declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LINE_CHANNEL_SECRET: string
    }
  }
}

export {}
