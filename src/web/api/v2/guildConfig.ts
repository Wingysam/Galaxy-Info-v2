import { json, Router } from 'express'
import frontendLoggedIn from '../../middleware/frontendLoggedIn'
import { TextChannel } from 'discord.js'
import { deserialize, serialize } from '../../../../educatejson'
import type { Channel, Prisma } from '.prisma/client'
import { getBotGuild, getUserGuild } from '../../../util/getGuild'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function guildConfig ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/:guildId', frontendLoggedIn, async (req, res) => {
    let botGuild
    try {
      botGuild = await getBotGuild(req.discordUser?._token, req.params.guildId, GalaxyInfo.client)
    } catch (error) {
      return res.send(serialize({ error }))
    }

    const guildId = BigInt(botGuild.id)

    const guildConfig = await GalaxyInfo.guildConfigs.readGuild(guildId)

    const djsChannels = Array.from(
      botGuild.channels.cache
        .filter(channel => channel instanceof TextChannel)
        .values()
    )

    const channelConfigs = await GalaxyInfo.guildConfigs.readChannel(guildId, djsChannels.map(chan => BigInt(chan.id)))

    const channels = djsChannels.map(channel => {
      const channelId = BigInt(channel.id)
      return {
        id: channelId,
        name: channel.name,
        config: (channelConfigs.find(
          config => channelId === config.id
        ) as AllProps<Channel>)
      }
    })

    return res.send(serialize({
      name: botGuild.name,
      icon: botGuild.iconURL(),
      channels,
      config: guildConfig
    }))
  })

  router.post('/:guildId', frontendLoggedIn, json(), async (req, res) => {
    try {
      const body = deserialize(req.body)

      if (!body.channels) {
        return res.send(serialize({
          error: 'no channels wyd'
        }))
      }
      if (!(body.channels instanceof Array)) {
        return res.send(serialize({
          error: 'channels not array'
        }))
      }

      const userGuild = await getUserGuild(req.discordUser?._token, req.params.guildId)

      const validatedGuildId = BigInt(userGuild.id)

      const oldGuildConfig = await GalaxyInfo.guildConfigs.readGuild(validatedGuildId)

      if (body.last_updated.getTime() !== oldGuildConfig.last_updated.getTime() && !body.force) return res.send(serialize({ requiresForce: true }))

      const last_updated = new Date()

      const config = {
        id: validatedGuildId,
        last_updated
      } as Prisma.GuildCreateInput

      for (const key of Object.keys(body)) {
        if (body[key] === '') delete body[key]
      }

      const GUILD_KEYS = [
        'prefix',

        'members',

        'command_ship_compact',
        'command_ship_image_size',
        'command_ship_detailed_enabled'
      ] as const

      for (const key of GUILD_KEYS) {
        if (body[key]) config[key] = body[key]
      }

      const channels: Prisma.ChannelCreateInput[] = []
      for (const submittedChannel of body.channels) {
        if (Object.prototype.toString.call(submittedChannel) !== '[object Object]') {
          return res.send(serialize({
            error: 'a channel was not an object'
          }))
        }
        if (typeof submittedChannel.id !== 'bigint') {
          return res.send(serialize({
            error: 'a channel id was not a bigint'
          }))
        }

        for (const key of Object.keys(submittedChannel)) {
          if (submittedChannel[key] === '') submittedChannel[key] = null
        }

        const channel: Prisma.ChannelCreateInput = { id: submittedChannel.id, guild: validatedGuildId }

        const CHANNEL_KEYS = [
          'commands',
          'admin_event_pings',
          'dps_updates',
          'permits',

          'kill_log_enabled',
          'kill_log_members',
          'kill_log_custom_users',
          'kill_log_embed',
          'kill_log_pin_limiteds',
          'kill_log_template_normal',
          'kill_log_template_nuke',
          'kill_log_daily_stats',

          'kill_log_bm_kill_classes',
          'kill_log_limited_kill_classes',
          'kill_log_bm_death_classes',
          'kill_log_limited_death_classes'
        ] as const

        for (const key of CHANNEL_KEYS) {
          // @ts-expect-error
          if (key in submittedChannel) channel[key] = submittedChannel[key]
        }

        channels.push(channel)
      }

      const newGuildConfig = await GalaxyInfo.guildConfigs.writeGuild(config)
      const newChannelsConfig = await GalaxyInfo.guildConfigs.writeChannel(channels)

      return res.send(serialize({ guild: newGuildConfig, channels: newChannelsConfig }))
    } catch (error) {
      console.log(error)
      return res.send(serialize({ error }))
    }
  })

  return router
}
