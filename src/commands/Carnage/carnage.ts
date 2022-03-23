import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import { Message, MessageEmbed } from 'discord.js'
import { GalaxyInfoCommand } from '../../GalaxyInfoCommand'
import format from 'pg-format'

@ApplyOptions<GalaxyInfoCommand.Options>({
  description: "Get carnage for one or more players, defaults to the guild the command is run in. Specify the player 'all' to see carnage for everyone. ",
  examples: [
    'carnage yname',
    'carnage yname drwhointardis',
    'carnage'
  ],
  flags: ['reverse', 'pirating', 'limited'],
  options: ['ship']
})

export class PingCommand extends GalaxyInfoCommand {
  public async messageRun (message: Message, args: Args) {
    const GalaxyInfo = this.container.client.GalaxyInfo

    const playerNames = await args.repeat('string').catch(() => [])
    let players: any[] = []
    let allPlayers = false
    if (playerNames[0] === 'all') {
      allPlayers = true
    } else {
      if (playerNames.length) {
        players = await Promise.all(playerNames.map(name => GalaxyInfo.roblox.nameToId(name)))
      } else {
        if (!message.guild) return message.channel.send('Specify a player or try this in a guild.')
        const guild = await GalaxyInfo.guildConfigs.readGuild(BigInt(message.guild.id))
        players = guild.members
      }
    }

    players = players.map(player => player.toString())
    if (players.find(player => !/^\d*$/.test(player))) return message.channel.send("Fetching players went wrong and returned something that isn't an id")

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
              args.getFlags('reverse')
              ? `victim_id IN (${players.join(',')})`
              : `killer_id IN (${players.join(',')})`
            }`
          }
          ${
            args.getFlags('pirating')
            ? "AND victim_class IN ('Miner', 'Freighter')"
            : ''
          }
          ${
            args.getFlags('limited')
            ? 'AND victim_limited'
            : ''
          }
          ${
            args.getOption('ship')
            ? format(
              args.getFlags('reverse')
              ? 'AND LOWER(victim_ship) = LOWER(%L)'
              : 'AND LOWER(killer_ship) = LOWER(%L)',
              args.getOption('ship')
            )
            : ''
          }
      `),
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          victim_ship AS ship,
          COUNT(*),
          SUM(victim_cost) AS carnage
        FROM "Kill_temp"
        GROUP BY victim_ship
        ORDER BY SUM(victim_cost) DESC
        LIMIT 10
      `,
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          SUM(victim_cost) AS carnage,
          COUNT(*)
        FROM "Kill_temp"
      `,
      GalaxyInfo.prisma.$queryRaw`
        SELECT
          victim_ship AS ship,
          COUNT(*)
        FROM "Kill_temp"
        GROUP BY victim_ship
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `,
      GalaxyInfo.prisma.$executeRawUnsafe('DROP VIEW "Kill_temp"')
    ])

    console.log({
      topTen, totals, mostCommon
    })

    const embed = new MessageEmbed()

    if (!topTen.length) return message.channel.send('No kills found.')

    ;(() => {
      const longestNumber = topTen
        .map((ship: any) => ship.count.toString())
        .sort((a: string, b: string) => b.length - a.length)[0]
        .length

      embed.addField('Top Ten Kills', '```ini\n' + topTen.map((ship: any) =>
        `[-] x${ship.count.toString().padStart(longestNumber, '0')} ${ship.ship} ($${ship.carnage.toLocaleString()})`
      ).join('\n') + '\n```')
    })()

    embed.addField('Carnage', '$' + totals[0].carnage.toLocaleString(), true)
    embed.addField('Total Ships', totals[0].count.toLocaleString(), true)
    embed.addField('Most Common', `${mostCommon[0].count.toLocaleString()}x ${mostCommon[0].ship}`, true)

    message.channel.send({ embeds: [embed] })

    return
  }
}
