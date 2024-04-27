import { model, Schema } from 'mongoose'

type LineWebhookLog = {
  destination: string
  webhook_event_id: string
  reply_token: string
  event_type: string
  event_data: object
  source: object
  timestamp: number
  created_at: Date
  updated_at: Date
}

const lineWebhookLogSchema = new Schema(
  {
    destination: { type: String },
    webhook_event_id: { type: String },
    reply_token: { type: String },
    event_type: { type: String },
    event_data: { type: Object },
    source: { type: Object },
    timestamp: { type: Date },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'line_webhook_log',
  },
)

export const LineWebhookLog = model<LineWebhookLog>('LineWebhookLog', lineWebhookLogSchema)
