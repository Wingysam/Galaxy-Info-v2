import type { CommandInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import type GalaxyStaffIngest from 'ingest/services/GalaxyStaff'
import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import { EMOJIS } from '../emoji'

export class KneallTranslatorCommand extends GalaxyInfoCommand {
  constructor () {
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
    super({ builder, preconditions: [KneallTranslationPrecondition], instant: true })
  }

  public async interactionCreate (interaction: CommandInteraction, ephemeral: boolean) {
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

    const translated = text.toLowerCase().split('').map(letter => (EMOJIS.kneall as Record<string, string>)[letter] ?? letter).join('')
    await interaction.reply({ ephemeral, content: translated })
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class KneallTranslationPrecondition {
  public static async run (interaction: CommandInteraction) {
    const galaxyStaffIngest = interaction.client.GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest | undefined
    if (!galaxyStaffIngest) throw new Error('GalaxyStaffIngest missing')

    if (!galaxyStaffIngest.kneallTranslation.members.includes(interaction.user.id)) throw new Error('Only certain Galaxy staff members may run this command.')
  }
}
