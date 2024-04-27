import Elysia from 'elysia'

import { ctx } from '@/context'
import { getKerryTrackingFlexMessage } from '@/data/line/template/kerryTrackingTemplate'
import { lineWebhookValidator } from '@/plugins'
import { reply } from '@/utils/line'
import { getKerryTracking } from '@/utils/parcel/kerry'

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

            if (message.text.startsWith('[Kerry]')) {
              const parcelId = message.text.replace('[Kerry]', '').trim()

              const parcelTracking = await getKerryTracking(parcelId)

              if (!parcelTracking) {
                await reply(replyToken, [{ type: 'text', text: 'ไม่พบพัสดุ' }], accessToken)
                continue
              }

              const latestStatus = parcelTracking.status[0]

              await reply(
                replyToken,
                [
                  {
                    type: 'flex',
                    altText: `[Kerry] พัสดุของคุณ ${parcelTracking.shipment.consignment} มีสถานะ ${latestStatus.description}`,
                    contents: getKerryTrackingFlexMessage(parcelTracking),
                  },
                ],
                accessToken,
              )
            }
          }
        } catch (error) {
          continue
        }
      }

      return { message: 'Webhook Received' }
    })
  })
