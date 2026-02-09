import mongoose from "mongoose"
import amqp from "amqplib"
import dotenv from "dotenv"

dotenv.config()

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

/**
 * Outbox Poller - Transactional Outbox Pattern
 * 
 * Polls every 5 seconds for events stuck in PENDING status for > 30 seconds.
 * Republishes them to RabbitMQ and marks them as PROCESSED.
 * 
 * This ensures at-least-once delivery even when the initial RabbitMQ
 * publish in the request handler fails (network issue, broker down, etc.).
 */

// Import the OutboxEvent model inline to avoid circular deps
const outboxSchema = new mongoose.Schema({
  aggregateId: { type: String, required: true },
  eventType: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, required: true, default: "PENDING" },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null }
})
outboxSchema.index({ status: 1, createdAt: 1 })

let OutboxEvent
try {
  OutboxEvent = mongoose.model("OutboxEvent")
} catch {
  OutboxEvent = mongoose.model("OutboxEvent", outboxSchema)
}

const MAX_RETRY_COUNT = 5
const POLL_INTERVAL_MS = 5000
const STUCK_THRESHOLD_MS = 30000 // 30 seconds

async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log("📦 Outbox poller: MongoDB connected")
  } catch (err) {
    console.error("MongoDB connection failed:", err.message)
    process.exit(1)
  }
}

async function connectRabbitMQ(retries = 10) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL)
    const channel = await connection.createChannel()
    await channel.assertExchange("order.direct", "direct", { durable: true })
    console.log("📦 Outbox poller: RabbitMQ connected")
    return channel
  } catch (err) {
    console.log("RabbitMQ not ready, retrying...", retries)
    if (retries === 0) throw err
    await sleep(3000)
    return connectRabbitMQ(retries - 1)
  }
}

/**
 * Maps event types to the appropriate RabbitMQ exchange/routing key.
 */
function getRoutingInfo(eventType) {
  switch (eventType) {
    case "ORDER_CREATED":
      return { exchange: "order.direct", routingKey: "order.created" }
    case "PAYMENT_VERIFIED":
      return { exchange: "order.direct", routingKey: "payment.process" }
    case "PAYMENT_FAILED":
      return { exchange: "order.direct", routingKey: "payment.failed" }
    default:
      return { exchange: "order.direct", routingKey: "order.created" }
  }
}

async function pollAndProcess(channel) {
  const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MS)

  try {
    const stuckEvents = await OutboxEvent.find({
      status: "PENDING",
      createdAt: { $lt: stuckThreshold }
    }).sort({ createdAt: 1 }).limit(50)

    if (stuckEvents.length > 0) {
      console.log(`🔄 Outbox poller: Found ${stuckEvents.length} stuck events`)
    }

    for (const event of stuckEvents) {
      try {
        const { exchange, routingKey } = getRoutingInfo(event.eventType)

        channel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify(event.payload)),
          { persistent: true }
        )

        await OutboxEvent.findByIdAndUpdate(event._id, {
          status: "PROCESSED",
          processedAt: new Date()
        })

        console.log(`✅ Outbox event processed: ${event.eventType} for ${event.aggregateId}`)

      } catch (publishErr) {
        const newRetryCount = (event.retryCount || 0) + 1
        const updateData = {
          retryCount: newRetryCount,
          lastError: publishErr.message
        }

        if (newRetryCount >= MAX_RETRY_COUNT) {
          updateData.status = "FAILED"
          console.error(`💀 Outbox event permanently failed after ${MAX_RETRY_COUNT} retries: ${event._id}`)
        }

        await OutboxEvent.findByIdAndUpdate(event._id, updateData)
        console.warn(`⚠️  Outbox retry failed for ${event._id}: ${publishErr.message}`)
      }
    }
  } catch (err) {
    console.error("Outbox poller error:", err.message)
  }
}

async function startOutboxPoller() {
  await connectMongoDB()
  const channel = await connectRabbitMQ()

  console.log(`📦 Outbox poller started (interval: ${POLL_INTERVAL_MS}ms, threshold: ${STUCK_THRESHOLD_MS}ms)`)

  // Poll every 5 seconds
  setInterval(() => pollAndProcess(channel), POLL_INTERVAL_MS)
}

startOutboxPoller()

export { pollAndProcess, startOutboxPoller }
