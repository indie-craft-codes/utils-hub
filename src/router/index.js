import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/games/ladder',
    name: 'LadderGame',
    component: () => import('../views/games/LadderGame.vue')
  },
  {
    path: '/developer/json',
    name: 'JsonParser',
    component: () => import('../views/developer/JsonParser.vue')
  },
  {
    path: '/text/tools',
    name: 'TextTools',
    component: () => import('../views/text/TextTools.vue')
  },
  {
    path: '/converter/image',
    name: 'ImageConverter',
    component: () => import('../views/converter/ImageConverter.vue')
  },
  {
    path: '/converter/qrcode',
    name: 'QRCodeGenerator',
    component: () => import('../views/converter/QRCodeGenerator.vue')
  },
  {
    path: '/developer/uuid',
    name: 'UUIDGenerator',
    component: () => import('../views/developer/UUIDGenerator.vue')
  },
  {
    path: '/developer/timestamp',
    name: 'TimestampConverter',
    component: () => import('../views/developer/TimestampConverter.vue')
  },
  {
    path: '/games/number',
    name: 'NumberPicker',
    component: () => import('../views/games/NumberPicker.vue')
  },
  {
    path: '/games/team',
    name: 'TeamDivider',
    component: () => import('../views/games/TeamDivider.vue')
  },
  {
    path: '/developer/password',
    name: 'PasswordGenerator',
    component: () => import('../views/developer/PasswordGenerator.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
