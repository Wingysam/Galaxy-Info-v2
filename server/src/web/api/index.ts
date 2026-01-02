import { Router } from 'express'

import { ApiV1 } from './v1'
import { ApiV2 } from './v2'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

/**
 * @openapi
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns a simple message indicating the API is available
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: API is available
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: API
 */

export default async function GalaxyInfoWebApi ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', (_, res) => res.end('API'))

  router.use('/v1', await ApiV1())
  router.use('/v2', await ApiV2({ GalaxyInfo }))

  return router
}
