<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title>{{ title }}</v-card-title>
      <v-list dense>
        <v-list-item
          v-for="[k, v] in processed"
          :key="k"
        >
          <v-list-item-content>{{ k }}</v-list-item-content>
          <v-list-item-content class="align-end">
            {{ v }}
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'DataCard',
  props: {
    title: {
      type: String,
      default: 'Data'
    },
    data: {
      type: Array,
      default () { return [] }
    }
  },
  computed: {
    processed () {
      return this.data
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => {
          if (v === true) v = 'Yes'
          if (v === false) v = 'No'
          if (typeof v === 'number') v = v.toLocaleString()
          return [k, v]
        })
    }
  }
}
</script>

<style>
  .recentkills_nowrap {
    white-space: nowrap;
  }
</style>