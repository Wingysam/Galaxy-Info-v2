import { SapphireClient } from '@sapphire/framework'
import parseConfig from './config'
import { config as dotenv } from 'dotenv'
import * as path from 'path'

;(async () => {
  dotenv({
    path: path.resolve(process.cwd(), '..', '.env')
  })
  const config = await parseConfig()

  const client = new SapphireClient({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
    defaultPrefix: '!'
  })

  client.login(config.token)
})()
