import type { Turrets, TurretResolvable, Turret } from './turrets'

import fuzzyfind from 'fuzzyfind'

import { CLASSES, PERMITS, SPINALS, SPINAL_RELOAD_EXPONENT } from './constants'
import { Weapon, Dps, Alpha } from './weapon'

export class ShipsNotInitializedError extends Error {}
export class ShipsNotDumpedError extends Error {}
export class ShipNotFoundError extends Error {}

type SerializedShips = { [key: string] : SerializedShip }
type SerializedShip = {
  name: string
  class: typeof CLASSES[number]
  description?: string
  eventId: number
  permitOverride?: number
  explosionSize: number
  notForSale: boolean
  cargoHold: number
  oreHold: number
  secret: boolean
  health: {
    shield: number
    hull: number
  }
  topSpeed: number
  acceleration: number
  turnSpeed: number
  weapons: SerializedShipWeapons,
  fighters: string[]
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
  reloadOverride?: number
  guns: SerializedSpinalGun[]
}
type SerializedSpinalGun = {
  barrels: number
}

type SpinalWeaponType = 'Phaser' | 'Cannon' | 'Torpedo'
type SpinalWeaponSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge'

function log (...args: any) {
  console.log('[Ships]', ...args)
}


const KV_STORE_KEY = 'ships_dump'
export class Ships {
  private initialized: boolean
  private ships: { [key: string]: Ship }
  private turrets: Turrets
  constructor(turrets: Turrets) {
    this.ships = {}
    this.turrets = turrets
    this.initialized = false
  }

  private assertReady() {
    if (!this.initialized) throw new ShipsNotInitializedError('Ships instance has not been initialized; do `await <Ships>.init()` before using it.')
    if (Object.keys(this.ships).length === 0) throw new ShipsNotDumpedError('Ships have not been exported from the game.')
  }

  async load(ships: SerializedShips) {
    this.ships = {}
    await this.loadShips(ships, this.turrets, true)
    await this.loadShips(ships, this.turrets, false)
    this.initialized = true
  }

