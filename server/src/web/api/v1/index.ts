import { Router } from 'express'

export async function ApiV1 () {
  const router = Router()

  router.get('/', (_, res) => res.end('API v1'))

  return router
}
