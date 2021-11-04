<template>
  <v-container>
    <h2>Guild Configuration</h2>
    <p>Select a guild to configure.</p>
    <h3>Update</h3>
    <GuildsSection :guilds="guilds.botGuilds"/>
    <h3>Setup</h3>
    <GuildsSection :guilds="guilds.userGuilds" invite="https://discord.com/oauth2/authorize?client_id=745790085789909033&scope=bot&disable_guild_select=true"/>
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
      }
    }
  },
  mounted () {
    (async () => {
      const discordUser = this.$store.state.discordUser || await this.$store.state.fetchDiscordUser({ login: true })
      if (!discordUser) return console.log({ discordUser })

      const updatableGuilds = await this.$api.http('/v2/updatableGuilds')
      this.guilds = updatableGuilds
    })()
  }
}
</script>