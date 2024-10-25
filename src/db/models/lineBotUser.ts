import { model, Schema } from 'mongoose'

type LineBotUser = {
  user_id: string
  display_name: string
  picture_url: string
  line_bots: string[]
  line_beacon_verbose?: boolean
  created_at: Date
  updated_at: Date
}

const lineBotUserSchema = new Schema(
  {
    user_id: { type: String },
    display_name: { type: String },
    picture_url: { type: String },
    line_bots: { type: [String], default: [] },
    line_beacon_verbose: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'line_bot_user',
  },
)

export const LineBotUser = model<LineBotUser>('LineBotUser', lineBotUserSchema)
