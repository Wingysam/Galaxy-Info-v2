import { CommandInteraction, MessageEmbed } from 'discord.js'
import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import format from 'pg-format'
import { SlashCommandBuilder } from '@discordjs/builders'
import { CLASSES as SHIP_CLASSES } from '@galaxyinfo/ships'

function assertShipClassesValid (shipClasses: string[]) {
  for (const shipClass of shipClasses) {
    const validClasses = SHIP_CLASSES.map(shipClass => shipClass.toLowerCase())
    const specifiedClass = shipClass.toLowerCase()
    if (!validClasses.includes(specifiedClass)) throw new Error(`"${shipClass}" is not a valid class.`)
  }
}

function findLongestNumber(numbers: string[]) {
  return numbers.sort((a: string, b: string) => b.length - a.length)[0].length
}

export class CarnageCommand extends GalaxyInfoCommand {
  constructor() {
    const builder = new SlashCommandBuilder()
      .setName('carnage')
      .addStringOption(option => option.setName('player').setDescription('The player or players to view carnage for.'))
      .addIntegerOption(option => option.setName('page').setDescription('Page to view on the leaderboard'))
      .addStringOption(option => option.setName('ship').setDescription('Filter to only kills with this ship'))
      .addStringOption(option => option.setName('class').setDescription('Restricts to only kills of this class.'))
      .addBooleanOption(option => option.setName('reverse').setDescription('Displays how much the player has lost rather than killed'))
      .addBooleanOption(option => option.setName('limited').setDescription('Only include limited kills'))
      .setDescription('View the carnage of one or more players')
    super({ builder })
  }
  public async interactionCreate (interaction: CommandInteraction): Promise<void> {
    const GalaxyInfo = interaction.client.GalaxyInfo

    const playerNames = (interaction.options.getString('player') ?? '').split(',').filter(str => str)
    const page = interaction.options.getInteger('page') ?? 1
    const ship = interaction.options.getString('ship')
    const shipClasses = (interaction.options.getString('class') ?? '').split(',').filter(str => str)
    const reverse = interaction.options.getBoolean('reverse')
    const limited = interaction.options.getBoolean('limited')

    if (Number.isNaN(page)) throw new Error('Page should be a number. If you meant to use a -flag or -option, make sure to remember the `-`.')
    if (!Number.isSafeInteger(page) || page <= 0) throw new Error('Page must be a positive integer.')
    if (page > 10) throw new Error('For performance reasons, page must be at most 10.')
    const afterPos = (page - 1) * 10

    let players: any[] = []
    let allPlayers = false
    if (playerNames.length === 1 && playerNames[0] === 'all') {
      allPlayers = true
    } else {
      if (playerNames.length) {
        players = await Promise.all(playerNames.map(name => GalaxyInfo.roblox.nameToId(name)))
      } else {
        if (!interaction.guild) throw new Error('Specify a player or try this in a guild.')
        const guild = await GalaxyInfo.guildConfigs.readGuild(BigInt(interaction.guild.id))
        players = guild.members
        if (players.length === 0) allPlayers = true
      }
    }

    players = players.map(player => player.toString())
    if (players.find(player => !/^\d*$/.test(player))) throw new Error("Fetching players went wrong and returned something that isn't an id")

    assertShipClassesValid(shipClasses)



    const [, topTen, totals, mostCommon]: any = await GalaxyInfo.prisma.$transaction([
      GalaxyInfo.prisma.$executeRawUnsafe(`
        CREATE TEMPORARY VIEW "Kill_temp" AS
        SELECT *
        FROM "Kill_clean"
        WHERE
          1=1
          ${
            allPlayers
            ? ''
            : `AND ${
              reverse
              ? `victim_id IN (${players.join(',')})`
              : `killer_id IN (${players.join(',')})`
            }`
          }
          ${
            shipClasses.length
            ? `AND victim_class IN (${shipClasses.map(shipClass => `'${shipClass}'`).join(',')})`
            : ''
          }
          ${
            limited === true
            ? 'AND victim_limited'
            : ''
          }
          ${
            limited === false
            ? 'AND NOT victim_limited'
            : ''
          }
          ${
            ship
            ? format(
              reverse
              ? 'AND LOWER(victim_ship) = LOWER(%L)'
              : 'AND LOWER(killer_ship) = LOWER(%L)',
              ship
            )
            : ''
          }
      `),
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          ROW_NUMBER() OVER (ORDER BY SUM(victim_cost) DESC) AS pos,
          victim_ship AS ship,
          TO_CHAR(COUNT(*), 'FM9,999,999,999,999,999,999,999') AS count,
          TO_CHAR(SUM(victim_cost), 'FM9,999,999,999,999,999,999,999') AS carnage
        FROM "Kill_temp"
        GROUP BY victim_ship
        ORDER BY SUM(victim_cost) DESC
        LIMIT 10 OFFSET ${afterPos}
      `,
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          TO_CHAR(SUM(victim_cost), 'FM9,999,999,999,999,999,999,999') AS carnage,
          TO_CHAR(COUNT(*), 'FM9,999,999,999,999,999,999,999') AS count
        FROM "Kill_temp"
      `,
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          victim_ship AS ship,
          TO_CHAR(COUNT(*), 'FM9,999,999,999,999,999,999,999') AS count
        FROM "Kill_temp"
        GROUP BY victim_ship
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `,
      GalaxyInfo.prisma.$executeRawUnsafe('DROP VIEW "Kill_temp"')
    ])

    const embed = new MessageEmbed()

    if (!topTen.length) throw new Error('No kills found.')

    ;(() => {
      const longestCount = findLongestNumber(
        topTen
          .map((ship: any) => ship.count.toString())
      )

      const longestPos = findLongestNumber(
        topTen
          .map((player: any) => player.pos.toString())
      )

      embed.addField('Top Ten Kills', '```ini\n' + topTen.map((ship: any) =>
        `[${ship.pos.toString().padStart(longestPos, '0')}] x${ship.count.toString().padStart(longestCount, '0')} ${ship.ship} ($${ship.carnage})`
      ).join('\n') + '\n```')
    })()

    embed.addField('Carnage', '$' + totals[0].carnage, true)
    embed.addField('Total Ships', totals[0].count, true)
    embed.addField('Most Common', `${mostCommon[0].count}x ${mostCommon[0].ship}`, true)

    await interaction.editReply({ embeds: [embed] })
  }
}

