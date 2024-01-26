import { createHmac } from 'node:crypto'

import { Message } from '@line/bot-sdk'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

export const verifySignature = (signature: string, body: any, secret?: string) => {
  const channelSecret = secret || CHANNEL_SECRET

  if (!channelSecret) {
    throw new Error('LINE_CHANNEL_SECRET is not provided')
  }

  const hash = createHmac('sha256', channelSecret).update(JSON.stringify(body)).digest('base64').toString()
  return hash === signature
}

export const sendNotify = async (message: string) => {
  if (!process.env.LINE_NOTIFY_TOKEN) {
    throw new Error('Missing LINE_NOTIFY_TOKEN env')
  }

  const token = process.env.LINE_NOTIFY_TOKEN

  const res = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      message,
    }),
  })

  if (!res.ok) {
    throw new Error('LINE Notify failed')
  }

  const result = await res.json()

  return result
}

export const reply = async (replyToken: string, messages: Message[]) => {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN env')
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN

  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  })

  const result = await res.json()

  if (!res.ok) {
    console.log(result)
    throw new Error('LINE Reply failed')
  }

  return result
}

export const push = async (to: string, messages: Message[]) => {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN env')
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages,
    }),
  })

  const result = await res.json()

  if (!res.ok) {
    console.log(result)
    throw new Error('LINE Push failed')
  }

  return result
}
