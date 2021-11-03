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
    discordUser: null,
    async fetchDiscordUser() {
      if (!store.state.discordToken) {
        store.commit('setDiscordUser', false)
        router.push('/')
        return false
      }
      const userData = await (await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
          Authorization: 'Bearer ' + store.state.discordToken
        }
      })).json()
    
      if (userData.errors) return store.commit('setToken', null)
      store.commit('setDiscordUser', userData)
      return userData
    }
  },
  mutations: {
    setToken (state, token) {
      state.discordToken = token
      localStorage.setItem('discordToken', JSON.stringify(token))
      store.state.fetchDiscordUser()
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

if (location.pathname !== '/login') store.state.fetchDiscordUser()