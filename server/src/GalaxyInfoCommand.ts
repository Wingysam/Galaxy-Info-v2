import { performance } from 'perf_hooks'

import type { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, Interaction } from 'discord.js'
import type { Channel } from '@prisma/client'

interface Precondition {
  run: (interaction: CommandInteraction) => Promise<void>
}

interface GalaxyInfoCommandOptions {
  builder: SlashCommandBuilder
  ephemeral?: boolean
  instant?: boolean
  preconditions?: Precondition[]
}

function log (...args: any) {
  console.log('[Command]', ...args)
}

export abstract class GalaxyInfoCommand {
  static isGalaxyInfoCommand: true = true
  builder: SlashCommandBuilder
  name: string
  description: string
  ephemeral: boolean
  instant: boolean
  preconditions: Precondition[]

  constructor (opts: GalaxyInfoCommandOptions) {
    this.builder = opts.builder
    this.name = this.builder.name
    this.description = this.builder.description
    this.ephemeral = !!opts.ephemeral
    this.instant = !!opts.instant
    this.preconditions = opts.preconditions ?? []
  }

  async _interactionCreate (interaction: CommandInteraction) {
    if (interaction.commandName !== this.name && interaction.commandName !== 'dev-' + this.name) return
    const start = performance.now()

    const channelConfig = (interaction.guild &&
      await interaction.client.GalaxyInfo.guildConfigs.readChannel(BigInt(interaction.guild.id), BigInt(interaction.channelId))) ??
      undefined

    const channelEphemeral = (channelConfig && !channelConfig.commands) ?? false
    const ephemeral = (this.ephemeral || (!this.instant && channelEphemeral)) ?? false
    try {
      if (!this.instant) await interaction.deferReply({ ephemeral })
      for (const precondition of this.preconditions) {
        await precondition.run(interaction)
      }
      await this.interactionCreate(interaction, channelEphemeral, channelConfig)
    } catch (error) {
      try {
        if (!(error instanceof Error)) return
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(error.message)
        } else {
          await interaction.reply({
            content: error.message,
            ephemeral: channelEphemeral
          })
        }
      } catch {
        console.log('Failed to handle error in command:', error)
      } // throw away the error if discord isn't working
    }
    const end = performance.now()
    log(`/${interaction.commandName}`, Math.ceil(end - start))
  }

  abstract interactionCreate (interaction: Interaction, ephemeralConfig: boolean, channelConfig?: AllProps<Channel>): Promise<void>
}
