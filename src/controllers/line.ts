import Elysia from 'elysia'

import { ctx } from '@/context'
import {
  HandleQueryParcelKerryStatus,
  HandleSubscribeParcelKerryStatus,
  HandleUnsubscribeParcelKerryStatus,
} from '@/modules/parcel'
import { definePostbackIntent, defineTextIntent, getChatId, PostbackIntent, TextIntent } from '@/modules/webhook'
import { lineWebhookValidator } from '@/plugins'

export const lineController = new Elysia({
  prefix: '/line',
})
  .use(ctx)
  .guard((app) => {
    return app
      .use(lineWebhookValidator())
      .post('/webhook', async ({ logger, body, events, destination, accessToken }) => {
        logger.info('Webhook Received')
        logger.info(JSON.stringify(body))

        for (const event of events) {
          const chatId = getChatId(event.source)

          try {
            if (event.type === 'message' && event.message.type === 'text') {
              const { replyToken, message } = event

              const intent = defineTextIntent(message)

              switch (intent) {
                case TextIntent.KERRY_TRACKING_STATUS:
                  await HandleQueryParcelKerryStatus(accessToken, replyToken, message.text, destination, chatId)
                  break
              }
            }

            if (event.type === 'postback') {
              const { replyToken, postback, source } = event

              const [intent, postbackObj] = definePostbackIntent(postback.data)

              console.log(intent, postbackObj)

              switch (intent) {
                case PostbackIntent.KERRY_TRACKING_NOTIFY_SUBSCRIBE:
                  await HandleSubscribeParcelKerryStatus(
                    accessToken,
                    replyToken,
                    postbackObj.parcelId,
                    destination,
                    source,
                  )
                  break
                case PostbackIntent.KERRY_TRACKING_NOTIFY_UNSUBSCRIBE:
                  await HandleUnsubscribeParcelKerryStatus(
                    accessToken,
                    replyToken,
                    postbackObj.parcelId,
                    destination,
                    source,
                  )
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
