import Elysia from 'elysia'

import { getSessionCookie, login, LoginInput, register, RegisterInput } from '@/modules/auth'

export const authController = new Elysia({ name: 'authController', prefix: '/auth' })
  .get('/', () => {
    return { message: 'Hello, World!' }
  })
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const user = await login(body)
        const sessionCookie = await getSessionCookie(user)

        set.headers['Set-Cookie'] = sessionCookie.serialize()

        return { message: 'Login Successfully' }
      } catch (error: any) {
        return { message: error.message }
      }
    },
    { body: LoginInput },
  )
  .post(
    '/register',
    async ({ body, set }) => {
      const user = await register(body)
      const sessionCookie = await getSessionCookie(user)

      set.headers['Set-Cookie'] = sessionCookie.serialize()

      return { message: 'Register Successfully' }
    },
    { body: RegisterInput },
  )
