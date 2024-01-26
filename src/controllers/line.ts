import Elysia, { t } from 'elysia'

import { type WebhookRequestBody } from '@line/bot-sdk'

import { ctx } from '@/context'
import { getKerryTrackingFlexMessage } from '@/data/line/template/kerryTrackingTemplate'
import { reply, verifySignature } from '@/utils/line'
import { getKerryTracking } from '@/utils/parcel/kerry'

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
        .post('/webhook', async ({ logger, body, events }) => {
          logger.info('Webhook Received')
          logger.info(JSON.stringify(body, null, 2))

          for (const event of events) {
            try {
              if (event.type === 'message' && event.message.type === 'text') {
                const { replyToken, message } = event

                if (message.text.startsWith('[Kerry]')) {
                  const parcelId = message.text.replace('[Kerry]', '').trim()

                  const parcelTracking = await getKerryTracking(parcelId)

                  if (!parcelTracking) {
                    await reply(replyToken, [
                      {
                        type: 'text',
                        text: 'ไม่พบพัสดุ',
                      },
                    ])
                    continue
                  }

                  await reply(replyToken, [
                    {
                      type: 'flex',
                      altText: 'Kerry Tracking',
                      contents: getKerryTrackingFlexMessage(parcelTracking),
                    },
                  ])
                }
              }
            } catch (error) {
              continue
            }
          }

          return { message: 'Webhook Received' }
        })
    },
  )
