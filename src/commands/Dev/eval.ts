import { ApplyOptions } from '@sapphire/decorators'
import type { Args, CommandOptions } from '@sapphire/framework'
import { Type } from '@sapphire/type'
import { codeBlock } from '@sapphire/utilities'
import type { Message } from 'discord.js'
import { inspect } from 'util'
import { Command } from '@sapphire/framework'

@ApplyOptions<CommandOptions>({
  aliases: ['ev'],
  description: 'Evaluates arbitary JavaScript',
  detailedDescription: 'Reserved only for devs',
  flags: ['json', 'async', 'showHidden'],
  preconditions: ['DevOnly']
})

export default class extends Command {
  public async messageRun (message: Message, args: Args): Promise<any> {
    const code = await args.rest('string').catch(() => null)
    if (!code) throw new Error('Code not found. You must provide some code to evaluate.')
    const language = args.getOption('language') ?? args.getOption('lang') ?? args.getFlags('json') ? 'json' : 'js'
    const { success, type, time, result } = await this.eval(message, args, code)

    if (!success) return message.channel.send(`**Ouput**:${codeBlock('', result)}\n**Type**:${codeBlock('ts', type?.toString())}\n${time}`)

    const footer = codeBlock('ts', type?.toString())

    try {
      await message.channel.send(`**Output**:\n${codeBlock(language, result)}\n**Type**:${footer}\n${time}`)
    } catch (error) {
      return message.channel.send(`${error}`)
    }
  }

  private async eval (message: Message, args: Args, code: string) {
    let time = Date.now()
    let success: boolean | undefined
    let syncTime: string | undefined
    let asyncTime: string | undefined
    let result: unknown | undefined
    let type: Type | undefined
    try {
      if (args.getFlags('async')) code = `(async () => {\n${code}\n})();`

      // @ts-expect-error 6133
      const msg = message // eslint-disable-line no-unused-vars

      // eslint-disable-next-line no-eval
      result = eval(code)
      syncTime = (Date.now() - time).toString()
      if (args.getFlags('async')) {
        time = Date.now()
        result = await result
        asyncTime = (Date.now() - time).toString()
      }
      type = new Type(result)
      success = true
    } catch (error) {
      if (!syncTime) syncTime = (Date.now() - time).toString()
      if (args.getFlags('async') && !asyncTime) asyncTime = (Date.now() - time).toString()
      if (!type!) type = new Type(error)
      result = error
      success = false
    }

    if (typeof result !== 'string') {
      result =
        result instanceof Error
          ? result.stack
          : args.getFlags('json')
            ? JSON.stringify(result, null, 2)
            : inspect(result, {
              depth: args.getOption('depth') ? parseInt(args.getOption('depth') ?? '', 10) || 0 : 0,
              showHidden: args.getFlags('showHidden')
            })
    }
    return { success, type, time: this.formatTime(syncTime, asyncTime ?? ''), result }
  }

  private formatTime (syncTime: string, asyncTime: string) {
    return asyncTime ? `⏱ ${asyncTime}<${syncTime}>ms` : `⏱ ${syncTime}ms`
  }
}
