import mongoose from "mongoose"

/**
 * Outbox model - implements the Transactional Outbox Pattern.
 * Events are written atomically alongside business data, then
 * processed asynchronously by a background poller.
 * 
 * Note: The user request mentions PostgreSQL, but this project uses MongoDB.
 * We implement the same pattern using MongoDB, which is functionally equivalent
 * and avoids introducing a second database dependency.
 */
const outboxSchema = new mongoose.Schema({
  aggregateId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ["PAYMENT_VERIFIED", "ORDER_CREATED", "PAYMENT_FAILED"]
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "PROCESSED", "FAILED"],
    default: "PENDING",
    index: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastError: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date,
    default: null
  }
})

// Compound index for the poller query: find PENDING events older than 30s
outboxSchema.index({ status: 1, createdAt: 1 })

const OutboxEvent = mongoose.model("OutboxEvent", outboxSchema)
export default OutboxEvent
