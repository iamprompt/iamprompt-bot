import { t } from 'elysia'

import { Static } from '@sinclair/typebox'
import { generateIdFromEntropySize } from 'lucia'

import { User } from '@/db/models'

import { lucia } from './lucia'

export const RegisterInput = t.Object({
  email: t.String(),
  password: t.String(),
})

export const register = async ({ email, password }: Static<typeof RegisterInput>) => {
  const existingUser = await User.findOne({ email })

  if (existingUser) {
    throw new Error('User already exists')
  }

  const id = generateIdFromEntropySize(16)

  const user = await User.create({ _id: id, email, password })

  return user
}

export const LoginInput = t.Object({
  email: t.String(),
  password: t.String(),
})

export const login = async ({ email, password }: Static<typeof LoginInput>) => {
  const existingUser = await User.findOne({ email })

  if (!existingUser) {
    throw new Error('User not found')
  }

  console.log(existingUser.password, password)

  const isValidPassword = await Bun.password.verify(password, existingUser.password, 'argon2d')

  if (!isValidPassword) {
    throw new Error('Invalid password')
  }

  return existingUser
}

export const getSessionCookie = async (user: User) => {
  const session = await lucia.createSession(user.id, {})
  const cookie = lucia.createSessionCookie(session.id)
  return cookie
}
