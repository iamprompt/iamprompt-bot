import { MessageEvent } from '@line/bot-sdk'

import { LineBotUser } from '@/db/models'
import { displayLoading, reply } from '@/utils/line'

export const HandleSubscribeBeaconVerbose = async (
  accessToken: string,
  replyToken: string,
  event: MessageEvent,
  chatId: string,
) => {
  try {
    if (event.source.type !== 'user') {
      return await reply(accessToken, replyToken, [
        {
          type: 'text',
          text: 'This feature is only available for one-on-one chat',
        },
      ])
    }

    await displayLoading(accessToken, chatId)
    const userId = event.source.userId
    await LineBotUser.findOneAndUpdate({ user_id: userId }, { line_beacon_verbose: true }, { upsert: true })
    await reply(accessToken, replyToken, [
      {
        type: 'text',
        text: `Subscribe to LINE Beacon Event success`,
      },
    ])
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const HandleUnsubscribeBeaconVerbose = async (
  accessToken: string,
  replyToken: string,
  event: MessageEvent,
  chatId: string,
) => {
  try {
    if (event.source.type !== 'user') {
      return await reply(accessToken, replyToken, [
        {
          type: 'text',
          text: 'This feature is only available for one-on-one chat',
        },
      ])
    }

    await displayLoading(accessToken, chatId)
    const userId = event.source.userId
    await LineBotUser.findOneAndUpdate({ user_id: userId }, { line_beacon_verbose: false }, { upsert: true })
    await reply(accessToken, replyToken, [
      {
        type: 'text',
        text: `Unsubscribe from LINE Beacon Event success`,
      },
    ])
  } catch (error) {
    console.error(error)
    throw error
  }
}
