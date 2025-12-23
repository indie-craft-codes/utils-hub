// 카테고리 및 도구 데이터 중앙 관리

export const categories = [
  {
    id: 'games',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    color: 'bg-pink-500',
    tools: [
      { id: 'roulette', route: '/games/roulette', icon: '🎡' },
      { id: 'ladder', route: '/games/ladder', icon: '🪜' },
      { id: 'numberPicker', route: '/games/number', icon: '🎲' },
      { id: 'teamDivider', route: '/games/team', icon: '👥' },
      { id: 'fortune', route: '/games/fortune', icon: '🔮' },
      { id: 'mbti', route: '/games/mbti', icon: '🧠' },
      { id: 'tetoEgen', route: '/games/teto-egen', icon: '🎭' }
    ]
  },
  {
    id: 'developer',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>`,
    color: 'bg-blue-500',
    tools: [
      { id: 'json', route: '/developer/json', icon: '{ }' },
      { id: 'uuid', route: '/developer/uuid', icon: '🔑' },
      { id: 'timestamp', route: '/developer/timestamp', icon: '⏱️' },
      { id: 'password', route: '/developer/password', icon: '🔒' }
    ]
  },
  {
    id: 'converter',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>`,
    color: 'bg-green-500',
    tools: [
      { id: 'converter', route: '/converter/image', icon: '🖼️' },
      { id: 'qrcode', route: '/converter/qrcode', icon: '📱' },
      { id: 'metadata', route: '/converter/metadata', icon: '🔍' }
    ]
  },
  {
    id: 'text',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>`,
    color: 'bg-purple-500',
    tools: [
      { id: 'text', route: '/text/tools', icon: 'Aa' }
    ]
  },
  {
    id: 'calculator',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>`,
    color: 'bg-orange-500',
    tools: [
      { id: 'dday', route: '/calculator/dday', icon: '📅' },
      { id: 'unit', route: '/calculator/unit', icon: '📐' },
      { id: 'koreanAge', route: '/calculator/korean-age', icon: '👶' }
    ]
  }
]

// 현재 라우트로 카테고리 찾기
export function findCategoryByRoute(route) {
  for (const category of categories) {
    const tool = category.tools.find(t => t.route === route)
    if (tool) {
      return { category, tool }
    }
  }
  return null
}

// 카테고리 ID로 카테고리 찾기
export function getCategoryById(categoryId) {
  return categories.find(c => c.id === categoryId)
}
