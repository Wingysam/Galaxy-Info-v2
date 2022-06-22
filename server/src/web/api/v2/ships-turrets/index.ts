import { Router } from 'express'
import { scope } from '../../../middleware/scope'

import type { SerializedShips, SerializedTurrets } from '@galaxyinfo/ships'
import { serialize } from '@galaxyinfo/serialization'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function shipsAndTurrets ({ GalaxyInfo }: Arg) {
  const router = Router()

  async function getDumps() {
    const serializedShips = (await GalaxyInfo.prisma.keyValue.findUnique({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedShips
      },
      rejectOnNotFound: true
    }) as any).value as SerializedShips

    const nonSecretShips: SerializedShips = {}

    for (const ship of Object.keys(serializedShips)) {
      if (!serializedShips[ship].secret) nonSecretShips[ship] = serializedShips[ship]
    }

    const serializedTurrets = (await GalaxyInfo.prisma.keyValue.findUnique({
      where: {
        key: GalaxyInfo.config.db.kvKeys.serializedTurrets
      },
      rejectOnNotFound: true
    }) as any).value as SerializedTurrets

    return { serializedShips: nonSecretShips, serializedTurrets }
  }

  router.get('/', scope('ships_read', 'turrets_read'), async (_req, res) => {
    try {
      const { serializedShips, serializedTurrets } = await getDumps()
      res.send(serialize({ serializedShips, serializedTurrets }))
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  router.get('/raw', scope('ships_read', 'turrets_read'), async (_req, res) => {
    try {
      const { serializedShips, serializedTurrets } = await getDumps()
      res.send({ serializedShips, serializedTurrets })
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  return router
}
