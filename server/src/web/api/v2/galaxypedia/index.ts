import { RESISTANCE, type Ship, type TurretClass, type TurretSize, type ShipSpinal, type ShipSpinalGun } from '@galaxyinfo/ships'
import { Router } from 'express'
import { firstBy } from 'thenby'
import { scope } from '../../../middleware/scope'
interface Arg {
  GalaxyInfo: GalaxyInfo
}

function formatShip (ship: Ship) {
  const dps = {
    turret: ship.weapons.turrets.dps().average,
    spinal: ship.weapons.spinals.dps().average,
    fighters: {
      turret: 0,
      spinal: 0
    }
  }

  const fighterList = []

  for (const [fighter, count] of ship.fighters.fighters.entries()) {
    dps.fighters.turret += fighter.weapons.turrets.dps().multiply(count).average
    dps.fighters.spinal += fighter.weapons.spinals.dps().multiply(count).average

    fighterList.push(`${count} ${fighter.name}`)
  }

  const turretsSortedByRange = Array.from(ship.weapons.turrets.turrets.keys()).sort(firstBy('range', -1))

  function formatNumberOrUndefined (num: number | undefined) {
    if (typeof num !== 'number') return
    const floor = Math.floor(num)
    if (floor === 0) return
    return floor.toLocaleString()
  }

  const result = {
    title: ship.name,
    shields: ship.health.shield.toLocaleString(),
    hull: ship.health.hull.toLocaleString(),
    top_speed: ship.speed.top,
    acceleration: ship.speed.acceleration,
    turn_speed: ship.speed.turn.toFixed(2),
    tiny_turrets: turretList('Tiny'),
    small_turrets: turretList('Small'),
    med_turrets: turretList('Medium'),
    large_turrets: turretList('Large'),
    huge_turrets: turretList('Huge'),
    m_class_range: formatNumberOrUndefined(turretsSortedByRange[0]?.range),
    r_class_range: formatNumberOrUndefined(turretsSortedByRange[turretsSortedByRange.length - 1]?.range),
    mining_lasers: turretList('All', 'Mining'),
    mining_range: turretsSortedByRange.filter(turret => turret.turretClass === 'Mining')[0]?.range,
    fighters: fighterList.join('\n') || undefined,
    cargo_hold: formatNumberOrUndefined(ship.cargoHold),
    ore_hold: formatNumberOrUndefined(ship.oreHold),
    warp_drive: ship.canWarp ? 'Yes' : 'No',
    damage_res: `${Math.round(RESISTANCE[ship.class] * 100)}%`,
    stealth: ship.stealth ? 'Yes' : 'No',
    cmax_drift: typeof ship.customDrift === 'number' ? `${Math.round(ship.customDrift * 100)}%` : undefined,
    turret_dps: Math.floor(dps.turret) || undefined,
    spinal_dps: Math.floor(dps.spinal) || undefined,
    fighter_turret_dps: Math.floor(dps.fighters.turret) || undefined,
    fighter_spinal_dps: Math.floor(dps.fighters.spinal) || undefined,
    antimatter_shard: ship.extraMaterials['16'],
    data_archive: ship.extraMaterials['17'],
    ascension_crystal: ship.extraMaterials['18'],
    space_pumpkin: ship.extraMaterials['22'],
    ghost_pumpkin: ship.extraMaterials['26'],
    gamma_pumpkin: ship.extraMaterials['30'],
    void_pumpkin: ship.extraMaterials['32'],
    forgotten_soul: ship.extraMaterials['52'],
    soul: ship.extraMaterials['51'],
    embryo: ship.extraMaterials['49'],
    preos_bit: ship.extraMaterials['50'],
    snowflake: ship.extraMaterials['23'],
    weapons_part: ship.extraMaterials['27'],
    alien_device: ship.extraMaterials['25'],
    alien_parts: ship.extraMaterials['24'],
    stealth_plating: ship.extraMaterials['56'],
    plasma_batteries: ship.extraMaterials['34'],
    thrust_component: ship.extraMaterials['33'],
    armored_plating: ship.extraMaterials['35'],
    dimensional_alloy: ship.extraMaterials['36'],
    quantum_core: ship.extraMaterials['43'],
    kneall_core: ship.extraMaterials['45'],
    luci_core: ship.extraMaterials['61'],
    permit: ship.permit ?? undefined,
    description: ship.description,
    vip_required: ship.vip ? 'Yes' : 'No',
    explosion_radius: ship.explosionSize.toLocaleString()
  } as any

  function turretList (size: TurretSize | 'All', turretClass?: TurretClass) {
    const list = []
    for (const [turret, count] of ship.weapons.turrets.turrets.entries()) {
      if (size !== 'All' && turret.size !== size) continue
      if (turretClass && turret.turretClass !== turretClass) continue
      list.push(`${count} ${turret.name}`)
    }
    return list.join('\n\n') || undefined
  }

  function formatSpinal (spinal: ShipSpinal) {
    return spinal.guns.map(formatSpinalGun).join('\n')
  }
  function formatSpinalGun (gun: ShipSpinalGun) {
    return `${gun.barrels} ${gun.weaponSize} ${gun.weaponType}`
  }

  for (const [i, spinal] of ship.weapons.spinals.spinals.entries()) {
    result[`spinal_${i + 1}`] = formatSpinal(spinal)
  }

  return result
}

export async function galaxypedia ({ GalaxyInfo }: Arg) {
  const router = Router()

  router.get('/', scope('galaxypedia'), async (_req, res) => {
    const ships = GalaxyInfo.ships.all({ secret: false })
    const result: any = {}
    for (const ship of Object.values(ships).map(formatShip)) {
      result[ship.title] = ship
    }
    res.send(result)
  })

  router.get('/:ship', scope('galaxypedia'), async (req, res) => {
    const ship = GalaxyInfo.ships.get(req.params.ship)
    res.send(formatShip(ship))
  })

  return router
}
