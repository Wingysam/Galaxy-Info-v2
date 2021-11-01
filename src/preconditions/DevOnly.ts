import { AsyncPreconditionResult, Precondition } from '@sapphire/framework'
import type { Message } from 'discord.js'

declare module '@sapphire/framework' {
  interface Preconditions { // eslint-disable-line no-unused-vars
    DevOnly: never;
  }
}

export class UserPrecondition extends Precondition {
  public async run (message: Message): AsyncPreconditionResult {
    const DEVS = [ // We hard code this because the devs of the app should always be the same
      '235804673578237952' // Wingy
    ]
    return DEVS.includes(message.author.id) ? this.ok() : this.error({ context: { silent: true } })
  }
}
