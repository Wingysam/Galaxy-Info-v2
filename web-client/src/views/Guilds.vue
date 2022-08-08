<template>
  <v-container>
    <v-row>
      <v-col
        shrink
        style="flex-grow: 0; white-space: nowrap;"
      >
        <h2>Guild Configuration</h2>
        <p>Select a guild to configure.</p>
      </v-col>
      <v-col>
        <v-btn
          style="top: 25%"
          :loading="loadBar"
          :disabled="loadBar"
          @click="updateGuilds"
        >
          Refresh
        </v-btn>
      </v-col>
    </v-row>
    <h3>Update</h3>
    <GuildsSection :guilds="guilds.botGuilds" />
    <h3>Setup</h3>
    <GuildsSection
      :guilds="guilds.userGuilds"
      invite="https://discord.com/oauth2/authorize?client_id=745790085789909033&scope=bot&disable_guild_select=true"
    />
  </v-container>
</template>

<script>
import GuildsSection from '@/components/GuildsSection.vue'

export default {
  name: 'Guilds',
  components: { GuildsSection },
  data () {
    return {
      guilds: {
        botGuilds: [],
        userGuilds: []
      },
      loadBar: false
    }
  },
  mounted () {
    this.updateGuilds()
  },
  methods: {
    async updateGuilds () {
      this.loadBar = true

      const discordUser = this.$store.state.discordUser || await this.$store.state.fetchDiscordUser({ login: true })
      if (!discordUser) return console.log({ discordUser })

      const updatableGuilds = await this.$api.http('/v2/updatableGuilds')
      this.guilds = updatableGuilds

      this.loadBar = false
    }
  }
}
</script>