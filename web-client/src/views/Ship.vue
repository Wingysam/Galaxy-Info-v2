<template>
  <v-container>
    <h2>{{ $route.params.ship }}</h2>
    <div v-if="ship">
      <p style="white-space: normal; word-wrap: break-word;">
        {{ ship.description }}
      </p>
    </div>
    <div v-else-if="error" />
    <div v-else>
      <v-skeleton-loader
        type="text"
        width="75em"
      />
    </div>
    <v-btn to="/ships">
      Return to index
    </v-btn>
    <div v-if="error">
      {{ error }}
    </div>
    <div v-else-if="ship && stats.weapons">
      <v-row class="mt-4">
        <v-col>
          <DataCard
            title="Speed"
            :data="[
              ['Top Speed', ship.speed.top],
              ['Turn Speed', ship.speed.turn.toFixed(2)],
              ['Acceleration', ship.speed.acceleration],
              ['Custom Drift', ship.customDrift || undefined]
            ]"
          />
        </v-col>
        <v-col>
          <DataCard
            title="Health"
            :data="[
              ['Shield', ship.health.shield],
              ['Hull', ship.health.hull],
              ['Combined', ship.health.shield + ship.health.hull],
              ['Resistance', `${Math.round(ship.resistance * 100)}%`]
            ]"
          />
        </v-col>
        <v-col>
          <DataCard
            title="Other"
            :data="[
              ['Class', ship.class],
              ['Cargo Hold', ship.cargoHold],
              ['Ore Hold', ship.oreHold],
              ['Event ID', ship.eventId || undefined],
              ['Permit', ship.permit || undefined],
              ['Explosion Size', ship.explosionSize],
              ['Not For Sale', ship.notForSale || undefined],
              ['Secret', ship.secret || undefined],
              ['Warp Drive', ship.canWarp],
              ['Stealth', ship.stealth || undefined],
              ['Requires VIP', ship.vip || undefined]
            ]"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-card class="pa-4">
            <h3>Weaponry</h3>
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
            <h4>Turrets</h4>
            <Weapons :weapons="stats.weapons.turrets" />
            <h4>Spinals</h4>
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
    <v-row v-if="!error && disableKills !== 'true'">
      <v-col>
        <v-card class="pa-4">
          <h3>Recent Kills</h3>
          <RecentKills :killer-ship="$route.params.ship" />
        </v-card>
      </v-col>
      <v-col>
        <v-card class="pa-4">
          <h3>Recent Deaths</h3>
          <RecentKills :victim-ship="$route.params.ship" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ClientShips, ClientTurrets } from "@galaxyinfo/ships";
import Weapons from "@/components/Weapons.vue";
import RecentKills from "@/components/RecentKills.vue";
import DataCard from '@/components/DataCard.vue'

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
  name: "Ship",
  components: { Weapons, RecentKills, DataCard },
  data() {
    return {
      ship: undefined,
      error: null,
      range: 0,
      loyalty: 0,
      stats: {},
      disableKills: process.env.VUE_APP_DISABLE_KILLS
    };
  },
  watch: {
    range() {
      this.updateStats();
    },
    loyalty() {
      this.updateStats();
    },
  },
  mounted() {
    (async () => {
      await this.updateShip();
      this.updateStats();
    })();
  },
  methods: {
    async updateShip() {
      try {
        const { serializedShips, serializedTurrets } = await this.$api.http(
          "/v2/ships-turrets"
        );
        const turrets = new ClientTurrets();
        await turrets.init(serializedTurrets);
        const ships = new ClientShips(turrets);
        await ships.init(serializedShips);
        this.ship = ships.get(this.$route.params.ship);
        this.loyalty = 0
      } catch (error) {
        this.error = error.message;
      }
    },

    updateStats() {
      if (!this.ship) return
      const stats = {};

      stats.weapons = {};

      stats.weapons.total = [
        {
          name: "Total",
          dps: floorDps(this.ship.weapons.dps(this.range, this.loyalty / 100)),
          alpha: floorAlpha(
            this.ship.weapons.alpha(this.range, this.loyalty / 100)
          ),
        },
      ];

      stats.weapons.turrets = [
        ...Array.from(this.ship.weapons.turrets.turrets.entries()).map(
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
            this.ship.weapons.turrets.dps(this.range, this.loyalty / 100)
          ),
          alpha: floorAlpha(
            this.ship.weapons.turrets.alpha(this.range, this.loyalty / 100)
          ),
        },
      ];

      stats.weapons.spinals = [
        ...this.ship.weapons.spinals.spinals
          .map((spinal) => {
            let guns = []
            for (const gun of spinal.guns) {
              guns.push(`${gun.barrels}x ${gun.weaponSize} ${gun.weaponType}`)
            }
            return {
              name: `${guns.join('\n')}`,
              dps: floorDps(spinal.dps(this.range, this.loyalty / 100)),
              alpha: floorAlpha(spinal.alpha(this.range, this.loyalty / 100)),
              interval: spinal.guns[0]?.interval.toFixed(2),
              reload: spinal.reload.toFixed(2),
            };
          }),
        {
          name: "Total Spinals",
          dps: floorDps(
            this.ship.weapons.spinals.dps(this.range, this.loyalty / 100)
          ),
          alpha: floorAlpha(
            this.ship.weapons.spinals.alpha(this.range, this.loyalty / 100)
          ),
        },
      ]

      this.stats = stats
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
