import { TextEventMessage } from '@line/bot-sdk'

export enum Intent {
  KERRY_TRACKING_STATUS = 'KERRY_TRACKING_STATUS',
}

export const defineTextIntent = (message: TextEventMessage): Intent | null => {
  if (isTextStartWith(message.text, 'kerry')) {
    return Intent.KERRY_TRACKING_STATUS
  }

  return null
}

export const isTextStartWith = (text: string, keyword: string): boolean => {
  const regex = new RegExp(`^\\[${keyword}\\]`, 'i')
  return text.search(regex) !== -1
}
