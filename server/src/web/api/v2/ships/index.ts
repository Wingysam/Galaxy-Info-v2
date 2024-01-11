import type { Alpha, Dps } from '@galaxyinfo/ships'
import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
interface Arg {
  GalaxyInfo: GalaxyInfo
}

export async function ships ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.post('/', scope('ships_write'), json({ limit: '50mb' }), async (req, res) => {
    try {
      await GalaxyInfo.ships.save(req.body, req.query?.test === 'true')
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send('Updated ships.')
    console.log('Ships updated by', Object.keys(req.body).length, req.ip)
  })

  router.post('/stats-from-serialized-ship', scope('ships_compute_stats'), json({ limit: '1mb' }), async (req, res) => {
    try {
      const ship = GalaxyInfo.ships.fromSerializedShip(req.body.ship)
      const range = req.body.range ?? 0
      if (range !== undefined && typeof range !== 'number') throw new Error('range must be a number')
      const loyalty = req.body.loyalty ?? 0
      if (loyalty !== undefined && typeof loyalty !== 'number') throw new Error('loyalty must be a number')

      const stats: any = {}

      stats.weapons = {}

      stats.weapons.total = [
        {
          name: 'Total',
          dps: floorDps(ship.weapons.dps(range, loyalty / 100)),
          alpha: floorAlpha(
            ship.weapons.alpha(range, loyalty / 100)
          )
        }
      ]

      stats.weapons.turrets = [
        ...Array.from(ship.weapons.turrets.turrets.entries()).map(
          ([turret, count]) => {
            return {
              name: `${count}x ${turret.name}`,
              dps: floorDps(
                turret.dps(range, loyalty / 100).multiply(count)
              ),
              alpha: floorAlpha(
                turret.alpha(range, loyalty / 100).multiply(count)
              ),
              reload: turret.reload.toFixed(2)
            }
          }
        ),
        {
          name: 'Total Turrets',
          dps: floorDps(
            ship.weapons.turrets.dps(range, loyalty / 100)
          ),
          alpha: floorAlpha(
            ship.weapons.turrets.alpha(range, loyalty / 100)
          )
        }
      ]

      stats.weapons.spinals = [
        ...(ship.weapons.spinals.spinals)
          .map((spinal, index) => {
            return {
              name: `Spinal${index + 1}`,
              dps: floorDps(spinal.dps(range)),
              alpha: floorAlpha(spinal.alpha(range)),
              reload: spinal.reload.toFixed(2)
            }
          }),
        {
          name: 'Total Spinals',
          dps: floorDps(
            ship.weapons.spinals.dps(range)
          ),
          alpha: floorAlpha(
            ship.weapons.spinals.alpha(range)
          )
        }
      ]

      res.send({ stats })
    } catch (error) {
      res.send(`${error}`)
      return
    }

    function floorDps (dps: Dps) {
      return {
        shield: Math.floor(dps.shield),
        hull: Math.floor(dps.hull),
        average: Math.floor(dps.average)
      }
    }

    function floorAlpha (alpha: Alpha) {
      return {
        shield: Math.floor(alpha.shield),
        hull: Math.floor(alpha.hull),
        max: Math.floor(alpha.max)
      }
    }
  })

  return router
}
