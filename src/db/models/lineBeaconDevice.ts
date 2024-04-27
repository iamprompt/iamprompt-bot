import { model, Schema } from 'mongoose'

type LineBeaconDevice = {
  device_id: string
  bot_id: string
  last_active: Date
  created_at: Date
  updated_at: Date
}

const lineBeaconDeviceSchema = new Schema(
  {
    device_id: { type: String, required: true },
    bot_id: { type: String, required: true },
    last_active_at: { type: Date },
    last_active_webhook_event_id: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'line_beacon_device',
  },
)

export const LineBeaconDevice = model<LineBeaconDevice>('LineBeaconDevice', lineBeaconDeviceSchema)
