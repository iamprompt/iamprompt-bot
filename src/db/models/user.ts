import { Document, model, Schema } from 'mongoose'

export type User = {
  email: string
  password: string
  name: string
  created_at: Date
  updated_at: Date
} & Document

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    name: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'users',
  },
)

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await Bun.password.hash(this.password, 'argon2d')
  }

  next()
})

export const User = model<User>('User', userSchema)
