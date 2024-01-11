import type { Channel, Guild, Prisma } from '.prisma/client'

interface ConstructorArg {
  GalaxyInfo: GalaxyInfo
}

// The purpose of this class is to allow reading/writing guild/channel configurations with defaults
export class GuildConfigs {
  private readonly GalaxyInfo: GalaxyInfo
  defaults
  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.defaults = {
      guild: {
        members: [],

        command_ship_image_placement: 'upload'
      },
      channel: {
        commands: true,
        admin_event_pings: false,
        dps_updates: false,
        permits: false,

        kill_log_enabled: false,
        kill_log_members: true,
        kill_log_include_all: false,
        kill_log_custom_users: [],
        kill_log_embed: true,
        kill_log_pin_limiteds: true,
        kill_log_template_normal: "{{KILLERNAME}}'s {{KILLERICON}} {{KILLERSHIP}} destroyed {{VICTIMNAME}}'s {{VICTIMICON}} {{VICTIMSHIP}}",
        kill_log_template_nuke: "{{KILLERNAME}}'s {{KILLERICON}} {{KILLERSHIP}} 💥 nuked 💥 {{VICTIMNAME}}'s {{VICTIMICON}} {{VICTIMSHIP}}",
        kill_log_daily_stats: false
      }
    }
  }

  // Defaults need to be removed to allow easily changing them in the future without migrating the database
  withoutDefaults (defaults: any) {
    // you provide the defaults, then call the returned function with your data to remove the defaults
    return function (value: any) {
      const result: any = {}

      for (const [key, val] of Object.entries(value)) {
        // if we don't have a default for it, we keep the provided value
        const defaultValue = defaults[key]
        if (typeof defaultValue === 'undefined') result[key] = val
        // this used to not set the key, but it caused a bug where it was
        // impossible to change a value back to the default after changing it
        // setting it to null allows it to remove the cell in the database
        // there was also a second bug involved, not sure which fix actaully fixed it
        else if (defaultValue === val) result[key] = null
        // if we do have a default but it doesn't match, we keep the provided value
        else result[key] = val
      }

      return result
    }
  }

  // we need to add the defaults back to the object when fetching from db
  withDefaults (defaults: any) {
    // using the factory pattern here because it's the most simple way to do this
    return function (value: any) {
      const result: any = {}

      // we iterate through the keys of the data fetched from database
      for (const key of Object.keys(value)) {
        // and we check if the database has the particular key
        // and if not, we return the default
        result[key] = value[key] ?? defaults[key]
      }

      return result
    }
  }

  async readGuild (guildid: bigint): Promise<AllProps<Guild>> {
    const dbEntry = await this.GalaxyInfo.prisma.guild.findFirst({
      where: {
        id: guildid
      }
    })

    const defaults = this.withDefaults(this.defaults.guild)

    if (dbEntry) {
      return defaults(dbEntry) as AllProps<Guild>
    } else {
      const newData = {
        id: guildid,
        last_updated: new Date()
      }
      await this.GalaxyInfo.prisma.guild.create({ data: newData })
      return defaults(newData)
    }
  }

  async writeGuild (guild: Prisma.GuildCreateInput) {
    guild = this.withoutDefaults(this.defaults.guild)(guild)
    return this.withDefaults(this.defaults.guild)(
      await this.GalaxyInfo.prisma.guild.upsert({
        create: guild,
        update: guild,
        where: {
          id: guild.id
        }
      })
    ) as AllProps<Guild>
  }

  async readChannel (guild: bigint, channel: bigint): Promise<AllProps<Channel>>
  async readChannel (guild: bigint, channel: bigint[]): Promise<AllProps<Channel[]>>
  async readChannel (guild: bigint, channel: bigint | bigint[]): Promise<AllProps<Channel> | AllProps<Channel[]>> {
    const defaults = this.withDefaults(this.defaults.channel)
    if (channel instanceof Array) {
      await this.GalaxyInfo.prisma.channel.createMany({
        data: channel.map(id => {
          return {
            id,
            guild
          }
        }),
        skipDuplicates: true
      })
      const dbEntry = await this.GalaxyInfo.prisma.channel.findMany({
        where: {
          id: {
            in: channel
          }
        }
      })

      return dbEntry.map(defaults)
    } else {
      await this.GalaxyInfo.prisma.channel.createMany({
        data: {
          id: channel,
          guild
        },
        skipDuplicates: true
      })

      const dbEntry = (await this.GalaxyInfo.prisma.channel.findFirst({
        where: {
          id: channel
        }
      }))!

      return defaults(dbEntry) as AllProps<Channel>
    }
  }

  async writeChannel (channel: Prisma.ChannelCreateInput): Promise<AllProps<Channel>>
  async writeChannel (channel: Prisma.ChannelCreateInput[]): Promise<Array<AllProps<Channel>>>
  async writeChannel (channel: Prisma.ChannelCreateInput | Prisma.ChannelCreateInput[]) {
    const defaults = this.withDefaults(this.defaults.channel)
    if (channel instanceof Array) {
      const results = []
      for (const channelData of channel.map(this.withoutDefaults(this.defaults.channel))) {
        results.push(defaults(
          await this.GalaxyInfo.prisma.channel.upsert({
            create: channelData,
            update: channelData,
            where: {
              id: channelData.id
            }
          })
        ))
      }
      return results
    } else {
      return defaults(
        await this.GalaxyInfo.prisma.channel.create({
          data: this.withoutDefaults(this.defaults.channel)(channel)
        })
      )
    }
  }
}
