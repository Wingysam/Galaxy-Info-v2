import format from 'pg-format'

import { deserialize, serialize } from '@galaxyinfo/serialization'
import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
import type GalaxyStaffIngest from 'ingest/services/GalaxyStaff'
import frontendLoggedIn from '../../../middleware/frontendLoggedIn'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function kills ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', scope('kills_read'), async (req, res) => {
    try {
      let killer_ship, victim_ship
      if (typeof req.query.killer_ship == 'string') {
        killer_ship = req.query.killer_ship
      }
      if (typeof req.query.victim_ship == 'string') {
        victim_ship = req.query.victim_ship
      }

      const [carnage, kills] = await GalaxyInfo.prisma.$transaction([
        GalaxyInfo.prisma.$queryRawUnsafe(`
          SELECT
            SUM(victim_cost) AS carnage,
            COUNT(*)
          FROM "Kill_clean"
          WHERE
            1=1
            ${
              killer_ship
              ? format(
                'AND killer_ship = %L',
                killer_ship
              )
              : ''
            }
            ${
              victim_ship
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
            killer_ship
            ? format(
              'AND killer_ship = %L',
              killer_ship
            )
            : ''
          }
          ${
            victim_ship
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

      res.send(serialize({ carnage, kills }))
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  router.get('/:id', scope('kills_read'), frontendLoggedIn({ optional: true }), async (req, res) => {
    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest
    const staff = [...galaxyStaffIngest.developers.members, ...galaxyStaffIngest.admins.members]
    const isAdmin = req.discordUser && staff.includes(req.discordUser.id)

    const id = BigInt(req.params.id)
    const kill = await GalaxyInfo.prisma.kill.findFirst({
      where: {
        id
      }
    })
    res.send(serialize({ kill, isAdmin }))
  })

  router.post('/:id/refund', frontendLoggedIn(), json(), async (req, res) => {
    if (!req.discordUser) throw new Error('not logged in')
    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest
    const staff = [...galaxyStaffIngest.developers.members, ...galaxyStaffIngest.admins.members]
    const isAdmin = staff.includes(req.discordUser.id)
    if (!isAdmin) throw new Error('must be admin')

    const data = deserialize(req.body)

    const refunded_override = !!data.refunded_override
    const refunded = refunded_override && !!data.refunded

    const id = BigInt(req.params.id)
    const kill = await GalaxyInfo.prisma.kill.findFirst({
      where: {
        id
      },
      rejectOnNotFound: true
    })
    kill.refunded_override_history.push({
      admin: req.discordUser.id,
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
