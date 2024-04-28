import { EventSource, FlexMessage, QuickReplyItem } from '@line/bot-sdk'
import consola from 'consola'

import { getKerryTrackingFlexMessage } from '@/data/line/template/kerryTrackingTemplate'
import { LineBot, ParcelTracking } from '@/db/models'
import { KerryTrackingPayload } from '@/types/parcel/kerry'
import { displayLoading, getStatelessToken, push, reply } from '@/utils/line'
import { getKerryTracking } from '@/utils/parcel/kerry'

import { getChatId, PostbackIntent } from '../webhook'

/**
 * Cron job for update parcel status from Kerry
 */
export const UpdateParcelKerryJob = async () => {
  try {
    consola.info('[Kerry] Update parcel status')

    const parcelToUpdate = await ParcelTracking.find({
      is_final: false,
      carrier: 'KERRY',
    })

    consola.info(`[Kerry] ${parcelToUpdate.length} parcel(s) to update`)

    const destinationBotIdsSet = new Set(
      parcelToUpdate.flatMap((parcel) => parcel.destinations.map((destination) => destination.bot_id)),
    )
    const destinationBotIds = Array.from(destinationBotIdsSet)

    const destinationBotTokenMap = new Map<string, string>()
    for (const destinationBotId of destinationBotIds) {
      if (destinationBotTokenMap.has(destinationBotId)) continue

      const destinationBot = await LineBot.findOne({ bot_id: destinationBotId })
      if (destinationBot) {
        const token = await getStatelessToken(destinationBot.channel_id, destinationBot.channel_secret)
        destinationBotTokenMap.set(destinationBot.bot_id, token)
      }
    }

    for (const parcel of parcelToUpdate) {
      try {
        if (!parcel.parcel_id) {
          consola.error(`[Kerry] ${parcel._id} parcel_id is missing`)
          continue
        }

        const payload = await getKerryTracking(parcel.parcel_id)

        const latestStatus = payload.status[0]

        const isDelivered = latestStatus.code === 'POD'

        const updatedParcel = await ParcelTracking.findByIdAndUpdate(
          parcel._id,
          {
            payload,
            is_delivered: isDelivered,
            is_final: isDelivered,
          },
          { new: true },
        )

        if (!updatedParcel) {
          consola.error(`[Kerry] ${parcel._id} parcel not found`)
          continue
        }

        const previousPayload = parcel.payload as unknown as KerryTrackingPayload
        const updatedPayload = updatedParcel.payload as unknown as KerryTrackingPayload

        if (!updatedPayload) {
          continue
        }

        for (const destination of parcel.destinations) {
          const botAccessToken = destinationBotTokenMap.get(destination.bot_id)

          if (!botAccessToken) {
            consola.error(`[Kerry] ${parcel.parcel_id} bot access token is missing`)
            continue
          }

          const isStatusChanged = updatedPayload.status.length !== previousPayload.status.length
          if (isStatusChanged) {
            consola.info(`[Kerry] ${parcel.parcel_id} status changed`)
            if (destination.user_id) {
              consola.info(`[Kerry] ${parcel.parcel_id} send notification to ${destination.user_id}`)
              await push(botAccessToken, destination.user_id, [
                generateKerryTrackingFlexMessage(updatedPayload, {
                  recheckAction: false,
                  subscribeAction: false,
                  unsubscribeAction: true,
                }),
              ])
            }
          }
        }
      } catch (error) {
        consola.error(error)
      }
    }
  } catch (error) {
    consola.error(error)
  }
}

export const HandleQueryParcelKerryStatus = async (
  accessToken: string,
  replyToken: string,
  text: string,
  destinationBotId: string,
  chatId: string,
) => {
  try {
    await displayLoading(accessToken, chatId)

    const parcelId = text.replace('[Kerry]', '').trim()

    const parcelTracking = await getKerryTracking(parcelId)
    const isDelivered = parcelTracking?.status[0].code === 'POD'

    if (!parcelTracking) {
      await reply(accessToken, replyToken, [{ type: 'text', text: `ไม่พบพัสดุ ${parcelId}` }])
    }

    const userSubscribed = await isUserSubscribed(parcelId, destinationBotId, chatId)

    await reply(accessToken, replyToken, [
      generateKerryTrackingFlexMessage(parcelTracking, {
        recheckAction: !isDelivered,
        subscribeAction: !userSubscribed && !isDelivered,
        unsubscribeAction: userSubscribed,
      }),
    ])
  } catch (error) {
    console.error(error)
  }
}

