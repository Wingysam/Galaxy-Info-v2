import type { Channel, Client, Collection, Guild, Message, TextBasedChannel } from 'discord.js'
import { clone } from 'lodash'

export type DiscordLogIngestionConfiguration = {
  client: Client,
  channel: ChannelLocation,
  startingMessageId?: Snowflake, // for performance reasons, we don't load every message ever sent every time
  parser: Parser,
  callback: DiscordLogIngesterCallback
}

export type ChannelLocation = {
  guildId: Snowflake,
  channelName: string
}

export type Snowflake = string | bigint

export class GuildNotFoundError extends Error {
  constructor (guildId: string) {
    super(`Couldn't find guild with id ${guildId}. Is the ingestion service in the guild?`)
    this.name = 'GuildNotFoundError'
  }
}

export class ChannelNotFoundError extends Error {
  constructor (channelName: string) {
    super(`Couldn't find channel with name ${channelName}. Was the channel deleted?`)
    this.name = 'ChannelNotFoundError'
  }
}

export class WrongChannelTypeError extends TypeError {
  constructor (channelType: string) {
    super(`Expected a text based channel, got a ${channelType}. Is there a duplicate channel being incorrectly located?`)
    this.name = 'WrongChannelTypeError'
  }
}

export class EmptyLogError extends Error {
  constructor (channelName: string) {
    super(`#${channelName} is empty. Is there a duplicate channel name preventing finding the correct channel?`)
    this.name = 'EmptyLogError'
  }
}

type DiscordLogIngesterCallback = (parsed: any[]) => Promise<void>
type Parser = {
  parse: (message: Message) => any
}

// DiscordLogIngester is responsible for obtaining then passing an IngestionChannel to a DiscordLogFetcher, then DiscordLogStreamer, then calling callback with logs.
export class DiscordLogIngester {
  private parser: Parser
  private client: Client
  private startingMessageId: Snowflake
  private channelLocation: ChannelLocation
  private callback: DiscordLogIngesterCallback
  private freshLogs: any[]
  private shouldFlushBuffer: boolean

  constructor ({ parser, client, startingMessageId = 0n, channel: channelLocation, callback }: DiscordLogIngestionConfiguration) {
    this.parser = parser
    this.client = client
    this.startingMessageId = startingMessageId
    this.channelLocation = channelLocation
    this.callback = callback
    this.freshLogs = []
    this.shouldFlushBuffer = false

    this.init()
  }

  private async init () {
    const foundChannel = await IngestionChannel.findChannel(this.client, this.channelLocation)
    const fetcher = new DiscordLogFetcher(foundChannel, this.startingMessageId)
    await this.setupCallbackWhenNewMessage(foundChannel)
    await this.fetchAndParseAndPrependToBufferAndBeginBufferFlush(fetcher)
  }

  async rescan () {
    const foundChannel = await IngestionChannel.findChannel(this.client, this.channelLocation)
    const fetcher = new DiscordLogFetcher(foundChannel)
    await this.fetchAndParseAndPrependToBufferAndBeginBufferFlush(fetcher)
  }

  private async setupCallbackWhenNewMessage (channel: TextBasedChannel) {
    DiscordLogStreamer.create(channel, async (messages: Message[]) => {
      const parsed = await this.tryToParseMessages(messages)
      this.freshLogs = [...this.freshLogs, ...parsed]
      await this.flushIfShould()
    })
  }

  private async fetchAndParseAndPrependToBufferAndBeginBufferFlush (fetcher: DiscordLogFetcher) {
    const fetched = await fetcher.fetch()
    const parsed = await this.tryToParseMessages(fetched)
    this.freshLogs = [...parsed, ...this.freshLogs]
    this.shouldFlushBuffer = true
    await this.flushIfShould()
  }

  private async tryToParseMessages (messages: Message[]) {
    const parsed = await Promise.allSettled(messages.map(this.parser.parse))
    return this.throwAwayParseFailures(parsed)
  }

  private async throwAwayParseFailures (parsed: PromiseSettledResult<any>[]) {
    // Typedefs for promise.allSettled are bad. Any type errors from the following two lines are ignored.
    // @ts-ignore
    const rejecteds = parsed.filter(settled => settled.status === 'rejected').map(settled => settled.reason)
    // @ts-ignore
    const fulfilled = parsed.filter(settled => settled.status === 'fulfilled').map(settled => settled.value)

    for (const rejected of rejecteds) {
      console.log(`Log parsing failure: ${rejected}`)
    }

    return fulfilled
  }

  private async flushIfShould () {
    if (!this.shouldFlushBuffer) return
    const logs = this.freshLogs
    this.freshLogs = []
    await this.callback(logs)
  }
}

