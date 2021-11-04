import fetch from 'node-fetch'

export default async function frontendLoggedIn (req: any, res: any, next: any) {
  const token = req.headers['x-discord-token']
  if (!token) return res.send('no token')
  if (typeof token !== 'string') return res.send('token not a string')

  const userData = await (await fetch('https://discord.com/api/v9/users/@me', {
    headers: {
      Authorization: 'Bearer ' + token
    }
  })).json()
  if (userData.errors) return res.send('discord api returned an error: ' + JSON.stringify(userData.errors))

  req.discordUser = userData
  req.discordUser._token = token
  return next()
}