  private async loadShips(ships: SerializedShips, turrets: Turrets, fighters: boolean) {
    for (const serializedShip of Object.values(ships)) {
      try {
        if (!fighters && serializedShip.class === 'Fighter') continue
        if (fighters && serializedShip.class !== 'Fighter') continue
        const ship = new Ship(this.ships, turrets, serializedShip)
        this.ships[ship.name] = ship
      } catch {} // missing turret or something
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

export class Ship {
  name: string
  class: typeof CLASSES[number]
  description: string
  eventId: number
  permit: Permit | null
  explosionSize: number
  notForSale: boolean
  cargoHold: number
  oreHold: number
  secret: boolean
  health: { shield: number, hull: number }
  speed: {
    top: number, acceleration: number, turn: number
  }
  weapons: ShipWeapons
  fighters: ShipFighters

  private serializedShip: SerializedShip

  constructor (ships: { [key: string]: Ship }, turrets: Turrets, serializedShip: SerializedShip) {
    this.serializedShip = serializedShip

    this.name = serializedShip.name
    this.class = serializedShip.class
    this.description = serializedShip.description ?? '(no description)'
    this.eventId = serializedShip.eventId
    this.permit = this.calculatePermit()
    this.explosionSize = serializedShip.explosionSize
    this.notForSale = serializedShip.notForSale
    this.cargoHold = serializedShip.cargoHold
    this.oreHold = serializedShip.oreHold
    this.secret = serializedShip.secret
    this.health = serializedShip.health

    this.speed = {
      top: serializedShip.topSpeed,
      acceleration: serializedShip.acceleration,
      turn: serializedShip.turnSpeed
    }

    this.weapons = new ShipWeapons(turrets, serializedShip.weapons)
    this.fighters = new ShipFighters(ships, serializedShip.fighters)
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

export class ShipWeapons extends Weapon {
  turrets: ShipTurrets
  spinals: ShipSpinals
  constructor(turrets: Turrets, serializedShipWeapons: SerializedShipWeapons) {
    super()
    this.turrets = new ShipTurrets(turrets, serializedShipWeapons.turrets)
    this.spinals = new ShipSpinals(serializedShipWeapons.spinals)
  }

  alpha (range?: number, loyalty = 0) {
    const turrets = this.turrets.alpha(range, loyalty)
    const spinals = this.spinals.alpha(range)
    return turrets.add(spinals)
  }
  
  dps(range?: number, loyalty = 0) {
    const turrets = this.turrets.dps(range, loyalty)
    const spinals = this.spinals.dps(range)
    return turrets.add(spinals)
  }
}

export class ShipTurrets extends Weapon {
  turrets: Map<Turret, number>
  constructor (turrets: Turrets, turretResolvables: TurretResolvable[]) {
    super()
    this.turrets = new Map()
    for (const turretResolvable of turretResolvables) {
      const turret = turrets.get(turretResolvable)
      this.incrementTurret(turret)
    }
  }

  private incrementTurret(turret: Turret) {
    const previous = this.turrets.get(turret) ?? 0
    this.turrets.set(turret, previous + 1)
  }

  alpha(range?: number, loyalty = 0) {
    const alpha = new Alpha()
    for (const [turret, count] of this.turrets) {
      alpha.add(turret.alpha(range).multiply(count).multiply(1 + loyalty))
    }
    return alpha
  }
  
  dps(range?: number, loyalty = 0) {
    const dps = new Dps()
    for (const [turret, count] of this.turrets) {
      dps.add(turret.dps(range).multiply(count).multiply(1 + loyalty))
    }
    return dps
  }
}

export class ShipSpinals extends Weapon {
  private spinals: ShipSpinal[]
  f?: ShipSpinal
  g?: ShipSpinal

  constructor(serializedSpinals: SerializedSpinals) {
    super()
    this.spinals = []
    if (serializedSpinals.f) {
      this.f = new ShipSpinal(serializedSpinals.f)
      this.spinals.push(this.f)
    }
    if (serializedSpinals.g) {
      this.g = new ShipSpinal(serializedSpinals.g)
      this.spinals.push(this.g)
    }
  }

  alpha(range?: number) {
    return new Alpha().add(...this.spinals.map(spinal => spinal.alpha(range)))
  }

  dps(range?: number) {
    return new Dps().add(...this.spinals.map(spinal => spinal.dps(range)))
  }
}

export class ShipSpinal extends Weapon {
  range: number
  reload: number
  barrels: number
  weaponSize: SpinalWeaponSize
  weaponType: SpinalWeaponType
  private guns: ShipSpinalGun[]

  constructor(serializedSpinal: SerializedSpinal) {
    super()
    this.range = SPINALS[serializedSpinal.weaponType][serializedSpinal.weaponSize].range
    this.guns = []
    for (const gun of serializedSpinal.guns) this.guns.push(new ShipSpinalGun(serializedSpinal, gun))

    this.weaponSize = serializedSpinal.weaponSize
    this.weaponType = serializedSpinal.weaponType

    this.barrels = 0
    let biggestGun = this.guns[0]
    for (const gun of this.guns) {
      this.barrels += gun.barrels
      if (gun.barrels > biggestGun.barrels) biggestGun = gun
    }

    if (serializedSpinal.reloadOverride) {
      this.reload = (serializedSpinal.interval * (biggestGun.barrels - 1)) + serializedSpinal.reloadOverride
    } else {
      this.reload = biggestGun.reload
    }
  }

  alpha(range?: number) {
    if (range && range > this.range) return new Alpha()
    return new Alpha().add(...this.guns.map(gun => gun.alpha()))
  }

  dps(range?: number) {
    const alphaAtRange = this.alpha(range)
    return new Dps(alphaAtRange.shield / this.reload, alphaAtRange.hull / this.reload)
  }
}

export class ShipSpinalGun extends Weapon {
  reload: number
  barrels: number

  private _alpha: Alpha

  constructor(spinal: SerializedSpinal, gun: SerializedSpinalGun) {
    super()
    const spinalType = SPINALS[spinal.weaponType]
    const spinalSize = spinalType[spinal.weaponSize]

    this._alpha = new Alpha(
      gun.barrels * spinalSize.damage * spinalType.damageDistribution.shield,
      gun.barrels * spinalSize.damage * spinalType.damageDistribution.hull,
      gun.barrels * spinalSize.damage * spinalType.damageDistribution[spinalType.damageDistribution.ideal]
    )

    this.reload = (spinal.interval * (gun.barrels - 1)) + (spinalSize.reload * (Math.pow(SPINAL_RELOAD_EXPONENT, gun.barrels - 1)))
    this.barrels = gun.barrels
  }

  alpha() {
    return new Alpha().add(this._alpha)
  }

  dps() {
    return new Dps(this._alpha.shield / this.reload, this._alpha.hull / this.reload)
  }
}

export class ShipFighters extends Weapon {
  fighters: Map<Ship, number>
  hasFighters: boolean

  constructor(ships: { [key: string]: Ship }, fighterNames: string[]) {
    super()

    this.hasFighters = false

    this.fighters = new Map()
    for (const fighterName of fighterNames) {
      try {
        const fighter = ships[fighterName]
        if (!fighter) continue
        this.incrementFighter(fighter)
        this.hasFighters = true
      } catch (error) { log(error) }
    }
  }

  private incrementFighter(fighter: Ship) {
    const previous = this.fighters.get(fighter) ?? 0
    this.fighters.set(fighter, previous + 1)
  }

  alpha(range?: number, loyalty = 0) {
    const alpha = new Alpha()
    for (const [fighter, count] of this.fighters) {
      alpha.add(fighter.weapons.alpha(range, loyalty).multiply(count))
    }
    return alpha
  }
  
  dps(range?: number, loyalty = 0) {
    const dps = new Dps()
    for (const [fighter, count] of this.fighters) {
      dps.add(fighter.weapons.dps(range, loyalty).multiply(count))
    }
    return dps
  }
}

export class ClientShips extends Ships {
  constructor(turrets: Turrets) {
    super(turrets)
  }

  async init(ships: SerializedShips) {
    await super.load(ships)
  }
}

export class ServerShips extends Ships {
  private GalaxyInfo: GalaxyInfo
  constructor(GalaxyInfo: GalaxyInfo) {
    super(GalaxyInfo.turrets)
    this.GalaxyInfo = GalaxyInfo
  }

  async init() {
    try {
      const cache = await this.GalaxyInfo.prisma.keyValue.findUnique({
        where: {
          key: KV_STORE_KEY
        },
        rejectOnNotFound: true
      }) as any
      await super.load(cache.value)
    } catch (error) {
      log('Ships database reset.', error)
    }
    log('Initialized')
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
    await super.load(ships)
  }
}