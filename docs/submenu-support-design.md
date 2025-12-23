# 서브메뉴 지원 기획서

## 📋 개요

현재 Utils Hub는 홈 페이지에서만 모든 카테고리와 도구를 보여주고 있습니다. 이 기획은 각 카테고리별로 중간 페이지를 추가하여 사용자가 카테고리를 선택한 후 해당 카테고리의 도구들을 더 명확하게 탐색할 수 있도록 개선하는 것입니다.

## 🎯 목표

1. **계층적 네비게이션**: 홈 → 카테고리 → 도구의 3단계 구조 제공
2. **카테고리별 페이지**: 각 카테고리마다 전용 랜딩 페이지 제공
3. **더 나은 UX**: 사용자가 원하는 도구를 더 쉽게 찾을 수 있도록 개선
4. **확장성**: 향후 카테고리와 도구가 늘어나도 관리하기 용이한 구조

## 🏗️ 현재 구조

```
홈 (/home)
├── 게임 카테고리
│   ├── 룰렛 (/games/roulette)
│   ├── 사다리타기 (/games/ladder)
│   └── ...
├── 개발자 도구 카테고리
│   ├── JSON Parser (/developer/json)
│   └── ...
└── 기타 카테고리...
```

**문제점:**
- 홈에서 바로 개별 도구로 이동만 가능
- 카테고리 자체를 탐색할 수 있는 페이지가 없음
- 카테고리별 설명이나 추가 정보를 제공할 공간 부족

## 🎨 새로운 구조

```
홈 (/)
├── 게임 카테고리 페이지 (/games)
│   ├── 카테고리 소개
│   ├── 도구 목록
│   │   ├── 룰렛 (/games/roulette)
│   │   ├── 사다리타기 (/games/ladder)
│   │   └── ...
│   └── 뒤로가기 (홈으로)
├── 개발자 도구 페이지 (/developer)
│   ├── 카테고리 소개
│   ├── 도구 목록
│   │   ├── JSON Parser (/developer/json)
│   │   ├── UUID Generator (/developer/uuid)
│   │   └── ...
│   └── 뒤로가기 (홈으로)
└── 기타 카테고리...
```

**개선점:**
- 각 카테고리를 클릭하면 해당 카테고리 페이지로 이동
- 카테고리 페이지에서 해당 카테고리의 모든 도구를 한눈에 확인
- 카테고리별 설명, 특징, 사용 가이드 제공 가능
- 홈에서는 카테고리 목록만 간단히 표시

## 📐 UI/UX 설계

### 1. 홈 페이지 변경사항

**Before:**
- 카테고리 헤더 + 도구 리스트
- 도구 클릭 시 도구 페이지로 이동

**After:**
- 카테고리 카드 형식
- 카테고리 클릭 시 카테고리 페이지로 이동
- 각 카테고리 카드에는:
  - 카테고리 아이콘 및 이름
  - 간단한 설명
  - 포함된 도구 개수
  - "더 보기" 또는 화살표 아이콘

### 2. 카테고리 페이지 (신규)

**레이아웃:**
```
┌─────────────────────────────────────┐
│ ← 홈으로                            │
├─────────────────────────────────────┤
│ [아이콘] 카테고리 이름               │
│ 카테고리 설명                        │
├─────────────────────────────────────┤
│ 도구 목록 (그리드 레이아웃)         │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │도구1 │ │도구2 │ │도구3 │         │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐                  │
│ │도구4 │ │도구5 │                  │
│ └──────┘ └──────┘                  │
└─────────────────────────────────────┘
```

**포함 요소:**
- 상단 네비게이션 (홈으로 돌아가기 버튼)
- 카테고리 헤더
  - 아이콘
  - 카테고리 이름
  - 설명
  - 도구 개수
- 도구 그리드
  - 각 도구 카드 (아이콘, 이름, 설명)
  - 호버 효과
  - 클릭 시 해당 도구 페이지로 이동

## 🛣️ 라우팅 구조

### 새로 추가될 라우트

```javascript
// 카테고리 페이지들
{
  path: '/games',
  name: 'GamesCategory',
  component: () => import('../views/categories/GamesCategory.vue')
},
{
  path: '/developer',
  name: 'DeveloperCategory',
  component: () => import('../views/categories/DeveloperCategory.vue')
},
{
  path: '/converter',
  name: 'ConverterCategory',
  component: () => import('../views/categories/ConverterCategory.vue')
},
{
  path: '/text',
  name: 'TextCategory',
  component: () => import('../views/categories/TextCategory.vue')
},
{
  path: '/calculator',
  name: 'CalculatorCategory',
  component: () => import('../views/categories/CalculatorCategory.vue')
}
```

### 기존 도구 라우트 유지

모든 기존 도구 페이지 경로는 그대로 유지:
- `/games/roulette`
- `/developer/json`
- 등등...

## 💾 데이터 구조

### categories.js (신규 파일)

카테고리 및 도구 정보를 중앙에서 관리:

