import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import { Message, MessageEmbed } from 'discord.js'
import { GalaxyInfoCommand } from '../../GalaxyInfoCommand'
import format from 'pg-format'

@ApplyOptions<GalaxyInfoCommand.Options>({
  description: 'Display carnage leaderboards',
  aliases: ['carnagelb', 'clb'],
  examples: [
    'carnagelb -ship="stealth b-2"',
    'carnagelb',
    'carnagelb 2'
  ],
  flags: ['pirating', 'limited', 'reverse', 'count'],
  options: ['ship', 'player']
})

export class PingCommand extends GalaxyInfoCommand {
  public async messageRun (message: Message, args: Args) {
    const GalaxyInfo = this.container.client.GalaxyInfo

    const page = (Number(await args.nextMaybe().value ?? 1))
    if (Number.isNaN(page)) return message.channel.send('Page should be a number. If you meant to use a -flag or -option, make sure to remember the `-`.')
    if (!Number.isSafeInteger(page) || page <= 0) return message.channel.send('Page must be a positive integer.')
    if (page > 10) return message.channel.send('For performance reasons, page must be at most 10.')
    const afterPos = (page - 1) * 10

    const [, topTen, totals, mostCommon]: any = await GalaxyInfo.prisma.$transaction([
      GalaxyInfo.prisma.$executeRawUnsafe(`
        CREATE TEMPORARY VIEW "Kill_temp" AS
        SELECT *
        FROM "Kill_clean"
        WHERE
          1=1
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
      GalaxyInfo.prisma.$queryRawUnsafe(`
        SELECT
        ROW_NUMBER() OVER (ORDER BY ${args.getFlags('count') ? 'killed' : 'carnage'} DESC) AS pos,
        (
          SELECT nameq.name
          FROM "Kill_usermap" AS nameq
          WHERE nameq.id = result.${args.getFlags('reverse') ? 'victim' : 'killer'}_id
          LIMIT 1
        ) AS player,
        carnage,
        killed
      FROM (
        SELECT
          ${args.getFlags('reverse') ? 'victim' : 'killer'}_id,
          SUM(victim_cost) AS carnage,
          COUNT(*) AS killed
        FROM "Kill_temp"
        WHERE
          killer_id != -1
          ${args.getFlags('reverse')
            ? ''
            : `AND NOT killer_name IN (
                'Alien',
                'Pirate',
                'NPC'
              )`
          }
        GROUP BY ${args.getFlags('reverse') ? 'victim' : 'killer'}_id
      ) AS result
      ORDER BY ${args.getFlags('count') ? 'killed' : 'carnage'} DESC
      LIMIT 10 OFFSET ${afterPos}
      ;
      `),
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

    const embed = new MessageEmbed()

    if (!topTen.length) return message.channel.send('No kills found.')

    ;(() => {
      const longestNumber = topTen
        .map((player: any) => player.pos.toString())
        .sort((a: string, b: string) => b.length - a.length)[0]
        .length

      embed.addField('Top Ten Carnage' + (page > 1 ? ` (Page ${page})` : ''), '```ini\n' + topTen.map((player: any) =>
        `[${player.pos.toString().padStart(longestNumber, '0')}] ${player.player} $${player.carnage.toLocaleString()} (${player.killed.toLocaleString()})`
      ).join('\n') + '\n```')
    })()

    embed.addField('Carnage', '$' + totals[0].carnage.toLocaleString(), true)
    embed.addField('Total Ships', totals[0].count.toLocaleString(), true)
    embed.addField('Most Common', `${mostCommon[0].count.toLocaleString()}x ${mostCommon[0].ship}`, true)

    message.channel.send({ embeds: [embed] })

    return
  }
}
