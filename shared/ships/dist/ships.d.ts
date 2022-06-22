import type { Turrets, TurretResolvable, Turret } from './turrets';
import { CLASSES } from './constants';
import { Weapon, Dps, Alpha } from './weapon';
export declare class ShipsNotInitializedError extends Error {
}
export declare class ShipsNotDumpedError extends Error {
}
export declare class ShipNotFoundError extends Error {
}
export declare type SerializedShips = {
    [key: string]: SerializedShip;
};
export declare type SerializedShip = {
    name: string;
    test: boolean;
    class: typeof CLASSES[number];
    description?: string;
    eventId: number;
    permitOverride?: number;
    explosionSize: number;
    notForSale: boolean;
    cargoHold: number;
    oreHold: number;
    secret: boolean;
    nonPlayer: boolean;
    canWarp: boolean;
    stealth: boolean;
    customDrift?: number;
    vip: boolean;
    health: {
        shield: number;
        hull: number;
    };
    topSpeed: number;
    acceleration: number;
    turnSpeed: number;
    weapons: SerializedShipWeapons;
    fighters: string[];
    extraMaterials: ExtraMaterials;
};
export declare type ExtraMaterials = {
    [key: string]: number;
};
export declare type Permit = 'SC Build' | 'Class A' | 'Class B' | 'Class C' | 'Class D' | 'Class E';
export declare type SerializedShipWeapons = {
    spinals: SerializedSpinals;
    turrets: TurretResolvable[];
};
export declare type SerializedSpinals = {
    f?: SerializedSpinal;
    g?: SerializedSpinal;
};
export declare type SerializedSpinal = {
    weaponType: SpinalWeaponType;
    weaponSize: SpinalWeaponSize;
    interval: number;
    reloadOverride?: number;
    guns: SerializedSpinalGun[];
};
export declare type SerializedSpinalGun = {
    barrels: number;
};
export declare type SpinalWeaponType = 'Phaser' | 'Cannon' | 'Torpedo';
export declare type SpinalWeaponSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge';
export declare class Ships {
    private initialized;
    private ships;
    private turrets;
    constructor(turrets: Turrets);
    private assertReady;
    load(ships: SerializedShips): Promise<void>;
    private loadShips;
    find(name: string): Ship;
    all(options: {
        secret?: boolean;
    }): {
        [key: string]: Ship;
    };
    get(name: string): Ship;
}
export declare class Ship {
    name: string;
    test: boolean;
    class: typeof CLASSES[number];
    description: string;
    eventId: number;
    permit: Permit | null;
    explosionSize: number;
    notForSale: boolean;
    cargoHold: number;
    oreHold: number;
    secret: boolean;
    nonPlayer: boolean;
    canWarp: boolean;
    stealth: boolean;
    customDrift?: number;
    vip: boolean;
    health: {
        shield: number;
        hull: number;
    };
    speed: {
        top: number;
        acceleration: number;
        turn: number;
    };
    weapons: ShipWeapons;
    fighters: ShipFighters;
    extraMaterials: ExtraMaterials;
    private serializedShip;
    constructor(ships: {
        [key: string]: Ship;
    }, turrets: Turrets, serializedShip: SerializedShip);
    private calculatePermit;
}
export declare class ShipWeapons extends Weapon {
    turrets: ShipTurrets;
    spinals: ShipSpinals;
    constructor(turrets: Turrets, serializedShipWeapons: SerializedShipWeapons);
    alpha(range?: number, loyalty?: number): Alpha;
    dps(range?: number, loyalty?: number): Dps;
}
export declare class ShipTurrets extends Weapon {
    turrets: Map<Turret, number>;
    constructor(turrets: Turrets, turretResolvables: TurretResolvable[]);
    private incrementTurret;
    alpha(range?: number, loyalty?: number): Alpha;
    dps(range?: number, loyalty?: number): Dps;
}
export declare class ShipSpinals extends Weapon {
    private spinals;
    f?: ShipSpinal;
    g?: ShipSpinal;
    constructor(serializedSpinals: SerializedSpinals);
    alpha(range?: number): Alpha;
    dps(range?: number): Dps;
}
export declare class ShipSpinal extends Weapon {
    range: number;
    reload: number;
    barrels: number;
    weaponSize: SpinalWeaponSize;
    weaponType: SpinalWeaponType;
    private guns;
    constructor(serializedSpinal: SerializedSpinal);
    alpha(range?: number): Alpha;
    dps(range?: number): Dps;
}
export declare class ShipSpinalGun extends Weapon {
    reload: number;
    barrels: number;
    private _alpha;
    constructor(spinal: SerializedSpinal, gun: SerializedSpinalGun);
    alpha(): Alpha;
    dps(): Dps;
}
export declare class ShipFighters extends Weapon {
    fighters: Map<Ship, number>;
    hasFighters: boolean;
    constructor(ships: {
        [key: string]: Ship;
    }, fighterNames: string[]);
    private incrementFighter;
    alpha(range?: number, loyalty?: number): Alpha;
    dps(range?: number, loyalty?: number): Dps;
}
export declare class ClientShips extends Ships {
    constructor(turrets: Turrets);
    init(ships: SerializedShips): Promise<void>;
}
export declare class ServerShips extends Ships {
    private GalaxyInfo;
    constructor(GalaxyInfo: GalaxyInfo);
    init(): Promise<void>;
    save(ships: SerializedShips): Promise<void>;
}