export const HandleSubscribeParcelKerryStatus = async (
  accessToken: string,
  replyToken: string,
  parcelId: string,
  destinationBotId: string,
  source: EventSource,
) => {
  try {
    const chatId = getChatId(source)
    chatId && (await displayLoading(accessToken, chatId))

    const payload = await getKerryTracking(parcelId)

    if (!payload) {
      await reply(accessToken, replyToken, [{ type: 'text', text: `ไม่พบพัสดุ ${parcelId}` }])
    }

    const latestStatus = payload.status[0]
    const isDelivered = latestStatus.code === 'POD'

    if (isDelivered) {
      await reply(accessToken, replyToken, [
        {
          type: 'text',
          text: `ไม่สามารถสมัครแจ้งเตือนพัสดุ ${parcelId} เนื่องจากพัสดุส่งสำเร็จแล้ว`,
        },
      ])
      return
    }

    if (!chatId) {
      await reply(accessToken, replyToken, [{ type: 'text', text: 'ไม่สามารถสมัครแจ้งเตือนพัสดุ' }])
      return
    }

    if (await isUserSubscribed(parcelId, destinationBotId, chatId)) {
      await reply(accessToken, replyToken, [{ type: 'text', text: `คุณได้สมัครแจ้งเตือนพัสดุ ${parcelId} แล้ว` }])
      return
    }

    await ParcelTracking.updateOne(
      { carrier: 'KERRY', parcel_id: parcelId },
      {
        payload,
        is_delivered: isDelivered,
        is_final: isDelivered,
        $addToSet: {
          destinations: {
            bot_id: destinationBotId,
            user_id: chatId,
          },
        },
      },
      { upsert: true },
    )

    await reply(accessToken, replyToken, [
      {
        type: 'text',
        text: `สมัครแจ้งเตือนพัสดุ ${parcelId} สำเร็จ`,
      },
    ])
  } catch (error) {
    console.error(error)
  }
}

export const HandleUnsubscribeParcelKerryStatus = async (
  accessToken: string,
  replyToken: string,
  parcelId: string,
  destinationBotId: string,
  source: EventSource,
) => {
  try {
    const chatId = getChatId(source)
    chatId && (await displayLoading(accessToken, chatId))

    if (!chatId) {
      await reply(accessToken, replyToken, [{ type: 'text', text: 'ไม่สามารถยกเลิกการแจ้งเตือนพัสดุ' }])
      return
    }

    const parcel = await ParcelTracking.findOneAndUpdate(
      { carrier: 'KERRY', parcel_id: parcelId },
      {
        $pull: {
          destinations: {
            bot_id: destinationBotId,
            user_id: chatId,
          },
        },
      },
      { new: true },
    )

    if (!parcel) {
      await reply(accessToken, replyToken, [{ type: 'text', text: `ไม่พบพัสดุ ${parcelId}` }])
      return
    }

    await reply(accessToken, replyToken, [
      {
        type: 'text',
        text: `ยกเลิกการแจ้งเตือนพัสดุ ${parcelId} สำเร็จ`,
      },
    ])
  } catch (error) {
    console.error(error)
  }
}

const isUserSubscribed = async (parcelId: string, destinationBotId: string, chatId: string) => {
  const existingParcel = await ParcelTracking.findOne({ carrier: 'KERRY', parcel_id: parcelId })
  if (!existingParcel) return false

  return existingParcel.destinations.some(
    (destination) => destination.bot_id === destinationBotId && destination.user_id === chatId,
  )
}

type GenerateKerryTrackingFlexMessageOptions = {
  recheckAction?: boolean
  subscribeAction?: boolean
  unsubscribeAction?: boolean
}

/**
 * Generate Kerry tracking flex message
 */
const generateKerryTrackingFlexMessage = (
  payload: KerryTrackingPayload,
  {
    recheckAction = true,
    subscribeAction = true,
    unsubscribeAction = false,
  }: GenerateKerryTrackingFlexMessageOptions = {},
): FlexMessage => {
  const latestStatus = payload.status[0]
  const quickReplyItems: Array<QuickReplyItem> = []

  if (recheckAction) {
    quickReplyItems.push({
      type: 'action',
      action: {
        type: 'message',
        label: 'ตรวจสอบอีกครั้ง',
        text: `[Kerry] ${payload.shipment.consignment}`,
      },
    })
  }

  if (subscribeAction) {
    quickReplyItems.push({
      type: 'action',
      action: {
        type: 'postback',
        label: 'เปิดการแจ้งเตือน',
        data: `action=${PostbackIntent.KERRY_TRACKING_NOTIFY_SUBSCRIBE}&parcelId=${payload.shipment.consignment}`,
      },
    })
  }

  if (unsubscribeAction) {
    quickReplyItems.push({
      type: 'action',
      action: {
        type: 'postback',
        label: 'ยกเลิกการแจ้งเตือน',
        data: `action=${PostbackIntent.KERRY_TRACKING_NOTIFY_UNSUBSCRIBE}&parcelId=${payload.shipment.consignment}`,
      },
    })
  }

  return {
    type: 'flex',
    altText: `[Kerry] พัสดุของคุณ ${payload.shipment.consignment} มีสถานะ ${latestStatus.description}`,
    contents: getKerryTrackingFlexMessage(payload),
    sender: {
      name: 'Kerry Tracking',
      iconUrl: 'https://bucket.ex10.tech/images/6c9375d2-0512-11ef-808f-0242ac12000b/originalContentUrl.jpg',
    },
    quickReply: quickReplyItems.length ? { items: quickReplyItems } : undefined,
  }
}
