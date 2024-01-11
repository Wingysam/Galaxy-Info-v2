import type { CommandInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'

const PP = (configSite: string) => `
**Galaxy Info Privacy Policy**
- Galaxy Info does not, by default, store any data on your user or guild.
- Some data may be temporarily logged when using some commands. This data is used for debugging and will be deleted within 30 days.
- Commands that are only available to Galaxy staff members may have permanent logs.
- When you use the [configuration website](${configSite}), the bot will store the settings you provide it with. Your guild ID will also be stored to allow the bot to know which guild the settings belong to.
- You can delete all guild configuration with /clear-galaxy-info-data.

If you have any concerns, please message yname#7161. You can ping me in the support server: https://discord.gg/cx2dXax
`

export class PrivacyPolicyCommand extends GalaxyInfoCommand {
  private readonly pp: string

  constructor (GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName('privacy-policy')
      .setDescription('See the privacy policy of Galaxy Info')
    super({ builder, instant: true })

    this.pp = PP(GalaxyInfo.config.web.frontendBase)
  }

  public async interactionCreate (interaction: CommandInteraction, ephemeral: boolean) {
    await interaction.reply({ ephemeral, content: this.pp })
  }
}
