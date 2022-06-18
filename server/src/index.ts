import { config as dotenv } from 'dotenv'

import { Intents } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { PrismaClient } from '@prisma/client'

import { GalaxyInfoConfig, parseConfig } from './config'
import GalaxyInfoRobloxInterface from './util/roblox'
import { IngestServices } from './ingest'
import { GalaxyInfoWeb } from './web'
import { GuildConfigs } from './util/guildConfigReadWrite'
import { ExportService } from './export'
import { Ships } from './ships/ships'
import { Turrets } from './ships/turrets'
import { GalaxyInfoClient } from './GalaxyInfoClient'
import { Galaxypedia } from './Galaxypedia'

declare global {
  type GalaxyInfo = { // eslint-disable-line no-unused-vars
    guildConfigs: GuildConfigs,
    config: GalaxyInfoConfig,
    ingest: IngestServices,
    prisma: PrismaClient,
    roblox: GalaxyInfoRobloxInterface,
    client: GalaxyInfoClient,
    web: GalaxyInfoWeb,
    ships: Ships,
    turrets: Turrets,
    galaxypedia: Galaxypedia
  }
}

declare module 'discord.js' {
  interface Client { // eslint-disable-line no-unused-vars
    GalaxyInfo: GalaxyInfo
  }
}

function log (...args: any) {
  console.log('[Init]', ...args)
}

;(async () => {
  dotenv()
  const config = await parseConfig()

  const GalaxyInfo: any = {}

  GalaxyInfo.config = config

  GalaxyInfo.prisma = new PrismaClient()

  GalaxyInfo.ingest = new IngestServices({ GalaxyInfo })

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

  const client = new GalaxyInfoClient({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES],
    partials: ['CHANNEL']
  }, { GalaxyInfo })

  GalaxyInfo.guildConfigs = new GuildConfigs({ GalaxyInfo })

  GalaxyInfo.galaxypedia = new Galaxypedia()

  client.GalaxyInfo = GalaxyInfo

  client.login(config.bot.token)

  GalaxyInfo.client = client
  GalaxyInfo.web = new GalaxyInfoWeb({ GalaxyInfo })
  GalaxyInfo.export = new ExportService({ GalaxyInfo })

  client.once('ready', async () => {
    try {
      if (!client.user) throw new Error('Client has no user')
  
      const rest = new REST({ version: '9' }).setToken(config.bot.token)
      
      const body = Array.from(client.commands.values()).map(command => command.builder)
      
      for (const guild of [ config.guilds.bot, config.guilds.galaxyDevelopment ]) {
        if (!guild) continue
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guild),
          { body }
        )
        log('Uploaded', body.length, 'slash commands to', guild)
      }
      
    } catch (error) {
      log(error)
    }
  })

})()
