
import amqp from "amqplib"

let channel
let connection

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/**
 * Queue topology:
 *
 *   payment_queue  ──(reject)──►  payment_dlx  ──►  payment_retry_queue (TTL)  ──►  payment_queue
 *                                      │ (after 3 retries)
 *                                      ▼
 *                                payment_dlq (dead letters for manual inspection)
 *
 *   order.direct exchange  ──►  email.queue  ──(reject)──►  email.dlx  ──►  email.dlq
 */

const PAYMENT_QUEUE = "payment_queue"
const PAYMENT_DLX = "payment_dlx"
const PAYMENT_DLQ = "payment_dlq"
const PAYMENT_RETRY_DELAYS = [1000, 5000, 30000] // 1s, 5s, 30s

const connectRabbitMQ = async (retries = 10) => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL)
    channel = await connection.createChannel()

    // ── Existing order exchange ──
    await channel.assertExchange("order.direct", "direct", { durable: true })

    // ── Payment DLX + DLQ ──
    await channel.assertExchange(PAYMENT_DLX, "direct", { durable: true })

    // Main payment queue with DLX routing
    await channel.assertQueue(PAYMENT_QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": PAYMENT_DLX,
        "x-dead-letter-routing-key": PAYMENT_DLQ
      }
    })

    // Dead letter queue for permanently failed messages
    await channel.assertQueue(PAYMENT_DLQ, { durable: true })
    await channel.bindQueue(PAYMENT_DLQ, PAYMENT_DLX, PAYMENT_DLQ)

    // Retry queues with incremental TTL (delayed re-enqueue)
    for (let i = 0; i < PAYMENT_RETRY_DELAYS.length; i++) {
      const retryQueue = `payment_retry_${i}`
      await channel.assertQueue(retryQueue, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "",               // default exchange
          "x-dead-letter-routing-key": PAYMENT_QUEUE, // re-route back to main
          "x-message-ttl": PAYMENT_RETRY_DELAYS[i]
        }
      })
    }

    // Bind payment queue to order exchange for payment events
    await channel.bindQueue(PAYMENT_QUEUE, "order.direct", "payment.process")

    console.log("✅ RabbitMQ connected (DLQ + retry topology declared)")
  } catch (err) {
    console.log("RabbitMQ not ready, retrying...", retries)

    if (retries === 0) {
      throw err
    }

    await sleep(3000)
    return connectRabbitMQ(retries - 1)
  }
}

const getChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel not established")
  }
  return channel
}

/**
 * Publish a message to a retry queue with exponential backoff.
 * If max retries exceeded, routes to the DLQ.
 */
const publishWithRetry = (channel, msg, error) => {
  const headers = msg.properties.headers || {}
  const retryCount = (headers["x-retry-count"] || 0)

  if (retryCount >= PAYMENT_RETRY_DELAYS.length) {
    // Max retries exceeded → route to DLQ
    console.error(`💀 DLQ: Message exceeded ${PAYMENT_RETRY_DELAYS.length} retries, routing to ${PAYMENT_DLQ}`)
    console.error(`   Payload: ${msg.content.toString()}`)
    console.error(`   Last error: ${error?.message || "unknown"}`)

    channel.publish(PAYMENT_DLX, PAYMENT_DLQ, msg.content, {
      persistent: true,
      headers: {
        ...headers,
        "x-retry-count": retryCount,
        "x-final-error": error?.message || "unknown",
        "x-dead-lettered-at": new Date().toISOString()
      }
    })
    return
  }

  const retryQueue = `payment_retry_${retryCount}`
  console.warn(`⏳ Retry ${retryCount + 1}/${PAYMENT_RETRY_DELAYS.length} → ${retryQueue} (delay: ${PAYMENT_RETRY_DELAYS[retryCount]}ms)`)

  channel.sendToQueue(retryQueue, msg.content, {
    persistent: true,
    headers: {
      ...headers,
      "x-retry-count": retryCount + 1,
      "x-last-error": error?.message || "unknown"
    }
  })
}

export {
  connectRabbitMQ,
  getChannel,
  publishWithRetry,
  PAYMENT_QUEUE,
  PAYMENT_DLX,
  PAYMENT_DLQ,
  PAYMENT_RETRY_DELAYS
}