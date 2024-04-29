import Elysia, { t } from 'elysia'

import { Role } from '@/db/models'
import { lucia } from '@/modules/auth'

type AuthValidatorOptions = {
  roles?: Role[]
}

export const authValidator = ({ roles = [Role.ADMIN] }: AuthValidatorOptions = {}) => {
  return new Elysia({ name: 'authValidator' })
    .guard({
      cookie: t.Object({ [lucia.sessionCookieName]: t.String() }),
    })
    .derive({ as: 'scoped' }, async ({ cookie: { auth_session } }) => {
      if (!auth_session) {
        return { user: null, session: null }
      }

      const { user, session } = await lucia.validateSession(auth_session.value)

      return { user, session }
    })
    .onBeforeHandle({ as: 'scoped' }, async ({ set, user, session }) => {
      if (!user || !session || !roles.some((role) => user.roles.includes(role))) {
        set.status = 'Unauthorized'
        return { message: 'Unauthorized' }
      }
    })
    .resolve({ as: 'scoped' }, async ({ user, session }) => {
      return { user: user!, session: session! }
    })
}
