<template>
  <v-container>
    <v-row class="pb-5">
      <v-col shrink style="flex-grow: 0; white-space: nowrap;">
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
        ></v-text-field>
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
        <router-link class="shiplink" :to="`/ships/${encodeURIComponent(item.name)}`">
          <span class="limited" v-if="item.limited">{{ item.name }}</span>
          <span v-else>{{ item.name }}</span>
        </router-link>
      </template>
    </v-data-table>
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
          value: 'dps.average'
        },

        {
          text: 'Shield',
          value: 'hp.shield'
        },
        {
          text: 'Hull',
          value: 'hp.hull'
        },
        {
          text: 'Total HP',
          value: 'hp.combined'
        },
        {
          text: 'Top Speed',
          value: 'speed.top'
        },
        {
          text: 'Acceleration',
          value: 'speed.acceleration'
        },
        {
          text: 'Turn Speed',
          value: 'speed.turn'
        },
        {
          text: 'Shield DPS',
          value: 'dps.shield'
        },
        {
          text: 'Hull DPS',
          value: 'dps.hull'
        },
        {
          text: 'DPS w/ Fighters',
          value: 'dps.fighters'
        },
        {
          text: 'Alpha',
          value: 'alpha'
        }
      ],
      tableSearch: '',
      sortBy: ['limited', 'dps.average']
    }
  },
  mounted () {
    (async () => {
      await this.updateShips()
      await this.updateShipTable()

      worker.onmessage = e => {
        this.shipTable = e.data
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
        loyalty: this.loyalty / 100
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
  },
  watch: {
    loyalty() { this.updateShipTable() },
    range() { this.updateShipTable() }
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
