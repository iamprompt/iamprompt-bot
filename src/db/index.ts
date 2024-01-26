import consola from 'consola'
import { connect } from 'mongoose'

export const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL env')
  }

  connect(process.env.DATABASE_URL)
    .then(() => consola.log('Connected to MongoDB'))
    .catch((err) => console.error(err))
}
