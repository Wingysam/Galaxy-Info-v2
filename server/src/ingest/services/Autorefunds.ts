import type { Message } from 'discord.js'
import { performance } from 'perf_hooks'
import { IngestService, IngestServiceArg } from '../service'
import { DiscordLogIngester, DiscordLogIngesterParser } from '../DiscordLogIngester'

import type { Autorefund } from '.prisma/client'

// The Autorefunds ingest is responsible for logging duplicate refunds.
export default class AutorefundsIngest extends IngestService {
  constructor (arg: IngestServiceArg) {
    super(arg)
  }

  async init () {
    if (!this.GalaxyInfo.config.guilds.galaxyDevelopment) throw new Error('Galaxy Development guild is unconfigured')
    const mostRecentRefund = await this.GalaxyInfo.prisma.autorefund.findFirst({
      orderBy: {
        refund_id: 'desc'
      }
    })

    const parser = new AutorefundsIngestParser()

    new DiscordLogIngester({
      client: this.client,
      channel: {
        guildId: this.GalaxyInfo.config.guilds.galaxyDevelopment,
        channelName: 'auto-refunds'
      },
      startingMessageId: mostRecentRefund?.refund_id,
      parser: parser,
      callback: this.handleAutorefunds.bind(this)
    })
  }

  private async handleAutorefunds (refunds: Autorefund[]) {
    for (const refund of refunds) this.emit('refund', refund)
    await this.uploadToDatabase(refunds)
  }

  private async uploadToDatabase (refunds: Autorefund[]) {
    const startTimestamp = performance.now()
    const { count } = await this.GalaxyInfo.prisma.autorefund.createMany({
      data: refunds,
      skipDuplicates: true
    })
    const endTimestamp = performance.now()
    this.log('Uploaded', count, 'autorefunds in', Math.ceil(endTimestamp - startTimestamp), 'ms')
  }
}

export class AutorefundsIngestParser extends DiscordLogIngesterParser {
  public parse

  constructor () {
    super()
    this.parse = this._parse.bind(this)
  }

  public async _parse (message: Message): Promise<Autorefund> {
    async function parseContent (text: string) {
      const matches = text.match(/^Issued refund of \$(\d*) to ([A-z0-9_]{3,20}) for their (.*?)\.$/)
      if (!matches) throw new Error(`invalid autorefund log: no matches (${message.id})\n\t${text}`)
      if (matches.length !== 4) throw new Error(`invalid autorefund log: incorrect number of matches (${matches.length})\n\t${text}`)

      const payout = BigInt(matches[1])
      const username = matches[2]
      const ship = matches[3]

      const result = {
        username,
        payout,
        ship,
        date: message.createdAt
      }

      return result
    }

    async function parseUsername (username: string) {
      const matches = username.match(/^Auto Refunds \[(Galaxy|Arcade|Dev)\]/)
      if (!matches || matches.length !== 2) throw new Error(`Autorefunds name invalid: ${username}`)
      return assertStringIsOneOfAcceptable(matches[1], 'Galaxy', 'Arcade', 'Dev')
    }

    async function assertStringIsOneOfAcceptable<T extends string> (string: string, ...acceptable: T[]): Promise<T> {
      for (const candidate of acceptable) {
        if (string === candidate) return string as T
      }
      throw new Error(`${string} is not one of ${acceptable}`)
    }

    const result = {
      refund_id: BigInt(message.id),
      environment: await parseUsername(message.author.username),
      ...await parseContent(message.content)
    }

    return result
  }
}
