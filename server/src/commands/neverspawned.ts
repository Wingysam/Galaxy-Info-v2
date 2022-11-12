import type { CommandInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import type { StandardDataStore } from '@dynabloxjs/opencloud/types/src/classes/opencloud/StandardDataStore'
import { sleep } from '../util/sleep'

export class NeverSpawnedCommand extends GalaxyInfoCommand {
  private datastore: StandardDataStore

  constructor(GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName('never-spawned')
      .addStringOption(option => option.setName('player').setDescription('The player to see the unspawned ships of').setRequired(true))
      .setDescription("See the ships a player has never spawned since obtaining them")

    super({ builder })

    this.datastore = GalaxyInfo.openCloud.galaxyMain.getBaseUniverse(GalaxyInfo.config.openCloud.galaxyMain.universeId).getStandardDataStore('Ships', GalaxyInfo.config.openCloud.galaxyMain.datastoreScope)
  }

  public async interactionCreate(interaction: CommandInteraction, _expectsEphemeral: boolean) {
    const GalaxyInfo = interaction.client.GalaxyInfo

    const playerName = interaction.options.getString('player', true)
    const playerId = await GalaxyInfo.roblox.nameToId(playerName)
    const dsKey = `u_${playerId}`
    
    interaction.editReply('Fetching Ships')
    const shipsDs = await this.readDatastore(dsKey)
    const ships = Object.entries(shipsDs)
      .filter(([_, info]: [string, any]) => info.Shield === undefined)
      .map(([shipName, _]: [string, any]) => `${shipName}`)
      .sort()

    await interaction.editReply(`Ships **${playerName}** has never spawned:\n\n${ships.join(' • ')}`)
  }

  private async readDatastore(key: string): Promise<any> {
    while (true) {
      try {
        const { data } = await this.datastore.getEntry(key)
        return data
      } catch (error: any) {
        if (error?.httpCode !== 429) throw error 
        await sleep(250)
      }
    }
  }
}
