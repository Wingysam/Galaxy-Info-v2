import type { Client, Guild } from "discord.js";
import _ from "lodash";
import { IngestService, IngestServiceArg, LogFunction } from "../service";

export default class GalaxyStaffIngest extends IngestService {
  developers!: GalaxyStaffIngestRole
  admins!: GalaxyStaffIngestRole

  constructor(arg: IngestServiceArg) {
    super(arg)
    try { this.developers = new GalaxyStaffIngestRole(this.GalaxyInfo.config.guilds.galaxyDevelopment, 'Dev', arg.client, this.log) } catch {}
    try { this.admins = new GalaxyStaffIngestRole(this.GalaxyInfo.config.guilds.galaxy, 'Admins', arg.client, this.log) } catch {}
  }

  async init () {}
}

class GalaxyStaffIngestRole {
  members: string[]
  private guildId: string
  private roleName: string
  private client: Client
  private log: LogFunction

  private guild!: Guild
  constructor(guildId: string | undefined, roleName: string, client: Client, log: LogFunction) {
    this.members = []
    if (!guildId) throw new Error('No guild id')
    this.guildId = guildId
    this.roleName = roleName
    this.client = client
    this.log = (...message: any[]) => log(`[${roleName}]`, ...message)
    this.init()
  }

  async init() {
    this.guild = await this.client.guilds.fetch(this.guildId)

    this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
     if (!this.guild) throw new Error('Guild not initialized')
      if (!([oldMember.guild.id, newMember.guild.id].includes(this.guild.id))) return
      await this.updateCache()
    })

    await this.updateCache()
  }

  private async updateCache() {
    try {
      await this.guild.members.fetch()
      
      const roles = await this.guild.roles.fetch()
      const role = roles.find(role => role.name === this.roleName)
      if (!role) throw new Error(`Could not find ${this.roleName} role`)
  
      const members = Array.from(role.members.values())
        .map(member => member.id)
  
      if (!_.isEqual(members, this.members)) this.log('Updated members', members)
  
      this.members = members
    } catch (error) {
      if (!(error instanceof Error)) return
      this.log('Failed to update cache:', error.message)
    }
  }
}