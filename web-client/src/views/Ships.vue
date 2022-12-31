<template>
  <v-container>
    <v-row class="pb-5">
      <v-col
        shrink
        style="flex-grow: 0; white-space: nowrap;"
      >
        <div style="display: flex; height: 100%; align-items: center;">
          <h2>Ship Index</h2>
        </div>
      </v-col>
      <v-col>
        <v-text-field
          v-model="tableSearch"
          append-icon="mdi-magnify"
          label="Search"
          class="mx-4"
          outlined
          hide-details
          dense
        />
      </v-col>
    </v-row>
    <v-row v-if="error">
      {{ error }}
    </v-row>
    <div v-else>
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
              />
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
              />
            </template>
          </v-slider>
        </v-col>
      </v-row>
      <v-data-table
        hide-default-footer
        group-by="Class"
        dense
        :sort-by="sortBy"
        :sort-desc="[false, true]"
        :group-desc="true"
        :headers="tableHeaders"
        :items="shipTable"
        :items-per-page="shipTable.length"
        :search="tableSearch"
        :loading="shipTable.length === 0"
        @update:sort-by="sortUpdate"
      >
        <template
          v-slot:item.name="{ item }"
        >
          <router-link
            class="shiplink"
            :to="`/ships/${encodeURIComponent(item.name)}`"
          >
            <span
              v-if="item.limited"
              class="limited"
            >{{ item.name }}</span>
            <span v-else>{{ item.name }}</span>
          </router-link>
        </template>
      </v-data-table>
    </div>
  </v-container>
</template>

<script>
import Worker from 'worker-loader!@/shipTableCalculator.js'

const worker = new Worker()

export default {
  name: 'Ships',
  components: {},
  data () {
    return {
      error: null,
      ships: null,
      shipTable: [],
      range: 0,
      loyalty: 0,
      tableHeaders: [
        {
          text: 'Name',
          value: 'name'
        },
        {
          text: 'Average DPS',
          value: 'dps.average',
          filterable: false
        },

        {
          text: 'Shield',
          value: 'hp.shield',
          filterable: false
        },
        {
          text: 'Hull',
          value: 'hp.hull',
          filterable: false
        },
        {
          text: 'Total HP',
          value: 'hp.combined',
          filterable: false
        },
        {
          text: 'Top Speed',
          value: 'speed.top',
          filterable: false
        },
        {
          text: 'Acceleration',
          value: 'speed.acceleration',
          filterable: false
        },
        {
          text: 'Turn Speed',
          value: 'speed.turn',
          filterable: false
        },
        {
          text: 'Shield DPS',
          value: 'dps.shield',
          filterable: false
        },
        {
          text: 'Hull DPS',
          value: 'dps.hull',
          filterable: false
        },
        {
          text: 'DPS w/ Fighters',
          value: 'dps.fighters',
          filterable: false
        },
        {
          text: 'Alpha',
          value: 'alpha',
          filterable: false
        }
      ],
      tableSearch: '',
      sortBy: ['limited', 'dps.average']
    }
  },
  watch: {
    loyalty() { this.updateShipTable() },
    range() { this.updateShipTable() }
  },
  mounted () {
    (async () => {
      await this.updateShips()
      await this.updateShipTable()

      worker.onmessage = e => {
        this.shipTable = e.data
          .filter(ship => {
            if (this.$route.query.class) {
              if (ship.Class.trim() !== this.$route.query.class) return false
            }
            return true
          })
        if (this.shipTable.length === 0) {
          if (this.$route.query.test === 'true') this.error = 'You must be a developer to see test ships.'
          else this.error = 'No ships found; open an issue or ticket please.'
        }
      }
    })()
  },
  methods: {
    async updateShips () {
      const { serializedShips, serializedTurrets } = await this.$api.http('/v2/ships-turrets')
      worker.postMessage(['init', { serializedShips, serializedTurrets }])
    },

    async updateShipTable() {
      worker.postMessage(['calculate', {
        range: this.range,
        loyalty: this.loyalty / 100,
        test: this.$route.query.test === 'true'
      }])
    },

    sortUpdate(sort) {
      if (!sort.length) {
        this.sortBy = ['limited', 'dps.average']
        return
      }
      if (sort.length === 1 && sort[0] === 'limited') {
        this.sortBy = ['limited', 'dps.average']
      }
      if (sort[0] === 'limited') return
      this.sortBy = ['limited', sort[sort.length - 1]]
    }
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

  a.shiplink {
    text-decoration: none;
    color: #dedede;
  }
</style>
