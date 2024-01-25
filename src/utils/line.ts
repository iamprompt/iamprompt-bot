import { createHmac } from 'node:crypto'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

export const verifySignature = (signature: string, body: any, secret?: string) => {
  const channelSecret = secret || CHANNEL_SECRET

  if (!channelSecret) {
    throw new Error('LINE_CHANNEL_SECRET is not provided')
  }

  const hash = createHmac('sha256', channelSecret).update(JSON.stringify(body)).digest('base64').toString()
  return hash === signature
}
