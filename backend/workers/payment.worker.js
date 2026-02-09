import amqp from "amqplib"
import dotenv from "dotenv"

dotenv.config()

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

const PAYMENT_QUEUE = "payment_queue"
const PAYMENT_DLX = "payment_dlx"
const PAYMENT_DLQ = "payment_dlq"
const PAYMENT_RETRY_DELAYS = [1000, 5000, 30000]

/**
 * Payment Worker
 * 
 * Consumes messages from payment_queue and processes payment confirmations.
 * Implements exponential backoff with retry queues:
 *   Retry 1 → 1s delay
 *   Retry 2 → 5s delay
 *   Retry 3 → 30s delay
 *   After 3 failures → DLQ for manual inspection
 */
async function startPaymentWorker(retries = 10) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL)
    const channel = await connection.createChannel()

    // Declare the full topology
    await channel.assertExchange("order.direct", "direct", { durable: true })
    await channel.assertExchange(PAYMENT_DLX, "direct", { durable: true })

    await channel.assertQueue(PAYMENT_QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": PAYMENT_DLX,
        "x-dead-letter-routing-key": PAYMENT_DLQ
      }
    })

    await channel.assertQueue(PAYMENT_DLQ, { durable: true })
    await channel.bindQueue(PAYMENT_DLQ, PAYMENT_DLX, PAYMENT_DLQ)

    // Retry queues with TTL
    for (let i = 0; i < PAYMENT_RETRY_DELAYS.length; i++) {
      const retryQueue = `payment_retry_${i}`
      await channel.assertQueue(retryQueue, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": PAYMENT_QUEUE,
          "x-message-ttl": PAYMENT_RETRY_DELAYS[i]
        }
      })
    }

    await channel.bindQueue(PAYMENT_QUEUE, "order.direct", "payment.process")

    channel.prefetch(1)
    console.log("💳 Payment worker started (DLQ + exponential backoff enabled)")

    // ── Consume payment messages ──
    channel.consume(PAYMENT_QUEUE, async (msg) => {
      if (!msg) return

      const headers = msg.properties.headers || {}
      const retryCount = headers["x-retry-count"] || 0
      const data = JSON.parse(msg.content.toString())

      console.log(`📨 Processing payment message (retry: ${retryCount}):`, data.orderId)

      try {
        // Simulate payment processing verification
        // In production, this would verify with Razorpay API
        await processPayment(data)

        console.log(`✅ Payment processed for order: ${data.orderId}`)
        channel.ack(msg)

      } catch (err) {
        console.error(`❌ Payment processing failed for order ${data.orderId}:`, err.message)

        // Reject the message (don't requeue, we handle retry ourselves)
        channel.ack(msg)

        if (retryCount >= PAYMENT_RETRY_DELAYS.length) {
          // Max retries exceeded → route to DLQ
          console.error(`💀 DLQ: Payment for order ${data.orderId} exceeded max retries (${PAYMENT_RETRY_DELAYS.length})`)
          channel.publish(PAYMENT_DLX, PAYMENT_DLQ, msg.content, {
            persistent: true,
            headers: {
              ...headers,
              "x-retry-count": retryCount,
              "x-final-error": err.message,
              "x-dead-lettered-at": new Date().toISOString()
            }
          })
        } else {
          // Retry with exponential backoff
          const retryQueue = `payment_retry_${retryCount}`
          console.warn(`⏳ Retry ${retryCount + 1}/${PAYMENT_RETRY_DELAYS.length} → ${retryQueue} (delay: ${PAYMENT_RETRY_DELAYS[retryCount]}ms)`)

          channel.sendToQueue(retryQueue, msg.content, {
            persistent: true,
            headers: {
              ...headers,
              "x-retry-count": retryCount + 1,
              "x-last-error": err.message
            }
          })
        }
      }
    })

    // ── Monitor DLQ for manual inspection ──
    channel.consume(PAYMENT_DLQ, (msg) => {
      if (!msg) return
      const headers = msg.properties.headers || {}
      const data = JSON.parse(msg.content.toString())
      console.error("═══════════════════════════════════════════")
      console.error("🚨 DLQ MESSAGE - REQUIRES MANUAL INSPECTION")
      console.error("═══════════════════════════════════════════")
      console.error("Order ID:", data.orderId)
      console.error("User ID:", data.userId)
      console.error("Amount:", data.amount)
      console.error("Retry Count:", headers["x-retry-count"])
      console.error("Final Error:", headers["x-final-error"])
      console.error("Dead-lettered At:", headers["x-dead-lettered-at"])
      console.error("Full Payload:", JSON.stringify(data, null, 2))
      console.error("═══════════════════════════════════════════")
      // Ack so it's consumed (logged for manual inspection)
      channel.ack(msg)
    }, { noAck: false })

  } catch (err) {
    console.log("RabbitMQ not ready, retrying...", retries)
    if (retries === 0) throw err
    await sleep(3000)
    return startPaymentWorker(retries - 1)
  }
}

/**
 * Process payment - in production this would call Razorpay APIs.
 * Throws on failure to trigger retry mechanism.
 */
async function processPayment(data) {
  // Validate required fields
  if (!data.orderId || !data.amount) {
    throw new Error("Missing required payment data: orderId or amount")
  }

  // In production: verify payment status with Razorpay
  // const orderInfo = await razorpayInstance.orders.fetch(data.razorpay_order_id)
  // if (orderInfo.status !== "paid") throw new Error("Payment not confirmed")

  console.log(`Payment verified for order ${data.orderId}, amount: ${data.amount}`)
}

startPaymentWorker()
