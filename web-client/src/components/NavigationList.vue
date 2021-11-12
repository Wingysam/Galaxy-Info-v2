<template>
  <div>
    <v-list nav dense>
      <v-list-item-group>
        <div v-for="(item, i) in items" :key="item.to">
          <v-list-item :to="item.to">
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-icon>
              <v-icon>mdi-chevron-right</v-icon>
            </v-list-item-icon>
          </v-list-item>
          <v-divider v-if="i !== items.length - 1"/>
        </div>
      </v-list-item-group>
    </v-list>
  </div>
</template>

<script>
export default {
  name: 'NavigationList',
  props: {
    items: Array
  }
}
</script>
