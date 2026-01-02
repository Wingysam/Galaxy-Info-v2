import express from 'express'
import 'express-async-errors'
import swaggerUi from 'swagger-ui-express'

import GalaxyInfoWebApi from './api'
import { apiToken } from './middleware/apiToken'
import { swaggerSpec } from './swagger'

interface ConstructorArg {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Web]', ...message)
}

export class GalaxyInfoWeb {
  private readonly GalaxyInfo

  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    void this.init()
  }

  async init () {
    const config = this.GalaxyInfo.config.web

    const app = express()

    app.use((req, _res, next) => {
      req.GalaxyInfo = this.GalaxyInfo
      next()
    })

    // Swagger UI setup - accessible without token
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Galaxy Info API Documentation'
    }))

    app.use(apiToken) // eslint-disable-line @typescript-eslint/no-misused-promises

    app.use('/api', await GalaxyInfoWebApi({ GalaxyInfo: this.GalaxyInfo }))

    app.get('/', (_, res) => res.send('should be frontend'))

    app.use((req: express.Request, res: express.Response) => {
      console.error('Got a request for nonexistent path', req.originalUrl)
      res.status(404)
      res.end()
    })

    app.listen(config.port, () => {
      log('Listening on', config.port)
    })
  }
}
