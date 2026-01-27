import mongoose from "mongoose"

/**
 * IdempotencyKey model - stores processed idempotency keys with 24h TTL.
 * Uses MongoDB TTL index for automatic expiration.
 */
const idempotencyKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  statusCode: {
    type: Number,
    default: 200
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL: 24 hours (in seconds)
  }
})

const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencyKeySchema)
export default IdempotencyKey
