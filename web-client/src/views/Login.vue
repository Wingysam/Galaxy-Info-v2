<template>
  <v-container>
    <div v-if="discordResponse">
      <v-row
        v-if="discordResponse.error"
        class="text-center"
      >
        <redirect
          v-if="discordResponse.error === 'access_denied'"
          tso="/"
        />
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
            <h1 class="display-2 font-weight-bold mb-3">
              Discord Error
            </h1>

            <p class="subheading font-weight-regular">
              {{ discordResponse.error_description }}
            </p>

            <v-btn
              color="primary"
              to="/"
            >
              Back to home page
            </v-btn>
          </v-col>
        </div>
      </v-row>
      <v-row v-else-if="discordResponse.access_token">
        <v-col>
          Logged in, redirecting.
        </v-col>
      </v-row>
      <redirect
        v-else
        :href="`https://discord.com/api/oauth2/authorize?client_id=1167172912533483540&redirect_uri=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/login`)}&response_type=token&scope=identify%20guilds`"
      />
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
      discordResponse: null,
      window
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


    if (this.$route.query.next) localStorage.setItem('login.next', this.$route.query.next)

    ;(async () => {
      const token = this.discordResponse?.access_token
      if (!token) return console.log('no token')
      console.log('has token')

      this.$store.commit('setToken', token)

      const next = localStorage.getItem('login.next')
      this.$router.push(next ?? '/')
    })()
  }
};
</script>
