import { performance } from 'perf_hooks'

import type { Kill } from '.prisma/client'
import type { Message } from 'discord.js'

import { DiscordLogIngester, DiscordLogIngesterParser } from '../DiscordLogIngester'
import type GalaxyInfoRobloxInterface from '../../util/roblox'
import { IngestService, IngestServiceArg } from '../service'
import { min } from '../../util/clampBigInt'

// The Ship Kills ingest is responsible for uploading `Kill`s to the database and emitting them.
export default class ShipKillsIngest extends IngestService {
  dli?: DiscordLogIngester

  constructor (arg: IngestServiceArg) {
    super(arg)
    this.init()
  }

  async init () {
    if (!this.GalaxyInfo.config.galaxy.guild) throw new Error('Galaxy guild is unconfigured')
    const mostRecentKill = await this.GalaxyInfo.prisma.kill.findFirst({
      orderBy: {
        id: 'desc'
      }
    })

    const parser = new ShipKillsIngestParser(this.GalaxyInfo.roblox)

    this.dli = new DiscordLogIngester({
      client: this.client,
      channel: {
        guildId: this.GalaxyInfo.config.galaxy.guild,
        channelName: 'ship-kills'
      },
      startingMessageId: mostRecentKill?.id,
      parser: parser,
      callback: this.handleKills.bind(this)
    })
  }

  private async handleKills (kills: Kill[]) {
    for (const kill of kills) this.emit('kill', kill)
    await this.uploadToDatabase(kills)
  }

  private async uploadToDatabase (kills: any[]) {
    const startTimestamp = performance.now()
    const { count } = await this.GalaxyInfo.prisma.kill.createMany({
      data: kills,
      skipDuplicates: true
    })
    const endTimestamp = performance.now()
    this.log('Uploaded', count, 'kills in', Math.ceil(endTimestamp - startTimestamp), 'ms')
  }
}

export class ShipKillsIngestParser extends DiscordLogIngesterParser {
  private roblox: GalaxyInfoRobloxInterface
  public parse

  constructor (roblox: GalaxyInfoRobloxInterface) {
    super()
    this.roblox = roblox
    this.parse = this._parse.bind(this)
  }

  public async _parse (message: Message): Promise<Kill> {
    if (!message.embeds.length) throw new Error(`No embed, id: ${message.id} content: ${message.content}`)
    const embed = message.embeds[0]

    const description = embed.description
    const title = embed.title

    if (!description) throw new Error(`Invalid embed, id: ${message.id}`)

    let nuke = false
    let matches = description.match(/^\*\*(.*?)'s (.*?)\*\* \((.*)\) destroyed \*\*([A-z0-9_]{3,20})'s (.*?)\*\* \((.*?) Value: (.*?)\)/)
    if (!matches) {
      matches = description.match(/^\*\*(.*?)'s (.*?)\*\* \((.*)\) __EXPLODED__ destroying \*\*([A-z0-9_]{3,20})'s (.*?)\*\* \((.*?) Value: (.*?)\)/)
      if (matches) nuke = true
    }
    if (!matches || matches.length !== 8) {
      throw new Error(`No Matches: ${matches} ${embed.description}`)
    }

    const killer_name = matches[1]
    const victim_name = matches[4]

    let killer_id
    try {
      if (matches[3] === 'Base') killer_id = -1n
      else killer_id = await this.roblox.nameToId(killer_name)
    } catch (error) {
      throw new Error(`${killer_name} does not exist ${error}`)
    }

    let victim_id
    try {
      victim_id = await this.roblox.nameToId(victim_name)
    } catch (error) {
      throw new Error(`${victim_name} does not exist ${error}`)
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
      victim_cost: await min(BigInt(Number(matches[7].replaceAll(',', ''))), BigInt(Math.pow(2, 31))),
      victim_limited: ['[EVENT SHIP KILL]', '[PRIZE SHIP KILL]'].includes(title || ''),
      refunded: false,
      nuke,
      date: message.createdAt
    }

    return result
  }
}
