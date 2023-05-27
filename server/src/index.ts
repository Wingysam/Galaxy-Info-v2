require('module-alias/register')

import { config as dotenv } from 'dotenv'

import { Intents, WebhookClient } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import * as Bloxlink from 'bloxlink-sdk'

import { GalaxyInfoConfig, parseConfig } from './config'
import prisma from './prismaClient'
import roblox from './util/roblox'
import { IngestServices } from './ingest'
import { GalaxyInfoWeb } from './web'
import { GuildConfigs } from './util/guildConfigReadWrite'
import { ExportService } from './export'
import { ServerShips } from '@galaxyinfo/ships'
import { ServerTurrets } from '@galaxyinfo/ships'
import { GalaxyInfoClient } from './GalaxyInfoClient'
import { Galaxypedia } from './Galaxypedia'
import { GameConstants } from './GameConstants'

declare global {
  type GalaxyInfo = { // eslint-disable-line no-unused-vars
    guildConfigs: GuildConfigs,
    config: GalaxyInfoConfig,
    ingest: IngestServices,
    prisma: typeof prisma,
    roblox: typeof roblox,
    client: GalaxyInfoClient,
    web: GalaxyInfoWeb,
    ships: ServerShips,
    turrets: ServerTurrets,
    galaxypedia: Galaxypedia,
    devs: string[],
    staffCommandsWebhook?: WebhookClient,
    bloxlink: any,
    gameConstants: GameConstants
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

;(() => {
  let previous = performance.now()
  setInterval(() => {
    const now = performance.now()
    const diff = now - previous
    if (diff > 1500) console.log('long event loop cycle:', diff)
    previous = now
  }, 1)
})()

;(async () => {
  dotenv()
  const config = await parseConfig()

  const GalaxyInfo: any = {}
  GalaxyInfo.devs = [ // We hard code this because the devs of the app should always be the same
  '235804673578237952', // Wingy
  '993019299025399898' // yname
]

  GalaxyInfo.config = config

  GalaxyInfo.prisma = prisma

  GalaxyInfo.roblox = roblox
  GalaxyInfo.ingest = new IngestServices({ GalaxyInfo })

  GalaxyInfo.turrets = new ServerTurrets(GalaxyInfo)
  await GalaxyInfo.turrets.init()
  GalaxyInfo.ships = new ServerShips(GalaxyInfo)
  await GalaxyInfo.ships.init()

  GalaxyInfo.gameConstants = new GameConstants(GalaxyInfo)
  await GalaxyInfo.gameConstants.init()

  if (GalaxyInfo.config.db.queryLog) {
    prisma.$use(async (params, next) => {
      const before = Date.now()

      const result = await next(params)

      const after = Date.now()

      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)

      return result
    })
  }


  Bloxlink.initialise(config.bloxlink.apiKey)
  GalaxyInfo.bloxlink = Bloxlink

  if (config.bot.staffCommands.webhook) {
    GalaxyInfo.staffCommandsWebhook = new WebhookClient({ url: config.bot.staffCommands.webhook })
  }

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
      
      const MAIN_BOT = '745790085789909033'
      if (client.user.id === MAIN_BOT) {
        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body }
        )
        log('Uploaded', body.length, 'slash commands globally')
      } else {
        for (const command of body) {
          command.setName(`dev-${command.name}`)
        }
        for (const guild of [ config.guilds.bot, config.guilds.galaxyDevelopment, config.guilds.galaxy, config.guilds.galaxySupport ]) {
          if (!guild) continue
          await rest.put(
            Routes.applicationGuildCommands(client.user.id, guild),
            { body }
          )
          log('Uploaded', body.length, 'slash commands to', guild)
        }
      }
      
    } catch (error) {
      log(error)
    }
  })

})()
