import { ApplyOptions } from '@sapphire/decorators'
import type { Args, CommandOptions } from '@sapphire/framework'
import { Type } from '@sapphire/type'
import { codeBlock } from '@sapphire/utilities'
import type { Message } from 'discord.js'
import { Command } from '@sapphire/framework'
import EasyTable from 'easy-table'

@ApplyOptions<CommandOptions>({
  aliases: ['q', 'query'],
  description: 'Evaluates arbitary SQL',
  detailedDescription: 'Reserved only for devs',
  quotes: [],
  preconditions: ['DevOnly']
})

export default class extends Command {
  public async messageRun (message: Message, args: Args): Promise<any> {
    const code = await args.rest('string').catch(() => null)
    if (!code) throw new Error('Code not found. You must provide some code to evaluate.')
    const { success, time, result }: any = await this.eval(message, code)

    if (!success) return message.channel.send(`${codeBlock('', result)}\n${time}`)

    try {
      await message.channel.send({
        content: `${time}\n${codeBlock('', result.length + ' records')}`,
        files: [
          {
            name: 'result.txt',
            attachment: Buffer.from(EasyTable.print(result))
          }
        ]
      })
    } catch (error) {
      return message.channel.send(`${error}`)
    }
  }

  private async eval (_: Message, code: string) {
    let time = Date.now()
    let success: boolean | undefined
    let syncTime: string | undefined
    let asyncTime: string | undefined
    let result: unknown | undefined
    let type: Type | undefined
    try {
      result = this.container.client.GalaxyInfo.prisma.$queryRawUnsafe(code)
      syncTime = (Date.now() - time).toString()
      time = Date.now()
      result = await result
      asyncTime = (Date.now() - time).toString()
      type = new Type(result)
      success = true
    } catch (error: any) {
      if (!syncTime) syncTime = (Date.now() - time).toString()
      if (!asyncTime) asyncTime = (Date.now() - time).toString()
      if (!type!) type = new Type(error)
      result = error?.meta?.message || error
      success = false
    }

    return { success, type, time: this.formatTime(syncTime, asyncTime ?? ''), result }
  }

  private formatTime (syncTime: string, asyncTime: string) {
    return asyncTime ? `⏱ ${asyncTime}<${syncTime}>ms` : `⏱ ${syncTime}ms`
  }
}
