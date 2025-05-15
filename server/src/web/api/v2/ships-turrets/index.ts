import { Router } from 'express'
import { scope } from '../../../middleware/scope'

import type { SerializedShips, SerializedTurrets } from '@galaxyinfo/ships'
import { serialize } from '@galaxyinfo/serialization'
import frontendLoggedIn from '../../../middleware/frontendLoggedIn'
import type GalaxyStaffIngest from 'ingest/services/GalaxyStaff'
import { sleep } from '../../../../util/sleep'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

export async function shipsAndTurrets ({ GalaxyInfo }: Arg) {
  const router = Router()

  async function getDumps (user?: string) {
    const serializedShipsMain = (await GalaxyInfo.prisma.keyValue.findUniqueOrThrow({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedShips
      }
    }) as any).value as SerializedShips

    const serializedShipsTest = (await GalaxyInfo.prisma.keyValue.findUniqueOrThrow({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedTestShips
      }
    }) as any).value as SerializedShips

    const serializedShips = { ...serializedShipsMain, ...serializedShipsTest }

    const allowedShips: SerializedShips = {}

    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest | undefined
    if (!galaxyStaffIngest) throw new Error('GalaxyStaffIngest missing')

    const includeSecret = typeof user === 'string' && galaxyStaffIngest.testShipAccess.members.includes(user)

    for (const ship of Object.keys(serializedShips)) {
      if (includeSecret || (!serializedShips[ship].secret && !serializedShips[ship].test)) allowedShips[ship] = serializedShips[ship]
    }

    const serializedTurrets = (await GalaxyInfo.prisma.keyValue.findUniqueOrThrow({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedTurrets
      }
    }) as any).value as SerializedTurrets

    const allowedTurrets: SerializedTurrets = {}
    for (const turret of Object.keys(serializedTurrets)) {
      if (includeSecret || (!['Test', 'Modelers'].includes(serializedTurrets[turret].Group))) allowedTurrets[turret] = serializedTurrets[turret]
    }

    return { serializedShips: allowedShips, serializedTurrets: allowedTurrets }
  }

  let unauthenticatedCache = getDumps()
  void (async () => {
    while (true) {
      await sleep(5000) // 5 seconds
      try {
        const latestCache = getDumps()
        await latestCache
        unauthenticatedCache = latestCache
      } catch (error) {
        console.error('Failed to update ships and turrets cache:', error)
      }
    }
  })()

  router.get('/', scope('ships_read', 'turrets_read'), frontendLoggedIn({ optional: true }), async (req, res) => {
    try {
      const { serializedShips, serializedTurrets } = typeof req.discordUser?.id === 'string'
        ? await getDumps(req.discordUser.id)
        : await unauthenticatedCache
      res.send(serialize({ serializedShips, serializedTurrets }))
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  router.get('/raw', scope('ships_read', 'turrets_read'), frontendLoggedIn({ optional: true }), async (req, res) => {
    try {
      const { serializedShips, serializedTurrets } = typeof req.discordUser?.id === 'string'
        ? await getDumps(req.discordUser.id)
        : await unauthenticatedCache
      res.send({ serializedShips, serializedTurrets })
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  return router
}