```javascript
export const categories = [
  {
    id: 'games',
    route: '/games',
    icon: '...',
    color: 'bg-pink-500',
    tools: [
      {
        id: 'roulette',
        route: '/games/roulette',
        icon: '🎡'
      },
      // ...
    ]
  },
  // ...
]
```

### i18n 추가 키

```json
{
  "categories": {
    "games": {
      "title": "게임 / 랜덤",
      "description": "재미있는 게임과 랜덤 선택 도구 모음",
      "toolCount": "{count}개의 도구"
    },
    "developer": {
      "title": "개발자 도구",
      "description": "개발 작업을 위한 유용한 도구 모음",
      "toolCount": "{count}개의 도구"
    },
    // ...
  },
  "navigation": {
    "backToHome": "홈으로",
    "viewAll": "전체 보기",
    "selectTool": "도구를 선택하세요"
  }
}
```

## 🎨 컴포넌트 구조

### 1. CategoryPage.vue (재사용 가능한 범용 컴포넌트)

Props로 카테고리 ID를 받아서 해당 카테고리 정보를 표시:

```vue
<template>
  <div class="category-page">
    <CategoryHeader :category="category" />
    <ToolsGrid :tools="category.tools" />
  </div>
</template>
```

**또는 각 카테고리별 개별 컴포넌트:**

- `GamesCategory.vue`
- `DeveloperCategory.vue`
- `ConverterCategory.vue`
- `TextCategory.vue`
- `CalculatorCategory.vue`

→ **추천: 범용 컴포넌트 사용 (유지보수 용이)**

### 2. 하위 컴포넌트

- `CategoryHeader.vue`: 카테고리 헤더 (아이콘, 제목, 설명)
- `ToolCard.vue`: 개별 도구 카드 (재사용)

## 🔄 사용자 플로우

### 시나리오 1: 카테고리 탐색
1. 사용자가 홈 페이지 접속
2. "게임 / 랜덤" 카테고리 카드 클릭
3. `/games` 페이지로 이동
4. 게임 카테고리의 모든 도구 확인
5. "룰렛" 도구 클릭
6. `/games/roulette` 페이지로 이동

### 시나리오 2: 직접 도구 접근 (기존과 동일)
1. 사용자가 URL `/developer/json` 직접 접속
2. JSON Parser 페이지 바로 표시

### 시나리오 3: 뒤로가기
1. 도구 페이지 (`/games/roulette`)에서 뒤로가기
2. 카테고리 페이지 (`/games`)로 이동 **또는** 홈으로 이동
   - → **선택 필요**: 브레드크럼 추가 고려

## 🚀 구현 단계

### Phase 1: 기본 구조 (v1.0)
- [ ] `CategoryPage.vue` 범용 컴포넌트 생성
- [ ] 카테고리 라우트 추가
- [ ] 홈 페이지에서 카테고리 클릭 시 카테고리 페이지로 이동하도록 수정
- [ ] i18n 다국어 키 추가

### Phase 2: UI 개선 (v1.1)
- [ ] 카테고리 페이지 디자인 개선
- [ ] 호버 효과, 애니메이션 추가
- [ ] 반응형 레이아웃 최적화

### Phase 3: 추가 기능 (v2.0)
- [ ] 브레드크럼 네비게이션 추가
- [ ] 카테고리별 검색 기능
- [ ] 인기 도구 / 최근 추가 도구 뱃지

## ✅ 체크리스트

### 개발
- [ ] `src/data/categories.js` 생성 (카테고리 데이터 중앙 관리)
- [ ] `src/views/categories/CategoryPage.vue` 생성
- [ ] `src/router/index.js`에 카테고리 라우트 추가
- [ ] `src/views/Home.vue` 수정 (카테고리 클릭 시 카테고리 페이지로 이동)
- [ ] `src/i18n/ko.json`, `src/i18n/en.json` 업데이트

### 테스트
- [ ] 홈 → 카테고리 → 도구 네비게이션 테스트
- [ ] 직접 URL 접근 테스트
- [ ] 브라우저 뒤로가기/앞으로가기 테스트
- [ ] 모바일 반응형 테스트

### 문서
- [ ] README 업데이트
- [ ] 사용자 가이드 업데이트 (필요 시)

## 🎯 기대 효과

1. **개선된 정보 구조**: 사용자가 도구를 더 쉽게 찾을 수 있음
2. **확장성**: 새로운 카테고리나 도구 추가가 용이
3. **SEO 개선**: 카테고리별 페이지로 검색 노출 증가
4. **사용자 참여 증가**: 카테고리 탐색을 통한 도구 발견 기회 증가

## 📌 참고사항

- 기존 URL 구조는 모두 유지 (SEO 영향 없음)
- 모든 도구 페이지는 카테고리 페이지를 거치지 않고도 직접 접근 가능
- 카테고리 페이지는 선택적 탐색 경로 제공

---

**작성일**: 2025-12-23
**버전**: 1.0
**상태**: 기획 완료, 구현 대기
