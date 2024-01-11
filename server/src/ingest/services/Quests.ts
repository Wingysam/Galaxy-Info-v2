import { type Message, MessageEmbed, WebhookClient } from 'discord.js'
import { performance } from 'perf_hooks'
import { IngestService, type IngestServiceArg } from '../service'
import { DiscordLogIngester, DiscordLogIngesterParser } from '../DiscordLogIngester'

type QuestCompletionEnvironment = 'Galaxy' | 'Arcade' | 'Dev'
type QuestCompletionServerType = 'Public' | 'Private'
export interface QuestCompletion {
  completionId: bigint
  environment: QuestCompletionEnvironment
  serverType: QuestCompletionServerType
  username: string
  questId: string
  title: string
  reward: string
  date: Date
}

// The Quests ingest is responsible for emitting `QuestCompletion`s, uploading them to database, and logging admin spawns.
export default class QuestsIngest extends IngestService {
  private readonly npcHooks?: WebhookClient[]

  constructor (arg: IngestServiceArg) {
    super(arg)

    if (this.GalaxyInfo.config.ingest.quests.npcHooks) this.npcHooks = this.GalaxyInfo.config.ingest.quests.npcHooks.map(url => new WebhookClient({ url }))
  }

  async init () {
    if (typeof this.GalaxyInfo.config.guilds.galaxyDevelopment !== 'string') throw new Error('Galaxy Development guild is unconfigured')
    const mostRecentCompletion = await this.GalaxyInfo.prisma.questCompletion.findFirst({
      orderBy: {
        completion_id: 'desc'
      }
    })

    const parser = new QuestsIngestParser()

    new DiscordLogIngester({
      client: this.client,
      channel: {
        guildId: this.GalaxyInfo.config.guilds.galaxyDevelopment,
        channelName: 'quest-completions'
      },
      startingMessageId: mostRecentCompletion?.completion_id,
      parser,
      callback: this.handleQuestCompletions.bind(this)
    })
  }

  private async handleQuestCompletions (completions: QuestCompletion[]) {
    for (const completion of completions) this.emit('completion', completion)
    await this.uploadToDatabase(completions)
    await this.logAdminSpawns(completions)
  }

  private async logAdminSpawns (questCompletions: QuestCompletion[]) {
    const QUESTS: Record<string, string> = {
      '-694201': 'Kneall Miner Fleet',
      20211209: 'Grim Reaper',
      '-102': 'Pirate Fleet',
      '-102.1': 'Kraken Fleet',
      '-101': 'Necromancer Fleet',
      '-100': "Pleb's Kodiak",
      '-6942010': 'Kneall Koderadicator Fleet',
      '-6942011': 'Kneall Koderadicator Fleet',
      '-365345': 'Harvest King'
    }
    if (!this.npcHooks) return
    for (const completion of questCompletions) {
      const quest = QUESTS[completion.questId]
      if (!quest) continue
      if (completion.environment !== 'Galaxy') continue
      const embed = new MessageEmbed()
      embed.setDescription(`**${completion.username}** spawned a *${quest}*.`)
      embed.setTimestamp(completion.date)
      this.npcHooks.forEach(async hook => await hook.send({ embeds: [embed] }))
    }
  }

  private async uploadToDatabase (questCompletions: QuestCompletion[]) {
    const startTimestamp = performance.now()
    const { count } = await this.GalaxyInfo.prisma.questCompletion.createMany({
      data: questCompletions.map(completion => {
        return {
          completion_id: completion.completionId,
          environment: completion.environment,
          server_type: completion.serverType,

          username: completion.username,

          title: completion.title,
          quest_id: completion.questId,
          reward: completion.reward,

          date: completion.date
        }
      }),
      skipDuplicates: true
    })
    const endTimestamp = performance.now()
    this.log('Uploaded', count, 'quest completions in', Math.ceil(endTimestamp - startTimestamp), 'ms')
  }
}

export class QuestsIngestParser extends DiscordLogIngesterParser {
  public parse

  constructor () {
    super()
    this.parse = this._parse.bind(this)
  }

  public async _parse (message: Message): Promise<QuestCompletion> {
    async function parseContent (text: string) {
      const matches = text.match(/^\[(Public|Private)\] ([A-z0-9_]{3,20}) completed (.*?): (.*), reward: (.*)$/)
      if (!matches) throw new Error(`invalid quest log: no matches (${message.id})\n\t${text}`)
      if (matches.length !== 6) throw new Error(`invalid quest log: incorrect number of matches\n\t${text}`)

      const serverType = await assertStringIsOneOfAcceptable(matches[1], 'Public', 'Private')
      const username = matches[2]
      const questId = matches[3]
      const title = matches[4]
      const reward = matches[5]

      if (!['Public', 'Private'].includes(serverType)) throw new Error(`invalid server type: ${serverType}`)

      const result = {
        serverType,
        username,
        questId,
        title,
        reward,
        date: message.createdAt
      }

      return result
    }

    async function parseUsername (username: string) {
      const matches = username.match(/^Quest Completions \[(Galaxy|Arcade|Dev)\]/)
      if (!matches || matches.length !== 2) throw new Error(`quest completions name invalid: ${username}`)
      return await assertStringIsOneOfAcceptable(matches[1], 'Galaxy', 'Arcade', 'Dev')
    }

    async function assertStringIsOneOfAcceptable<T extends string> (string: string, ...acceptable: T[]): Promise<T> {
      for (const candidate of acceptable) {
        if (string === candidate) return string as T
      }
      throw new Error(`${string} is not one of ${acceptable}`)
    }

    const result = {
      completionId: BigInt(message.id),
      environment: await parseUsername(message.author.username),
      ...await parseContent(message.content)
    }

    return result
  }
}
