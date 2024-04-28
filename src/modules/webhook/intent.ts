import { EventSource, TextEventMessage } from '@line/bot-sdk'

export enum TextIntent {
  KERRY_TRACKING_STATUS = 'KERRY_TRACKING_STATUS',
}

export enum PostbackIntent {
  KERRY_TRACKING_NOTIFY_SUBSCRIBE = 'KERRY_TRACKING_NOTIFY_SUBSCRIBE',
  KERRY_TRACKING_NOTIFY_UNSUBSCRIBE = 'KERRY_TRACKING_NOTIFY_UNSUBSCRIBE',
}

type IntentPostbackObject = {
  [PostbackIntent.KERRY_TRACKING_NOTIFY_SUBSCRIBE]: { parcelId: string }
  [PostbackIntent.KERRY_TRACKING_NOTIFY_UNSUBSCRIBE]: { parcelId: string }
}

export const defineTextIntent = (message: TextEventMessage): TextIntent | null => {
  if (isTextStartWith(message.text, 'kerry')) {
    return TextIntent.KERRY_TRACKING_STATUS
  }

  return null
}

export const postbackToObject = <T extends Record<string, any> = Record<string, any>>(postback: string): T => {
  const postbackSearch = new URLSearchParams(postback)

  const postbackObject = new Map<string, any>()
  for (const [key, value] of postbackSearch) {
    postbackObject.set(key, Number.isNaN(Number(value)) ? value : Number(value))
  }

  return Object.fromEntries(postbackObject) as T
}

export const definePostbackIntent = (postback: string) => {
  const { action, ...postbackObject } = postbackToObject<
    IntentPostbackObject[PostbackIntent] & { action: PostbackIntent }
  >(postback)

  if (!Object.values(PostbackIntent).includes(action)) {
    throw new Error('Invalid postback action')
  }

  return [action, postbackObject] as [PostbackIntent, IntentPostbackObject[PostbackIntent]]
}

export const isTextStartWith = (text: string, keyword: string): boolean => {
  const regex = new RegExp(`^\\[${keyword}\\]`, 'i')
  return text.search(regex) !== -1
}

export const getChatId = (source: EventSource): string => {
  switch (source.type) {
    case 'user':
      return source.userId
    case 'group':
      return source.groupId
    case 'room':
      return source.roomId
    default:
      return ''
  }
}
