import format from 'pg-format'

import { deserialize, serialize } from '@galaxyinfo/serialization'
import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
import type GalaxyStaffIngest from 'ingest/services/GalaxyStaff'
import frontendLoggedIn from '../../../middleware/frontendLoggedIn'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

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
