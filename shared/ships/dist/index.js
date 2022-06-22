var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/fuzzyfind/search.js
var require_search = __commonJS({
  "node_modules/fuzzyfind/search.js"(exports, module2) {
    module2.exports = function search(haystack) {
      haystack = haystack.toLowerCase();
      var self = {
        for: function(needle) {
          var foundIndex = 0;
          var result = { found: true };
          needle = needle.toLowerCase();
          var needleLength = needle.length;
          for (var i = 0; i < needleLength; i++) {
            foundIndex = haystack.indexOf(needle[i], foundIndex);
            if (foundIndex === -1) {
              return { found: false };
            }
            if (i == 0)
              result.start = foundIndex;
          }
          result.end = foundIndex + 1;
          return result;
        }
      };
      return self;
    };
  }
});

// node_modules/fuzzyfind/generateGrams.js
var require_generateGrams = __commonJS({
  "node_modules/fuzzyfind/generateGrams.js"(exports, module2) {
    module2.exports = function generateGrams(word, precision) {
      var wordLength = word.length;
      var smallestGram = Math.ceil(wordLength * precision) || 1;
      var grams = [];
      var gramLength = wordLength;
      while (gramLength >= smallestGram) {
        var end = wordLength - gramLength;
        for (var start = 0; start <= end; start++) {
          var gram = word.substr(start, gramLength);
          if (grams.indexOf(gram) === -1)
            grams.push(gram);
        }
        gramLength--;
      }
      return grams;
    };
  }
});

// node_modules/fuzzyfind/index.js
var require_fuzzyfind = __commonJS({
  "node_modules/fuzzyfind/index.js"(exports, module2) {
    var search = require_search();
    var generateGrams = require_generateGrams();
    module2.exports = function fuzzyfind2(input, collection, options) {
      if (typeof input !== "string" || input === "") {
        return collection;
      }
      options = options || {};
      var accessor = options.accessor || function(item) {
        return item;
      };
      var precision = options.precision === void 0 ? 1 : options.precision;
      var suggestions = [];
      var grams = generateGrams(input, precision);
      collection.forEach(function(item) {
        var searchableItem = accessor(item);
        grams.find(function(gram) {
          var match = search(searchableItem).for(gram);
          if (match.found) {
            suggestions.push({
              gram,
              length: match.end - match.start,
              start: match.start,
              searchableItem,
              item
            });
          }
          return match.found;
        });
      });
      return suggestions.sort(function(a, b) {
        if (a.gram.length !== b.gram.length) {
          return b.gram.length - a.gram.length;
        }
        if (a.length !== b.length) {
          return a.length - b.length;
        }
        if (a.start !== b.start) {
          return a.start - b.start;
        }
        if (a.searchableItem > b.searchableItem) {
          return 1;
        }
        if (a.searchableItem < b.searchableItem) {
          return -1;
        }
        return 0;
      }).map(function(item) {
        return item.item;
      });
    };
  }
});

// src/index.ts
__export(exports, {
  Alpha: () => Alpha,
  BUILD_MENU_CLASSES: () => BUILD_MENU_CLASSES,
  CLAMPS: () => CLAMPS,
  CLASSES: () => CLASSES,
  ClientShips: () => ClientShips,
  ClientTurrets: () => ClientTurrets,
  DAMAGE_TYPE_DISTRIBUTIONS: () => DAMAGE_TYPE_DISTRIBUTIONS,
  Dps: () => Dps,
  LOYALTY_REQUIREMENTS: () => LOYALTY_REQUIREMENTS,
  PERMITS: () => PERMITS,
  RESISTANCE: () => RESISTANCE,
  SPINALS: () => SPINALS,
  SPINAL_RELOAD_EXPONENT: () => SPINAL_RELOAD_EXPONENT,
  ServerShips: () => ServerShips,
  ServerTurrets: () => ServerTurrets,
  Ship: () => Ship,
  ShipFighters: () => ShipFighters,
  ShipNotFoundError: () => ShipNotFoundError,
  ShipSpinal: () => ShipSpinal,
  ShipSpinalGun: () => ShipSpinalGun,
  ShipSpinals: () => ShipSpinals,
  ShipTurrets: () => ShipTurrets,
  ShipWeapons: () => ShipWeapons,
  Ships: () => Ships,
  ShipsNotDumpedError: () => ShipsNotDumpedError,
  ShipsNotInitializedError: () => ShipsNotInitializedError,
  TURRET_CLASS_DAMAGE_DISTRIBUTIONS: () => TURRET_CLASS_DAMAGE_DISTRIBUTIONS,
  TurretNotFoundError: () => TurretNotFoundError,
  Turrets: () => Turrets,
  TurretsNotDumpedError: () => TurretsNotDumpedError,
  TurretsNotInitializedError: () => TurretsNotInitializedError,
  Weapon: () => Weapon
});

