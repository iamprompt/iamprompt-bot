import { KerryTrackingPayload } from '@/types/parcel/kerry'
import { Shipment, Status, TrackingResponse } from '@/types/parcel/kerryApi'

import { formatISODate } from '../dayjs'

export const getKerryTracking = async (trackingNumber: string): Promise<KerryTrackingPayload> => {
  const response = await fetch(
    `https://kf.th.kerryexpress.com/business-fm-api/api/v1/track-n-trace/consignment/${trackingNumber}?lang=th`,
  )

  const { shipment, shipment_status } = await (response.json() as Promise<TrackingResponse>)

  if (response.status !== 200) {
    throw new Error('[Kerry] Something went wrong')
  }

  if (shipment === null || shipment_status === null) {
    throw new Error('[Kerry] Tracking number not found')
  }

  return {
    shipment: formatShipment(shipment),
    status: formatShipmentStatus(shipment_status),
  }
}

export const getKerryTrackingStatusIcon = (group: string) => {
  switch (group) {
    case '1':
      return 'https://th.kerryexpress.com/th/track/v2/assets/resource/status/101_C.png'
    case '2':
      return 'https://th.kerryexpress.com/th/track/v2/assets/resource/status/200_C.png'
    case '3':
      return 'https://th.kerryexpress.com/th/track/v2/assets/resource/status/300_C.png'
    case '4':
      return 'https://th.kerryexpress.com/th/track/v2/assets/resource/status/400_P.png'
  }
}

export const getKerryTrackingUrl = (trackingNumber: string) => {
  return `https://th.kerryexpress.com/th/track/v2/?track=${btoa('fHx8fHx8' + trackingNumber)}`
}

const formatShipment = (shipment: Shipment) => {
  return {
    ref_no: shipment.ref_no,
    consignment: shipment.con,
    sender: {
      name: shipment.sender,
      tel: shipment.s_mobile,
      postcode: shipment.s_postcode,
      province: shipment.org_province,
      location: shipment.origin_dc,
    },
    receiver: {
      name: shipment.r_name,
      tel: shipment.r_mobile,
      postcode: shipment.dest_postcode,
      province: shipment.dest_province,
      location: shipment.destination_dc,
    },
  }
}

const formatShipmentStatus = (shipmentStatus: Status[]) => {
  return shipmentStatus.map((status) => {
    return {
      location: status.loc,
      index: status.indx,
      date: formatISODate(status.s_datetime + '+07:00'),
      description: status.s_desc,
      group: status.s_group,
      code: status.s_code,
    }
  })
}
