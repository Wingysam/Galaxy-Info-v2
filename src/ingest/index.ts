import { Client } from 'discord.js'

import UpdateLogIngest from './updateLog'
import ShipKillsIngest from './shipKills'
import RefundsIngest from './refunds'
import QuestsIngest from './quests'

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Ingest]', ...message)
}

export class IngestService {
  private GalaxyInfo
  public UpdateLog: undefined | UpdateLogIngest
  public ShipKills: undefined | ShipKillsIngest
  public Refunds: undefined | RefundsIngest
  public Quests: undefined | QuestsIngest

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
      this.UpdateLog = new UpdateLogIngest({
        GalaxyInfo: this.GalaxyInfo,
        client
      })
      this.Quests = new QuestsIngest({
        GalaxyInfo: this.GalaxyInfo,
        client,
        log
      })

      log('Instantiated all ingest subservices')
    })

    client.login(this.GalaxyInfo.config.ingest.token)
  }
}
