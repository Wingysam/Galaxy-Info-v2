import { config as dotenv } from 'dotenv'

import { SapphireClient } from '@sapphire/framework'
import { PrismaClient } from '@prisma/client'
import '@sapphire/plugin-logger/register'

import { GalaxyInfoConfig, parseConfig } from './config'
import GalaxyInfoRobloxInterface from './util/roblox'
import { IngestService } from './ingest'
import { GalaxyInfoWeb } from './web'
import { GuildConfigs } from './util/guildConfigReadWrite'

declare global {
  type GalaxyInfo = { // eslint-disable-line no-unused-vars
    guildConfigs: GuildConfigs,
    config: GalaxyInfoConfig,
    ingest: IngestService,
    prisma: PrismaClient,
    roblox: GalaxyInfoRobloxInterface,
    client: SapphireClient,
    web: GalaxyInfoWeb
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient { // eslint-disable-line no-unused-vars
    GalaxyInfo: GalaxyInfo
  }
}

;(async () => {
  dotenv()
  const config = await parseConfig()

  ;(async () => {
    const GalaxyInfo: any = {}

    GalaxyInfo.config = config
    GalaxyInfo.ingest = new IngestService({ GalaxyInfo: GalaxyInfo })
    GalaxyInfo.prisma = new PrismaClient()
    GalaxyInfo.roblox = new GalaxyInfoRobloxInterface({ GalaxyInfo: GalaxyInfo })

    const client = new SapphireClient({
      intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES'],
      defaultPrefix: GalaxyInfo.config.bot.prefix,
      partials: [
        'CHANNEL'
      ]
    })

    GalaxyInfo.guildConfigs = new GuildConfigs({ GalaxyInfo })

    client.GalaxyInfo = GalaxyInfo

    client.login(config.bot.token)

    GalaxyInfo.client = client

    GalaxyInfo.web = new GalaxyInfoWeb({ GalaxyInfo })
  })()
})()
