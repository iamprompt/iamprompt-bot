export type LINEAccessToken = {
  token_type: string
  access_token: string
  expires_in: number
}

export type LINEProfile = {
  displayName: string
  userId: string
  language?: string
  pictureUrl?: string
  statusMessage?: string
}
