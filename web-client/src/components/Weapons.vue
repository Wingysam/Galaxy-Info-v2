<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="weapons"
      :items-per-page="weapons.length"
      sort-by="dps.average"
      :sort-desc="true"
      hide-default-footer
      class="weapons-table"
    />
  </v-container>
</template>

<style scoped>
  .weapons-table {
    white-space: pre;
  }
</style>

<script>
export default {
  name: 'Weapons',
  props: {
    weapons: {
      type: Array,
      default () { return [] }
    }
  },
  data () {
    return {
      headers: [
        {
          text: 'Weapon',
          value: 'name',
          width: '30em',
          sortable: false
        },
        {
          text: 'Average DPS',
          value: 'dps.average',
          sortable: false
        },
        {
          text: 'Shield DPS',
          value: 'dps.shield',
          sortable: false
        },
        {
          text: 'Hull DPS',
          value: 'dps.hull',
          sortable: false
        },
        {
          text: 'Max Alpha',
          value: 'alpha.max',
          sortable: false
        },
        {
          text: 'Shield Alpha',
          value: 'alpha.shield',
          sortable: false
        },
        {
          text: 'Hull Alpha',
          value: 'alpha.hull',
          sortable: false
        },
        {
          text: 'Interval',
          value: 'interval',
          sortable: false
        },
        {
          text: 'Reload',
          value: 'reload',
          sortable: false
        }
      ]
    }
  }
}
</script>
