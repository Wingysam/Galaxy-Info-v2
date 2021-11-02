import Vue from 'vue'
import Vuex from 'vuex'

import App from './App.vue'
import vuetify from './plugins/vuetify'

import router from './router'

Vue.config.productionTip = false

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    discordToken: JSON.parse(localStorage.getItem('discordToken')),
    discordUser: null
  },
  mutations: {
    setToken (state, token) {
      state.discordToken = token
      localStorage.setItem('discordToken', JSON.stringify(token))
      fetchDiscordUser()
    },
    setDiscordUser (state, discordUser) {
      state.discordUser = discordUser
    }
  }
})

new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')

async function fetchDiscordUser() {
  if (!store.state.discordToken) return store.commit('setDiscordUser', false)
  const userRes = await fetch('https://discord.com/api/v9/users/@me', {
    headers: {
      Authorization: 'Bearer ' + store.state.discordToken
    }
  })
  const userData = await userRes.json()

  if (userData.errors) return store.commit('setToken', null)
  store.commit('setDiscordUser', userData)
}
fetchDiscordUser()