// IngestionChannel is responsible for locating a discord.js Channel from a guild id and channel name
class IngestionChannel {
  public static async findChannel (client: Client, channelLocation: ChannelLocation): Promise<TextBasedChannel> {
    const guild = await this.findGuild(client, channelLocation.guildId)
    const channel = await this.findChannelInGuild(guild, channelLocation.channelName)
    if (!channel) throw new ChannelNotFoundError(channelLocation.channelName)
    if (!channel.isText()) throw new WrongChannelTypeError(channel.type)
    return channel
  }

  private static async findGuild (client: Client, guildId: Snowflake) {
    const id = String(guildId) // discord.js requires it as a string and does not handle BigInts

    const guild = await client.guilds.fetch(id)
    if (!guild) throw new GuildNotFoundError(id)

    return guild
  }

  private static async findChannelInGuild (guild: Guild, channelName: string): Promise<Channel | undefined> {
    const channels = await guild.channels.fetch()
    const channel = channels.find(channel => channel.name === channelName)
    return channel
  }
}

class DiscordLogFetcher {
  private fetchMessagesAfterId: bigint
  private channel: TextBasedChannel
  private channelNameOrId: string
  private newestMessageId: bigint

  constructor (channel: TextBasedChannel, startingMessageId?: Snowflake) {
    this.channel = channel
    this.fetchMessagesAfterId = BigInt(startingMessageId ?? 0n)
    this.channelNameOrId = 'name' in this.channel ? this.channel.name : this.channel.id
    this.newestMessageId = 0n
  }

  public async fetch () {
    return this._fetch()
  }

  private async _fetch (cursor?: Snowflake, buffer?: Message[]): Promise<Message[]> {
    const fetcher = this

    buffer = await bufferOrDefault(buffer)
    cursor = await cursorOrDefault(cursor)

    const messages = await fetchPage(cursor)
    buffer = await mergeMessagesIntoBuffer(messages, buffer)

    const newCursor = await getNewCursor(messages)
    if (!newCursor) return finalize(buffer)
    return this._fetch(newCursor, buffer)

    async function bufferOrDefault (buffer?: Message[]) {
      return buffer ?? []
    }

    async function cursorOrDefault (cursor?: Snowflake) {
      if (cursor) return cursor

      const mostRecent = (await fetcher.channel.messages.fetch({ limit: 1 })).first()
      if (!mostRecent) throw new EmptyLogError(fetcher.channelNameOrId)
      return mostRecent.id
    }

    async function fetchPage (cursor: Snowflake): Promise<Collection<String, Message>> {
      try {
        const cursorAsStringForDiscordJS = String(cursor) // discord.js does not support BigInts.
        const messages = await fetcher.channel.messages.fetch({
          limit: 100,
          before: cursorAsStringForDiscordJS
        })
        return messages
      } catch (error) {
        console.error(error)
        return fetchPage(cursor)
      }
    }

    async function mergeMessagesIntoBuffer (messages: Collection<any, Message>, buffer: Message[]) {
      return [...buffer, ...Array.from(messages.values())]
    }

    async function getNewCursor (messages: Collection<any, Message>) {
      const oldestMessage = messages.last()
      if (!oldestMessage || messages.map(message => message.id).includes(String(fetcher.fetchMessagesAfterId))) return
      return oldestMessage.id
    }

    async function finalize (buffer: Message[]) {
      // Messages are fetched from newest to oldest, but should be returned starting at the oldest one.
      // This is because Discord's API does not have a way to get the first message.
      const reversed = await reverseArrayWithoutManipulating(buffer)

      const messagesAfterStartingId = await trimBuffer(reversed)

      const lastMessageId = messagesAfterStartingId.length === 0
        ? fetcher.newestMessageId
        : messagesAfterStartingId[messagesAfterStartingId.length - 1].id
      fetcher.fetchMessagesAfterId = BigInt(lastMessageId)

      return messagesAfterStartingId
    }

    async function reverseArrayWithoutManipulating <T> (array: T[]): Promise<T[]> {
      return clone(array).reverse()
    }

    async function trimBuffer (buffer: Message[]) {
      return buffer.filter(message => BigInt(message.id) > fetcher.fetchMessagesAfterId)
    }
  }
}

class DiscordLogStreamer {
  public static async create (channel: TextBasedChannel, callback: (messages: Message[]) => Promise<void>) {
    let buffer: Message[] = []
    let flushing: Promise<void> | null = null
    let moreToFlush = false

    channel.client.on('messageCreate', handleMessage)

    async function handleMessage (message: Message) {
      if (message.channel.id !== channel.id) return
      buffer.push(message)
      await flush()
    }

    async function flush () {
      if (moreToFlush) return
      if (flushing) moreToFlush = true
      await flushing
      moreToFlush = false
      flushing = callback(buffer)
      buffer = []
    }
  }
}

export abstract class DiscordLogIngesterParser {
  public abstract parse (message: Message): Promise<any>
}
