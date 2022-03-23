import { Client, Message, TextChannel } from 'discord.js'
import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'

type LogFunction = (...message: any[]) => void

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
  client: Client,
  log: LogFunction
}

export default class RefundsIngest extends EventEmitter {
  private GalaxyInfo: GalaxyInfo
  private client: Client
  private log: LogFunction

  constructor ({ GalaxyInfo, client, log }: ConstructorArg) {
    super()
    this.GalaxyInfo = GalaxyInfo
    this.client = client
    this.log = (...message) => log('[Refunds]', ...message)
    this.init()
  }

  async init () {
    const galaxyGuildId = this.GalaxyInfo.config.galaxy.guild
    if (!galaxyGuildId) return

    const galaxyGuild = this.client.guilds.cache.get(galaxyGuildId)
    if (!galaxyGuild) return this.log('Galaxy Guild is falsy')

    this.client.on('messageCreate', async message => {
      if (!message.guild) return // DM
      if (message.guild.id !== galaxyGuild.id) return // not in the galaxy guild
      if (!(message.channel instanceof TextChannel)) return // Voice or something idk
      if (message.channel.name !== 'accepted-refunds') return // a different channel

      await this.scanMessages([message])
    })

    ; (async () => {
      const channels = await galaxyGuild.channels.fetch()
      if (!channels) return this.log("Couldn't find Galaxy guild channels")
      const channel = channels.find(channel => channel.name === 'accepted-refunds')
      if (!channel) return this.log("Couldn't find #accepted-refunds")
      if (!channel.isText()) return this.log('#accepted-refunds is a', channel.type, 'channel, not a TextChannel')

      const fetchAllRefunds = async (cursor: Message | undefined, allMessages: Message[]): Promise<void> => {
        if (!cursor) {
          const mostRecent = (await channel.messages.fetch({ limit: 1 })).first()
          if (!mostRecent) return this.log('#accepted-refunds is empty!')

          return fetchAllRefunds(mostRecent, [mostRecent])
        }

        const messages = await channel.messages.fetch({
          limit: 100,
          before: cursor.id
        })

        allMessages = [...allMessages, ...messages.values()]
        if (this.GalaxyInfo.config.ingest.verbose) {
          this.log(
            'Fetched',
            allMessages.length,
            'messages',
            allMessages[allMessages.length - 1].createdAt,
            (process.memoryUsage().heapUsed / 1024 / 1024 / 1024).toFixed(2) + 'G'
          )
        }

        const oldestMessage = messages.last()
        if (!oldestMessage) {
          allMessages.reverse()
          const startTimestamp = performance.now()
          const ingestedRefunds = await this.scanMessages(allMessages)
          const endTimestamp = performance.now()
          this.log('Ingested', ingestedRefunds, 'refunds in', endTimestamp - startTimestamp, 'ms')
          return
        }

        return fetchAllRefunds(oldestMessage, allMessages)
      }

      fetchAllRefunds(undefined, [])
    })()
  }

  async scanMessages (allMessages: Message[]) {
    const kills = await this.GalaxyInfo.prisma.kill.findMany()
    let ingestedRefunds = 0
    for (const kill of kills) {
      for (const message of allMessages) {
        const lower = message.content.toLowerCase()
        if (!lower.includes(kill.victim_name.toLowerCase())) continue
        if (!lower.includes(kill.victim_ship.toLowerCase())) continue
        if (kill.date > message.createdAt) continue

        const refundCandidateKills = await this.GalaxyInfo.prisma.kill.findMany({
          where: {
            victim_name: kill.victim_name,
            victim_ship: kill.victim_ship
          }
        })
        refundCandidateKills.reverse()

        const refundedKill = refundCandidateKills.find(candidate => candidate.date < message.createdAt)
        if (!refundedKill) continue // this kill wasn't refunded
        if (refundedKill.refunded) continue // no need to update in database, already registered as refunded

        await this.GalaxyInfo.prisma.kill.update({
          where: {
            id: refundedKill.id
          },
          data: {
            refunded: true
          }
        })

        ingestedRefunds++
        this.log('Refunded', kill.victim_name, kill.victim_ship)
      }
    }
    return ingestedRefunds
  }
}
