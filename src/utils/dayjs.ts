import 'dayjs/locale/th'

import dayjs from 'dayjs'

dayjs.locale('th')

export const formatDate = (date: string) => {
  return dayjs(date).format('DD MMM YYYY HH:mm น.')
}

export const formatISODate = (date: string) => {
  if (dayjs(date).isValid()) {
    return dayjs(date).toISOString()
  }

  return date
}

export default dayjs
