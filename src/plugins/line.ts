import Elysia, { t } from 'elysia'

import { WebhookRequestBody } from '@line/bot-sdk'

import { LineBeaconDevice, LineBot, LineBotUser, LineWebhookLog } from '@/db/models'
import { getProfileByUserId, getStatelessToken, verifySignature } from '@/utils/line'

type LineWebhookValidatorConfig = {
  log?: boolean
}

export const lineWebhookValidator = ({ log = true }: LineWebhookValidatorConfig = {}) => {
  return new Elysia({ name: 'lineWebhookValidator' })
    .guard({
      headers: t.Object({ 'x-line-signature': t.String() }),
    })
    .resolve({ as: 'scoped' }, async ({ headers, body }) => {
      const signature = headers['x-line-signature']

      const webhookBody = body as WebhookRequestBody
      const { destination, events } = webhookBody

      const bot = await LineBot.findOne({ bot_id: destination })

      return { bot, signature, destination, body: webhookBody, events }
    })
    .onBeforeHandle({ as: 'scoped' }, async ({ set, bot, signature, body }) => {
      if (!bot) {
        set.status = 401
        return { message: 'Invalid destination or Bot is not registered' }
      }

      if (!verifySignature(signature, body, bot.channel_secret)) {
        set.status = 401
        return { message: 'Invalid signature' }
      }
    })
    .resolve({ as: 'scoped' }, async (ctx) => {
      const bot = ctx.bot! // bot is filtered by onBeforeHandle
      try {
        const accessToken = await getStatelessToken(bot.channel_id, bot.channel_secret)
        return { bot, accessToken }
      } catch (error) {
        return { bot }
      }
    })
    .onBeforeHandle({ as: 'scoped' }, async ({ set, accessToken }) => {
      if (!accessToken) {
        set.status = 401
        return { message: 'Failed to get LINE access token' }
      }
    })
    .resolve({ as: 'scoped' }, async (ctx) => {
      return { accessToken: ctx.accessToken! } // bot and accessToken are filtered by onBeforeHandle
    })
    .onBeforeHandle({ as: 'scoped' }, async ({ bot, events, accessToken }) => {
      if (!log) return

      try {
        await LineBot.updateOne({ bot_id: bot.bot_id }, { name: bot.name }, { upsert: true })

        const webhookUserIdsSet = new Set(events.map((event) => event.source.userId!))
        const webhookUserIds = Array.from(webhookUserIdsSet).filter(Boolean)

        const updatedUserIds: string[] = []
        for (const userId of webhookUserIds) {
          if (updatedUserIds.includes(userId)) continue

          const user = await getProfileByUserId(userId, accessToken)
          if (!user) continue

          await LineBotUser.updateOne(
            { user_id: user.userId },
            {
              user_id: user.userId,
              display_name: user.displayName,
              picture_url: user.pictureUrl,
              $addToSet: { line_bots: bot.bot_id },
            },
            { upsert: true },
          )

          updatedUserIds.push(user.userId)
        }

        for (const event of events) {
          const { type, timestamp, webhookEventId, source, ...rest } = event
          let replyToken: string | undefined
          let eventData: Record<string, any> = rest

          if ('replyToken' in event) {
            replyToken = event.replyToken
            delete eventData.replyToken
          }

          delete eventData.deliveryContext
          delete eventData.mode

          await LineWebhookLog.create({
            webhook_event_id: webhookEventId,
            timestamp: new Date(timestamp),
            event_type: type,
            event_data: eventData,
            source,
            reply_token: replyToken,
          })

          if (event.type === 'beacon') {
            const {
              beacon: { hwid },
            } = event
            await LineBeaconDevice.updateOne(
              { device_id: hwid },
              {
                device_id: hwid,
                bot_id: bot.bot_id,
                last_active_webhook_event_id: webhookEventId,
                last_active_at: new Date(timestamp),
              },
              { upsert: true },
            )
          }
        }
      } catch (error) {
        console.log(error)
      }
    })
}
