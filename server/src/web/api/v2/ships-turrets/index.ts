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

/**
 * @openapi
 * /v2/ships-turrets:
 *   get:
 *     summary: Get all ships and turrets data
 *     description: Retrieve serialized data for all ships and turrets. Requires ships_read and turrets_read scopes. Secret/test ships are only included for authorized users.
 *     tags:
 *       - Ships
 *       - Turrets
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     responses:
 *       200:
 *         description: Ships and turrets data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serializedShips:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/Ship'
 *                 serializedTurrets:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/Turret'
 *       403:
 *         description: Missing required scopes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /v2/ships-turrets/raw:
 *   get:
 *     summary: Get raw ships and turrets data
 *     description: Retrieve raw (non-serialized) data for all ships and turrets. Requires ships_read and turrets_read scopes.
 *     tags:
 *       - Ships
 *       - Turrets
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     responses:
 *       200:
 *         description: Raw ships and turrets data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serializedShips:
 *                   type: object
 *                 serializedTurrets:
 *                   type: object
 *       403:
 *         description: Missing required scopes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

    const galaxyStaffIngest = await GalaxyInfo.ingest.services.wait('GalaxyStaffIngest') as GalaxyStaffIngest

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
