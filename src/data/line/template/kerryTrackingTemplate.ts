import { FlexBubble } from '@line/bot-sdk'

import { KerryTrackingPayload } from '@/types/parcel/kerry'
import { formatDate } from '@/utils/dayjs'
import { getKerryTrackingStatusIcon, getKerryTrackingUrl } from '@/utils/parcel/kerry'

export const getKerryTrackingFlexMessageHero = (trackingNumber: string) => ({
  type: 'box',
  layout: 'vertical',
  contents: [
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'text',
          text: 'ติดตามพัสดุ',
          color: '#FFFFFF',
          weight: 'bold',
          style: 'normal',
          size: 'lg',
          flex: 0,
        },
        {
          type: 'image',
          url: 'https://bucket.ex10.tech/images/f7bccaf5-bc09-11ee-97d4-0242ac12000b/originalContentUrl.png',
          size: '20px',
          aspectRatio: '1:1',
          flex: 0,
          margin: 'sm',
          action: {
            type: 'clipboard',
            label: 'คัดลอกเลขพัสดุ',
            clipboardText: `${trackingNumber}`,
          },
        },
      ],
      alignItems: 'center',
    },
    {
      type: 'text',
      text: `${trackingNumber}`,
      color: '#FFFFFF',
      style: 'normal',
      weight: 'bold',
      size: 'xxl',
    },
  ],
  backgroundColor: '#F37024',
  paddingAll: 'xxl',
})

export const getKerryTrackingFlexMessageBody = (trackingPayload: KerryTrackingPayload) => {
  const { status, shipment } = trackingPayload

  const latestStatus = status.splice(0, 1)[0]

  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: getKerryTrackingStatusIcon(latestStatus.group),
            aspectRatio: '1:1',
            size: 'xs',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: latestStatus.description,
                weight: 'bold',
                size: 'xl',
                color: '#F37024',
                flex: 1,
              },
              {
                type: 'text',
                text: latestStatus.location,
                color: '#999999',
              },
              {
                type: 'text',
                text: formatDate(latestStatus.date),
                size: 'xxs',
                margin: 'sm',
                color: '#999999',
              },
            ],
            paddingStart: 'lg',
          },
        ],
      },
      {
        type: 'box',
        layout: 'vertical',
        contents: status.map((_status, i) => ({
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'image',
                  url: 'https://th.kerryexpress.com/th/track/v2/assets/resource/point_default.png',
                  aspectRatio: '1:1',
                  size: '16px',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: _status.description,
                  weight: 'bold',
                  margin: 'md',
                },
              ],
              alignItems: 'center',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [],
                  ...(i === status.length - 1 ? {} : { backgroundColor: '#C9C9C9' }),
                  width: '2px',
                  margin: '6.8px',
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    ...(_status.location
                      ? [
                          {
                            type: 'text',
                            text: _status.location,
                            color: '#999999',
                            margin: 'xs',
                            size: 'sm',
                          },
                        ]
                      : []),
                    {
                      type: 'text',
                      text: formatDate(_status.date),
                      size: 'xxs',
                      margin: 'none',
                      color: '#999999',
                    },
                  ],
                  margin: 'xl',
                  paddingBottom: 'lg',
                },
              ],
              position: 'relative',
            },
          ],
        })),
        margin: 'xl',
      },
      {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียด',
              uri: getKerryTrackingUrl(shipment.consignment),
            },
            color: '#3A3937',
          },
        ],
        flex: 0,
        margin: 'xs',
      },
    ],
    paddingAll: 'xxl',
  }
}

export const getKerryTrackingFlexMessage = (trackingPayload: KerryTrackingPayload) => {
  const { shipment } = trackingPayload

  const { consignment } = shipment

  return {
    type: 'bubble',
    hero: getKerryTrackingFlexMessageHero(consignment),
    body: getKerryTrackingFlexMessageBody(trackingPayload),
  } as FlexBubble
}
