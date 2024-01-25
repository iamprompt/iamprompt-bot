import Elysia from 'elysia'

import { lineController } from './line'

export const controllers = new Elysia().use(lineController).get('/', ({}) => {
  return { message: 'Server is running!' }
})
