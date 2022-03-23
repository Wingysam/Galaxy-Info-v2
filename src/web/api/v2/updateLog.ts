import { Router } from 'express'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

const UPDATE_LOG = '318472741172936704'

export async function updateLog ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', async (req, res) => {
  })

  return router
}
