import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function ships ({ GalaxyInfo }: Arg) {
  const router = Router()

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
