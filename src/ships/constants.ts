const DAMAGE_TYPE_DISTRIBUTIONS = { // verified in StructureHealth 2022-03-19
  Laser: { shield: 1, hull: 0.3, ideal: 'shield' },
  Kinetic: { shield: 0.4, hull: 1, ideal: 'hull' },
  Plasma: { shield: 1, hull: 0.7, ideal: 'shield' },
  Missile: { shield: 0.7, hull: 1, ideal: 'hull' }
} as const

const TURRET_CLASS_DAMAGE_DISTRIBUTIONS = { // verified in StructureHealth 2022-03-19
  Mining: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
  Laser: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
  Railgun: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
  Flak: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
  Cannon: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
  PDL: DAMAGE_TYPE_DISTRIBUTIONS.Laser
} as const

const SPINALS = {
  Phaser: { // https://canary.discord.com/channels/204965774618656769/753714180900519937/839169257996681257
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
    Tiny: { damage: 30, reload: .7, range: 4500, velocity: 5000 },
    Small: { damage: 45, reload: 1, range: 4750, velocity: 4500 },
    Medium: { damage: 70, reload: 1.8, range: 5000, velocity: 4000 },
    Large: { damage: 140, reload: 2.5, range: 5250, velocity: 3500 },
    Huge: { damage: 210, reload: 3.6, range: 5500, velocity: 3000}
  },
  Cannon: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
    Tiny: { damage: 33, reload: 1.5, range: 5500, velocity: 3000 },
    Small: { damage: 50, reload: 1.8, range: 5750, velocity: 2800 },
    Medium: { damage: 77, reload: 3, range: 6000, velocity: 2600 },
    Large: { damage: 154, reload: 4.1, range: 6250, velocity: 2400 },
    Huge: { damage: 231, reload: 6, range: 6500, velocity: 2200 }
  },
  Torpedo: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Missile,
    Tiny: { damage: 125, reload: 4, range: 8000, velocity: 700 },
    Small: { damage: 250, reload: 5.5, range: 9000, velocity: 600 },
    Medium: { damage: 500, reload: 6.5, range: 10000, velocity: 500 },
    Large: { damage: 750, reload: 8, range: 11000, velocity: 400 },
    Huge: { damage: 1000, reload: 10, range: 12000, velocity: 300 }
  }
} as const

const SPINAL_RELOAD_EXPONENT = 1.1 as const

const PERMITS = {
  '37': 'SC Build',
  '38': 'Class A',
  '39': 'Class B',
  '40': 'Class C',
  '41': 'Class D',
  '42': 'Class E'
} as const

export { DAMAGE_TYPE_DISTRIBUTIONS, TURRET_CLASS_DAMAGE_DISTRIBUTIONS, SPINALS, SPINAL_RELOAD_EXPONENT, PERMITS }