// src/ships.ts
var import_fuzzyfind = __toModule(require_fuzzyfind());

// src/constants.ts
var CLASSES = [
  "Miner",
  "Freighter",
  "Frigate",
  "Destroyer",
  "Cruiser",
  "Battlecruiser",
  "Battleship",
  "Dreadnought",
  "Carrier",
  "Super Capital",
  "Fighter",
  "Titan",
  "Alien",
  "Admin"
];
var DAMAGE_TYPE_DISTRIBUTIONS = {
  Laser: { shield: 1, hull: 0.3, ideal: "shield" },
  Kinetic: { shield: 0.4, hull: 1, ideal: "hull" },
  Plasma: { shield: 1, hull: 0.7, ideal: "shield" },
  Missile: { shield: 0.7, hull: 1, ideal: "hull" }
};
var TURRET_CLASS_DAMAGE_DISTRIBUTIONS = {
  Mining: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
  Laser: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
  Railgun: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
  Flak: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
  Cannon: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
  PDL: DAMAGE_TYPE_DISTRIBUTIONS.Laser
};
var SPINALS = {
  Phaser: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Laser,
    Tiny: { damage: 28, reload: 0.8, range: 4500, velocity: 5e3 },
    Small: { damage: 40, reload: 1, range: 4750, velocity: 4500 },
    Medium: { damage: 72, reload: 1.6, range: 5e3, velocity: 4e3 },
    Large: { damage: 120, reload: 2.4, range: 5250, velocity: 3500 },
    Huge: { damage: 198, reload: 3.6, range: 5500, velocity: 3e3 }
  },
  Cannon: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Kinetic,
    Tiny: { damage: 40, reload: 1.6, range: 5500, velocity: 3e3 },
    Small: { damage: 60, reload: 2, range: 5750, velocity: 2800 },
    Medium: { damage: 112, reload: 3.2, range: 6e3, velocity: 2600 },
    Large: { damage: 160, reload: 4, range: 6250, velocity: 2400 },
    Huge: { damage: 270, reload: 6, range: 6500, velocity: 2200 }
  },
  Torpedo: {
    damageDistribution: DAMAGE_TYPE_DISTRIBUTIONS.Missile,
    Tiny: { damage: 200, reload: 5, range: 8e3, velocity: 700 },
    Small: { damage: 330, reload: 6, range: 9e3, velocity: 600 },
    Medium: { damage: 490, reload: 7, range: 1e4, velocity: 500 },
    Large: { damage: 680, reload: 8, range: 11e3, velocity: 400 },
    Huge: { damage: 900, reload: 9, range: 12e3, velocity: 300 }
  }
};
var SPINAL_RELOAD_EXPONENT = 1.1;
var PERMITS = {
  "37": "SC Build",
  "38": "Class A",
  "39": "Class B",
  "40": "Class C",
  "41": "Class D",
  "42": "Class E"
};
var RESISTANCE = {
  Fighter: 0,
  Frigate: 0.2,
  Destroyer: 0.25,
  Cruiser: 0.3,
  Battlecruiser: 0.4,
  Battleship: 0.45,
  Dreadnought: 0.5,
  Carrier: 0.55,
  "Super Capital": 0.65,
  Titan: 0.7,
  Miner: 0.3,
  Freighter: 0.1,
  Alien: 0.3,
  Admin: 0.9
};
var LOYALTY_REQUIREMENTS = {
  Fighter: 0,
  Frigate: 0,
  Destroyer: 0,
  Cruiser: 0,
  Battlecruiser: 0.03,
  Battleship: 0.05,
  Dreadnought: 0.07,
  Carrier: 0.09,
  "Super Capital": 0.11,
  Titan: 0,
  Miner: 0,
  Freighter: 0,
  Alien: 0,
  Admin: 0
};
var BUILD_MENU_CLASSES = [
  "Miner",
  "Freighter",
  "Frigate",
  "Destroyer",
  "Cruiser",
  "Battlecruiser",
  "Battleship",
  "Dreadnought",
  "Carrier",
  "Super Capital"
];
var CLAMPS = {
  turnSpeed: [0.1, 0.9],
  topSpeed: [45, 380],
  acceleration: [5, 50]
};

