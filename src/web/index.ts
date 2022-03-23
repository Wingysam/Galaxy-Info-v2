import express from 'express'

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

    app.listen(config.port, () => {
      log('Listening on', config.port)
    })
  }
}
