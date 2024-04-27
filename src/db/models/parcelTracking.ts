import { model, Schema } from 'mongoose'

type ParcelTracking = {
  line_destination_user_id: string
  line_destination_bot_id: string
  carrier: 'KERRY' | 'FLASH'
  parcel_id: string
  payload: object
  is_delivered: boolean
  is_final: boolean
  created_at: Date
  updated_at: Date
}

const parcelTrackingSchema = new Schema(
  {
    line_destination_user_id: { type: String },
    line_destination_bot_id: { type: String },
    carrier: { type: String, enum: ['KERRY', 'FLASH'], required: true },
    parcel_id: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    is_delivered: { type: Boolean, default: false },
    is_final: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'parcel_tracking',
  },
)

export const ParcelTracking = model<ParcelTracking>('ParcelTracking', parcelTrackingSchema)
