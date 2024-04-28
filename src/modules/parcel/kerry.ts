import { FlexMessage } from '@line/bot-sdk'
import consola from 'consola'

import { getKerryTrackingFlexMessage } from '@/data/line/template/kerryTrackingTemplate'
import { LineBot, ParcelTracking } from '@/db/models'
import { KerryTrackingPayload } from '@/types/parcel/kerry'
import { getStatelessToken, push, reply } from '@/utils/line'
import { getKerryTracking } from '@/utils/parcel/kerry'

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
              await push(destination.user_id, [generateKerryTrackingFlexMessage(updatedPayload)], botAccessToken)
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

export const HandleQueryParcelKerryStatus = async (text: string, replyToken: string, accessToken: string) => {
  const parcelId = text.replace('[Kerry]', '').trim()

  const parcelTracking = await getKerryTracking(parcelId)

  if (!parcelTracking) {
    await reply(replyToken, [{ type: 'text', text: `ไม่พบพัสดุ ${parcelId}` }], accessToken)
  }

  await reply(replyToken, [generateKerryTrackingFlexMessage(parcelTracking)], accessToken)
}

/**
 * Generate Kerry tracking flex message
 */
const generateKerryTrackingFlexMessage = (payload: KerryTrackingPayload): FlexMessage => {
  const latestStatus = payload.status[0]
  return {
    type: 'flex',
    altText: `[Kerry] พัสดุของคุณ ${payload.shipment.consignment} มีสถานะ ${latestStatus.description}`,
    contents: getKerryTrackingFlexMessage(payload),
    sender: {
      name: 'Kerry Tracking',
      iconUrl: 'https://bucket.ex10.tech/images/6c9375d2-0512-11ef-808f-0242ac12000b/originalContentUrl.jpg',
    },
  }
}
