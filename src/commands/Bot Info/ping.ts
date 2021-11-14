import { ApplyOptions } from '@sapphire/decorators'
import type { Message } from 'discord.js'
import { GalaxyInfoCommand } from '../../GalaxyInfoCommand'

@ApplyOptions<GalaxyInfoCommand.Options>({
  aliases: ['pong'],
  description: 'ping pong',
  examples: [
    'ping'
  ]
})

export class PingCommand extends GalaxyInfoCommand {
  public async messageRun (message: Message) {
    const msg = await message.channel.send('Ping?')

    const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
      msg.createdTimestamp - message.createdTimestamp
    }ms.`

    return msg.edit(content)
  }
}
