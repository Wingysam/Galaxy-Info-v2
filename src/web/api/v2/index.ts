import { Router } from 'express'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ApiV2 (_: Arg) {
  const router = Router()

  router.get('/', (_, res) => res.end('API v2'))

  return router
}
