import type { NextFunction, Request, Response } from 'express'
import fetch from 'node-fetch'

export default function frontendLoggedIn (options: { optional?: boolean } = {}) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      function notLoggedIn(reason: string) {
        if (options.optional) return next()
        return res.send(reason)
      }
      const token = req.headers['x-discord-token']
      if (!token) return notLoggedIn('no token')
      if (typeof token !== 'string') return notLoggedIn('token not a string')
  
      const userData = await (await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })).json()
      if (userData.errors) return notLoggedIn('discord api returned an error: ' + JSON.stringify(userData.errors))
  
      userData._token = token
      req.discordUser = userData
      return next()
    } catch (error) {
      if (options.optional) {
        return next()
      }
      throw error
    }
  }
}