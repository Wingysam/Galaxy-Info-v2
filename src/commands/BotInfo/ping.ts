import { ApplyOptions } from '@sapphire/decorators'
import { Command, CommandOptions } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<CommandOptions>({
  aliases: ['pong'],
  description: 'ping pong'
})

export class PingCommand extends Command {
  public async messageRun (message: Message) {
    const msg = await message.channel.send('Ping?')

    const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
      msg.createdTimestamp - message.createdTimestamp
    }ms.`

    return msg.edit(content)
  }
}
