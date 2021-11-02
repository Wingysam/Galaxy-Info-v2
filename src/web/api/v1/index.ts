import { Router } from 'express'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ApiV1 (_: Arg) {
  const router = Router()

  router.get('/', (_, res) => res.end('API v1'))

  return router
}
