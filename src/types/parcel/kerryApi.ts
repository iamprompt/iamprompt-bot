export type TrackingResponse = {
  icon: Icon | undefined
  shipment: Shipment | null
  shipment_status: Status[] | null
  sta: Metadata
}

export type Icon = {
  current_idx: number
  display: Display[]
}

export type Display = {
  code: string
  desc: string
}

export type Shipment = {
  booking_no: string
  cnee: string
  cod_amount: string
  con: string
  con_type: string
  cool_con_type: string
  dest_postcode: string
  dest_province: string
  destination_dc: string
  dly_banner: string
  edt: string
  org_province: string
  origin_dc: string
  pickup_date: string
  r_mobile: string
  r_name: string
  ref_no: string
  s_mobile: string
  s_postcode: string
  sender: string
  sig: string
}

export type Status = {
  call_number: string
  consignment_ref_no: string
  courier_id: string
  courier_mobile: string
  courier_name: string
  indx: number
  kf_driver_id: string
  kf_driver_mobile: string
  kf_driver_name: string
  loc: string
  location_dc_code: string
  original_status_code: string
  partner_name: string
  return_consignment_no: string
  s_action: string
  s_code: string
  s_date: string
  s_datetime: string
  s_desc: string
  s_group: string
  s_temperature: string
  s_time: string
  talk_time: string
  wating_time: string
}

export type Metadata = {
  code: string
  desc: string
}
