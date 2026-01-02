import format from 'pg-format'

import { deserialize, serialize } from '@galaxyinfo/serialization'
import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
import type GalaxyStaffIngest from 'ingest/services/GalaxyStaff'
import frontendLoggedIn from '../../../middleware/frontendLoggedIn'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

/**
 * @openapi
 * /v2/kills:
 *   get:
 *     summary: Get kill logs
 *     description: Retrieve kill logs with optional filtering by killer ship or victim ship. Requires kills_read scope. Returns up to 250 most recent kills.
 *     tags:
 *       - Kills
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     parameters:
 *       - in: query
 *         name: killer_ship
 *         schema:
 *           type: string
 *         description: Filter by killer ship name
 *       - in: query
 *         name: victim_ship
 *         schema:
 *           type: string
 *         description: Filter by victim ship name
 *     responses:
 *       200:
 *         description: Kill logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carnage:
 *                   type: string
 *                   description: Total carnage value
 *                 kills:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Kill'
 *       403:
 *         description: Missing required scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /v2/kills/{id}:
 *   get:
 *     summary: Get kill by ID
 *     description: Retrieve a specific kill by its ID. Requires kills_read scope or admin privileges.
 *     tags:
 *       - Kills
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kill ID
 *     responses:
 *       200:
 *         description: Kill retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kill:
 *                   $ref: '#/components/schemas/Kill'
 *       403:
 *         description: Missing required scope or not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /v2/kills/{id}/refund:
 *   post:
 *     summary: Update kill refund status
 *     description: Update the refund status of a kill. Requires kills_write scope or admin privileges.
 *     tags:
 *       - Kills
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discordUserId:
 *                 type: string
 *                 description: Discord user ID performing the refund action
 *               refunded_override:
 *                 type: boolean
 *                 description: Whether to override the refund status
 *               refunded:
 *                 type: boolean
 *                 description: Refund status
 *     responses:
 *       200:
 *         description: Kill refund status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kill:
 *                   $ref: '#/components/schemas/Kill'
 *       403:
 *         description: Missing required scope or not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function kills ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', scope('kills_read'), async (req, res) => {
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let killer_ship, victim_ship
      if (typeof req.query.killer_ship === 'string') {
        killer_ship = req.query.killer_ship
      }
      if (typeof req.query.victim_ship === 'string') {
        victim_ship = req.query.victim_ship
      }

      const [carnage, kills]: [any, any] = await GalaxyInfo.prisma.$transaction([
        GalaxyInfo.prisma.$queryRawUnsafe(`
          SELECT
            SUM(victim_cost) AS carnage,
            COUNT(*)
          FROM "Kill_clean"
          WHERE
            1=1
            ${
              typeof killer_ship === 'string'
              ? format(
                'AND killer_ship = %L',
                killer_ship
              )
              : ''
            }
            ${
              typeof victim_ship === 'string'
              ? format(
                'AND victim_ship = %L',
                victim_ship
              )
              : ''
            }
        `),
        GalaxyInfo.prisma.$queryRawUnsafe(`
        SELECT *
        FROM "Kill_clean"
        WHERE
          1=1
          ${
            typeof killer_ship === 'string'
            ? format(
              'AND killer_ship = %L',
              killer_ship
            )
            : ''
          }
          ${
            typeof victim_ship === 'string'
            ? format(
              'AND victim_ship = %L',
              victim_ship
            )
            : ''
          }
        ORDER BY date DESC
        LIMIT 250
      `)
      ])

      res.send(serialize({ carnage: BigInt(carnage[0].carnage.truncated().toString()), kills }))
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  router.get('/:id', frontendLoggedIn({ optional: true }), async (req, res) => {
    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest
    const staff = [...galaxyStaffIngest.developers.members, ...galaxyStaffIngest.admins.members]
    const isAdmin = req.discordUser && staff.includes(req.discordUser.id)

    if (!isAdmin && !req.token.scopes.includes('kills_read')) {
      throw new Error('must either have kills_read scope or be an admin to read kills')
    }

    const id = BigInt(req.params.id)
    const kill = await GalaxyInfo.prisma.kill.findFirst({
      where: {
        id
      }
    })
    res.send(serialize({ kill }))
  })

  router.post('/:id/refund', frontendLoggedIn({ optional: true }), json(), async (req, res) => {
    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest
    const staff = [...galaxyStaffIngest.developers.members, ...galaxyStaffIngest.admins.members]
    const isAdmin = req.discordUser && staff.includes(req.discordUser.id)

    if (!isAdmin && !req.token.scopes.includes('kills_write')) {
      throw new Error('must either have kills_write scope or be an admin to update kills')
    }

    const data = deserialize(req.body)

    const discordUserId = req.discordUser?.id ?? data.discordUserId
    if (!discordUserId) {
      throw new Error('must provide discordUserId')
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const refunded_override = !!data.refunded_override
    const refunded = refunded_override && !!data.refunded

    const id = BigInt(req.params.id)
    const kill = await GalaxyInfo.prisma.kill.findFirstOrThrow({
      where: {
        id
      }
    })
    kill.refunded_override_history.push({
      admin: discordUserId,
      refunded,
      refunded_override
    })
    kill.refunded = refunded
    kill.refunded_override = refunded_override
    await GalaxyInfo.prisma.kill.update({
      where: {
        id
      },
      data: kill
    })
    res.send(serialize({ kill }))
  })

  return router
}
