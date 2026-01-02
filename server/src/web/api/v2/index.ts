import { Router } from 'express'
import cors from 'cors'

import { updatableGuilds } from './updatableGuilds'
import { guildConfig } from './guildConfig'
import { ships } from './ships'
import { turrets } from './turrets'
import { shipsAndTurrets } from './ships-turrets'
import { gameConstants } from './gameConstants'
import { galaxypedia } from './galaxypedia'
import { kills } from './kills'
import { logout } from './logout'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

/**
 * @openapi
 * /v2:
 *   get:
 *     summary: API v2 root endpoint
 *     description: Returns a simple message indicating API v2 is available
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: API v2 is available
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: API v2
 */

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
  router.use('/game-constants', await gameConstants({ GalaxyInfo }))
  router.use('/galaxypedia', await galaxypedia({ GalaxyInfo }))
  router.use('/kills', await kills({ GalaxyInfo }))

  return router
}