// src/weapon.ts
var Weapon = class {
};
var Alpha = class {
  constructor(shield, hull, max) {
    this.shield = shield ?? 0;
    this.hull = hull ?? 0;
    this.max = max ?? 0;
  }
  add(...alphas) {
    for (const alpha of alphas) {
      this.shield += alpha.shield;
      this.hull += alpha.hull;
      this.max += alpha.max;
    }
    return this;
  }
  multiply(multiplier) {
    this.shield *= multiplier;
    this.hull *= multiplier;
    this.max *= multiplier;
    return this;
  }
};
var Dps = class {
  constructor(shield, hull) {
    this.shield = shield ?? 0;
    this.hull = hull ?? 0;
  }
  add(...dpses) {
    for (const dps of dpses) {
      this.shield += dps.shield;
      this.hull += dps.hull;
    }
    return this;
  }
  multiply(count) {
    this.shield *= count;
    this.hull *= count;
    return this;
  }
  get average() {
    return (this.shield + this.hull) / 2;
  }
};

// src/ships.ts
var ShipsNotInitializedError = class extends Error {
};
var ShipsNotDumpedError = class extends Error {
};
var ShipNotFoundError = class extends Error {
};
function log(...args) {
  console.log("[Ships]", ...args);
}
function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}
var Ships = class {
  constructor(turrets) {
    this.ships = {};
    this.turrets = turrets;
    this.initialized = false;
  }
  assertReady() {
    if (!this.initialized)
      throw new ShipsNotInitializedError("Ships instance has not been initialized; do `await <Ships>.init()` before using it.");
    if (Object.keys(this.ships).length === 0)
      throw new ShipsNotDumpedError("Ships have not been exported from the game.");
  }
  async load(ships) {
    this.ships = {};
    await this.loadShips(ships, this.turrets, true);
    await this.loadShips(ships, this.turrets, false);
    this.initialized = true;
  }
  async loadShips(ships, turrets, fighters) {
    for (const serializedShip of Object.values(ships)) {
      try {
        if (!fighters && serializedShip.class === "Fighter")
          continue;
        if (fighters && serializedShip.class !== "Fighter")
          continue;
        const ship = new Ship(this.ships, turrets, serializedShip);
        this.ships[ship.name] = ship;
      } catch {
      }
    }
  }
  find(name) {
    this.assertReady();
    if (this.ships.hasOwnProperty(name))
      return this.ships[name];
    const fuzzyfound = (0, import_fuzzyfind.default)(name, Object.keys(this.ships))[0];
    if (!fuzzyfound)
      throw new ShipNotFoundError("Could not find a ship with that name.");
    return this.ships[fuzzyfound];
  }
  all(options) {
    this.assertReady();
    if (!options)
      options = {};
    const ships = {};
    for (const key in this.ships) {
      if (options.secret === false && this.ships[key].secret)
        continue;
      ships[key] = this.ships[key];
    }
    return ships;
  }
  get(name) {
    this.assertReady();
    if (!this.ships.hasOwnProperty(name))
      throw new ShipNotFoundError("No ship with that name found.");
    return this.ships[name];
  }
};
var Ship = class {
  constructor(ships, turrets, serializedShip) {
    this.serializedShip = serializedShip;
    this.name = serializedShip.name;
    this.test = serializedShip.test;
    this.class = serializedShip.class;
    this.description = serializedShip.description ?? "(no description)";
    this.eventId = serializedShip.eventId;
    this.permit = this.calculatePermit();
    this.explosionSize = serializedShip.explosionSize;
    this.notForSale = serializedShip.notForSale;
    this.cargoHold = serializedShip.cargoHold;
    this.oreHold = serializedShip.oreHold;
    this.secret = serializedShip.secret;
    this.nonPlayer = serializedShip.nonPlayer || ["Alien", "Titan"].includes(this.class);
    this.canWarp = serializedShip.canWarp;
    this.stealth = serializedShip.stealth;
    if (serializedShip.customDrift)
      this.customDrift = serializedShip.customDrift, this.vip = serializedShip.vip;
    this.health = serializedShip.health;
    this.speed = {
      top: serializedShip.topSpeed,
      acceleration: serializedShip.acceleration,
      turn: serializedShip.turnSpeed
    };
    this.weapons = new ShipWeapons(turrets, serializedShip.weapons);
    this.fighters = new ShipFighters(ships, serializedShip.fighters);
    this.extraMaterials = serializedShip.extraMaterials;
    this.speed.turn = clamp(this.speed.turn, ...CLAMPS.turnSpeed);
    if (!this.secret) {
      this.speed.top = clamp(this.speed.top, ...CLAMPS.topSpeed);
      this.speed.acceleration = clamp(this.speed.acceleration, ...CLAMPS.acceleration);
    }
  }
  calculatePermit() {
    if (!this.eventId)
      return null;
    if (!this.serializedShip.permitOverride)
      return null;
    const id = this.serializedShip.permitOverride.toString();
    if (!(id in PERMITS))
      throw new Error(`Unknown permit override: ${id}`);
    const permit = PERMITS[id];
    return permit;
  }
};
var ShipWeapons = class extends Weapon {
  constructor(turrets, serializedShipWeapons) {
    super();
    this.turrets = new ShipTurrets(turrets, serializedShipWeapons.turrets);
    this.spinals = new ShipSpinals(serializedShipWeapons.spinals);
  }
  alpha(range, loyalty = 0) {
    const turrets = this.turrets.alpha(range, loyalty);
    const spinals = this.spinals.alpha(range);
    return turrets.add(spinals);
  }
  dps(range, loyalty = 0) {
    const turrets = this.turrets.dps(range, loyalty);
    const spinals = this.spinals.dps(range);
    return turrets.add(spinals);
  }
};
var ShipTurrets = class extends Weapon {
  constructor(turrets, turretResolvables) {
    super();
    this.turrets = new Map();
    for (const turretResolvable of turretResolvables) {
      const turret = turrets.get(turretResolvable);
      this.incrementTurret(turret);
    }
  }
  incrementTurret(turret) {
    const previous = this.turrets.get(turret) ?? 0;
    this.turrets.set(turret, previous + 1);
  }
  alpha(range, loyalty = 0) {
    const alpha = new Alpha();
    for (const [turret, count] of this.turrets) {
      alpha.add(turret.alpha(range).multiply(count).multiply(1 + loyalty));
    }
    return alpha;
  }
  dps(range, loyalty = 0) {
    const dps = new Dps();
    for (const [turret, count] of this.turrets) {
      dps.add(turret.dps(range).multiply(count).multiply(1 + loyalty));
    }
    return dps;
  }
};
var ShipSpinals = class extends Weapon {
  constructor(serializedSpinals) {
    super();
    this.spinals = [];
    if (serializedSpinals.f) {
      this.f = new ShipSpinal(serializedSpinals.f);
      this.spinals.push(this.f);
    }
    if (serializedSpinals.g) {
      this.g = new ShipSpinal(serializedSpinals.g);
      this.spinals.push(this.g);
    }
  }
  alpha(range) {
    return new Alpha().add(...this.spinals.map((spinal) => spinal.alpha(range)));
  }
  dps(range) {
    return new Dps().add(...this.spinals.map((spinal) => spinal.dps(range)));
  }
};
var ShipSpinal = class extends Weapon {
  constructor(serializedSpinal) {
    super();
    this.range = SPINALS[serializedSpinal.weaponType][serializedSpinal.weaponSize].range;
    this.guns = [];
    for (const gun of serializedSpinal.guns)
      this.guns.push(new ShipSpinalGun(serializedSpinal, gun));
    this.weaponSize = serializedSpinal.weaponSize;
    this.weaponType = serializedSpinal.weaponType;
    this.barrels = 0;
    let biggestGun = this.guns[0];
    for (const gun of this.guns) {
      this.barrels += gun.barrels;
      if (gun.barrels > biggestGun.barrels)
        biggestGun = gun;
    }
    if (typeof serializedSpinal.reloadOverride !== "undefined") {
      this.reload = Math.max(0.01, serializedSpinal.interval * (biggestGun.barrels - 1) + serializedSpinal.reloadOverride);
    } else {
      this.reload = biggestGun.reload;
    }
  }
  alpha(range) {
    if (range && range > this.range)
      return new Alpha();
    return new Alpha().add(...this.guns.map((gun) => gun.alpha()));
  }
  dps(range) {
    const alphaAtRange = this.alpha(range);
    return new Dps(alphaAtRange.shield / this.reload, alphaAtRange.hull / this.reload);
  }
};
var ShipSpinalGun = class extends Weapon {
  constructor(spinal, gun) {
    super();
    const spinalType = SPINALS[spinal.weaponType];
    const spinalSize = spinalType[spinal.weaponSize];
    this._alpha = new Alpha(gun.barrels * spinalSize.damage * spinalType.damageDistribution.shield, gun.barrels * spinalSize.damage * spinalType.damageDistribution.hull, gun.barrels * spinalSize.damage * spinalType.damageDistribution[spinalType.damageDistribution.ideal]);
    this.reload = spinal.interval * (gun.barrels - 1) + spinalSize.reload * Math.pow(SPINAL_RELOAD_EXPONENT, gun.barrels - 1);
    this.barrels = gun.barrels;
  }
  alpha() {
    return new Alpha().add(this._alpha);
  }
  dps() {
    return new Dps(this._alpha.shield / this.reload, this._alpha.hull / this.reload);
  }
};
var ShipFighters = class extends Weapon {
  constructor(ships, fighterNames) {
    super();
    this.hasFighters = false;
    this.fighters = new Map();
    for (const fighterName of fighterNames) {
      try {
        const fighter = ships[fighterName];
        if (!fighter)
          continue;
        this.incrementFighter(fighter);
        this.hasFighters = true;
      } catch (error) {
        log(error);
      }
    }
  }
  incrementFighter(fighter) {
    const previous = this.fighters.get(fighter) ?? 0;
    this.fighters.set(fighter, previous + 1);
  }
  alpha(range, loyalty = 0) {
    const alpha = new Alpha();
    for (const [fighter, count] of this.fighters) {
      alpha.add(fighter.weapons.alpha(range, loyalty).multiply(count));
    }
    return alpha;
  }
  dps(range, loyalty = 0) {
    const dps = new Dps();
    for (const [fighter, count] of this.fighters) {
      dps.add(fighter.weapons.dps(range, loyalty).multiply(count));
    }
    return dps;
  }
};
var ClientShips = class extends Ships {
  constructor(turrets) {
    super(turrets);
  }
  async init(ships) {
    await super.load(ships);
  }
};
var ServerShips = class extends Ships {
  constructor(GalaxyInfo) {
    super(GalaxyInfo.turrets);
    this.GalaxyInfo = GalaxyInfo;
  }
  async init() {
    try {
      const cache = await this.GalaxyInfo.prisma.keyValue.findUnique({
        where: {
          key: this.GalaxyInfo.config.db.kvKeys.serializedShips
        },
        rejectOnNotFound: true
      });
      await super.load(cache.value);
    } catch (error) {
      log("Ships database reset.", error);
    }
    log("Initialized");
  }
  async save(ships) {
    await this.GalaxyInfo.prisma.keyValue.upsert({
      create: {
        key: this.GalaxyInfo.config.db.kvKeys.serializedShips,
        value: ships
      },
      update: {
        value: ships
      },
      where: {
        key: this.GalaxyInfo.config.db.kvKeys.serializedShips
      }
    });
    await super.load(ships);
  }
};

