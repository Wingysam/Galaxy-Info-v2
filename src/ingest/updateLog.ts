import type { Client, Message } from 'discord.js'
import { EventEmitter } from 'events'
import { DiscordLogIngester, DiscordLogIngesterParser } from './DiscordLogIngester'

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
  client: Client
}

// The Ship Kills ingest is responsible for uploading `Kill`s to the database and emitting them.
export default class UpdateLogIngest extends EventEmitter {
  private GalaxyInfo: GalaxyInfo
  private client: Client

  constructor ({ GalaxyInfo, client }: ConstructorArg) {
    super()
    this.GalaxyInfo = GalaxyInfo
    this.client = client

    this.init()
  }

  private async init () {
    if (!this.GalaxyInfo.config.galaxy.guild) throw new Error('Galaxy guild is unconfigured')

    const parser = new UpdateLogIngestParser()

    new DiscordLogIngester({
      client: this.client,
      channel: {
        guildId: this.GalaxyInfo.config.galaxy.guild,
        channelName: 'update-log'
      },
      parser: parser,
      callback: this.handleKills.bind(this)
    })
  }

  private async handleKills (updates: string[]) {
    for (const update of updates) this.emit('updateLog', update)
  }
}

class UpdateLogIngestParser extends DiscordLogIngesterParser {
  public parse

  constructor () {
    super()
    this.parse = this._parse.bind(this)
  }

  public async _parse (message: Message) {
    return message.content
  }
}
