import { createRouter, createWebHistory } from 'vue-router'
import { trackPageView } from '../utils/analytics'

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
    path: '/games/roulette',
    name: 'RouletteWheel',
    component: () => import('../views/games/RouletteWheel.vue')
  },
  {
    path: '/developer/password',
    name: 'PasswordGenerator',
    component: () => import('../views/developer/PasswordGenerator.vue')
  },
  {
    path: '/developer/jwt',
    name: 'JwtParser',
    component: () => import('../views/developer/JwtParser.vue')
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
    path: '/calculator/korean-age',
    name: 'KoreanAgeCalculator',
    component: () => import('../views/calculator/KoreanAgeCalculator.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/Privacy.vue')
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../views/Terms.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// SPA 라우팅 시 페이지 뷰 추적 및 광고 새로고침
router.afterEach((to) => {
  // Google Analytics 페이지 뷰 추적
  const pageTitle = to.name || to.path
  trackPageView(to.path, pageTitle)

  // AdSense 광고 새로고침
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
