import { Router } from 'express'
import { updatableGuilds } from './updatableGuilds'
import cors from 'cors'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ApiV2 ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.use(cors())

  router.get('/', (_, res) => res.end('API v2'))

  router.use('/updatableGuilds', await updatableGuilds({ GalaxyInfo }))

  return router
}
