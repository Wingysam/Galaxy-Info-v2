import { config as dotenv } from 'dotenv'

import { SapphireClient } from '@sapphire/framework'
import '@sapphire/plugin-logger/register'
import { GalaxyInfoConfig, parseConfig } from './config'
import { IngestService } from './ingest'
import { PrismaClient } from '@prisma/client'
import GalaxyInfoRobloxInterface from './roblox'

declare global {
  type GalaxyInfo = { // eslint-disable-line no-unused-vars
    config: GalaxyInfoConfig,
    ingest: IngestService,
    prisma: PrismaClient,
    roblox: GalaxyInfoRobloxInterface,
    client: SapphireClient
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

  await (async () => {
    const GalaxyInfo: any = {}

    GalaxyInfo.config = config
    GalaxyInfo.ingest = new IngestService({ GalaxyInfo: GalaxyInfo })
    GalaxyInfo.prisma = new PrismaClient()
    GalaxyInfo.roblox = new GalaxyInfoRobloxInterface({ GalaxyInfo: GalaxyInfo })

    const client = new SapphireClient({
      intents: ['GUILDS', 'GUILD_MESSAGES'],
      defaultPrefix: GalaxyInfo.config.bot.prefix
    })

    client.GalaxyInfo = GalaxyInfo

    client.login(config.bot.token)

    GalaxyInfo.client = client

    return GalaxyInfo
  })()
})()
