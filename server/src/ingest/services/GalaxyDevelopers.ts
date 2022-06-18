import type { Guild } from "discord.js";
import { IngestService, IngestServiceArg } from "../service";

export default class GalaxyDevelopersIngest extends IngestService {
  developers: string[]

  private guild?: Guild

  constructor(arg: IngestServiceArg) {
    super(arg)
    this.developers = []
  }

  async init() {
    if (!this.GalaxyInfo.config.guilds.galaxyDevelopment) throw new Error('Galaxy Development guild unspecified')
    this.guild = await this.client.guilds.fetch(this.GalaxyInfo.config.guilds.galaxyDevelopment)

    this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
     if (!this.guild) throw new Error('Guild not initialized')
      if (!([oldMember.guild.id, newMember.guild.id].includes(this.guild.id))) return
      await this.updateCache()
    })

    await this.updateCache()
  }

  private async updateCache() {
    if (!this.guild) throw new Error('Guild not initialized')

    await this.guild.members.fetch()
    
    const roles = await this.guild.roles.fetch()
    const role = roles.find(role => role.name === 'Dev')
    if (!role) throw new Error('Could not find Dev role')

    const members = Array.from(role.members.values())
    this.developers = members.map(member => member.id)
  }
}