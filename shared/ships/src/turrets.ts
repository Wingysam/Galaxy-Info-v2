import { DAMAGE_TYPE_DISTRIBUTIONS, TURRET_CLASS_DAMAGE_DISTRIBUTIONS } from './constants'
import { Alpha, Dps, Weapon } from './weapon'

export type TurretResolvable = string

export class TurretsNotInitializedError extends Error {}
export class TurretsNotDumpedError extends Error {}
export class TurretNotFoundError extends Error {}

export type SerializedTurrets = { [key: string]: SerializedTurret }
export type SerializedTurret = {
  Name: string,
  Damage: number,
  Reload: number
  Range: number,
  Class: TurretClass,
  Group: TurretGroup,
  BeamSize: number,
  BaseAccuracy: number,
  SpeedDenominator: number,
  TurretSize: TurretSize
}
export type TurretClass = 'Mining' | 'Laser' | 'Railgun' | 'Flak' | 'Cannon' | 'PDL' | 'Beam'
export type TurretSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge'
export type TurretGroup = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Alien' | 'Test' | 'Modelers'

export class Turrets {
  private turrets: { [key: string]: Turret }
  private initialized: boolean
  constructor() {
    this.turrets = {}
    this.initialized = false
  }

  private assertReady() {
    if (!this.initialized) throw new TurretsNotInitializedError('Turrets instance has not been initialized; do `await <Turrets>.init()` before using it.')
    if (Object.keys(this.turrets).length === 0) throw new TurretsNotDumpedError('Turrets have not been exported from the game.')
  }

  async load(serializedTurrets: SerializedTurrets) {
    for (const serializedTurret of Object.values(serializedTurrets)) {
      const turret = new Turret(serializedTurret)
      this.turrets[turret.name] = turret
    }
    this.initialized = true
  }

  get(turretName: TurretResolvable) {
    this.assertReady()
    if (!this.turrets.hasOwnProperty(turretName)) throw new TurretNotFoundError(`Could not find turret called ${turretName}.`)
    return this.turrets[turretName]
  }

  all() {
    this.assertReady()
    return this.turrets
  }
}

export type { Turret }
class Turret extends Weapon {
  name: string
  reload: number
  range: number
  group: TurretGroup
  size: TurretSize
  turretClass: TurretClass
  baseAccuracy: number
  trackingAccuracy: number
  test: Boolean
  
  private _alpha: Alpha
  private affectedByLoyalty: boolean

  constructor (serializedTurret: SerializedTurret) {
    super()
    const damageDistribution =
      serializedTurret.Group === 'Alien'
        ? DAMAGE_TYPE_DISTRIBUTIONS.Plasma
        : TURRET_CLASS_DAMAGE_DISTRIBUTIONS[serializedTurret.Class]

    if (!damageDistribution) throw new Error(`Unknown turret class ${serializedTurret.Class}`)

    this._alpha = new Alpha(
      serializedTurret.Damage * damageDistribution.shield,
      serializedTurret.Damage * damageDistribution.hull,
      serializedTurret.Damage * damageDistribution[damageDistribution.ideal]
    )

    this.name = serializedTurret.Name
    this.range = serializedTurret.Range
    this.reload = serializedTurret.Reload
    this.group = serializedTurret.Group
    this.size = serializedTurret.TurretSize
    this.turretClass = serializedTurret.Class
    this.baseAccuracy = serializedTurret.BaseAccuracy
    this.trackingAccuracy = serializedTurret.SpeedDenominator
    this.test = ['Test', 'Modelers'].includes(this.group)
    
    this.affectedByLoyalty = !['Mining'].includes(serializedTurret.Class)
  }

  alpha(range?: number, loyalty = 0) {
    if (!this.affectedByLoyalty) loyalty = 0
    if (range && range > this.range) return new Alpha()
    return new Alpha().add(this._alpha).multiply(1 + loyalty)
  }

  dps(range?: number, loyalty = 0) {
    const alphaAtRange = this.alpha(range, loyalty)
    return new Dps(alphaAtRange.shield / this.reload, alphaAtRange.hull / this.reload)
  }

  accuracyDeviation(absoluteVelocity: number) {
    if (this.size === 'Large' && absoluteVelocity > 80) absoluteVelocity *= 1 + (absoluteVelocity - 80) * 0.003
    if (this.size === 'Medium' && absoluteVelocity > 120) absoluteVelocity *= 1 + (absoluteVelocity - 120) * 0.003
    if (this.size === 'Small' && absoluteVelocity > 170) absoluteVelocity *= 1 + (absoluteVelocity - 170) * 0.003
    return this.baseAccuracy + (absoluteVelocity / this.trackingAccuracy)
  }
}

export class ClientTurrets extends Turrets {
  constructor() {
    super()
  }

  async init (turrets: SerializedTurrets) {
    await super.load(turrets)
  }
}

export class ServerTurrets extends Turrets {
  private GalaxyInfo: GalaxyInfo

  constructor(GalaxyInfo: GalaxyInfo) {
    super()
    this.GalaxyInfo = GalaxyInfo
  }

  async init() {
    try {
      const cache = await this.GalaxyInfo.prisma.keyValue.findUnique({
        where: {
          key: this.GalaxyInfo.config.db.kvKeys.serializedTurrets
        },
        rejectOnNotFound: true
      }) as any
      await this.load(cache.value)
    } catch (e) {
      console.log('Turrets database reset.', e)
    }
  }

  async save(serializedTurrets: SerializedTurrets) {
    await this.GalaxyInfo.prisma.keyValue.upsert({
      create: {
        key: this.GalaxyInfo.config.db.kvKeys.serializedTurrets,
        value: serializedTurrets
      },
      update: {
        value: serializedTurrets
      },
      where: {
        key: this.GalaxyInfo.config.db.kvKeys.serializedTurrets
      }
    })
    await this.load(serializedTurrets)
  }
}