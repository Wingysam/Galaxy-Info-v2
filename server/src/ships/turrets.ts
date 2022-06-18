import { DAMAGE_TYPE_DISTRIBUTIONS, TURRET_CLASS_DAMAGE_DISTRIBUTIONS } from './constants'
import { Alpha, Dps, Weapon } from './weapon'

export type TurretResolvable = string

export class TurretsNotInitializedError extends Error {}
export class TurretsNotDumpedError extends Error {}
export class TurretNotFoundError extends Error {}

type SerializedTurrets = { [key: string]: SerializedTurret }
type SerializedTurret = {
  Name: string,
  Damage: number,
  Reload: number
  Range: number,
  Class: TurretClass,
  Group: TurretGroup,
  BeamSize: number,
  BaseAccuracy: number,
  SpeedDenominator: number
}
type TurretClass = 'Mining' | 'Laser' | 'Railgun' | 'Flak' | 'Cannon' | 'PDL'
type TurretGroup = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Alien'

const KV_STORE_KEY = 'turrets_dump'
export class Turrets {
  private turrets: { [key: string]: Turret }
  private initialized: boolean
  private GalaxyInfo: GalaxyInfo
  constructor(GalaxyInfo: GalaxyInfo) {
    this.turrets = {}
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
      console.log('Turrets database reset.')
    }
    this.initialized = true
  }

  private assertReady() {
    if (!this.initialized) throw new TurretsNotInitializedError('Turrets instance has not been initialized; do `await <Turrets>.init()` before using it.')
    if (Object.keys(this.turrets).length === 0) throw new TurretsNotDumpedError('Turrets have not been exported from the game.')
  }

  async save(serializedTurrets: SerializedTurrets) {
    await this.GalaxyInfo.prisma.keyValue.upsert({
      create: {
        key: KV_STORE_KEY,
        value: serializedTurrets
      },
      update: {
        value: serializedTurrets
      },
      where: {
        key: KV_STORE_KEY
      }
    })
    await this.load(serializedTurrets)
  }

  async load(serializedTurrets: SerializedTurrets) {
    for (const serializedTurret of Object.values(serializedTurrets)) {
      const turret = new Turret(serializedTurret)
      this.turrets[turret.name] = turret
    }
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

  private _alpha: Alpha

  constructor (serializedTurret: SerializedTurret) {
    super()
    const damageDistribution =
      serializedTurret.Group === 'Alien'
        ? DAMAGE_TYPE_DISTRIBUTIONS.Plasma
        : TURRET_CLASS_DAMAGE_DISTRIBUTIONS[serializedTurret.Class]

    this._alpha = new Alpha(
      serializedTurret.Damage * damageDistribution.shield,
      serializedTurret.Damage * damageDistribution.hull,
      serializedTurret.Damage * damageDistribution[damageDistribution.ideal]
    )

    this.name = serializedTurret.Name
    this.range = serializedTurret.Range
    this.reload = serializedTurret.Reload
  }

  alpha(range?: number, loyalty = 0) {
    if (range && range > this.range) return new Alpha()
    return new Alpha().add(this._alpha).multiply(1 + loyalty)
  }

  dps(range?: number, loyalty = 0) {
    const alphaAtRange = this.alpha(range)
    return new Dps(alphaAtRange.shield / this.reload, alphaAtRange.hull / this.reload).multiply(1 + loyalty)
  }
}