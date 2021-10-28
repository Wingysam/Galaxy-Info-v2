import { SapphireClient } from '@sapphire/framework'
import configurator from './config'
import { config as dotenv } from 'dotenv'
import * as path from 'path'

;(async () => {
  dotenv({
    path: path.resolve(process.cwd(), '..', '.env')
  })
  const config = await configurator()

  const client = new SapphireClient({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
    defaultPrefix: '!'
  })

  client.login(config.token)
})()
