import { ApplyOptions } from '@sapphire/decorators'
import type { Message } from 'discord.js'
import { GalaxyInfoCommand } from '../../GalaxyInfoCommand'

const PP = `
**Galaxy Info Privacy Policy**
- Galaxy Info does not, by default, store any data on your user or guild.
- Some data may be temporarily logged when using some commands. This data is used for debugging and will be deleted within 30 days.
- When you use the configuration website, the bot will store the settings you provide it with. Your guild ID will also be stored to allow the bot to know which guild the settings belong to.
- You can delete all guild configuration with "<@898058469263945778> cleargalaxyinfodata".

If you have any concerns, please DM Wingy#3538. My privacy settings are set to allow DMs from members of the support server: https://discord.gg/cx2dXax
`

@ApplyOptions<GalaxyInfoCommand.Options>({
  aliases: ['pp'],
  description: 'Sends the Privacy Policy for Galaxy Info',
  examples: [
    'pp'
  ]
})

export class PingCommand extends GalaxyInfoCommand {
  public async messageRun (message: Message) {
    return message.channel.send(PP)
  }
}
