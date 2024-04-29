import Elysia from 'elysia'

import { authValidator } from '@/context/auth'

export const lineBotController = new Elysia({ name: 'lineBotController', prefix: '/bots' })
  .use(authValidator())
  .get('/', async () => {
    return { message: 'Hello, World!' }
  })
