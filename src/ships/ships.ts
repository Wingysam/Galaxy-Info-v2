import type { Turrets, TurretResolvable, Turret } from './turrets'
import type { GalaxyShipClass } from '@prisma/client'

import fuzzyfind from 'fuzzyfind'

import { PERMITS, SPINALS, SPINAL_RELOAD_EXPONENT } from './constants'
import { Weapon, Dps } from './weapon'

export class ShipsNotInitializedError extends Error {}
export class ShipsNotDumpedError extends Error {}
export class ShipNotFoundError extends Error {}

type SerializedShips = { [key: string] : SerializedShip }
type SerializedShip = {
  name: string
  class: GalaxyShipClass
  description?: string
  eventId: number
  permitOverride?: number
  explosionSize: number
  notForSale: boolean
  health: {
    shield: number
    hull: number
  }
  topSpeed: number
  acceleration: number
  turnSpeed: number
  weapons: SerializedShipWeapons
}

type Permit = 'SC Build' | 'Class A' | 'Class B' | 'Class C' | 'Class D' | 'Class E'

type SerializedShipWeapons = {
  spinals: SerializedSpinals
  turrets: TurretResolvable[]
}

type SerializedSpinals = {
  f?: SerializedSpinal
  g?: SerializedSpinal
}
type SerializedSpinal = {
  weaponType: SpinalWeaponType
  weaponSize: SpinalWeaponSize
  interval: number
  guns: SerializedSpinalGun[]
}
type SerializedSpinalGun = {
  barrels: number
}

type SpinalWeaponType = 'Phaser' | 'Cannon' | 'Torpedo'
type SpinalWeaponSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge'

const KV_STORE_KEY = 'ships_dump'
export class Ships {
  private initialized: boolean
  private ships: { [key: string]: Ship }
  private GalaxyInfo: GalaxyInfo
  constructor(GalaxyInfo: GalaxyInfo) {
    this.ships = {}
    this.GalaxyInfo = GalaxyInfo
    this.initialized = false
  }

  async init() {
    try {
      const cache = await this.GalaxyInfo.prisma.keyValue.findUnique({
        where: {
          key: KV_STORE_KEY
        },
        rejectOnNotFound: true
      }) as any
      await this.load(cache.value)
    } catch (e) {
      console.log('Ships database reset.')
    }
    this.initialized = true
  }

  private assertReady() {
    if (!this.initialized) throw new ShipsNotInitializedError('Ships instance has not been initialized; do `await <Ships>.init()` before using it.')
    if (Object.keys(this.ships).length === 0) throw new ShipsNotDumpedError('Ships have not been exported from the game.')
  }

  async save(ships: SerializedShips) {
    await this.GalaxyInfo.prisma.keyValue.upsert({
      create: {
        key: KV_STORE_KEY,
        value: ships
      },
      update: {
        value: ships
      },
      where: {
        key: KV_STORE_KEY
      }
    })
    await this.load(ships)
  }

  private async load(ships: SerializedShips) {
    this.ships = {}
    for (const serializedShip of Object.values(ships)) {
      const ship = new Ship(this.GalaxyInfo.turrets, serializedShip)
      this.ships[ship.name] = ship
    }
  }

  find (name: string) {
    this.assertReady()
    if (this.ships.hasOwnProperty(name)) return this.ships[name]
    const fuzzyfound = fuzzyfind(name, Object.keys(this.ships))[0]
    if (!fuzzyfound) throw new ShipNotFoundError('Could not find a ship with that name.')
    return this.ships[fuzzyfound]
  }

  all () {
    this.assertReady()
    return this.ships
  }
}

class Ship {
  name: string
  class: string
  description: string
  eventId: number
  permit: Permit | null
  explosionSize: number
  notForSale: boolean
  health: { shield: number, hull: number }
  speed: {
    top: number, acceleration: number, turn: number
  }
  weapons: ShipWeapons

  private serializedShip: SerializedShip

