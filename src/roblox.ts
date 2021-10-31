import _ from 'lodash'

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
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
    const existing = await this.GalaxyInfo.prisma.users.findUnique({
      where: {
        name
      }
    })
    if (existing) return existing.id

    const fromRoblox = BigInt(_.random(1, 1000000))
    try {
      await this.GalaxyInfo.prisma.users.create({
        data: {
          name,
          id: fromRoblox
        }
      })
    } catch {
      log('Already exists')
      return fromRoblox
    }
    log('Saved data for', name)
    return fromRoblox
  }

  /**
   * Maps a Roblox ID to a username
   * @param id The ID of the Roblox user
   * @returns the name of the Roblox user
   */
  async idToName (id: bigint): Promise<string> {
    const existing = await this.GalaxyInfo.prisma.users.findFirst({
      where: {
        id: id
      }
    })
    if (existing) return existing.name

    const fromRoblox = 'a'
    try {
      await this.GalaxyInfo.prisma.users.create({
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
