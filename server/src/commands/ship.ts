import { type CommandInteraction, MessageEmbed } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import format from 'pg-format'

import { GalaxyInfoCommand } from '../GalaxyInfoCommand'
import { EMOJIS } from '../emoji'
import { type Ship, type ShipFighters, ShipNotFoundError, type ShipSpinal, type ShipSpinalGun, type ShipTurrets, type Turret, BUILD_MENU_CLASSES } from '@galaxyinfo/ships'
import { firstBy } from 'thenby'
import type GalaxyStaffIngest from '../ingest/services/GalaxyStaff'
import type { Channel } from '@prisma/client'

const NBSP = '\u00A0'

export class ShipCommand extends GalaxyInfoCommand {
  constructor () {
    const builder = new SlashCommandBuilder()
      .setName('ship')
      .addStringOption(option => option.setName('ship').setDescription('The ship to get information about').setRequired(true))
      .addIntegerOption(option => option.setName('range').setDescription('Show alpha/DPS at this range'))
      .addIntegerOption(option => option.setName('loyalty').setDescription('Turret damage is increased at higher loyalty, default is ship requirement or 3%'))
      .setDescription('Get information about a ship in Galaxy')
    super({ builder, instant: true })
  }

  public async interactionCreate (interaction: CommandInteraction, _expectsEphemeral: boolean, channelConfig?: AllProps<Channel>) {
    const GalaxyInfo = interaction.client.GalaxyInfo

    const search = interaction.options.getString('ship', true)
    const info = GalaxyInfo.ships.find(search)

    const range = interaction.options.getInteger('range')
    let loyalty = interaction.options.getInteger('loyalty')
    if (loyalty === null) {
      loyalty = 0
    } else {
      loyalty = loyalty / 100
    }

    if (info.secret || info.test) {
      const galaxyStaffIngest = GalaxyInfo.ingest.services.get('GalaxyStaffIngest') as GalaxyStaffIngest | undefined
      if (!galaxyStaffIngest) throw new Error('GalaxyStaffIngest missing')

      if (!galaxyStaffIngest.testShipAccess.members.includes(interaction.user.id)) {
        if (info.test) {
          throw new ShipNotFoundError()
        } else {
          throw new Error(`**${info.name}** is scrambled. If you think this is unintentional, please contact a developer.`)
        }
      }
      await interaction.deferReply({ ephemeral: true })
    } else if (!channelConfig || channelConfig.commands) {
      await interaction.deferReply()
    } else {
      await interaction.deferReply({ ephemeral: true })
    }

    const image = GalaxyInfo.galaxypedia.getShipImage(info.name)

    const PRIZE_SHIP = '🏆 Prize Ship'
    const LIMITED = '🟠 Limited'
    const BUILD_MENU = '🟢 Build Menu'
    const NPC = '👽 Non-player ship'
    let availabilityType = info.notForSale ? PRIZE_SHIP : info.eventId ? LIMITED : BUILD_MENU
    if (!((BUILD_MENU_CLASSES as any).includes(info.class))) availabilityType = PRIZE_SHIP
    if (['Alien', 'Titan'].includes(info.class)) availabilityType = NPC

    const [carnage, reverseCarnagePlayer, reverseCarnageNpc] = await GalaxyInfo.prisma.$transaction([
      GalaxyInfo.prisma.$queryRawUnsafe(`
        SELECT
          SUM(victim_cost) AS carnage,
          COUNT(*)
        FROM "Kill_clean"
        WHERE
          ${format('LOWER(killer_ship) = LOWER(%L)', info.name)}
          AND date > NOW() - INTERVAL '30 days'
      `),
      GalaxyInfo.prisma.$queryRawUnsafe(`
        SELECT
          SUM(victim_cost) AS carnage,
          COUNT(*)
        FROM "Kill_clean"
        WHERE
          ${format('LOWER(victim_ship) = LOWER(%L)', info.name)}
          AND killer_id != -1
          AND NOT killer_name IN ('Alien', 'Pirate', 'Kneall')
          AND date > NOW() - INTERVAL '30 days'
      `),
      GalaxyInfo.prisma.$queryRawUnsafe(`
        SELECT
          SUM(victim_cost) AS carnage,
          COUNT(*)
        FROM "Kill_clean"
        WHERE
          ${format('LOWER(victim_ship) = LOWER(%L)', info.name)}
          AND (
            killer_id != -1
            OR killer_name IN ('Alien', 'Pirate', 'Kneall')
          )
          AND date > NOW() - INTERVAL '30 days'
      `)
    ]) as any

    function checkIfBotHasEmojiPermissions () {
      if (!interaction.channel) return true
      if (!('permissionsFor' in interaction.channel)) return true
      if (!interaction.guild) return true
      if (!interaction.guild.me) return false
      const permissions = interaction.channel.permissionsFor(interaction.guild.me, true)
      const hasPermission = permissions.has('USE_EXTERNAL_EMOJIS')
      return hasPermission
    }
    const botHasEmojiPermissions = checkIfBotHasEmojiPermissions()

    function processTurret (turret: Turret, count: number) {
      return {
        name: turret.name,
        count,
        dps: Math.floor(turret.dps(range ?? undefined, loyalty ?? undefined).multiply(count).average)
      }
    }
    function generateTurretText (turrets: ShipTurrets) {
      const processed = Array.from(turrets.turrets.entries()).map(([turret, count]) => processTurret(turret, count))
      processed.sort(firstBy('dps', -1))
      return processed.map(processedTurret => `${processedTurret.count}x ${processedTurret.name} (${processedTurret.dps}${NBSP}DPS)`).join('\n')
    }
    const turretText = generateTurretText(info.weapons.turrets)

    function generateSpinalText (spinal: ShipSpinal, spinalIndex: number) {
      const dps = spinal.dps(range ?? undefined)
      return `* Spinal ${spinalIndex + 1} (${Math.floor(dps.average)}${NBSP}DPS)\n${spinal.guns.map(generateGunText).join('\n')}`
    }
    function generateGunText (gun: ShipSpinalGun) {
      return `  * ${gun.barrels} ${gun.weaponSize} ${gun.weaponType}`
    }
    const spinalText = info.weapons.spinals.spinals.map(generateSpinalText).join('\n')

    function processFighter (fighter: Ship, count: number) {
      return {
        name: fighter.name,
        count,
        dps: Math.floor(fighter.weapons.dps().multiply(count).average)
      }
    }
    function generateFighterText (fighters: ShipFighters) {
      const processed = Array.from(fighters.fighters.entries()).map(([fighter, count]) => processFighter(fighter, count))
      processed.sort(firstBy('dps', -1))
      return processed.map(processedTurret => `[F] ${processedTurret.count}x ${processedTurret.name} (${processedTurret.dps}${NBSP}DPS)`).join('\n')
    }
    const fighterText = generateFighterText(info.fighters)

    const dps = info.weapons.dps(range ?? undefined, loyalty)
    const alpha = info.weapons.alpha(range ?? undefined, loyalty)

    const embed = new MessageEmbed()
    embed.setTitle(info.name)
    embed.setDescription(info.description)
    embed.url = `${GalaxyInfo.config.web.frontendBase}/ships/${encodeURIComponent(info.name)}`
    embed.setFooter({
      text: `Damage at ${Math.round(loyalty * 100)}% loyalty${info.secret ? '; Secret ship. This information is only available to Galaxy developers.' : ''}`
    })

    embed.addField('Health', `🛡️ ${info.health.shield} / 🛠️ ${info.health.hull}`, true)
    embed.addField('Speed', `Top Speed: ${Math.floor(info.speed.top)}\nTurn Speed: ${info.speed.turn.toFixed(2)}\nAcceleration: ${Math.floor(info.speed.acceleration)}`, true)
    embed.addField('Storage', `${botHasEmojiPermissions ? EMOJIS.classIcons.freighter + ' ' : ''}Cargo Hold: ${info.cargoHold}\n${botHasEmojiPermissions ? EMOJIS.classIcons.miner + ' ' : ''}Ore Hold: ${info.oreHold}`, true)

    embed.addField('Availability', availabilityType, true)
    embed.addField('Class', info.class, true)
    embed.addField('Carnage (past 30d)', `💀 Kills: ${carnage[0].count ?? '0'} ($${(carnage[0].carnage ?? 0).toLocaleString()})\n💥 Losses (Players): ${reverseCarnagePlayer[0].count ?? 0} ($${(reverseCarnagePlayer[0].carnage ?? 0).toLocaleString()})\n💥 Losses (NPCs): ${reverseCarnageNpc[0].count ?? 0} ($${(reverseCarnageNpc[0].carnage ?? 0).toLocaleString()})`, true)

    embed.addField('Weapons', ([turretText, spinalText, fighterText].filter(text => text.trim()).join('\n\n')) || 'None', true)
    embed.addField('DPS', `Shield: ${Math.floor(dps.shield)}\nHull: ${Math.floor(dps.hull)}\nAverage: ${Math.floor(dps.average)}` + (info.fighters.hasFighters ? `\n\nWith fighters: ${Math.floor(dps.average + info.fighters.dps().average)}` : ''), true)
    embed.addField('Alpha', `Shield: ${Math.floor(alpha.shield)}\nHull: ${Math.floor(alpha.hull)}\nMax: ${Math.floor(alpha.max)}\nExplosion Size: ${info.explosionSize}`, true)

    const imageResolved = await image
    await interaction.editReply({ files: typeof imageResolved === 'string' ? [imageResolved] : [], embeds: [embed] })
  }
}
