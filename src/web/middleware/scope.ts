import type { ApiTokenScope } from '.prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { serialize } from '../../../educatejson'

export function scope (...scopes: ApiTokenScope[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const scope of scopes) {
        if (!req.token.scopes.includes(scope)) {
          return res.send(serialize({
            error: `token missing scope ${scope}`
          }))
        }
      }

      return next()
    } catch (error) {
      return res.send(serialize({ error }))
    }
  }
}
