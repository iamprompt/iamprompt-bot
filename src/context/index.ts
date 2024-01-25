import Elysia from 'elysia'

import consola from 'consola'

export const ctx = new Elysia().decorate('logger', consola)
