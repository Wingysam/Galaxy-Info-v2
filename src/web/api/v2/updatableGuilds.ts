import { Router } from 'express'
import fetch from 'node-fetch'
import frontendLoggedIn from '../../middleware/frontendLoggedIn'
import { Permissions } from 'discord.js'

type Arg = {
  GalaxyInfo: GalaxyInfo
}

export async function updatableGuilds ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', frontendLoggedIn, async (req, res) => {
    let userGuilds = await (await fetch('https://discord.com/api/v9/users/@me/guilds', {
      headers: {
        Authorization: 'Bearer ' + req.discordUser._token
      }
    })).json()
    if (userGuilds.message) return res.send({ error: userGuilds.message })

    userGuilds = userGuilds.filter((guild: any) =>
      new Permissions(guild.permissions).has(['ADMINISTRATOR', 'MANAGE_GUILD'])
    )

    const botGuilds: any[] = ((await Promise.all(userGuilds.map(async (userGuild: any): Promise<any> => {
      const botGuild = GalaxyInfo.client.guilds.resolve(userGuild.id)
      if (!botGuild) return
      return {
        id: botGuild.id,
        name: botGuild.name,
        icon: botGuild.icon
      }
    }))) as any)
      .filter((guild: any) => guild)

    userGuilds = userGuilds.filter((userGuild: any) => !botGuilds.find((botGuild): any => userGuild.id === botGuild.id))

    return res.send({ botGuilds, userGuilds })
  })

  return router
}
