import type { Kill } from '.prisma/client'
import type { Client, Message } from 'discord.js'
import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'

type LogFunction = (...message: any[]) => void

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
  client: Client,
  log: LogFunction
}

export default class ShipKillsIngest extends EventEmitter {
  private GalaxyInfo: GalaxyInfo
  private client: Client
  private log: LogFunction

  constructor ({ GalaxyInfo, client, log }: ConstructorArg) {
    super()
    this.GalaxyInfo = GalaxyInfo
    this.client = client
    this.log = (...message) => log('[ship-kills]', ...message)
    this.init()
  }

  async parseMessage (message: Message) {
    if (message.channel.type !== 'GUILD_TEXT') return
    if (message.guild?.id !== this.GalaxyInfo.config.galaxy.guild || message.channel.name !== 'ship-kills') return

    if (!message.embeds.length) return this.log('No embed, id:', message.id)
    const embed = message.embeds[0]

    const description = embed.description
    const title = embed.title

    if (!description) return this.log('Invalid embed, id:', message.id)

    let nuke = false
    let matches = description.match(/^\*\*(.*?)'s (.*?)\*\* \((.*)\) destroyed \*\*([A-z0-9_]{3,20})'s (.*?)\*\* \((.*?) Value: (.*?)\)/)
    if (!matches) {
      matches = description.match(/^\*\*(.*?)'s (.*?)\*\* \((.*)\) __EXPLODED__ destroying \*\*([A-z0-9_]{3,20})'s (.*?)\*\* \((.*?) Value: (.*?)\)/)
      if (matches) nuke = true
    }
    if (!matches || matches.length !== 8) {
      this.log('No Matches:', matches, embed.description)
      return
    }

    const killer_name = matches[1]
    const victim_name = matches[4]

    let killer_id
    try {
      if (matches[3] === 'Base') killer_id = -1n
      else killer_id = await this.GalaxyInfo.roblox.nameToId(killer_name)
    } catch (error) {
      return this.log(killer_name, 'does not exist', error)
    }

    let victim_id
    try {
      victim_id = await this.GalaxyInfo.roblox.nameToId(victim_name)
    } catch {
      return this.log(victim_name, 'does not exist')
    }

    const result = {
      id: BigInt(message.id),
      killer_id,
      killer_name,
      killer_ship: matches[2],
      killer_class: matches[3],
      victim_id,
      victim_name,
      victim_ship: matches[5],
      victim_class: matches[6],
      victim_cost: Number(matches[7].split(',').join('')),
      victim_limited: ['[EVENT SHIP KILL]', '[PRIZE SHIP KILL]'].includes(title || ''),
      refunded: false,
      nuke,
      date: message.createdAt
    }

    return result
  }

  async init () {
    const galaxyGuildId = this.GalaxyInfo.config.galaxy.guild
    if (!galaxyGuildId) return

    const galaxyGuild = this.client.guilds.cache.get(galaxyGuildId)
    if (!galaxyGuild) return this.log('Galaxy Guild is falsy')

    const getOld = async () => {
      const channels = await galaxyGuild.channels.fetch()
      if (!channels) throw new Error("Couldn't find Galaxy guild channels")
      const channel = channels.find(channel => channel.name === 'ship-kills')
      if (!channel) throw new Error("Couldn't find #ship-kills")
      if (!channel.isText()) throw new Error('#ship-kills is a ' + channel.type + ' channel, not a TextChannel')

      const mostRecentKill = await this.GalaxyInfo.prisma.kill.findFirst({
        orderBy: {
          id: 'desc'
        }
      })
      const mostRecentKillId = (mostRecentKill?.id || '').toString()
      this.log('most recent kill id:', mostRecentKillId)

      const fetchOldKills = async (cursor: Message | undefined, alreadyParsed: Kill[]): Promise<number> => {
        if (!cursor) {
          const mostRecent = (await channel.messages.fetch({ limit: 1 })).first()
          if (!mostRecent) throw new Error('#ship-kills is empty!')

          const parsed = await this.parseMessage(mostRecent)
          if (parsed?.id === mostRecentKill?.id) {
            this.log('Backlog: already up-to-date')
            return 0
          }

          return fetchOldKills(mostRecent, parsed ? [parsed] : [])
        }

        const messages = await channel.messages.fetch({
          limit: 100,
          before: cursor.id
        })

        for (const message of Array.from(messages.values())) {
          const parsed = await this.parseMessage(message)
          if (!parsed) {
            this.log(`Couldn't parse ${message.id}: ${message.embeds[0].description}`)
            continue
          }
          alreadyParsed.push(parsed)
        }
        this.log('Parsed', alreadyParsed.length, 'kills', alreadyParsed[alreadyParsed.length - 1].date, (process.memoryUsage().heapUsed / 1024 / 1024 / 1024).toFixed(2) + 'G')

        const oldestMessage = messages.last()
        if (!oldestMessage || messages.map(message => message.id).includes(mostRecentKillId)) {
          alreadyParsed.reverse()
          const startTimestamp = performance.now()
          this.log('Uploading', alreadyParsed.length, 'kills to db')
          const { count } = await this.GalaxyInfo.prisma.kill.createMany({
            data: alreadyParsed,
            skipDuplicates: true
          })
          const endTimestamp = performance.now()
          this.log('Uploaded', count, 'kills in', Math.ceil(endTimestamp - startTimestamp), 'ms')
          return alreadyParsed.length
        }

        return fetchOldKills(oldestMessage, alreadyParsed)
      }

      return fetchOldKills(undefined, [])
    }

    const startTimestamp = performance.now()
    while (true) { // we grab old kills as they come in until there aren't any, this is to prevent an old kill then a new kill without the ones in between.
      const got = await getOld()
      if (got === 0) break
    }
    const endTimestamp = performance.now()
    this.log('Processed old kills in', Math.ceil(endTimestamp - startTimestamp), 'ms')

    this.client.on('messageCreate', async message => {
      const parsed = await this.parseMessage(message)
      if (!parsed) return

      await this.GalaxyInfo.prisma.kill.create({
        data: parsed
      })

      this.log(`${parsed.date} ${parsed.killer_name} (${parsed.killer_id}) ${parsed.killer_ship} -> ${parsed.victim_name} ${parsed.victim_ship}`)
    })
  }
}
