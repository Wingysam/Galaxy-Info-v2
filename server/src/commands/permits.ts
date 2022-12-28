import { CommandInteraction, MessageEmbed } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import type { StandardDataStore } from '@dynabloxjs/opencloud/types/src/classes/opencloud/StandardDataStore'
import { sleep } from '../util/sleep'

const DATASTORE = 'Lists'
const DATA_LIST_KEY = 'GlobalMarketPrices'
const PERMITS = [
  ['SC Build Permit', '37'],
  ['Class A Permit', '38'],
  ['Class B Permit', '39'],
  ['Class C Permit', '40'],
  ['Class D Permit', '41'],
  ['Class E Permit', '42']
]

export class InvCommand extends GalaxyInfoCommand {
  private datastore: StandardDataStore

  constructor(GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName('permits')
      .setDescription('Get the current prices of permits in Mega Base, even out of stock permits')

    super({ builder })

    this.datastore = GalaxyInfo.openCloud.galaxyMain.getBaseUniverse(GalaxyInfo.config.openCloud.galaxyMain.universeId).getStandardDataStore(DATASTORE, GalaxyInfo.config.openCloud.galaxyMain.datastoreScope)
  }

  public async interactionCreate(interaction: CommandInteraction) {
    const prices = await this.readDatastore(DATA_LIST_KEY)

    const embed = new MessageEmbed()
    for (const permit of PERMITS) {
      embed.addFields({
        name: permit[0],
        value: `$${prices[permit[1]].toLocaleString()}`,
        inline: true
      })
    }

    interaction.editReply({ embeds: [embed] })
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
