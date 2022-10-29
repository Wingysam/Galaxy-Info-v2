<template>
  <v-container>
    <h2>{{ $route.params.turret }}</h2>
    <v-btn
      to="/turrets"
      style="margin-bottom: 1em;"
    >
      Return to index
    </v-btn>
    <div v-if="error">
      {{ error }}
    </div>
    <div v-else-if="loaded">
      <h3>Ships with this turret</h3>
      <ul>
        <li
          v-for="ship in shipsList"
          :key="ship"
        >
          <router-link :to="`/ships/${encodeURIComponent(ship)}`">
            {{ ship }}
          </router-link>
        </li>
      </ul>
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
import { ClientShips, ClientTurrets } from "@galaxyinfo/ships";

function turretsIncludesTurretName(turrets, turretName) {
  for (const turret of turrets.keys()) {
    if (turret.name === turretName) return true
  }
  return false
}

export default {
  name: "Ship",
  data() {
    return {
      error: null,
      clientShips: null,
      shipsList: [],
      loaded: false
    };
  },
  mounted() {
    (async () => {
      await this.fetchData();
      this.updateStats();
    })();
  },
  methods: {
    async fetchData() {
      try {
        const { serializedShips, serializedTurrets } = await this.$api.http(
          "/v2/ships-turrets"
        );
        const turrets = new ClientTurrets();
        await turrets.init(serializedTurrets);
        const ships = new ClientShips(turrets);
        await ships.init(serializedShips);
        this.clientShips = ships
      } catch (error) {
        this.error = error.message
      }
    },

    updateStats() {
      if (!this.clientShips) return
      this.shipsList = []
      for (const [_, ship] of Object.entries(this.clientShips.all())) {
        if (turretsIncludesTurretName(ship.weapons.turrets.turrets, this.$route.params.turret)) {
          this.shipsList.push(ship.name)
        }
      }
      this.shipsList.sort()
      this.loaded = true
    }
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
