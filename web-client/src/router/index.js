import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '@/views/Login.vue')
  },
  {
    path: '/guilds',
    name: 'Guilds',
    component: () => import(/* webpackChunkName: "guilds" */ '@/views/Guilds.vue')
  },
  {
    path: '/guilds/:guildid/:section',
    name: 'Guild',
    component: () => import(/* webpackChunkName: "guild" */ '@/views/Guild.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
