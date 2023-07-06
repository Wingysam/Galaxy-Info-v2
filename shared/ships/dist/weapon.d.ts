export declare abstract class Weapon {
    abstract dps(range?: number, loyalty?: number): Dps;
    abstract alpha(range?: number, loyalty?: number): Alpha;
}
export declare class Alpha {
    shield: number;
    hull: number;
    max: number;
    constructor(shield?: number, hull?: number, max?: number);
    add(...alphas: Alpha[]): this;
    multiply(multiplier: number): this;
    toString(): string;
}
export declare class Dps {
    shield: number;
    hull: number;
    constructor(shield?: number, hull?: number);
    add(...dpses: Dps[]): this;
    multiply(count: number): this;
    get average(): number;
    toString(): string;
}
