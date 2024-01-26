export type KerryTrackingPayloadPerson = {
  name: string
  tel: string
  postcode: string
  province: string
  location: string
}

export type KerryTrackingPayloadStatus = {
  location: string
  index: number
  date: string
  description: string
  group: string
  code: string
}

export type KerryTrackingPayload = {
  status: Array<KerryTrackingPayloadStatus>
  shipment: {
    ref_no: string
    consignment: string
    sender: KerryTrackingPayloadPerson
    receiver: KerryTrackingPayloadPerson
  }
}
