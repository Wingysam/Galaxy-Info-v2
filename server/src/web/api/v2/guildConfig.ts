import { json, Router } from 'express'
import frontendLoggedIn from '../../middleware/frontendLoggedIn'
import { TextChannel } from 'discord.js'
import { deserialize, serialize } from '@galaxyinfo/serialization'
import type { Channel, Prisma } from '.prisma/client'
import { getBotGuild, getUserGuildOrThrowIfNoPerms } from '../../../util/getGuild'
import { firstBy } from 'thenby'

interface Arg {
  GalaxyInfo: GalaxyInfo
}

/**
 * @openapi
 * /v2/guildConfig/{guildId}:
 *   get:
 *     summary: Get guild configuration
 *     description: Retrieve configuration for a specific Discord guild. Requires authentication and guild management permissions.
 *     tags:
 *       - Guild Config
 *     parameters:
 *       - in: path
 *         name: guildId
 *         required: true
 *         schema:
 *           type: string
 *         description: Discord guild ID
 *     responses:
 *       200:
 *         description: Guild configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Guild name
 *                 icon:
 *                   type: string
 *                   description: Guild icon URL
 *                 channels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       config:
 *                         type: object
 *                 config:
 *                   $ref: '#/components/schemas/GuildConfig'
 *       403:
 *         description: Not authorized to access this guild
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Update guild configuration
 *     description: Update configuration for a specific Discord guild. Requires authentication and guild management permissions.
 *     tags:
 *       - Guild Config
 *     parameters:
 *       - in: path
 *         name: guildId
 *         required: true
 *         schema:
 *           type: string
 *         description: Discord guild ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channels
 *               - last_updated
 *             properties:
 *               channels:
 *                 type: array
 *                 items:
 *                   type: object
 *               last_updated:
 *                 type: string
 *                 format: date-time
 *               force:
 *                 type: boolean
 *                 description: Force update even if configuration has changed
 *               members:
 *                 type: string
 *               command_ship_image_placement:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guild configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 guild:
 *                   $ref: '#/components/schemas/GuildConfig'
 *                 channels:
 *                   type: array
 *                   items:
 *                     type: object
 *                 requiresForce:
 *                   type: boolean
 *                   description: Configuration has changed, force flag required
 *       403:
 *         description: Not authorized to update this guild
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function guildConfig ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/:guildId', frontendLoggedIn(), async (req, res) => {
    if (!req.discordUser) throw new Error('Not logged in')
    let botGuild
    try {
      botGuild = await getBotGuild(req.discordUser.id, req.discordUser._token, req.params.guildId, GalaxyInfo.client)
    } catch (error) {
      return res.send(serialize({ error }))
    }

    const guildId = BigInt(botGuild.id)

    const guildConfig = await GalaxyInfo.guildConfigs.readGuild(guildId)

    const djsChannels = Array.from(
      botGuild.channels.cache
        .filter(channel => channel instanceof TextChannel)
        .values()
    ) as TextChannel[]

    djsChannels.sort(firstBy((a: TextChannel, b: TextChannel) => (a.parent?.position ?? 0) - (b.parent?.position ?? 0)).thenBy('position'))

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

  router.post('/:guildId', frontendLoggedIn(), json({ limit: '50mb' }), async (req, res) => {
    try {
      const body = deserialize(req.body)

      if (!body.channels) {
        return res.send(serialize({
          error: 'no channels'
        }))
      }
      if (!(body.channels instanceof Array)) {
        return res.send(serialize({
          error: 'channels not array'
        }))
      }

      if (!req.discordUser) throw new Error('Not logged in')

      const userGuild = await getUserGuildOrThrowIfNoPerms(GalaxyInfo, req.discordUser.id, req.discordUser._token, req.params.guildId)

      const validatedGuildId = BigInt(userGuild.id)

      const oldGuildConfig = await GalaxyInfo.guildConfigs.readGuild(validatedGuildId)

      if (body.last_updated.getTime() !== oldGuildConfig.last_updated.getTime() && !body.force) return res.send(serialize({ requiresForce: true }))

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const last_updated = new Date()

      const config: Prisma.GuildCreateInput = {
        id: validatedGuildId,
        last_updated
      }

      for (const key of Object.keys(body)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        if (body[key] === '') delete body[key]
      }

      const GUILD_KEYS = [
        'members',

        'command_ship_image_placement'
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
          'kill_log_include_all',
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
          // @ts-expect-error "Expression produces a union type that is too complex to represent."
          if (key in submittedChannel) channel[key] = submittedChannel[key]
        }

        channels.push(channel)
      }

      const newGuildConfig = await GalaxyInfo.guildConfigs.writeGuild(config)
      const newChannelsConfig = await GalaxyInfo.guildConfigs.writeChannel(channels)

      return res.send(serialize({ guild: newGuildConfig, channels: newChannelsConfig }))
    } catch (error) {
      console.log('Failed to upload guild settings:', error)
      return res.send(serialize({ error }))
    }
  })

  return router
}