  constructor (turrets: Turrets, serializedShip: SerializedShip) {
    this.serializedShip = serializedShip

    this.name = serializedShip.name
    this.class = serializedShip.class
    this.description = serializedShip.description ?? '(no description)'
    this.eventId = serializedShip.eventId
    this.permit = this.calculatePermit()
    this.explosionSize = serializedShip.explosionSize
    this.notForSale = serializedShip.notForSale
    this.health = serializedShip.health

    this.speed = {
      top: serializedShip.topSpeed,
      acceleration: serializedShip.acceleration,
      turn: serializedShip.turnSpeed
    }

    this.weapons = new ShipWeapons(turrets, serializedShip.weapons)
  }

  private calculatePermit() {
    if (!this.eventId) return null
    if (!this.serializedShip.permitOverride) return null
    const id = this.serializedShip.permitOverride.toString() as keyof typeof PERMITS
    if (!(id in PERMITS)) throw new Error(`Unknown permit override: ${id}`)
    const permit = PERMITS[id]
    return permit
  }
}

class ShipWeapons extends Weapon {
  private turrets: ShipTurrets
  private spinals: ShipSpinals
  constructor(turrets: Turrets, serializedShipWeapons: SerializedShipWeapons) {
    super()
    this.turrets = new ShipTurrets(turrets, serializedShipWeapons.turrets)
    this.spinals = new ShipSpinals(serializedShipWeapons.spinals)

    this.alpha.add(this.turrets.alpha)
    this.alpha.add(this.spinals.alpha)
  }
  
  dps(range?: number) {
    const turrets = this.turrets.dps(range)
    const spinals = this.spinals.dps(range)
    return turrets.add(spinals)
  }
}

class ShipTurrets extends Weapon {
  private turrets: Map<Turret, number>
  constructor (turrets: Turrets, turretResolvables: TurretResolvable[]) {
    super()
    this.turrets = new Map()
    for (const turretResolvable of turretResolvables) {
      const turret = turrets.get(turretResolvable)
      this.alpha.add(turret.alpha)
      this.incrementTurret(turret)
    }
  }

  private incrementTurret(turret: Turret) {
    const previous = this.turrets.get(turret) ?? 0
    this.turrets.set(turret, previous + 1)
  }
  
  dps(range?: number) {
    const dps = new Dps()
    for (const [turret, count] of this.turrets) {
      dps.add(turret.dps(range).multiply(count))
    }
    return dps
  }
}

class ShipSpinals extends Weapon {
  spinals: ShipSpinal[]
  constructor(serializedSpinals: SerializedSpinals) {
    super()
    this.spinals = []
    if (serializedSpinals.f) this.spinals.push(new ShipSpinal(serializedSpinals.f))
    if (serializedSpinals.g) this.spinals.push(new ShipSpinal(serializedSpinals.g))
    this.alpha.add(...this.spinals.map(spinal => spinal.alpha))
  }

  dps(range?: number) {
    return new Dps().add(...this.spinals.map(spinal => spinal.dps(range)))
  }
}

class ShipSpinal extends Weapon {
  range: number
  guns: ShipSpinalGun[]

  constructor(serializedSpinal: SerializedSpinal) {
    super()
    this.range = SPINALS[serializedSpinal.weaponType][serializedSpinal.weaponSize].range
    this.guns = []
    for (const gun of serializedSpinal.guns) this.guns.push(new ShipSpinalGun(serializedSpinal, gun))
    this.alpha.add(...this.guns.map(gun => gun.alpha))
  }

  dps(range?: number): Dps {
    if (range && range > this.range) return new Dps()
    return new Dps().add(...this.guns.map(gun => gun.dps()))
  }
}

class ShipSpinalGun extends Weapon {
  private reload: number

  constructor(spinal: SerializedSpinal, gun: SerializedSpinalGun) {
    super()
    const spinalType = SPINALS[spinal.weaponType]
    const spinalSize = spinalType[spinal.weaponSize]

    this.alpha.shield = gun.barrels * spinalSize.damage * spinalType.damageDistribution.shield
    this.alpha.hull = gun.barrels * spinalSize.damage * spinalType.damageDistribution.hull
    this.alpha.max = gun.barrels * spinalSize.damage * spinalType.damageDistribution[spinalType.damageDistribution.ideal]

    this.reload = (spinal.interval * (gun.barrels - 1)) + (spinalSize.reload * (Math.pow(SPINAL_RELOAD_EXPONENT, gun.barrels - 1)))
  }

  dps() {
    return new Dps(this.alpha.shield / this.reload, this.alpha.hull / this.reload)
  }
}