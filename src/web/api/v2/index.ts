import { Router } from 'express'
import cors from 'cors'

import { updatableGuilds } from './updatableGuilds'
import { guildConfig } from './guildConfig'
import { ships } from './ships'
import { turrets } from './turrets'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ApiV2 ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.use(cors())

  router.get('/', (_req, res) => res.end('API v2'))

  router.use('/updatableGuilds', await updatableGuilds({ GalaxyInfo }))
  router.use('/guildConfig', await guildConfig({ GalaxyInfo }))
  router.use('/turrets', await turrets({ GalaxyInfo }))
  router.use('/ships', await ships({ GalaxyInfo }))

  return router
}
