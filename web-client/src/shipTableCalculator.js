import { ClientShips, ClientTurrets, CLASSES } from '@galaxyinfo/ships'

let ships
let turrets

onmessage = async e => {
  if (e.data[0] === 'init') {
    const { serializedShips, serializedTurrets } = e.data[1]

    turrets = new ClientTurrets()
    await turrets.init(serializedTurrets)

    ships = new ClientShips(turrets)
    await ships.init(serializedShips)

    return
  }
  const { range, loyalty } = e.data[1]

  const shipTable = []

  for (const ship of Object.values(ships.all())) {
    if (ship.test) continue
    const dps = ship.weapons.dps(range, loyalty)
    if (dps.average === 0 && !ship.fighters.hasFighters) continue
    shipTable.push({
      Class: ship.nonPlayer ? `${' '.repeat(CLASSES.length)} Non-Player` : `${' '.repeat(CLASSES.indexOf(ship.class))}${ship.class}`,
      name: ship.name,
      limited: ship.notForSale || !!ship.eventId,
      hp: {
        shield: ship.health.shield,
        hull: ship.health.hull,
        combined: ship.health.shield + ship.health.hull
      },
      dps: {
        shield: Math.floor(dps.shield),
        hull: Math.floor(dps.hull),
        average: Math.floor(dps.average),
        fighters: Math.floor(dps.average + ship.fighters.dps().average)
      },
      alpha: Math.floor(ship.weapons.alpha(range, loyalty).max),
      speed: {
        top: ship.speed.top,
        acceleration: ship.speed.acceleration,
        turn: ship.speed.turn.toFixed(2)
      }
    })
  }

  postMessage(shipTable)
}