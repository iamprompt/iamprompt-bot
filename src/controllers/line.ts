import Elysia from 'elysia'

import { ctx } from '@/context'
import { HandleQueryParcelKerryStatus } from '@/modules/parcel'
import { defineTextIntent, Intent } from '@/modules/webhook'
import { lineWebhookValidator } from '@/plugins'

export const lineController = new Elysia({
  prefix: '/line',
})
  .use(ctx)
  .guard((app) => {
    return app.use(lineWebhookValidator()).post('/webhook', async ({ logger, body, events, accessToken }) => {
      logger.info('Webhook Received')
      logger.info(JSON.stringify(body))

      for (const event of events) {
        try {
          if (event.type === 'message' && event.message.type === 'text') {
            const { replyToken, message } = event

            const intent = defineTextIntent(message)

            switch (intent) {
              case Intent.KERRY_TRACKING_STATUS:
                await HandleQueryParcelKerryStatus(message.text, replyToken, accessToken)
                break
            }
          }
        } catch (error) {
          continue
        }
      }

      return { message: 'Webhook Received' }
    })
  })
