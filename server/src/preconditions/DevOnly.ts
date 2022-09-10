import type { CommandInteraction } from 'discord.js'

export class DevOnly {
  public static async run (interaction: CommandInteraction) {
    if (!interaction.client.GalaxyInfo.devs.includes(interaction.user.id)) throw new Error('Only developers of Galaxy Info can use this command.')
  }
}