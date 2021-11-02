<template>
  <v-app>
    <v-app-bar
      app
      dark
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

      <v-spacer></v-spacer>

      <v-btn
        href="https://discord.com/api/oauth2/authorize?client_id=745790085789909033&redirect_uri=http%3A%2F%2F192.168.1.32%3A8083%2F&response_type=code&scope=identify%20guilds"
        color="blurple"
      >
        <span class="mr-2">Log In</span>
        <v-icon>mdi-discord</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<style lang="scss">
#app {
  color: #dedede;
}
</style>
