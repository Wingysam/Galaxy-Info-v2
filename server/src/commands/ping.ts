import { performance } from 'perf_hooks'

import type { CommandInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'

export class PingCommand extends GalaxyInfoCommand {
  constructor () {
    const builder = new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Responds with bot latency')
    super({ builder, instant: true })
  }

  public async interactionCreate (interaction: CommandInteraction, ephemeral: boolean) {
    const start = performance.now()
    await interaction.reply({ ephemeral, content: 'Ping?' })
    const end = performance.now()

    const content = `Pong! Bot Latency ${Math.round(interaction.client.ws.ping)}ms. API Latency ${
      Math.ceil(end - start)
    }ms.`

    await interaction.editReply(content)
  }
}
