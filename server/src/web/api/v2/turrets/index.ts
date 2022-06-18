import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function turrets ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', scope('turrets_read'), async (req, res) => {
    try {
      if (typeof req.query.turret == 'string') {
        res.send(GalaxyInfo.turrets.get(req.query.turret))
        return
      }
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send(GalaxyInfo.turrets.all())
  })

  router.post('/', scope('turrets_write'), json({ limit: '50mb' }), async (req, res) => {
    try {
      await GalaxyInfo.turrets.save(req.body)
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send('Updated turrets.')
  })

  return router
}
