<template>
  <v-container>
    <RecentKills />
  </v-container>
</template>

<script>
import RecentKills from '@/components/RecentKills.vue'

export default {
  name: 'Kills',
  components: { RecentKills }
}
</script>