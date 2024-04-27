import { model, Schema } from 'mongoose'

type LineBot = {
  channel_id: string
  channel_secret: string
  channel_access_token: string
  bot_id: string
  name: string
  created_at: Date
  updated_at: Date
}

const lineBotSchema = new Schema(
  {
    channel_id: { type: String, required: true },
    channel_secret: { type: String, required: true },
    channel_access_token: { type: String },
    bot_id: { type: String, required: true },
    name: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'line_bot',
  },
)

export const LineBot = model<LineBot>('LineBot', lineBotSchema)
