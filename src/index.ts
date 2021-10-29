import { config as dotenv } from 'dotenv'

import { SapphireClient } from '@sapphire/framework'
import '@sapphire/plugin-logger/register'
import parseConfig from './config'
import IngestService from './ingest'

;(async () => {
  dotenv()
  const config = await parseConfig()

  const GalaxyInfo: GalaxyInfo = { config }

  const client = new SapphireClient({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
    defaultPrefix: GalaxyInfo.config.bot.prefix
  })

  client.login(config.bot.token)

  IngestService({ GalaxyInfo })
})()
