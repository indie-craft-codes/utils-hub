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
    path: '/converter/metadata',
    name: 'ImageMetadata',
    component: () => import('../views/converter/ImageMetadata.vue')
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
    path: '/games/fortune',
    name: 'DailyFortune',
    component: () => import('../views/games/DailyFortune.vue')
  },
  {
    path: '/games/mbti',
    name: 'MbtiTest',
    component: () => import('../views/games/MbtiTest.vue')
  },
  {
    path: '/games/teto-egen',
    name: 'TetoEgenTest',
    component: () => import('../views/games/TetoEgenTest.vue')
  },
  {
    path: '/developer/password',
    name: 'PasswordGenerator',
    component: () => import('../views/developer/PasswordGenerator.vue')
  },
  {
    path: '/calculator/dday',
    name: 'DdayCalculator',
    component: () => import('../views/calculator/DdayCalculator.vue')
  },
  {
    path: '/calculator/unit',
    name: 'UnitConverter',
    component: () => import('../views/calculator/UnitConverter.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/Privacy.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// SPA 라우팅 시 광고 새로고침
router.afterEach(() => {
  setTimeout(() => {
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (e) {
      // 이미 로드된 광고는 무시
    }
  }, 100)
})

export default router
