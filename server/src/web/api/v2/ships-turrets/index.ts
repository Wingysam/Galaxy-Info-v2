import { Router } from 'express'
import { scope } from '../../../middleware/scope'

import type { SerializedShips, SerializedTurrets } from '@galaxyinfo/ships'
import { serialize } from '@galaxyinfo/serialization'
import frontendLoggedIn from '../../../middleware/frontendLoggedIn'
import type GalaxyStaffIngest from 'ingest/services/GalaxyStaff'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function shipsAndTurrets ({ GalaxyInfo }: Arg) {
  const router = Router()

  async function getDumps(user?: string) {
    const serializedShips = (await GalaxyInfo.prisma.keyValue.findUnique({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedShips
      },
      rejectOnNotFound: true
    }) as any).value as SerializedShips

    const allowedShips: SerializedShips = {}

    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest
    if (!galaxyStaffIngest) throw new Error('GalaxyStaffIngest missing')

    const includeSecret = user && galaxyStaffIngest.developers.members.includes(user)

    for (const ship of Object.keys(serializedShips)) {
      if (!serializedShips[ship].secret || includeSecret) allowedShips[ship] = serializedShips[ship]
    }

    const serializedTurrets = (await GalaxyInfo.prisma.keyValue.findUnique({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedTurrets
      },
      rejectOnNotFound: true
    }) as any).value as SerializedTurrets

    return { serializedShips: allowedShips, serializedTurrets }
  }

  router.get('/', scope('ships_read', 'turrets_read'), frontendLoggedIn({ optional: true }), async (req, res) => {
    try {
      const { serializedShips, serializedTurrets } = await getDumps(req.discordUser?.id)
      res.send(serialize({ serializedShips, serializedTurrets }))
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  router.get('/', scope('ships_read', 'turrets_read'), frontendLoggedIn({ optional: true }), async (req, res) => {
    try {
      const { serializedShips, serializedTurrets } = await getDumps(req.discordUser?.id)
      res.send({ serializedShips, serializedTurrets })
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  return router
}
