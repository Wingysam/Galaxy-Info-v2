import { config as dotenv } from 'dotenv'

import { SapphireClient } from '@sapphire/framework'
import '@sapphire/plugin-logger/register'
import { GalaxyInfoConfig, parseConfig } from './config'
import { IngestService } from './ingest'

declare global {
  type GalaxyInfo = { // eslint-disable-line no-unused-vars
    config: GalaxyInfoConfig,
    ingest: IngestService
  }
}

;(async () => {
  dotenv()
  const config = await parseConfig()

  const GalaxyInfo: GalaxyInfo = await (async () => {
    const gi: any = {}

    gi.config = config
    gi.ingest = new IngestService({ GalaxyInfo: gi })

    return gi
  })()

  const client = new SapphireClient({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
    defaultPrefix: GalaxyInfo.config.bot.prefix
  })

  client.login(config.bot.token)
})()
