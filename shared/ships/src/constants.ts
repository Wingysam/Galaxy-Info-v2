const CLASSES = [
  'Miner',
  'Freighter',
  'Frigate',
  'Destroyer',
  'Cruiser',
  'Battlecruiser',
  'Battleship',
  'Dreadnought',
  'Carrier',
  'Super Capital',
  'Fighter',
  'Titan',
  'Alien',
  'Admin'
] as const

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

// verified in SpinalData 2023-03-18
const SPINALS = {
  Phaser: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
    Tiny: { damage: 28, reload: .8, range: 3000, velocity: 5000 },
    Small: { damage: 40, reload: 1, range: 4000, velocity: 4500 },
    Medium: { damage: 72, reload: 1.6, range: 5000, velocity: 4000 },
    Large: { damage: 120, reload: 2.4, range: 6000, velocity: 3500 },
    Huge: { damage: 198, reload: 3.6, range: 6500, velocity: 3000}
  },
  Cannon: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
    Tiny: { damage: 40, reload: 1.6, range: 3000, velocity: 3000 },
    Small: { damage: 60, reload: 2, range: 4000, velocity: 2800 },
    Medium: { damage: 112, reload: 3.2, range: 5000, velocity: 2600 },
    Large: { damage: 160, reload: 4, range: 6000, velocity: 2400 },
    Huge: { damage: 270, reload: 6, range: 6500, velocity: 2200 }
  },
  Torpedo: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Missile,
    Tiny: { damage: 200, reload: 5, range: 5000, velocity: 700 },
    Small: { damage: 330, reload: 6, range: 6000, velocity: 600 },
    Medium: { damage: 490, reload: 7, range: 7000, velocity: 500 },
    Large: { damage: 680, reload: 8, range: 9000, velocity: 400 },
    Huge: { damage: 900, reload: 9, range: 10000, velocity: 300 }
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

const RESISTANCE = {
  Fighter: 0,
  Frigate: .2,
  Destroyer: .25,
  Cruiser: .3,
  Battlecruiser: .4,
  Battleship: .45,
  Dreadnought: .5,
  Carrier: .55,
  'Super Capital': .65,
  Titan: .7,
  Miner: .3,
  Freighter: .1,
  Alien: .3,
  Admin: .9
} as const

const LOYALTY_REQUIREMENTS = {
  Fighter: 0,
  Frigate: 0,
  Destroyer: 0,
  Cruiser: 0,
  Battlecruiser: .03,
  Battleship: .05,
  Dreadnought: .07,
  Carrier: .09,
  'Super Capital': .11,
  Titan: 0,
  Miner: 0,
  Freighter: 0,
  Alien: 0,
  Admin: 0
} as const

const BASE_REQUIREMENTS = {
  Fighter: 1,
  Frigate: 1,
  Destroyer: 1,
  Cruiser: 1,
  Battlecruiser: 1,
  Battleship: 1,
  Dreadnought: 2,
  Carrier: 2,
  'Super Capital': 3,
  Titan: 1,
  Miner: 1,
  Freighter: 1,
  Alien: 1,
  Admin: 1
} as const

const BUILD_MENU_CLASSES = [
  'Miner',
  'Freighter',
  'Frigate',
  'Destroyer',
  'Cruiser',
  'Battlecruiser',
  'Battleship',
  'Dreadnought',
  'Carrier',
  'Super Capital'
] as const

const CLAMPS = {
  turnSpeed: [.1, .9],
  topSpeed: [45, 380],
  acceleration: [5, 50]
} as const

const NON_LIMITED_QUEST_SHIPS = [
  'Nightmare',
  'Atheon',
  'Zhen',
  'Helios',
  'Imperator',
  'Osiris',
  'Slipstream'
]

export { CLASSES, DAMAGE_TYPE_DISTRIBUTIONS, TURRET_CLASS_DAMAGE_DISTRIBUTIONS, SPINALS, SPINAL_RELOAD_EXPONENT, PERMITS, RESISTANCE, LOYALTY_REQUIREMENTS, BASE_REQUIREMENTS, BUILD_MENU_CLASSES, CLAMPS, NON_LIMITED_QUEST_SHIPS }