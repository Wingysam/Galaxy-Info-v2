<template>
  <v-container>
    <p>Total Carnage: ${{ carnage ? carnage.toLocaleString() : '0' }}</p>
    <v-data-table
      :headers="headers"
      :items="kills"
      :loading="!loaded"
    />
  </v-container>
</template>

<script>
import * as dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default {
  name: 'RecentKills',
  props: {
    killerShip: {
      type: String,
      default: undefined
    },
    victimShip: {
      type: String,
      default: undefined
    }
  },
  data () {
    return {
      kills: [],
      carnage: 0,
      loaded: false,
      headers: [
        {
          text: 'Killer',
          value: 'killer_name',
          sortable: false
        },
        {
          text: "Killer's Ship",
          value: 'killer_ship',
          sortable: false
        },
        {
          text: 'Victim',
          value: 'victim_name',
          sortable: false
        },
        {
          text: "Victim's Ship",
          value: 'victim_ship',
          sortable: false
        },
        {
          text: 'Victim Value',
          value: 'victim_cost',
          sortable: false
        },
        {
          text: 'Date',
          value: 'date',
          sortable: false,
          cellClass: 'recentkills_nowrap'
        }
      ]
    }
  },
  mounted () {
    (async () => {
      const qs = {}
      if (this.killerShip) qs.killer_ship = this.killerShip
      if (this.victimShip) qs.victim_ship = this.victimShip
      const { carnage, kills } = await this.$api.http('/v2/kills', { qs })
      this.kills = kills.map(kill => {
        kill.victim_cost = kill.victim_cost.toLocaleString()
        kill.date = dayjs(kill.date).fromNow()
        return kill
      })
      if (carnage.length > 0) this.carnage = carnage[0].carnage
      this.loaded = true
    })()
  }
}
</script>

<style>
  .recentkills_nowrap {
    white-space: nowrap;
  }
</style>