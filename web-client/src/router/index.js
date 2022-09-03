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
    path: '/commands',
    name: 'Commands',
    component: () => import(/* webpackChunkName: "login" */ '@/views/Commands.vue')
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
  },
  {
    path: '/ships',
    name: 'Ships',
    component: () => import(/* webpackChunkName: "ships" */ '@/views/Ships.vue')
  },
  {
    path: '/ships/:ship',
    name: 'Ship',
    component: () => import(/* webpackChunkName: "ship" */ '@/views/Ship.vue')
  },
  {
    path: '/turrets',
    name: 'Turrets',
    component: () => import(/* webpackChunkName: "turrets" */ '@/views/Turrets.vue')
  },
  {
    path: '/kills',
    name: 'Kills',
    component: () => import(/* webpackChunkName: "kills" */ '@/views/Kills.vue')
  },
  {
    path: '/kills/:kill',
    name: 'Kill',
    component: () => import(/* webpackChunkName: "kill" */ '@/views/Kill.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
