import type { CommandInteraction } from 'discord.js'

export class DevOnly {
  public static async run (interaction: CommandInteraction) {
    const DEVS = [ // We hard code this because the devs of the app should always be the same
      '235804673578237952' // Wingy
    ]
    if (!DEVS.includes(interaction.user.id)) throw new Error('Only developers of Galaxy Info can use this command.')
  }
}