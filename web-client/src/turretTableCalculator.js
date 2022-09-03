import { ClientTurrets } from '@galaxyinfo/ships'

const GROUPS = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Alien'
]

let turrets

onmessage = async e => {
  if (e.data[0] === 'init') {
    const { serializedTurrets } = e.data[1]

    turrets = new ClientTurrets()
    await turrets.init(serializedTurrets)

    return
  }
  const { range, loyalty, absoluteVelocity, test } = e.data[1]

  const turretTable = []

  for (const turret of Object.values(turrets.all())) {
    if (turret.test !== test) continue
    const dps = turret.dps(range, loyalty)
    if (dps.average === 0) continue
    turretTable.push({
      Group: `${' '.repeat(GROUPS.indexOf(turret.group))}${turret.group}`,
      name: turret.name,
      reload: turret.reload.toFixed(2),
      range: Math.floor(turret.range),
      size: turret.size,
      turretClass: turret.turretClass,
      dps: {
        shield: Math.floor(dps.shield),
        hull: Math.floor(dps.hull),
        average: Math.floor(dps.average),
      },
      alpha: Math.floor(turret.alpha(range, loyalty).max),
      accuracyDeviation: `${(turret.accuracyDeviation(absoluteVelocity) * 100).toFixed(2)}`
    })
  }

  postMessage(turretTable)
}