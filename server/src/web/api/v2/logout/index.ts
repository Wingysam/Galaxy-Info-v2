import { Router } from 'express'
import frontendLoggedIn from '../../../middleware/frontendLoggedIn'

import fetch from 'node-fetch'
import { serialize } from '@galaxyinfo/serialization'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

export async function logout ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', frontendLoggedIn(), async (req, res) => {
    if (!req.discordUser) { res.send(serialize({ error: 'no discord user' })); return }
    const body = `client_id=${GalaxyInfo.config.web.clientId}&client_secret=${encodeURIComponent(GalaxyInfo.config.bot.clientSecret)}&token=${encodeURIComponent(req.discordUser._token)}`
    const discord = await fetch('https://discord.com/api/oauth2/token/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    res.send(serialize(await discord.json()))
  })

  return router
}
