import type { NextFunction, Request, Response } from 'express'
import { serialize } from '../../../../shared/galaxy-info-serialization'

export async function apiToken (req: Request, res: Response, next: NextFunction) {
  try {
    const providedToken = req.params.token || req.header('x-token') || ''

    const foundToken = await req.GalaxyInfo.prisma.apiToken.findUnique({
      where: {
        token: providedToken
      },
      rejectOnNotFound: true
    })

    req.token = foundToken

    return next()
  } catch (error) {
    return res.send(serialize({ error }))
  }
}
