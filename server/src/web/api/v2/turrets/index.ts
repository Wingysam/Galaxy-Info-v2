import { serialize } from '@galaxyinfo/serialization'
import { Router, json } from 'express'
import { scope } from '../../../middleware/scope'
interface Arg {
  GalaxyInfo: GalaxyInfo
}

/**
 * @openapi
 * /v2/turrets:
 *   get:
 *     summary: Get turret data
 *     description: Retrieve all turrets or a specific turret by name. Requires turrets_read scope.
 *     tags:
 *       - Turrets
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     parameters:
 *       - in: query
 *         name: turret
 *         schema:
 *           type: string
 *         description: Name of specific turret to retrieve
 *     responses:
 *       200:
 *         description: Turret data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Turret'
 *                 - type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/Turret'
 *       403:
 *         description: Missing required scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Update turret data
 *     description: Updates turret data with the provided information. Requires turrets_write scope.
 *     tags:
 *       - Turrets
 *     security:
 *       - ApiToken: []
 *       - ApiTokenQuery: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: object
 *               description: Turret data keyed by turret name
 *     responses:
 *       200:
 *         description: Turrets updated successfully
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

export async function turrets ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', scope('turrets_read'), async (req, res) => {
    try {
      if (typeof req.query.turret === 'string') {
        res.send(GalaxyInfo.turrets.get(req.query.turret))
        return
      }
    } catch (error) {
      res.send(`${error}`)
      return
    }
    res.send(serialize(GalaxyInfo.turrets.all()))
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
