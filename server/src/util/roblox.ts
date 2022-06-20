import fetch from 'node-fetch'

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

type RobloxAPIGetByUsername = {
  code: number,
  message: string
} | {
  success: false,
  errorMessage: string
} | {
  Id: number,
  username: string
  // has other properties, but they aren't used by this
}

function log (...message: any[]) {
  console.log('[Roblox Interface]', ...message)
}

export default class GalaxyInfoRobloxInterface {
  private GalaxyInfo: GalaxyInfo
  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
  }

  /**
   * Maps a Roblox username to an ID
   * @param name the name of the Roblox user
   * @returns the ID of the Roblox user
   */
  async nameToId (name: string): Promise<bigint> {
    name = name.toLowerCase()
    const existing = await this.GalaxyInfo.prisma.user.findUnique({
      where: {
        name
      }
    })
    if (existing?.id) return existing.id

    let fromRoblox = (await (await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(name)}`)).json() as RobloxAPIGetByUsername)

    if ('success' in fromRoblox) { // success is undefined when it should be true, success being present means it's false
      if (fromRoblox.success) {
        log('my assumption about success was wrong', fromRoblox)
        process.exit()
      }
      fromRoblox = {
        Id: -1,
        username: name
      }
    }

    if ('code' in fromRoblox) {
      log('Failed to fetch', name, fromRoblox)
      return 0n
    } // 5xx i think

    try {
      await this.GalaxyInfo.prisma.user.upsert({
        create: {
          name,
          id: fromRoblox.Id
        },
        update: {
          id: fromRoblox.Id
        },
        where: {
          name
        }
      })
    } catch {
      log(name, 'Already exists')
      return BigInt(fromRoblox.Id)
    }
    log('Saved data for', name)
    return BigInt(fromRoblox.Id)
  }

  // TODO: implement this
  /**
   * Maps a Roblox ID to a username
   * @param id The ID of the Roblox user
   * @returns the name of the Roblox user
   */
  async idToName (id: bigint): Promise<string> {
    const existing = await this.GalaxyInfo.prisma.user.findFirst({
      where: {
        id: id
      }
    })
    if (existing) return existing.name

    const fromRoblox = ''
    if (fromRoblox === '') throw new Error('Not implemented')
    try {
      await this.GalaxyInfo.prisma.user.create({
        data: {
          name: fromRoblox,
          id
        }
      })
    } catch {
      log('Already exists')
      return fromRoblox
    }
    log('Saved data for', fromRoblox)
    return fromRoblox
  }
}
