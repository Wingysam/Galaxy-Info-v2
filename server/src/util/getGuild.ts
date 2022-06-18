import { Client, Permissions } from 'discord.js'
import fetch from 'node-fetch'
import { sleep } from './sleep'

export async function getUserGuild (token: string, guildid: string): Promise<any> {
  const userGuilds = await (await fetch(`https://discord.com/api/v9/users/@me/guilds?after=${BigInt(guildid) - 1n}&limit=1`, {
    headers: {
      Authorization: 'Bearer ' + token
    }
  })).json()
  if (userGuilds.retry_after) {
    await sleep(userGuilds.retry_after * 1000)
    return await getUserGuild(token, guildid)
  }
  if (userGuilds.message) throw new Error(JSON.stringify(userGuilds))

  const userGuild = userGuilds.find((guild: any) => guild.id === guildid)
  if (!userGuild) throw new Error("didn't find guild")

  if (
    !new Permissions(userGuild.permissions)
      .has(['ADMINISTRATOR', 'MANAGE_GUILD'])
  ) throw new Error('not correct perms')

  return userGuild
}

export async function getBotGuild (token: string, guildid: string, client: Client) {
  const userGuild = await getUserGuild(token, guildid)
  const botGuild = client.guilds.resolve(userGuild.id)
  if (!botGuild) throw new Error('bot not in guild')

  return botGuild
}
