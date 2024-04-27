import { FlexMessage } from '@line/bot-sdk'
import consola from 'consola'

import { getKerryTrackingFlexMessage } from '@/data/line/template/kerryTrackingTemplate'
import { LineBot, ParcelTracking } from '@/db/models'
import { KerryTrackingPayload } from '@/types/parcel/kerry'
import { push } from '@/utils/line'
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

    const destinationBotIdsSet = new Set(parcelToUpdate.map((parcel) => parcel.line_destination_bot_id))
    const destinationBotIds = Array.from(destinationBotIdsSet)

    const destinationBotTokenMap = new Map<string, string>()
    for (const destinationBotId of destinationBotIds) {
      const destinationBot = await LineBot.findOne({ bot_id: destinationBotId })
      if (destinationBot) {
        destinationBotTokenMap.set(destinationBot.bot_id, destinationBot.channel_access_token)
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

        const updatedParcel = await ParcelTracking.findByIdAndUpdate(
          parcel._id,
          {
            payload,
            is_delivered: latestStatus.code === 'POD',
            is_final: latestStatus.code === 'POD',
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

        const botAccessToken = destinationBotTokenMap.get(updatedParcel.line_destination_bot_id)

        if (!botAccessToken) {
          consola.error(`[Kerry] ${parcel.parcel_id} bot access token is missing`)
          continue
        }

        const isStatusChanged = updatedPayload.status.length !== previousPayload.status.length
        if (isStatusChanged) {
          consola.info(`[Kerry] ${parcel.parcel_id} status changed`)
          if (updatedParcel.line_destination_user_id) {
            consola.info(`[Kerry] ${parcel.parcel_id} send notification to ${updatedParcel.line_destination_user_id}`)
            await push(
              updatedParcel.line_destination_user_id,
              [generateKerryTrackingFlexMessage(updatedPayload)],
              botAccessToken,
            )
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

const generateKerryTrackingFlexMessage = (payload: KerryTrackingPayload): FlexMessage => {
  const latestStatus = payload.status[0]
  return {
    type: 'flex',
    altText: `[Kerry] พัสดุของคุณ ${payload.shipment.consignment} มีการเปลี่ยนแปลงสถานะ ${latestStatus.description}`,
    contents: getKerryTrackingFlexMessage(payload),
  }
}
