<template>
  <v-container>
    <v-row class="pb-5">
      <v-col
        shrink
        style="flex-grow: 0; white-space: nowrap;"
      >
        <div style="display: flex; height: 100%; align-items: center;">
          <h2>Turret Index</h2>
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
      <v-switch
        v-model="splitByGroup"
        label="Split by Group"
      />
      <v-row>
        <v-col>
          <v-slider
            v-model="range"
            :min="0"
            :max="10000"
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
        <v-col>
          <v-slider
            v-model="absoluteVelocity"
            :min="0"
            :max="380 * 2"
            label="Absolute Velocity"
            class="align-center"
          >
            <template v-slot:append>
              <v-text-field
                v-model="absoluteVelocity"
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
        :group-by="splitByGroup ? 'Group' : undefined"
        dense
        :sort-by="sortBy"
        :sort-desc="[true]"
        :group-desc="true"
        :headers="tableHeaders"
        :items="turretTable"
        :items-per-page="turretTable.length"
        :search="tableSearch"
        :loading="turretTable.length === 0"
        @update:sort-by="sortUpdate"
      >
        <template
          v-slot:item.name="{ item }"
        >
          <router-link
            class="turretlink"
            :to="`/turrets/${encodeURIComponent(item.name)}`"
          >
            {{ item.name }}
          </router-link>
        </template>
      </v-data-table>
    </div>
  </v-container>
</template>

<script>
import Worker from 'worker-loader!@/turretTableCalculator.js'

const worker = new Worker()

export default {
  name: 'Turrets',
  components: {},
  data () {
    return {
      error: null,
      turrets: null,
      turretTable: [],
      range: 0,
      loyalty: 0,
      absoluteVelocity: 0,
      splitByGroup: true,
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
          text: 'Alpha',
          value: 'alpha',
          filterable: false
        },
        {
          text: 'Reload',
          value: 'reload',
          filterable: false
        },
        {
          text: 'Range',
          value: 'range',
          filterable: false
        },
        {
          text: 'Accuracy Deviation',
          value: 'accuracyDeviation',
          filterable: false
        },
        {
          text: 'Size',
          value: 'size',
        },
        {
          text: 'Class',
          value: 'turretClass'
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
        }
      ],
      tableSearch: '',
      sortBy: ['dps.average']
    }
  },
  watch: {
    loyalty() { this.updateturretTable() },
    range() { this.updateturretTable() },
    absoluteVelocity() { this.updateturretTable() }
  },
  mounted () {
    (async () => {
      await this.updateTurrets()
      await this.updateturretTable()

      worker.onmessage = e => {
        this.turretTable = e.data
        if (e.data.length === 0) {
          if (this.$route.query.test === 'true') this.error = 'You must be a developer to see test turrets.'
          else this.error = 'No turrets found; open an issue or ticket please.'
        }
      }
    })()
  },
  methods: {
    async updateTurrets () {
      const { serializedTurrets } = await this.$api.http('/v2/ships-turrets')
      worker.postMessage(['init', { serializedTurrets }])
    },

    async updateturretTable() {
      worker.postMessage(['calculate', {
        range: this.range,
        loyalty: this.loyalty / 100,
        absoluteVelocity: this.absoluteVelocity,
        test: this.$route.query.test === 'true'
      }])
    },

    sortUpdate(sort) {
      if (!sort.length) {
        this.sortBy = ['dps.average']
        return
      }
      this.sortBy = sort
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

  a.turretlink {
    text-decoration: none;
    color: #dedede;
  }
</style>