export class CarnageLeaderboardCommand extends GalaxyInfoCommand {
  constructor() {
    const builder = new SlashCommandBuilder()
      .setName('carnage-leaderboard')
      .addStringOption(option => option.setName('players').setDescription('Only show these players on the leaderboard'))
      .addIntegerOption(option => option.setName('page').setDescription('Page to view on the leaderboard'))
      .addStringOption(option => option.setName('ship').setDescription('Filter to only kills with this ship'))
      .addBooleanOption(option => option.setName('ships').setDescription('Show output by killer ship'))
      .addStringOption(option => option.setName('class').setDescription('Restricts to only kills of this class.'))
      .addBooleanOption(option => option.setName('reverse').setDescription('Displays how much the player has lost rather than killed'))
      .addBooleanOption(option => option.setName('limited').setDescription('Only include limited kills'))
      .addBooleanOption(option => option.setName('count').setDescription('Order by kill count, rather than carnage'))
      .setDescription('View the carnage of one or more players')
    super({ builder })
  }

  public async interactionCreate (interaction: CommandInteraction): Promise<void> {
    const GalaxyInfo = interaction.client.GalaxyInfo

    const playerNames = (interaction.options.getString('players') ?? '').split(',').filter(str => str)
    const page = interaction.options.getInteger('page') ?? 1
    const ship = interaction.options.getString('ship')
    const ships = interaction.options.getBoolean('ships')
    const shipClasses = (interaction.options.getString('class') ?? '').split(',').filter(str => str)
    const reverse = !!interaction.options.getBoolean('reverse')
    const limited = interaction.options.getBoolean('limited') ?? null
    const count = !!interaction.options.getBoolean('count')

    if (Number.isNaN(page)) throw new Error('Page should be a number. If you meant to use a -flag or -option, make sure to remember the `-`.')
    if (!Number.isSafeInteger(page) || page <= 0) throw new Error('Page must be a positive integer.')
    if (page > 10) throw new Error('For performance reasons, page must be at most 10.')
    const afterPos = (page - 1) * 10

    console.log(afterPos)

    assertShipClassesValid(shipClasses)

    let players: any[] = []
    let allPlayers = false
    if (playerNames.length) {
      if (playerNames.length) {
        players = await Promise.all(playerNames.map(name => GalaxyInfo.roblox.nameToId(name)))
      } else {
        if (!interaction.guild) throw new Error('Specify a player or try this in a guild.')
        const guild = await GalaxyInfo.guildConfigs.readGuild(BigInt(interaction.guild.id))
        players = guild.members
      }
    } else {
      allPlayers = true
    }

    players = players.map(player => player.toString())
    if (players.find(player => !/^\d*$/.test(player))) throw new Error("Fetching players went wrong and returned something that isn't an id")

    const [, topTen, totals, mostCommon]: any = await GalaxyInfo.prisma.$transaction([
      GalaxyInfo.prisma.$executeRawUnsafe(`
        CREATE TEMPORARY VIEW "Kill_temp" AS
        SELECT *
        FROM "Kill_clean"
        WHERE
          1=1
          ${
            allPlayers
            ? ''
            : `AND ${
              reverse
              ? `victim_id IN (${players.join(',')})`
              : `killer_id IN (${players.join(',')})`
            }`
          }
          ${
            shipClasses.length
            ? `AND victim_class IN (${shipClasses.map(shipClass => `'${shipClass}'`).join(',')})`
            : ''
          }
          ${
            limited === true && limited !== null
            ? 'AND victim_limited'
            : ''
          }
          ${
            limited === false && limited !== null
            ? 'AND NOT victim_limited'
            : ''
          }
          ${
            ship
            ? format(
              reverse
              ? 'AND LOWER(victim_ship) = LOWER(%L)'
              : 'AND LOWER(killer_ship) = LOWER(%L)',
              ship
            )
            : ''
          }
      `),
      GalaxyInfo.prisma.$queryRawUnsafe(`
        SELECT
        ROW_NUMBER() OVER (ORDER BY ${count ? 'killed' : 'carnage'} DESC) AS pos,
        ${ships ? `${reverse ? 'victim' : 'killer'}_ship AS player` : `(
          SELECT nameq.name
          FROM "Kill_usermap" AS nameq
          WHERE nameq.id = result.${reverse ? 'victim' : 'killer'}_id
          LIMIT 1
        ) AS player`},
        carnage,
        killed,
        TO_CHAR(carnage, 'FM9,999,999,999,999,999,999,999') AS carnage_fmt,
        TO_CHAR(killed, 'FM9,999,999,999,999,999,999,999') AS killed_fmt
      FROM (
        SELECT
          ${ships ? `${reverse ? 'victim' : 'killer'}_ship` : `${reverse ? 'victim' : 'killer'}_id`},
          COUNT(*) AS killed,
          SUM(victim_cost) AS carnage
        FROM "Kill_temp"
        WHERE
          killer_id != -1
          ${reverse
            ? ''
            : `AND NOT killer_name IN (
                'Alien',
                'Pirate',
                'NPC'
              )`
          }
        GROUP BY ${ships ? `${reverse ? 'victim' : 'killer'}_ship` : `${reverse ? 'victim' : 'killer'}_id`}
      ) AS result
      ORDER BY ${count ? 'killed' : 'carnage'} DESC
      LIMIT 10 OFFSET ${afterPos}
      ;
      `),
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          TO_CHAR(SUM(victim_cost), 'FM9,999,999,999,999,999,999,999') AS carnage,
          TO_CHAR(COUNT(*), 'FM9,999,999,999,999,999,999,999') AS count
        FROM "Kill_temp"
      `,
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          victim_ship AS ship,
          TO_CHAR(COUNT(*), 'FM9,999,999,999,999,999,999,999') AS count
        FROM "Kill_temp"
        GROUP BY victim_ship
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `,
      GalaxyInfo.prisma.$executeRawUnsafe('DROP VIEW "Kill_temp"')
    ])

    const embed = new MessageEmbed()

    if (!topTen.length) throw new Error('No kills found.')

    ;(() => {
      const longestNumber = findLongestNumber(
        topTen
          .map((player: any) => player.pos.toString())
      )

      embed.addField('Top Ten Carnage' + (page > 1 ? ` (Page ${page})` : ''), '```ini\n' + topTen.map((player: any) =>
        `[${player.pos.toString().padStart(longestNumber, '0')}] ${player.player} $${player.carnage_fmt} (${player.killed_fmt})`
      ).join('\n') + '\n```')
    })()

    embed.addField('Carnage', '$' + totals[0].carnage, true)
    embed.addField('Total Ships', totals[0].count, true)
    embed.addField('Most Common', `${mostCommon[0].count}x ${mostCommon[0].ship}`, true)

    await interaction.editReply({ embeds: [embed] })
  }
}