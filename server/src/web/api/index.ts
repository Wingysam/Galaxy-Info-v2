import { Router } from 'express'

import { ApiV1 } from './v1'
import { ApiV2 } from './v2'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

export default async function GalaxyInfoWebApi ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', (_, res) => res.end('API'))

  router.use('/v1', await ApiV1())
  router.use('/v2', await ApiV2({ GalaxyInfo }))

  return router
}
