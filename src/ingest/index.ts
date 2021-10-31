import { Client } from 'discord.js'
import RefundsIngest from './refunds'
import ShipKillsIngest from './shipKills'

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Ingest]', ...message)
}

export class IngestService {
  private GalaxyInfo
  public ShipKills: undefined | ShipKillsIngest
  public Refunds: undefined | RefundsIngest

  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.init()
  }

  async init () {
    if (!this.GalaxyInfo.config.ingest?.token) return

    const client = new Client({
      intents: [
        'GUILD_MESSAGES'
      ]
    })

    client.once('ready', async () => {
      if (!client.user) return log('Error: client.user is falsy')
      log(`Logged in as ${client.user.tag}!`)
      this.ShipKills = new ShipKillsIngest({
        GalaxyInfo: this.GalaxyInfo,
        client,
        log
      })
      this.Refunds = new RefundsIngest({
        GalaxyInfo: this.GalaxyInfo,
        client,
        log
      })
    })

    client.login(this.GalaxyInfo.config.ingest.token)
  }
}
