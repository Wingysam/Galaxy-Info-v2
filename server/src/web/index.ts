import express from 'express'
import 'express-async-errors'

import GalaxyInfoWebApi from './api'
import { apiToken } from './middleware/apiToken'

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Web]', ...message)
}

export class GalaxyInfoWeb {
  private GalaxyInfo

  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.init()
  }

  async init () {
    const config = this.GalaxyInfo.config.web

    const app = express()

    app.use((req, _res, next) => {
      req.GalaxyInfo = this.GalaxyInfo
      next()
    })

    app.use(apiToken)

    app.use('/api', await GalaxyInfoWebApi({ GalaxyInfo: this.GalaxyInfo }))

    app.get('/', (_, res) => res.send('should be frontend'))

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err)
      res.status(500)
      res.end()
    })

    app.listen(config.port, () => {
      log('Listening on', config.port)
    })
  }
}
