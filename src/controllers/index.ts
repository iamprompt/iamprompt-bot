import cron from '@elysiajs/cron'
import Elysia from 'elysia'

import { UpdateParcelKerryJob } from '@/modules/parcel'

import { lineController } from './line'

export const controllers = new Elysia()
  .use(lineController)
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
