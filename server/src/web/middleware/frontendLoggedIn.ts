import type { NextFunction, Request, Response } from 'express'
import fetch from 'node-fetch'

export default function frontendLoggedIn (options: { optional?: boolean } = {}) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      function notLoggedIn (reason: string) {
        if (options.optional) { next(); return }
        return res.send(reason)
      }
      const token = req.headers['x-discord-token']
      if (typeof token !== 'string') return notLoggedIn('token not a string')
      if (token === '') return notLoggedIn('no token')

      const userData = await (await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })).json()
      if (userData.errors) return notLoggedIn('discord api returned an error: ' + JSON.stringify(userData.errors))

      userData._token = token
      req.discordUser = userData
      next(); return
    } catch (error) {
      if (options.optional) {
        next(); return
      }
      throw error
    }
  }
}
