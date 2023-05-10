<template>
  <v-container>
    <h2>Sandbox</h2>
    <p>You can prototype your own ship with custom weaponry here.</p>
    <h3>Turrets</h3>
    <v-row>
      <v-col
        v-for="i in 10"
        :key="i"
      >
        <v-autocomplete
          v-model="turrets[i - 1]"
          :label="`Turret ${i}`"
          :items="turretNames"
          auto-select-first
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-for="letter in ['f', 'g']"
        :key="letter"
      >
        <h3>Spinal {{ letter.toUpperCase() }}</h3>
        <v-select
          v-model="spinals"
          v-col
          <
        />
      </v-col>
    </v-row>
    <h3>Your Ship</h3>
    <div v-if="error">
      {{ error }}
    </div>
    <div v-else-if="stats.weapons">
      <v-row>
        <v-col>
          <v-card class="pa-4">
            <h4>Weaponry</h4>
            <v-row class="mt-2">
              <v-col>
                <v-slider
                  v-model="range"
                  :min="0"
                  :max="12000"
                  :step="250"
                  :label="`Range: ${range}`"
                  class="align-center"
                />
              </v-col>
              <v-col>
                <v-slider
                  v-model="loyalty"
                  :min="0"
                  :max="33"
                  :label="`Loyalty: ${loyalty}%`"
                  class="align-center"
                />
              </v-col>
            </v-row>
            <Weapons :weapons="stats.weapons.total" />
            <h5>Turrets</h5>
            <Weapons :weapons="stats.weapons.turrets" />
            <h5>Spinals</h5>
            <Weapons :weapons="stats.weapons.spinals" />
          </v-card>
        </v-col>
      </v-row>
    </div>
    <div v-else>
      <v-progress-circular
        indeterminate
        color="primary"
        class="mb-8"
      />
    </div>
  </v-container>
</template>

<script>
import { Ship, ClientTurrets } from "@galaxyinfo/ships";
import Weapons from "@/components/Weapons.vue";

function floorDps(dps) {
  return {
    shield: Math.floor(dps.shield),
    hull: Math.floor(dps.hull),
    average: Math.floor(dps.average),
  };
}

function floorAlpha(alpha) {
  return {
    shield: Math.floor(alpha.shield),
    hull: Math.floor(alpha.hull),
    max: Math.floor(alpha.max),
  };
}

export default {
  name: "Sandbox",
  components: { Weapons },
  data() {
    const defaultSpinal = {
      weaponSize: '',
      weaponType: '',
      interval: 0,
      
    }
    return {
      galaxyInfoTurrets: undefined,
      ship: undefined,
      error: null,
      range: 0,
      loyalty: 0,
      stats: {},
      turretNames: [],
      turrets: Array(10).fill(''),
      spinals: {
        f: {},
        g: {}
      }
    };
  },
  watch: {
    range() {
      this.updateStats();
    },
    loyalty() {
      this.updateStats();
    },
    turrets() {
      this.updateStats();
    }
  },
  mounted() {
    (async () => {
      await this.loadTurrets();
      this.updateStats();
    })();
  },
  methods: {
    async loadTurrets() {
      try {
        const { serializedTurrets } = await this.$api.http(
          "/v2/ships-turrets"
        );
        const turrets = new ClientTurrets();
        await turrets.init(serializedTurrets);
        this.galaxyInfoTurrets = turrets
        this.turretNames = Object.keys(turrets.all()).sort()
        this.loyalty = 0
      } catch (error) {
        this.error = error.message;
      }
    },

    updateStats() {
      try {
        if (!this.galaxyInfoTurrets) return
        const serializedShip = {
          name: 'Sandbox Ship',
          test: true,
          class: 'Miner',
          eventId: 0,
          explosionSize: 0,
          notForSale: true,
          cargoHold: 0,
          oreHold: 0,
          secret: false,
          nonPlayer: false,
          canWarp: true,
          stealth: false,
          vip: false,
          health: {
            shield: 0,
            hull: 0,
          },
          topSpeed: 0,
          acceleration: 0,
          turnSpeed: 0,
          weapons: {
            spinals: {},
            turrets: this.turrets.filter(turret => turret !== '')
          },
          fighters: [],
          extraMaterials: {}
        }
        const ship = new Ship({}, this.galaxyInfoTurrets, serializedShip)
        const stats = {};

        stats.weapons = {};

        stats.weapons.total = [
          {
            name: "Total",
            dps: floorDps(ship.weapons.dps(this.range, this.loyalty / 100)),
            alpha: floorAlpha(
              ship.weapons.alpha(this.range, this.loyalty / 100)
            ),
          },
        ];

        stats.weapons.turrets = [
          ...Array.from(ship.weapons.turrets.turrets.entries()).map(
            ([turret, count]) => {
              return {
                name: `${count}x ${turret.name}`,
                dps: floorDps(
                  turret.dps(this.range, this.loyalty / 100).multiply(count)
                ),
                alpha: floorAlpha(
                  turret.alpha(this.range, this.loyalty / 100).multiply(count)
                ),
                reload: turret.reload.toFixed(2),
              };
            }
          ),
          {
            name: "Total Turrets",
            dps: floorDps(
              ship.weapons.turrets.dps(this.range, this.loyalty / 100)
            ),
            alpha: floorAlpha(
              ship.weapons.turrets.alpha(this.range, this.loyalty / 100)
            ),
          },
        ];

        stats.weapons.spinals = [
          ...[ship.weapons.spinals.f, ship.weapons.spinals.g]
            .filter((spinal) => spinal)
            .map((spinal) => {
              return {
                name: `${spinal.barrels} ${spinal.weaponSize} ${spinal.weaponType}`,
                dps: floorDps(spinal.dps(this.range, this.loyalty / 100)),
                alpha: floorAlpha(spinal.alpha(this.range, this.loyalty / 100)),
                interval: spinal.guns[0]?.interval.toFixed(2),
                reload: spinal.reload.toFixed(2),
              };
            }),
          {
            name: "Total Spinals",
            dps: floorDps(
              ship.weapons.spinals.dps(this.range, this.loyalty / 100)
            ),
            alpha: floorAlpha(
              ship.weapons.spinals.alpha(this.range, this.loyalty / 100)
            ),
          },
        ]

        this.stats = stats
      } catch (error) {
        this.error = `${error}`
      }
    },
  },
};
</script>

<style>
.v-row-group__header button:nth-child(2) {
  display: none;
}

th[role="columnheader"] {
  white-space: nowrap;
}

.limited {
  color: #dba84a;
}

.shiplink {
  text-decoration: none;
  color: #dedede;
}
</style>
