import { createHmac } from 'node:crypto'

import { Message } from '@line/bot-sdk'
import axios from 'axios'

import { LINEAccessToken, LINEProfile } from '@/types/line'

const LINEApiInstance = axios.create({
  baseURL: 'https://api.line.me',
})

export const verifySignature = (signature: string, body: any, secret: string) => {
  if (!secret) throw new Error('Channel secret is missing')
  const hash = createHmac('sha256', secret).update(JSON.stringify(body)).digest('base64').toString()
  return hash === signature
}

export const getStatelessToken = async (channelId: string, channelSecret: string) => {
  const { data } = await LINEApiInstance<LINEAccessToken>({
    method: 'POST',
    url: '/oauth2/v3/token',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: channelId,
      client_secret: channelSecret,
    }),
  })

  if (!data.access_token) {
    throw new Error('Failed to get LINE access token')
  }

  return data.access_token
}

export const getProfileByUserId = async (token: string, userId: string) => {
  const { data } = await LINEApiInstance<LINEProfile>({
    method: 'GET',
    url: `/v2/bot/profile/${userId}`,
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const sendNotify = async (message: string) => {
  if (!process.env.LINE_NOTIFY_TOKEN) {
    throw new Error('Missing LINE_NOTIFY_TOKEN env')
  }

  const token = process.env.LINE_NOTIFY_TOKEN

  const { data, status } = await axios({
    method: 'POST',
    url: 'https://notify-api.line.me/api/notify',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: new URLSearchParams({ message }),
  })

  if (!data || status !== 200) {
    throw new Error('LINE Notify failed')
  }

  return data
}

export const reply = async (token: string, replyToken: string, messages: Message[]) => {
  const { data, status } = await LINEApiInstance({
    method: 'POST',
    url: '/v2/bot/message/reply',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: { replyToken, messages },
  })

  if (!data || status !== 200) {
    throw new Error('LINE Reply failed')
  }

  return data
}

export const push = async (token: string, to: string, messages: Message[]) => {
  const { data, status } = await LINEApiInstance({
    method: 'POST',
    url: '/v2/bot/message/push',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { to, messages },
  })

  if (!data || status !== 200) {
    throw new Error('LINE Push failed')
  }

  return data
}

export const displayLoading = async (token: string, chatId: string, duration: number = 20) => {
  const { status } = await LINEApiInstance({
    method: 'POST',
    url: '/v2/bot/chat/loading/start',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { chatId, loadingSeconds: duration },
  })

  if (status !== 202) {
    throw new Error('LINE Loading failed')
  }
}
