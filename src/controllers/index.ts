import cron from '@elysiajs/cron'
import Elysia from 'elysia'

import { UpdateParcelKerryJob } from '@/modules/parcel'

import { authController } from './auth'
import { lineController } from './line'
import { lineBotController } from './lineBot'

export const controllers = new Elysia()
  .use(lineController)
  .use(authController)
  .use(lineBotController)
  .use(
    cron({
      name: 'parcel_update_kerry',
      pattern: '*/30 * * * * *',
      run: UpdateParcelKerryJob,
    }),
  )
  .get('/', ({}) => {
    return { message: 'Server is running!' }
  })