// src/turrets.ts
var TurretsNotInitializedError = class extends Error {
};
var TurretsNotDumpedError = class extends Error {
};
var TurretNotFoundError = class extends Error {
};
var Turrets = class {
  constructor() {
    this.turrets = {};
    this.initialized = false;
  }
  assertReady() {
    if (!this.initialized)
      throw new TurretsNotInitializedError("Turrets instance has not been initialized; do `await <Turrets>.init()` before using it.");
    if (Object.keys(this.turrets).length === 0)
      throw new TurretsNotDumpedError("Turrets have not been exported from the game.");
  }
  async load(serializedTurrets) {
    for (const serializedTurret of Object.values(serializedTurrets)) {
      const turret = new Turret(serializedTurret);
      this.turrets[turret.name] = turret;
    }
    this.initialized = true;
  }
  get(turretName) {
    this.assertReady();
    if (!this.turrets.hasOwnProperty(turretName))
      throw new TurretNotFoundError(`Could not find turret called ${turretName}.`);
    return this.turrets[turretName];
  }
  all() {
    this.assertReady();
    return this.turrets;
  }
};
var Turret = class extends Weapon {
  constructor(serializedTurret) {
    super();
    const damageDistribution = serializedTurret.Group === "Alien" ? DAMAGE_TYPE_DISTRIBUTIONS.Plasma : TURRET_CLASS_DAMAGE_DISTRIBUTIONS[serializedTurret.Class];
    this._alpha = new Alpha(serializedTurret.Damage * damageDistribution.shield, serializedTurret.Damage * damageDistribution.hull, serializedTurret.Damage * damageDistribution[damageDistribution.ideal]);
    this.name = serializedTurret.Name;
    this.range = serializedTurret.Range;
    this.reload = serializedTurret.Reload;
    this.size = serializedTurret.TurretSize;
    this.turretClass = serializedTurret.Class;
    this.affectedByLoyalty = !["Mining"].includes(serializedTurret.Class);
  }
  alpha(range, loyalty = 0) {
    if (!this.affectedByLoyalty)
      loyalty = 0;
    if (range && range > this.range)
      return new Alpha();
    return new Alpha().add(this._alpha).multiply(1 + loyalty);
  }
  dps(range, loyalty = 0) {
    const alphaAtRange = this.alpha(range, loyalty);
    return new Dps(alphaAtRange.shield / this.reload, alphaAtRange.hull / this.reload);
  }
};
var ClientTurrets = class extends Turrets {
  constructor() {
    super();
  }
  async init(turrets) {
    await super.load(turrets);
  }
};
var ServerTurrets = class extends Turrets {
  constructor(GalaxyInfo) {
    super();
    this.GalaxyInfo = GalaxyInfo;
  }
  async init() {
    try {
      const cache = await this.GalaxyInfo.prisma.keyValue.findUnique({
        where: {
          key: this.GalaxyInfo.config.db.kvKeys.serializedTurrets
        },
        rejectOnNotFound: true
      });
      await this.load(cache.value);
    } catch (e) {
      console.log("Turrets database reset.");
    }
  }
  async save(serializedTurrets) {
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
    });
    await this.load(serializedTurrets);
  }
};
