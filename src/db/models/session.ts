import { model, Schema } from 'mongoose'

type Session = {
  _id: string
  user_id: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

const sessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'sessions',
  },
)

export const Session = model<Session>('Session', sessionSchema)
