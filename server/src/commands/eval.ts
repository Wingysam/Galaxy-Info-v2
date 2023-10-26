import { SlashCommandBuilder } from '@discordjs/builders'
import { codeBlock } from '@sapphire/utilities'
import type { CommandInteraction } from 'discord.js'
import { inspect } from 'util'
import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import { BotDevOnly } from '../preconditions/BotDevOnly'

export default class extends GalaxyInfoCommand {
  constructor() {
    const builder = new SlashCommandBuilder()
      .setName('eval')
      .addStringOption(option => option.setName('code').setDescription('The JavaScript to evaluate').setRequired(true))
      .addBooleanOption(option => option.setName('json').setDescription('Convert the output to JSON before returning it'))
      .addBooleanOption(option => option.setName('async').setDescription('Wrap your code in an async function'))
      .addBooleanOption(option => option.setName('show-hidden').setDescription('Shows hidden JS properties'))
      .addIntegerOption(option => option.setName('depth').setDescription('How deep the display of the response object should be'))
      .setDescription('Evaluate arbitrary JavaScript')
    super({ builder, preconditions: [ BotDevOnly ], ephemeral: true })
  }

  public async interactionCreate (interaction: CommandInteraction): Promise<any> {
    const code = interaction.options.getString('code', true)
    const json = !!interaction.options.getBoolean('json')
    const language = json ? 'json' : 'js'
    const { success, type, time, result } = await this.eval(interaction, {
      json,
      async: !!interaction.options.getBoolean('async'),
      showHidden: !!interaction.options.getBoolean('show-hidden'),
      depth: interaction.options.getInteger('depth') ?? 10
    }, code)

    if (!success) return interaction.editReply(`**Ouput**:${codeBlock('', `${result}`)}\n**Type**:${codeBlock('ts', type?.toString())}\n${time}`)

    const footer = codeBlock('ts', type?.toString())

    try {
      await interaction.editReply(`**Output**:\n${codeBlock(language, `${result}`)}\n**Type**:${footer}\n${time}`)
    } catch (error) {
      return interaction.editReply(`${error}`)
    }
  }

  private async eval (interaction: CommandInteraction, args: { json: boolean, async: boolean, showHidden: boolean, depth: number }, code: string) {
    let time = Date.now()
    let success: boolean | undefined
    let syncTime: string | undefined
    let asyncTime: string | undefined
    let result: unknown | undefined
    let type: undefined
    try {
      if (args.async) code = `(async () => {\n${code}\n})();`

      // @ts-expect-error
      const { GalaxyInfo } = interaction.client

      // eslint-disable-next-line no-eval
      result = eval(code)
      syncTime = (Date.now() - time).toString()
      if (args.async) {
        time = Date.now()
        result = await result
        asyncTime = (Date.now() - time).toString()
      }
      success = true
    } catch (error) {
      if (!syncTime) syncTime = (Date.now() - time).toString()
      if (args.async && !asyncTime) asyncTime = (Date.now() - time).toString()
      result = error
      success = false
    }

    if (typeof result !== 'string') {
      result =
        result instanceof Error
          ? result.stack
          : args.json
            ? JSON.stringify(result, null, 2)
            : inspect(result, {
              depth: args.depth,
              showHidden: args.showHidden
            })
    }
    return { success, type, time: this.formatTime(syncTime, asyncTime ?? ''), result }
  }

  private formatTime (syncTime: string, asyncTime: string) {
    return asyncTime ? `⏱ ${asyncTime}<${syncTime}>ms` : `⏱ ${syncTime}ms`
  }
}
