interface SerializedConstants {
  logCodes: Record<string, string>
  items: SerializedItems
}

type SerializedItems = Record<string, SerializedItem>

type SerializedItem = [
  string, // item name
  number // mass
]

export class GameConstants {
  private readonly GalaxyInfo: GalaxyInfo

  logCodes!: Map<bigint, string>
  items!: Map<bigint, Item>

  constructor (GalaxyInfo: GalaxyInfo) {
    this.GalaxyInfo = GalaxyInfo
  }

  async init () {
    try {
      const cache = await this.GalaxyInfo.prisma.keyValue.findUnique({
        where: {
          key: this.GalaxyInfo.config.db.kvKeys.gameConstants
        },
        rejectOnNotFound: true
      }) as any
      this.load(cache.value)
    } catch (error) {
      console.log(error)
    }
  }

  load (constants: SerializedConstants) {
    this.logCodes = new Map()
    for (const [id, logCode] of Object.entries(constants.logCodes)) {
      this.logCodes.set(BigInt(id), logCode)
    }

    this.items = new Map()
    for (const [id, info] of Object.entries(constants.items)) {
      this.items.set(BigInt(id), new Item(info))
    }
  }
}

class Item {
  name: string
  mass: number

  constructor (serialized: SerializedItem) {
    this.name = serialized[0]
    this.mass = serialized[1]
  }
}
