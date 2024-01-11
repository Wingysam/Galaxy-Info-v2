import { SlashCommandBuilder } from '@discordjs/builders'
import { codeBlock } from '@sapphire/utilities'
import type { CommandInteraction } from 'discord.js'
import EasyTable from 'easy-table'
import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import { BotDevOnly } from '../preconditions/BotDevOnly'

export class SqlCommand extends GalaxyInfoCommand {
  private readonly GalaxyInfo: GalaxyInfo

  constructor (GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName('sql')
      .addStringOption(option => option.setName('sql').setDescription('The SQL to evaluate').setRequired(true))
      .setDescription('Evaluate SQL')
    super({ builder, preconditions: [BotDevOnly], ephemeral: true })
    this.GalaxyInfo = GalaxyInfo
  }

  public async interactionCreate (interaction: CommandInteraction) {
    const code = interaction.options.getString('sql')
    if (typeof code !== 'string') throw new Error('Code not found. You must provide some code to evaluate.')
    const { success, time, result }: any = await this.eval(code)

    if (!success) {
      await interaction.editReply(`${codeBlock('', result)}\n${time}`)
      return
    }

    try {
      await interaction.editReply({
        content: `${time}\n${codeBlock('', result.length + ' records')}`,
        files: [
          {
            name: 'result.txt',
            attachment: Buffer.from(EasyTable.print(result))
          }
        ]
      })
    } catch (error) {
      void interaction.editReply(`${error}`)
      return
    }
  }

  private async eval (code: string) {
    let time = Date.now()
    let success: boolean | undefined
    let syncTime: string | undefined
    let asyncTime: string | undefined
    let result: unknown | undefined
    try {
      result = this.GalaxyInfo.prisma.$queryRawUnsafe(code)
      syncTime = (Date.now() - time).toString()
      time = Date.now()
      result = await result
      asyncTime = (Date.now() - time).toString()
      success = true
    } catch (error: any) {
      if (typeof syncTime !== 'string') syncTime = (Date.now() - time).toString()
      if (typeof asyncTime !== 'string') asyncTime = (Date.now() - time).toString()
      result = error?.meta?.message || error
      success = false
    }

    return { success, time: this.formatTime(syncTime, asyncTime ?? ''), result }
  }

  private formatTime (syncTime: string, asyncTime: string) {
    return asyncTime ? `⏱ ${asyncTime}<${syncTime}>ms` : `⏱ ${syncTime}ms`
  }
}
