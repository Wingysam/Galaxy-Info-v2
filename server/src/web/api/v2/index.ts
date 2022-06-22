import { Router } from 'express'
import cors from 'cors'

import { updatableGuilds } from './updatableGuilds'
import { guildConfig } from './guildConfig'
import { ships } from './ships'
import { turrets } from './turrets'
import { shipsAndTurrets } from './ships-turrets'
import { galaxypedia } from './galaxypedia'
import { kills } from './kills'
import { logout } from './logout'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ApiV2 ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.use(cors())

  router.get('/', (_req, res) => res.end('API v2'))

  router.use('/updatableGuilds', await updatableGuilds({ GalaxyInfo }))
  router.use('/guildConfig', await guildConfig({ GalaxyInfo }))
  router.use('/logout', await logout({ GalaxyInfo }))
  router.use('/turrets', await turrets({ GalaxyInfo }))
  router.use('/ships', await ships({ GalaxyInfo }))
  router.use('/ships-turrets', await shipsAndTurrets({ GalaxyInfo }))
  router.use('/galaxypedia', await galaxypedia({ GalaxyInfo }))
  router.use('/kills', await kills({ GalaxyInfo }))

  return router
}
