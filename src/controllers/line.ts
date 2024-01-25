import Elysia, { t } from 'elysia'

import { type WebhookRequestBody } from '@line/bot-sdk'

import { ctx } from '@/context'
import { verifySignature } from '@/utils/line'

export const lineController = new Elysia({
  prefix: '/line',
})
  .use(ctx)
  .guard(
    {
      headers: t.Object({
        'x-line-signature': t.String(),
      }),
      beforeHandle: ({ headers, set, body }) => {
        const signature = headers['x-line-signature']

        if (!signature) {
          set.status = 400
          return { message: 'Webhook signature is missing' }
        }

        if (!verifySignature(signature, body)) {
          set.status = 401
          return { message: 'Invalid signature' }
        }
      },
    },
    (app) => {
      return app
        .resolve((ctx) => {
          const body = ctx.body as WebhookRequestBody
          return { body, events: body.events, destination: body.destination }
        })
        .post('/webhook', async ({ logger, body, events, destination }) => {
          logger.info('Webhook Received')
          logger.info(JSON.stringify(body, null, 2))

          return { message: 'Webhook Received' }
        })
    },
  )
