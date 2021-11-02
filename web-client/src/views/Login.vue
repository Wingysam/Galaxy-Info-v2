<template>
  <v-container>
    <div v-if="discordResponse">
      <v-row class="text-center" v-if="discordResponse.error">
        <redirect v-if="discordResponse.error === 'access_denied'" to="/"/>
        <div v-else>
          <v-col cols="12">
            <v-img
              :src="require('../assets/logo.png')"
              class="my-3"
              contain
              height="200"
            />
          </v-col>

          <v-col class="mb-4">
            <h1 class="display-2 font-weight-bold mb-3">Discord Error</h1>

            <p class="subheading font-weight-regular">
              {{ discordResponse.error_description }}
            </p>

            <v-btn color="primary" to="/">Back to home page</v-btn>
          </v-col>
        </div>
      </v-row>
      <v-row v-else-if="discordResponse.access_token">
        <v-col>
          got a code: {{discordResponse.access_token}}
        </v-col>
      </v-row>
      <redirect v-else href="https://discord.com/api/oauth2/authorize?client_id=745790085789909033&redirect_uri=http%3A%2F%2F192.168.1.32%3A8083%2Flogin&response_type=token&scope=identify%20guilds"/>
    </div>
  </v-container>
</template>
<script>
import redirect from '@/components/Redirect.vue'

export default {
  name: 'Login',
  components: { redirect },
  data() {
    return {
      query: this.$route.query,
      discordResponse: null
    }
  },
  mounted() {
    // #a=b&b=c -> {a: 'b', b: 'c'}
    this.discordResponse = location.hash
      .substr(1)
      .split('&')
      .map(chunk => chunk.split('='))
      .reduce((result, item) => {
        result[item[0]] = item[1]
        return result
      }, {})

    ;(async () => {
      const token = this.discordResponse?.access_token
      if (!token) return

      this.$store.commit('setToken', token)

      this.$router.push('/')
    })()
  }
};
</script>
