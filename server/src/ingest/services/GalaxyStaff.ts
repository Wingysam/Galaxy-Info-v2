import { EventEmitter } from 'events'
import type { Client, Guild } from "discord.js";
import _ from "lodash";
import { IngestService, IngestServiceArg, LogFunction } from "../service";

export default class GalaxyStaffIngest extends IngestService {
  developers!: GalaxyStaffIngestRole
  devAdvisors!: GalaxyStaffIngestRole
  testShipAccess!: GalaxyStaffIngestAlias
  admins!: GalaxyStaffIngestRole

  constructor(arg: IngestServiceArg) {
    super(arg)
    try { this.developers = new GalaxyStaffIngestRole(this.GalaxyInfo.config.guilds.galaxyDevelopment, 'Dev', arg.client, this.log) } catch {}
    try { this.devAdvisors = new GalaxyStaffIngestRole(this.GalaxyInfo.config.guilds.galaxyDevelopment, 'Dev Advisor', arg.client, this.log) } catch {}
    try { this.admins = new GalaxyStaffIngestRole(this.GalaxyInfo.config.guilds.galaxy, 'Admins', arg.client, this.log) } catch {}

    try { this.testShipAccess = new GalaxyStaffIngestAlias(this.developers, this.devAdvisors) } catch {}
  }

  async init () {}
}

class GalaxyStaffIngestRole extends EventEmitter {
  members: string[]
  private guildId: string
  private roleName: string
  private client: Client
  private log: LogFunction

  private guild!: Guild
  constructor(guildId: string | undefined, roleName: string, client: Client, log: LogFunction) {
    super()
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
      this.emit('members', members)
    } catch (error) {
      if (!(error instanceof Error)) return
      this.log('Failed to update cache:', error.message)
    }
  }
}

class GalaxyStaffIngestAlias {
  members!: string[]
  private roles: GalaxyStaffIngestRole[]

  constructor(...roles: GalaxyStaffIngestRole[]) {
    this.roles = roles
    this.update()
    for (const role of roles) {
      role.on('members', () => {
        this.update()
      })
    }
  }
  
  private update() {
    this.members = []
    for (const role of this.roles) {
      this.members = [...this.members, ...role.members]
    }
    this.members = _.uniq(this.members)
  }
}