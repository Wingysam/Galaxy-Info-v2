import format from 'pg-format'

import { serialize } from '@galaxyinfo/serialization'
import { Router } from 'express'
import { scope } from '../../../middleware/scope'

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
      const kills = await GalaxyInfo.prisma.$queryRawUnsafe(`
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
      res.send(serialize({ kills }))
    } catch (error) {
      res.send(`${error}`)
      return
    }
  })

  return router
}
