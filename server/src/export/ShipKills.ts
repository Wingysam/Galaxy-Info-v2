import { NON_LIMITED_QUEST_SHIPS } from "@galaxyinfo/ships/dist";
import type { Kill } from "@prisma/client";
import { Message, MessageEmbed } from "discord.js";
import type { LogFunction } from "ingest/service";
import type ShipKillsIngest from "ingest/services/ShipKills";
import { substitute } from '../util/templating';

export class ShipKillsExport {
  GalaxyInfo: GalaxyInfo
  log: LogFunction

  constructor(arg: { GalaxyInfo: GalaxyInfo, log: LogFunction }) {
    this.GalaxyInfo = arg.GalaxyInfo
    this.log = (...message) => arg.log('[ShipKillsExport]', ...message)
    this.init()
  }

  async init () {
    const shipKillsIngest = await this.GalaxyInfo.ingest.services.wait('ShipKillsIngest') as ShipKillsIngest
    shipKillsIngest.on('kill', async (kill: Kill) => {
      console.log(kill)
      const channels: any = await this.GalaxyInfo.prisma.$queryRaw`
        SELECT
          id, kill_log_embed, kill_log_pin_limiteds, kill_log_template_normal, kill_log_template_nuke, (SELECT members FROM "Guild" WHERE "Guild".id = "Channel".guild) AS members, kill_log_members, kill_log_include_all, kill_log_custom_users,
          kill_log_limited_kill_classes, kill_log_bm_kill_classes, kill_log_limited_death_classes, kill_log_bm_death_classes
        FROM "Channel"
        WHERE
          kill_log_enabled
      `
      for (const channelRow of channels) {
        let isAll = channelRow.kill_log_include_all
        if (!this.GalaxyInfo.config.export.shipKills.allowKillLogForAll) isAll = false

        const killerIsMember = (channelRow.kill_log_members ?? this.GalaxyInfo.guildConfigs.defaults.channel.kill_log_members) && channelRow.members?.includes(kill.killer_id)
        const killerIsCustom = channelRow.kill_log_custom_users?.includes(kill.killer_id)

        const victimIsMember = (channelRow.kill_log_members ?? this.GalaxyInfo.guildConfigs.defaults.channel.kill_log_members) && channelRow.members?.includes(kill.victim_id)
        const victimIsCustom = channelRow.kill_log_custom_users?.includes(kill.victim_id)

        const isLimited = kill.victim_limited && !NON_LIMITED_QUEST_SHIPS.includes(kill.victim_ship)

        const getClassEmoji = async (shipClass: string) => {
          const FALLBACK_ID = '413300275953008641'
          const IDS = {
            Miner: '621337546051289088',
            Freighter: '621337546126917662',
            Frigate: '1096102884002766978',
            Destroyer: '621337545568944138',
            Cruiser: '621337545661349888',
            Battlecruiser: '621337545694773279',
            Battleship: '621337545791242240',
            Dreadnought: '621337545854156801',
            Carrier: '621337546068328471',
            'Super Capital': '621337546034642954'
          }
          return `<:emoji:${(IDS as any)[shipClass] ?? FALLBACK_ID}>`
        }

        const generateMessageBody = async (isKill: boolean, shouldEmbed: boolean, template: string) => {
          const text = substitute(template, {
            KILLERNAME: kill.killer_name,
            KILLERSHIP: kill.killer_ship,
            KILLERCLASS: kill.killer_class,
            KILLERICON: await getClassEmoji(kill.killer_class),
            VICTIMNAME: kill.victim_name,
            VICTIMSHIP: kill.victim_ship,
            VICTIMCLASS: kill.victim_class,
            VICTIMICON: await getClassEmoji(kill.victim_class),
            VICTIMCOST: kill.victim_cost.toLocaleString()
          })

          if (shouldEmbed) {
            const embed = new MessageEmbed()
              .setDescription(text)
              .setColor(isKill ? 'GREEN' : 'RED')
            return { embeds: [embed] }
          }

          return { content: text }
        }

        let channel
        try {
          channel = await this.GalaxyInfo.client.channels.fetch(`${channelRow.id}`)
        } catch {}
        if (!channel || !channel.isText()) continue

        const templateNormal = channelRow.kill_log_template_normal ?? this.GalaxyInfo.guildConfigs.defaults.channel.kill_log_template_normal
        const templateNuke = channelRow.kill_log_template_nuke ?? this.GalaxyInfo.guildConfigs.defaults.channel.kill_log_template_nuke
        const shouldEmbed = channelRow.kill_log_embed ?? this.GalaxyInfo.guildConfigs.defaults.channel.kill_log_embed

        const victimClass = kill.victim_class.replaceAll(' ', '_')

        let message: Message | undefined
        if (isAll || killerIsMember || killerIsCustom) {
          if (isLimited && !channelRow.kill_log_limited_kill_classes?.includes(victimClass)) continue
          if (!isLimited && !channelRow.kill_log_bm_kill_classes?.includes(victimClass)) continue
          try {
            message = await channel.send(await generateMessageBody(true, shouldEmbed, kill.nuke ? templateNuke : templateNormal))
          } catch {} // no perms, discord outage, etc
        } else if (victimIsMember || victimIsCustom) {
          if (isLimited && !channelRow.kill_log_limited_death_classes?.includes(victimClass)) continue
          if (!isLimited && !channelRow.kill_log_bm_death_classes?.includes(victimClass)) continue
          try {
            message = await channel.send(await generateMessageBody(false, shouldEmbed, kill.nuke ? templateNuke : templateNormal))
          } catch {}
        }

        if (message && isLimited && (channelRow.kill_log_pin_limiteds ?? this.GalaxyInfo.guildConfigs.defaults.channel.kill_log_pin_limiteds)) {
          try {
            await message.pin()
          } catch {} // no perms or max pins / discord api issue
        }
      }
    })
  }
}