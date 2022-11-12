import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function gameConstants ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.post('/', scope('game_constants_write'), json({ limit: '50mb' }), async (req, res) => {
    try {
      await GalaxyInfo.turrets.save(req.body.turrets)
      // if the turrets changed, the ships won't immediately recognize this,
      // so they need to be reloaded.
      await GalaxyInfo.ships.init()

      const constants = {
        items: req.body.items,
        logCodes: req.body.logCodes
      }

      await GalaxyInfo.prisma.keyValue.upsert({
        create: {
          key: GalaxyInfo.config.db.kvKeys.gameConstants,
          value: constants
        },
        update: {
          value: constants
        },
        where: {
          key: GalaxyInfo.config.db.kvKeys.gameConstants
        }
      })

      GalaxyInfo.gameConstants.load(constants)
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send('Updated turrets.')
  })

  return router
}
