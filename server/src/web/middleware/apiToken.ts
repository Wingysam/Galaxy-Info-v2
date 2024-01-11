import type { NextFunction, Request, Response } from 'express'
import { serialize } from '@galaxyinfo/serialization'

export async function apiToken (req: Request, res: Response, next: NextFunction) {
  try {
    const providedToken = (typeof req.query.token === 'string' ? req.query.token : null) ?? req.header('x-token') ?? ''

    const foundToken = await req.GalaxyInfo.prisma.apiToken.findUnique({
      where: {
        token: providedToken
      },
      rejectOnNotFound: true
    })

    req.token = foundToken

    next(); return
  } catch (error) {
    return res.send(serialize({ error }))
  }
}
