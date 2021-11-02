import express from 'express'

import GalaxyInfoWebApi from './api'

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

    app.use('/api', await GalaxyInfoWebApi({ GalaxyInfo: this.GalaxyInfo }))

    app.listen(config.port, () => {
      log('Listening on', config.port)
    })
  }
}
