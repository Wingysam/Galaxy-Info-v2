<template>
  <v-app>
    <v-app-bar
      app
      dark
    >
      <router-link
        to="/"
        style="text-decoration: none; color: inherit;"
      >
        <div class="d-flex align-center">
          <v-img
            alt="Galaxy Info Logo"
            class="shrink mr-2"
            contain
            :src="require('@/assets/logo.png')"
            transition="scale-transition"
            width="30"
          />

          <span>
            <v-toolbar-title class="headline">Galaxy Info</v-toolbar-title>
          </span>
        </div>
      </router-link>

      <v-spacer />

      <div v-if="$store.state.discordUser">
        <v-btn
          color="blurple"
          :loading="loggingOut"
          @click="logOut"
        >
          <span>Log Out&nbsp;</span>
          <v-img
            alt="Your Discord Avatar"
            :src="`https://cdn.discordapp.com/avatars/${$store.state.discordUser.id}/${$store.state.discordUser.avatar}.png?size=512`"
            width="30"
            transition="slide-y-transition"
          />
        </v-btn>
      </div>

      <v-btn
        v-else-if="$store.state.discordUser === false"
        :to="`/login?next=${encodeURIComponent(window.location.pathname)}`"
        color="blurple"
      >
        <span class="mr-2">Log In</span>
        <v-icon>mdi-discord</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      window,
      loggingOut: false
    }
  },
  methods: {
    async logOut () {
      this.loggingOut = true
      await this.$api.http('/v2/logout')
      this.$store.commit('setToken', null)
    }
  }
}
</script>

<style lang="scss">
#app {
  color: #dedede;
}
</style>
