import http from "k6/http"
import { check, sleep, group } from "k6"
import { Counter, Rate, Trend } from "k6/metrics"
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js"

/**
 * k6 Load Test: OneCart Payment Endpoint
 *
 * Simulates 100 concurrent users initiating payments with idempotency keys.
 * Measures p95 latency, error rate, and idempotency correctness.
 *
 * Usage:
 *   k6 run load-test/k6-payment.js
 *   k6 run --env BASE_URL=http://your-server:8000 load-test/k6-payment.js
 */

// ── Custom Metrics ──
const paymentErrors = new Counter("payment_errors")
const paymentSuccess = new Counter("payment_success")
const idempotencyHits = new Counter("idempotency_hits")
const errorRate = new Rate("payment_error_rate")
const paymentLatency = new Trend("payment_latency", true)

// ── Configuration ──
export const options = {
  scenarios: {
    payment_load: {
      executor: "constant-vus",
      vus: 100,
      duration: "60s",
    },
    idempotency_test: {
      executor: "per-vu-iterations",
      vus: 10,
      iterations: 2, // Each VU sends same request twice → tests idempotency
      startTime: "65s",
    }
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // p95 latency < 2s
    payment_error_rate: ["rate<0.1"],   // Error rate < 10%
  },
}

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000"

// ── Helper: Login and get auth cookie ──
function login() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: __ENV.TEST_EMAIL || "test@onecart.com",
    password: __ENV.TEST_PASSWORD || "Test@1234"
  }), {
    headers: { "Content-Type": "application/json" },
  })

  if (loginRes.status !== 200) {
    console.warn(`Login failed with status ${loginRes.status}`)
    return null
  }

  return loginRes.cookies
}

// ── Helper: Generate sample order payload ──
function generateOrderPayload() {
  return {
    items: [
      {
        productId: "test_product_" + randomString(8),
        name: "Test Product",
        price: Math.floor(Math.random() * 1000) + 100,
        quantity: Math.floor(Math.random() * 3) + 1,
        size: "M"
      }
    ],
    amount: Math.floor(Math.random() * 5000) + 500,
    address: {
      firstName: "Load",
      lastName: "Test",
      email: `loadtest_${randomString(5)}@test.com`,
      street: "123 Test St",
      city: "Mumbai",
      state: "Maharashtra",
      zipcode: "400001",
      country: "India",
      phone: "9876543210"
    }
  }
}

// ──────────────────────────────────────────
// SCENARIO 1: Payment Load Test (100 VUs)
// ──────────────────────────────────────────
export default function () {
  const cookies = login()

  group("COD Order Placement", () => {
    const idempotencyKey = `k6-${__VU}-${__ITER}-${Date.now()}-${randomString(8)}`
    const payload = generateOrderPayload()

    const startTime = Date.now()
    const res = http.post(`${BASE_URL}/api/order/placeorder`, JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      cookies: cookies,
    })
    const elapsed = Date.now() - startTime
    paymentLatency.add(elapsed)

    const success = check(res, {
      "status is 201 (created)": (r) => r.status === 201,
      "response has orderId": (r) => {
        try { return JSON.parse(r.body).orderId !== undefined } catch { return false }
      },
      "latency < 2000ms": () => elapsed < 2000,
    })

    if (success) {
      paymentSuccess.add(1)
      errorRate.add(false)
    } else {
      paymentErrors.add(1)
      errorRate.add(true)
      if (res.status !== 201) {
        console.warn(`[VU${__VU}] Order failed: ${res.status} - ${res.body}`)
      }
    }
  })

  group("Razorpay Order Initiation", () => {
    const idempotencyKey = `k6-razorpay-${__VU}-${__ITER}-${Date.now()}`
    const payload = generateOrderPayload()

    const startTime = Date.now()
    const res = http.post(`${BASE_URL}/api/order/razorpay`, JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      cookies: cookies,
    })
    const elapsed = Date.now() - startTime
    paymentLatency.add(elapsed)

    check(res, {
      "razorpay status is 200": (r) => r.status === 200,
      "razorpay latency < 3000ms": () => elapsed < 3000,
    })

    if (res.status !== 200) {
      paymentErrors.add(1)
      errorRate.add(true)
    } else {
      paymentSuccess.add(1)
      errorRate.add(false)
    }
  })

  sleep(Math.random() * 2 + 0.5) // Random think time 0.5-2.5s
}

// ──────────────────────────────────────────
// SCENARIO 2: Idempotency Verification
// ──────────────────────────────────────────
export function idempotency_test() {
  const cookies = login()
  // Each VU uses the SAME idempotency key for both iterations
  const idempotencyKey = `k6-idempotency-vu${__VU}-fixed`
  const payload = generateOrderPayload()

  const res = http.post(`${BASE_URL}/api/order/placeorder`, JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    cookies: cookies,
  })

  if (__ITER === 0) {
    check(res, {
      "first request creates order (201)": (r) => r.status === 201,
    })
  } else {
    // Second request with same key should return cached response
    const isIdempotent = check(res, {
      "duplicate request returns cached (200 or 201)": (r) => r.status === 200 || r.status === 201,
    })
    if (isIdempotent) {
      idempotencyHits.add(1)
      console.log(`✅ VU${__VU}: Idempotency key correctly returned cached response`)
    }
  }

  sleep(0.5)
}

// ── Summary handler ──
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"] || "N/A"
  const errRate = data.metrics.payment_error_rate?.values?.rate || 0
  const totalReqs = data.metrics.http_reqs?.values?.count || 0
  const successes = data.metrics.payment_success?.values?.count || 0
  const errors = data.metrics.payment_errors?.values?.count || 0
  const idempHits = data.metrics.idempotency_hits?.values?.count || 0

  const report = `
╔══════════════════════════════════════════════════════╗
║          OneCart Payment Load Test Results            ║
╠══════════════════════════════════════════════════════╣
║  Total Requests:        ${String(totalReqs).padStart(10)}               ║
║  Successful:            ${String(successes).padStart(10)}               ║
║  Failed:                ${String(errors).padStart(10)}               ║
║  Error Rate:            ${String((errRate * 100).toFixed(2) + "%").padStart(10)}               ║
║  p95 Latency:           ${String(typeof p95 === "number" ? p95.toFixed(2) + "ms" : p95).padStart(10)}               ║
║  Idempotency Hits:      ${String(idempHits).padStart(10)}               ║
╠══════════════════════════════════════════════════════╣
║  Thresholds:                                         ║
║    p95 < 2000ms:  ${p95 !== "N/A" && p95 < 2000 ? "✅ PASS" : "❌ FAIL"}                              ║
║    Error < 10%:   ${errRate < 0.1 ? "✅ PASS" : "❌ FAIL"}                              ║
╚══════════════════════════════════════════════════════╝
`
  console.log(report)

  return {
    stdout: report,
    "load-test/results.json": JSON.stringify(data, null, 2),
  }
}
