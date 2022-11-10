import { CommandInteraction, MessageEmbed } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import type GalaxyStaffIngest from '../ingest/services/GalaxyStaff'
import type { Channel } from '@prisma/client'
import type { StandardDataStore } from '@dynabloxjs/opencloud/types/src/classes/opencloud/StandardDataStore'
import { sleep } from '../util/sleep'

const DATASTORES = {
  stats: 'Stats',
  ships: 'Ships',
  warehouse: 'Warehouse',
  log: 'Log'
}

export class InvCommand extends GalaxyInfoCommand {
  private datastores: {
    [key in keyof typeof DATASTORES]: StandardDataStore
  }

  constructor(GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName('inv')
      .addStringOption(option => option.setName('player').setDescription('The player to get the inventory of').setRequired(true))
      .setDescription("Get a player's inventory")

    super({ builder, ephemeral: true })

    const datastores: {
      [key: string]: StandardDataStore
    } = {}
    for (const [key, dsName] of Object.entries(DATASTORES)) {
      datastores[key] = GalaxyInfo.openCloud.galaxyMain.getBaseUniverse(GalaxyInfo.config.openCloud.galaxyMain.universeId).getStandardDataStore(dsName, GalaxyInfo.config.openCloud.galaxyMain.datastoreScope)
    }
    this.datastores = datastores as typeof this.datastores
  }

  public async interactionCreate(interaction: CommandInteraction, _expectsEphemeral: boolean, channelConfig?: AllProps<Channel>) {
    const GalaxyInfo = interaction.client.GalaxyInfo

    const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest
    if (!galaxyStaffIngest) throw new Error('GalaxyStaffIngest missing')
    if (!([...galaxyStaffIngest.admins.members, ...galaxyStaffIngest.developers.members].includes(interaction.user.id))) {
      throw new Error('You have to be an admin or a dev to use this.')
    }

    if (GalaxyInfo.staffCommandsWebhook) {
      const embed = new MessageEmbed()
      embed.setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.avatarURL() ?? undefined
      })
      embed.setDescription(`${interaction}`)
      GalaxyInfo.staffCommandsWebhook.send({ embeds: [embed] })
    }

    const playerName = interaction.options.getString('player', true)
    const playerId = await GalaxyInfo.roblox.nameToId(playerName)
    const dsKey = `u_${playerId}`
    
    interaction.editReply('Fetching Stats')
    const statsDs = await this.readDatastore('stats', dsKey)
    const stats = new MessageEmbed()
    stats.addFields(
      {
        name: 'Score',
        value: statsDs?.Score.toLocaleString() || 'No Score',
        inline: true,
      },
      {
        name: 'Credits',
        value: statsDs?.Credits.toLocaleString() || 'No Credits',
        inline: true
      },
      {
        name: 'Bounty',
        value: statsDs?.Bounty.toLocaleString() || 'No Bounty',
        inline: true
      },
      {
        name: 'Purchased AIs',
        value: statsDs?.PurchasedAiPilots.toLocaleString() || 'No AIs',
        inline: true
      },
      {
        name: 'Warehouse Level',
        value: statsDs?.WarehouseLevel.toString() || 'No WH Level',
        inline: true
      },
      {
        name: 'Used Codes',
        value: statsDs?.Codes.split(',').map((code: string) => `• ${code}`).join('\n') || '• No Used Codes',
        inline: true
      },
      {
        name: 'Completed Quests',
        value: statsDs?.CompletedQuests.split(',').join(' • ') || 'No Completed Quests'
      }
    )
    
    interaction.editReply('Fetching Ships')
    const shipsDs = await this.readDatastore('ships', dsKey)
    const ships = Object.entries(shipsDs).map(([shipName, info]: [string, any]) => {
      return `${shipName}: ${info.Shield ? `${info?.Shield}/${info?.Hull}` : 'never spawned'}`
    })

    interaction.editReply('Fetching Warehouse')
    const warehouseDs = await this.readDatastore('warehouse', dsKey)
    const warehouse = Object.entries(warehouseDs).map(([id, amt]: [string, any]) => {
      return `${id}: ${amt.toLocaleString()}`
    })

    interaction.editReply('Fetching Log')
    const logDs = await this.readDatastore('log', dsKey)
    const log = logDs.map((log: any) => {
      return `${new Date(log[0] * 1000).toISOString().split('T')[0]} ${log[1]}: ${log[2]}`
    }).reverse()

    await interaction.editReply({
      content: `Inventory for ${playerName}:`,
      embeds: [ stats ],
      files: [
        {
          name: 'ships.txt',
          attachment: Buffer.from(ships.sort().join('\n'))
        },
        {
          name: 'warehouse.txt',
          attachment: Buffer.from(warehouse.join('\n'))
        },
        {
          name: 'log.txt',
          attachment: Buffer.from(log.join('\n'))
        }
      ]
    })
  }

  private async readDatastore(datastore: keyof typeof DATASTORES, key: string): Promise<any> {
    while (true) {
      try {
        const { data } = await this.datastores[datastore].getEntry(key)
        return data
      } catch (error: any) {
        if (error?.httpCode !== 429) throw error 
        await sleep(250)
      }
    }
  }
}
