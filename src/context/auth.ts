import Elysia, { t } from 'elysia'

import { lucia } from '@/modules/auth'

export const authValidator = new Elysia({ name: 'authValidator' })
  .guard({
    cookie: t.Object({ [lucia.sessionCookieName]: t.String() }),
  })
  .derive({ as: 'scoped' }, async ({ cookie: { auth_session } }) => {
    if (!auth_session) {
      return { user: null, session: null }
    }

    const { user, session } = await lucia.validateSession(auth_session.value)

    console.log(user, session)

    return { user, session }
  })
  .onBeforeHandle({ as: 'scoped' }, async ({ set, user, session }) => {
    if (!user || !session) {
      set.status = 'Unauthorized'
      return { message: 'Unauthorized' }
    }
  })
  .resolve({ as: 'scoped' }, async ({ user, session }) => {
    return { user: user!, session: session! }
  })
