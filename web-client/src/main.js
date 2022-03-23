import Vue from 'vue'
import Vuex from 'vuex'
import { Api } from '@/util/Api'

import App from './App.vue'
import vuetify from './plugins/vuetify'

import router from './router'

Vue.config.productionTip = false

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    discordToken: JSON.parse(localStorage.getItem('discordToken')),
    discordUser: null,
    async fetchDiscordUser(opts = {}) {
      if (!store.state.discordToken) {
        console.log({opts})
        store.commit('setDiscordUser', false)
        if (opts.login && location.pathname === '/login') return false
        else if (!opts.login && location.pathname === '/') return false
        router.push(opts.login ? '/login' : '/')
        return false
      }
      const userData = await (await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
          Authorization: 'Bearer ' + store.state.discordToken
        }
      })).json()
    
      if (userData.message) return store.commit('setToken', null)
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

Vue.prototype.$api = new Api({ store })
new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')

if (location.pathname !== '/login') store.state.fetchDiscordUser()