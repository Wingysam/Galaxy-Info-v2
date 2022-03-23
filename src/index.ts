import { config as dotenv } from 'dotenv'

import { SapphireClient } from '@sapphire/framework'
import { PrismaClient } from '@prisma/client'
import '@sapphire/plugin-logger/register'

import { GalaxyInfoConfig, parseConfig } from './config'
import GalaxyInfoRobloxInterface from './util/roblox'
import { IngestService } from './ingest'
import { GalaxyInfoWeb } from './web'
import { GuildConfigs } from './util/guildConfigReadWrite'
import { ExportService } from './export'
import { Ships } from './ships/ships'
import { Turrets } from './ships/turrets'

declare global {
  type GalaxyInfo = { // eslint-disable-line no-unused-vars
    guildConfigs: GuildConfigs,
    config: GalaxyInfoConfig,
    ingest: IngestService,
    prisma: PrismaClient,
    roblox: GalaxyInfoRobloxInterface,
    client: SapphireClient,
    web: GalaxyInfoWeb,
    ships: Ships,
    turrets: Turrets
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

  const GalaxyInfo: any = {}

  GalaxyInfo.config = config

  GalaxyInfo.prisma = new PrismaClient()

  GalaxyInfo.ingest = new IngestService({ GalaxyInfo })

  GalaxyInfo.turrets = new Turrets(GalaxyInfo)
  await GalaxyInfo.turrets.init()
  GalaxyInfo.ships = new Ships(GalaxyInfo)
  await GalaxyInfo.ships.init()

  if (GalaxyInfo.config.db.queryLog) {
    ;(GalaxyInfo.prisma as PrismaClient).$use(async (params, next) => {
      const before = Date.now()

      const result = await next(params)

      const after = Date.now()

      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)

      return result
    })
  }

  GalaxyInfo.roblox = new GalaxyInfoRobloxInterface({ GalaxyInfo })

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
  GalaxyInfo.export = new ExportService({ GalaxyInfo })
})()
