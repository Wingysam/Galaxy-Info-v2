import { Client } from 'discord.js'

import { readdir } from 'fs/promises'
import path from 'path'
import { AwaitableCollection } from '../util/AwaitableCollection'
import type { IngestService, IngestServiceArg } from './service'

interface ConstructorArg {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Ingest]', ...message)
}

async function getServices (): Promise<Array<new(arg: IngestServiceArg) => IngestService>> {
  const servicesDir = path.join(__dirname, 'services')
  const serviceFilenames = (await readdir(servicesDir))
    .filter(filename => filename.endsWith('.js'))

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return await Promise.all(serviceFilenames.map(filename => require(path.join(servicesDir, filename)).default))
}

export class IngestServices {
  private readonly GalaxyInfo
  public services: AwaitableCollection<string, IngestService>
  client!: Client

  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.services = new AwaitableCollection()
    this.init()
      .catch(err => {
        log(`Failed to initialize: ${err}`)
      })
  }

  async init () {
    if (typeof this.GalaxyInfo.config.ingest?.token !== 'string') return

    const client = new Client({
      intents: [
        'GUILD_MESSAGES',
        'GUILD_MEMBERS'
      ]
    })
    this.client = client

    client.once('ready', async () => {
      if (!client.user) { log('Error: client.user is falsy'); return }
      log(`Logged in as ${client.user.tag}!`)

      const services = await getServices()

      for (const serviceConstructor of services) {
        // eslint-disable-next-line new-cap
        const service = new serviceConstructor({
          GalaxyInfo: this.GalaxyInfo,
          client,
          log: (...message) => { log(`[${serviceConstructor.name}]`, ...message) }
        })
        this.services.set(serviceConstructor.name, service)
      }

      log('Instantiated all ingest subservices')
    })

    void client.login(this.GalaxyInfo.config.ingest.token)
  }
}
