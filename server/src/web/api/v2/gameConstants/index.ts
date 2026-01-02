import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
interface Arg {
  GalaxyInfo: GalaxyInfo
}

/**
 * @openapi
 * /v2/game-constants:
 *   post:
 *     summary: Update game constants
 *     description: Updates game constants including turrets, items, log codes, and classes. Requires game_constants_write scope. This also reloads ships to recognize turret changes.
 *     tags:
 *       - Game Constants
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turrets
 *               - items
 *               - logCodes
 *               - classes
 *             properties:
 *               turrets:
 *                 type: object
 *                 description: Turret data
 *               items:
 *                 type: object
 *                 description: Game items data
 *               logCodes:
 *                 type: object
 *                 description: Log codes data
 *               classes:
 *                 type: object
 *                 description: Ship classes data
 *     responses:
 *       200:
 *         description: Game constants updated successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Updated turrets.
 *       403:
 *         description: Missing required scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
        logCodes: req.body.logCodes,
        classes: req.body.classes
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
