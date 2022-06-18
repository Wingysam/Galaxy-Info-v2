import path from 'node:path'
import { readdirSync } from 'node:fs'

import { Client, ClientOptions } from 'discord.js'
import { AwaitableCollection } from './util/AwaitableCollection'

import type { GalaxyInfoCommand } from './GalaxyInfoCommand'

type GalaxyInfoClientAdditonalOptions = {
  GalaxyInfo: GalaxyInfo
}

export class GalaxyInfoClient extends Client {
  GalaxyInfo: GalaxyInfo
  commands: AwaitableCollection<string, GalaxyInfoCommand>

  private getCommands (): (new (GalaxyInfo: GalaxyInfo) => GalaxyInfoCommand)[] {
    const commandsDir = path.join(__dirname, 'commands')
    const commandFilenames = readdirSync(commandsDir)
      .filter(filename => filename.endsWith('.js'))
    
    return (commandFilenames.flatMap(filename => {
      const required = require(path.join(commandsDir, filename))
      return Object.values(required).filter((commandClass: any) => commandClass.isGalaxyInfoCommand)
    }) as any)
  }

  constructor(options: ClientOptions, additionalOptions: GalaxyInfoClientAdditonalOptions) {
    super(options)
    this.GalaxyInfo = additionalOptions.GalaxyInfo

    this.commands = new AwaitableCollection()
    const commandsFound = this.getCommands()
    for (const commandConstructor of commandsFound) {
      const command = new commandConstructor(this.GalaxyInfo)
      this.commands.set(command.name, command)
    }

    this.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return
      for (const command of this.commands.values()) {
        command._interactionCreate(interaction)
      }
    })
  }
}