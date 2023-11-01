declare const CLASSES: readonly ["Miner", "Freighter", "Frigate", "Destroyer", "Cruiser", "Battlecruiser", "Battleship", "Dreadnought", "Carrier", "Super Capital", "Fighter", "Titan", "Alien", "Admin"];
declare const DAMAGE_TYPE_DISTRIBUTIONS: {
    readonly Laser: {
        readonly shield: 1;
        readonly hull: 0.3;
        readonly ideal: "shield";
    };
    readonly Kinetic: {
        readonly shield: 0.4;
        readonly hull: 1;
        readonly ideal: "hull";
    };
    readonly Plasma: {
        readonly shield: 0.9;
        readonly hull: 0.9;
        readonly ideal: "shield";
    };
    readonly Missile: {
        readonly shield: 0.7;
        readonly hull: 1;
        readonly ideal: "hull";
    };
    readonly Quantum: {
        readonly shield: 1;
        readonly hull: 1;
        readonly ideal: "shield";
    };
};
declare const TURRET_CLASS_DAMAGE_DISTRIBUTIONS: {
    readonly Mining: {
        readonly shield: 1;
        readonly hull: 0.3;
        readonly ideal: "shield";
    };
    readonly Laser: {
        readonly shield: 1;
        readonly hull: 0.3;
        readonly ideal: "shield";
    };
    readonly Railgun: {
        readonly shield: 0.4;
        readonly hull: 1;
        readonly ideal: "hull";
    };
    readonly Flak: {
        readonly shield: 0.4;
        readonly hull: 1;
        readonly ideal: "hull";
    };
    readonly Cannon: {
        readonly shield: 0.4;
        readonly hull: 1;
        readonly ideal: "hull";
    };
    readonly PDL: {
        readonly shield: 1;
        readonly hull: 0.3;
        readonly ideal: "shield";
    };
    readonly Beam: {
        readonly shield: 0.4;
        readonly hull: 1;
        readonly ideal: "hull";
    };
};
declare const SPINALS: {
    readonly Phaser: {
        readonly damageDistribution: {
            readonly shield: 1;
            readonly hull: 0.3;
            readonly ideal: "shield";
        };
        readonly Tiny: {
            readonly damage: 28;
            readonly reload: 0.8;
            readonly range: 3000;
            readonly velocity: 5000;
        };
        readonly Small: {
            readonly damage: 40;
            readonly reload: 1;
            readonly range: 4000;
            readonly velocity: 4500;
        };
        readonly Medium: {
            readonly damage: 72;
            readonly reload: 1.6;
            readonly range: 5000;
            readonly velocity: 4000;
        };
        readonly Large: {
            readonly damage: 120;
            readonly reload: 2.4;
            readonly range: 6000;
            readonly velocity: 3500;
        };
        readonly Huge: {
            readonly damage: 198;
            readonly reload: 3.6;
            readonly range: 6500;
            readonly velocity: 3000;
        };
    };
    readonly Cannon: {
        readonly damageDistribution: {
            readonly shield: 0.4;
            readonly hull: 1;
            readonly ideal: "hull";
        };
        readonly Tiny: {
            readonly damage: 40;
            readonly reload: 1.6;
            readonly range: 3000;
            readonly velocity: 3000;
        };
        readonly Small: {
            readonly damage: 60;
            readonly reload: 2;
            readonly range: 4000;
            readonly velocity: 2800;
        };
        readonly Medium: {
            readonly damage: 112;
            readonly reload: 3.2;
            readonly range: 5000;
            readonly velocity: 2600;
        };
        readonly Large: {
            readonly damage: 160;
            readonly reload: 4;
            readonly range: 6000;
            readonly velocity: 2400;
        };
        readonly Huge: {
            readonly damage: 270;
            readonly reload: 6;
            readonly range: 6500;
            readonly velocity: 2200;
        };
    };
    readonly Torpedo: {
        readonly damageDistribution: {
            readonly shield: 0.7;
            readonly hull: 1;
            readonly ideal: "hull";
        };
        readonly Tiny: {
            readonly damage: 200;
            readonly reload: 5;
            readonly range: 5000;
            readonly velocity: 700;
        };
        readonly Small: {
            readonly damage: 330;
            readonly reload: 6;
            readonly range: 6000;
            readonly velocity: 600;
        };
        readonly Medium: {
            readonly damage: 490;
            readonly reload: 7;
            readonly range: 7000;
            readonly velocity: 500;
        };
        readonly Large: {
            readonly damage: 680;
            readonly reload: 8;
            readonly range: 9000;
            readonly velocity: 400;
        };
        readonly Huge: {
            readonly damage: 900;
            readonly reload: 9;
            readonly range: 10000;
            readonly velocity: 300;
        };
    };
};
declare const SPINAL_RELOAD_EXPONENT: 1.1;
declare const PERMITS: {
    readonly '37': "SC Build";
    readonly '38': "Class A";
    readonly '39': "Class B";
    readonly '40': "Class C";
    readonly '41': "Class D";
    readonly '42': "Class E";
};
declare const RESISTANCE: {
    readonly Fighter: 0;
    readonly Frigate: 0.2;
    readonly Destroyer: 0.25;
    readonly Cruiser: 0.3;
    readonly Battlecruiser: 0.4;
    readonly Battleship: 0.45;
    readonly Dreadnought: 0.5;
    readonly Carrier: 0.55;
    readonly 'Super Capital': 0.65;
    readonly Titan: 0.7;
    readonly Miner: 0.3;
    readonly Freighter: 0.1;
    readonly Alien: 0.3;
    readonly Admin: 0.9;
};
declare const BASE_REQUIREMENTS: {
    readonly Fighter: 1;
    readonly Frigate: 1;
    readonly Destroyer: 1;
    readonly Cruiser: 1;
    readonly Battlecruiser: 1;
    readonly Battleship: 1;
    readonly Dreadnought: 2;
    readonly Carrier: 2;
    readonly 'Super Capital': 3;
    readonly Titan: 1;
    readonly Miner: 1;
    readonly Freighter: 1;
    readonly Alien: 1;
    readonly Admin: 1;
};
declare const BUILD_MENU_CLASSES: readonly ["Miner", "Freighter", "Frigate", "Destroyer", "Cruiser", "Battlecruiser", "Battleship", "Dreadnought", "Carrier", "Super Capital"];
declare const NON_LIMITED_QUEST_SHIPS: string[];
export { CLASSES, DAMAGE_TYPE_DISTRIBUTIONS, TURRET_CLASS_DAMAGE_DISTRIBUTIONS, SPINALS, SPINAL_RELOAD_EXPONENT, PERMITS, RESISTANCE, BASE_REQUIREMENTS, BUILD_MENU_CLASSES, NON_LIMITED_QUEST_SHIPS };
