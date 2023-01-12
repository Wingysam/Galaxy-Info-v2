import type { CommandInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import { EMOJIS } from '../emoji'
import { GameDevOnly } from '../preconditions/GameDevOnly'

export class KneallTranslatorCommand extends GalaxyInfoCommand {
  constructor(_GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName('kneall')
      .addStringOption(option => option
        .setName('text')
        .setDescription('The text to translate.')
        .setRequired(true)
      )
      .addBooleanOption(option => option
        .setName('reverse')
        .setDescription('Translates the message back to text')
      )
      .setDescription('Translate a message to kneall')
    super({ builder, preconditions: [GameDevOnly], instant: true })
  }

  public async interactionCreate(interaction: CommandInteraction, ephemeral: boolean) {
    const text = interaction.options.getString('text', true)
    const reverse = interaction.options.getBoolean('reverse') ?? false

    if (reverse) {
      let output = text
      for (const [letter, emoji] of Object.entries(EMOJIS.kneall)) {
        output = output.replaceAll(emoji, letter)
      }
      await interaction.reply({ ephemeral, content: output })
      return
    }

    const translated = text.toLowerCase().split('').map(letter => (EMOJIS.kneall as {[key: string]: string})[letter] ?? letter).join('')
    await interaction.reply({ ephemeral, content: translated })
  }
}
