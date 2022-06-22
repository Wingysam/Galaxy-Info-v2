<template>
  <v-container>
    <v-row class="pb-5">
      <v-col shrink style="flex-grow: 0; white-space: nowrap;">
        <div style="display: flex; height: 100%; align-items: center;">
          <h2>{{ $route.params.ship }}</h2>
        </div>
        <v-btn to="/ships">Return to index</v-btn>
      </v-col>
    </v-row>
      <v-row>
        <v-col>
          <v-slider
            v-model="range"
            :min="0"
            :max="12000"
            :step="250"
            label="Range"
            class="align-center"
          >
            <template v-slot:append>
              <v-text-field
                v-model="range"
                class="mt-0 pt-0"
                type="number"
                style="width: 4em"
              ></v-text-field>
            </template>
          </v-slider>
        </v-col>
        <v-col>
          <v-slider
            v-model="loyalty"
            :min="0"
            :max="33"
            label="Loyalty"
            class="align-center"
          >
            <template v-slot:append>
              <v-text-field
                v-model="loyalty"
                class="mt-0 pt-0"
                type="number"
                style="width: 4em"
              ></v-text-field>
            </template>
          </v-slider>
        </v-col>
      </v-row>
      <div v-if="error">
        {{error}}
      </div>
      <div v-else-if="ship && stats.weapons">
        <v-row>
          <v-col>
            <v-card class="pa-4">
              <h3>Speed</h3>
              <v-simple-table>
                <tbody>
                  <tr>
                    <th>Top Speed</th>
                    <th>Turn Speed</th>
                    <th>Acceleration</th>
                  </tr>
                  <tr>
                    <td>{{ ship.speed.top }}</td>
                    <td>{{ ship.speed.turn.toFixed(2) }}</td>
                    <td>{{ ship.speed.acceleration }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>
          <v-col>
            <v-card class="pa-4">
              <h3>Health</h3>
              <v-simple-table>
                <tbody>
                  <tr>
                    <th>Shield</th>
                    <th>Hull</th>
                    <th>Combined</th>
                    <th>Resistance</th>
                  </tr>
                  <tr>
                    <td>{{ ship.health.shield }}</td>
                    <td>{{ ship.health.hull }}</td>
                    <td>{{ ship.health.shield + ship.health.hull }}</td>
                    <td>{{ ship.resistance * 100 }}%</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card class="pa-4">
              <h3>Weaponry</h3>
              <Weapons :weapons="stats.weapons.total"/>
              <h4>Turrets</h4>
              <Weapons :weapons="stats.weapons.turrets"/>
              <h4>Spinals</h4>
              <Weapons :weapons="stats.weapons.spinals"/>
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
      <v-row>
        <v-col>
          <v-card class="pa-4">
            <h3>Recent Kills</h3>
            <RecentKills :killerShip="$route.params.ship"/>
          </v-card>
        </v-col>
        <v-col>
          <v-card class="pa-4">
            <h3>Recent Deaths</h3>
            <RecentKills :victimShip="$route.params.ship"/>
          </v-card>
        </v-col>
      </v-row>
  </v-container>
</template>

<script>
import { ClientShips, ClientTurrets } from '@galaxyinfo/ships'
import Weapons from '@/components/Weapons.vue'
import RecentKills from '@/components/RecentKills.vue'

function floorDps(dps) {
  return {
    shield: Math.floor(dps.shield),
    hull: Math.floor(dps.hull),
    average: Math.floor(dps.average)
  }
}

function floorAlpha(alpha) {
  return {
    shield: Math.floor(alpha.shield),
    hull: Math.floor(alpha.hull),
    max: Math.floor(alpha.max)
  }
}

export default {
  name: 'Ship',
  components: { Weapons, RecentKills },
  data () {
    return {
      ship: undefined,
      error: null,
      range: 0,
      loyalty: 0,
      stats: {}
    }
  },
  mounted () {
    (async () => {
      await this.updateShip()
      this.updateStats()
    })()
  },
  methods: {
    async updateShip () {
      try {
        const { serializedShips, serializedTurrets } = await this.$api.http('/v2/ships-turrets')
        const turrets = new ClientTurrets()
        await turrets.init(serializedTurrets)
        const ships = new ClientShips(turrets)
        await ships.init(serializedShips)
        this.ship = ships.get(this.$route.params.ship)
      } catch (error) {
        this.error = error.message
      }
    },

    updateStats () {
      const stats = {}

      stats.weapons = {}

      stats.weapons.total = [
        {
          name: 'Total',
          dps: floorDps(this.ship.weapons.dps(this.range, this.loyalty / 100)),
          alpha: floorAlpha(this.ship.weapons.alpha(this.range, this.loyalty / 100))
        }
      ]

      stats.weapons.turrets = [
        ...Array.from(this.ship.weapons.turrets.turrets.entries()).map(([turret, count]) => {
          return {
            name: `${count}x ${turret.name}`,
            dps: floorDps(turret.dps(this.range, this.loyalty / 100).multiply(count)),
            alpha: floorAlpha(turret.alpha(this.range, this.loyalty / 100).multiply(count)),
            reload: turret.reload.toFixed(2)
          }
        }),
        {
          name: 'Total Turrets',
          dps: floorDps(this.ship.weapons.turrets.dps(this.range, this.loyalty / 100)),
          alpha: floorAlpha(this.ship.weapons.turrets.alpha(this.range, this.loyalty / 100))
        }
      ]

      stats.weapons.spinals = [
        ...[this.ship.weapons.spinals.f, this.ship.weapons.spinals.g].filter(spinal => spinal).map(spinal => {
          return {
            name: `${spinal.barrels} ${spinal.weaponSize} ${spinal.weaponType}`,
            dps: floorDps(spinal.dps(this.range, this.loyalty / 100)),
            alpha: floorAlpha(spinal.alpha(this.range, this.loyalty / 100)),
            reload: spinal.reload.toFixed(2)
          }
        }),
        {
          name: 'Total Spinals',
          dps: floorDps(this.ship.weapons.spinals.dps(this.range, this.loyalty / 100)),
          alpha: floorAlpha(this.ship.weapons.spinals.alpha(this.range, this.loyalty / 100))
        }
      ],

      this.stats = stats
    }
  },
  watch: {
    range() { this.updateStats() },
    loyalty() { this.updateStats() }
  }
}
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
