import { Elysia } from 'elysia'

import consola from 'consola'

import { controllers } from './controllers'

new Elysia().use(controllers).listen(3000, ({ hostname, port }) => {
  consola.success(`🤖 Server is running at ${hostname}:${port}`)
})
