import { Alpha, Dps, Weapon } from './weapon';
export declare type TurretResolvable = string;
export declare class TurretsNotInitializedError extends Error {
}
export declare class TurretsNotDumpedError extends Error {
}
export declare class TurretNotFoundError extends Error {
}
export declare type SerializedTurrets = {
    [key: string]: SerializedTurret;
};
export declare type SerializedTurret = {
    Name: string;
    Damage: number;
    Reload: number;
    Range: number;
    Class: TurretClass;
    Group: TurretGroup;
    BeamSize: number;
    BaseAccuracy: number;
    SpeedDenominator: number;
    TurretSize: TurretSize;
};
export declare type TurretClass = 'Mining' | 'Laser' | 'Railgun' | 'Flak' | 'Cannon' | 'PDL';
export declare type TurretSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge';
export declare type TurretGroup = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Alien' | 'Test' | 'Modelers';
export declare class Turrets {
    private turrets;
    private initialized;
    constructor();
    private assertReady;
    load(serializedTurrets: SerializedTurrets): Promise<void>;
    get(turretName: TurretResolvable): Turret;
    all(): {
        [key: string]: Turret;
    };
}
export type { Turret };
declare class Turret extends Weapon {
    name: string;
    reload: number;
    range: number;
    group: TurretGroup;
    size: TurretSize;
    turretClass: TurretClass;
    baseAccuracy: number;
    trackingAccuracy: number;
    test: Boolean;
    private _alpha;
    private affectedByLoyalty;
    constructor(serializedTurret: SerializedTurret);
    alpha(range?: number, loyalty?: number): Alpha;
    dps(range?: number, loyalty?: number): Dps;
    accuracyDeviation(absoluteVelocity: number): number;
}
export declare class ClientTurrets extends Turrets {
    constructor();
    init(turrets: SerializedTurrets): Promise<void>;
}
export declare class ServerTurrets extends Turrets {
    private GalaxyInfo;
    constructor(GalaxyInfo: GalaxyInfo);
    init(): Promise<void>;
    save(serializedTurrets: SerializedTurrets): Promise<void>;
}
