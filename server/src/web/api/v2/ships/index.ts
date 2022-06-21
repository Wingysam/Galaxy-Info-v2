import { serialize } from '@galaxyinfo/serialization'
import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ships ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', scope('ships_read'), async (req, res) => {
    try {
      if (typeof req.query.ship == 'string') {
        const ship = GalaxyInfo.ships.find(req.query.ship)
        res.send(serialize(ship))
        return
      }
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send(serialize(GalaxyInfo.ships.all({ secret: false })))
  })

  router.post('/', scope('ships_write'), json({ limit: '50mb' }), async (req, res) => {
    try {
      await GalaxyInfo.ships.save(req.body)
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send('Updated ships.')
  })

  return router
}
