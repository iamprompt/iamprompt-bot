import { model, Schema } from 'mongoose'

type ParcelDestination = {
  user_id: string
  bot_id: string
  created_at: Date
  updated_at: Date
}

type ParcelTracking = {
  destinations: Array<ParcelDestination>
  carrier: 'KERRY' | 'FLASH'
  parcel_id: string
  payload: object
  is_delivered: boolean
  is_final: boolean
  created_at: Date
  updated_at: Date
}

const parcelDestinationSchema = new Schema(
  {
    user_id: { type: String },
    bot_id: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
)

const parcelTrackingSchema = new Schema(
  {
    destinations: { type: [parcelDestinationSchema], default: [] },
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
