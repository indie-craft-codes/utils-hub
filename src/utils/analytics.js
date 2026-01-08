// Firebase 설정 (클라이언트에서만 초기화)
const firebaseConfig = {
  apiKey: "AIzaSyBAUlUusX5g2HEIlReXplvmoUkNprMmcek",
  authDomain: "utils-hub.firebaseapp.com",
  projectId: "utils-hub",
  storageBucket: "utils-hub.firebasestorage.app",
  messagingSenderId: "837485702440",
  appId: "1:837485702440:web:53395f0e532d3f20fdb41d",
  measurementId: "G-P9R4JCL6WD"
}

let analytics = null
let isInitialized = false

// Firebase 초기화 (클라이언트에서만 실행)
async function initFirebase() {
  if (isInitialized || typeof window === 'undefined') return

  try {
    const { initializeApp } = await import('firebase/app')
    const { getAnalytics } = await import('firebase/analytics')

    const app = initializeApp(firebaseConfig)
    analytics = getAnalytics(app)
    isInitialized = true
  } catch (error) {
    console.error('Firebase Analytics 초기화 실패:', error)
  }
}

// 모듈 로드 시 자동 초기화
initFirebase()

/**
 * 페이지 뷰 이벤트 추적
 * @param {string} pagePath - 페이지 경로
 * @param {string} pageTitle - 페이지 제목
 */
export async function trackPageView(pagePath, pageTitle) {
  if (typeof window === 'undefined') return

  try {
    if (!analytics) await initFirebase()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href
    })
  } catch (error) {
    console.error('페이지 뷰 추적 실패:', error)
  }
}

/**
 * 도구 사용 이벤트 추적
 * @param {string} toolName - 도구 이름
 * @param {Object} params - 추가 매개변수
 */
export async function trackToolUsage(toolName, params = {}) {
  if (typeof window === 'undefined') return

  try {
    if (!analytics) await initFirebase()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, 'tool_usage', {
      tool_name: toolName,
      ...params
    })
  } catch (error) {
    console.error('도구 사용 추적 실패:', error)
  }
}

/**
 * 커스텀 이벤트 추적
 * @param {string} eventName - 이벤트 이름
 * @param {Object} params - 이벤트 매개변수
 */
export async function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return

  try {
    if (!analytics) await initFirebase()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, eventName, params)
  } catch (error) {
    console.error('이벤트 추적 실패:', error)
  }
}

/**
 * 버튼 클릭 이벤트 추적
 * @param {string} buttonName - 버튼 이름
 * @param {Object} params - 추가 매개변수
 */
export async function trackButtonClick(buttonName, params = {}) {
  if (typeof window === 'undefined') return

  try {
    if (!analytics) await initFirebase()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, 'button_click', {
      button_name: buttonName,
      ...params
    })
  } catch (error) {
    console.error('버튼 클릭 추적 실패:', error)
  }
}

/**
 * 파일 변환 이벤트 추적
 * @param {string} conversionType - 변환 유형 (예: 'image_to_webp', 'json_parse')
 * @param {Object} params - 추가 매개변수
 */
export async function trackConversion(conversionType, params = {}) {
  if (typeof window === 'undefined') return

  try {
    if (!analytics) await initFirebase()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, 'conversion_complete', {
      conversion_type: conversionType,
      ...params
    })
  } catch (error) {
    console.error('변환 추적 실패:', error)
  }
}

/**
 * 에러 이벤트 추적
 * @param {string} errorType - 에러 유형
 * @param {string} errorMessage - 에러 메시지
 */
export async function trackError(errorType, errorMessage) {
  if (typeof window === 'undefined') return

  try {
    if (!analytics) await initFirebase()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, 'error_occurred', {
      error_type: errorType,
      error_message: errorMessage
    })
  } catch (error) {
    console.error('에러 추적 실패:', error)
  }
}

export default {
  trackPageView,
  trackToolUsage,
  trackEvent,
  trackButtonClick,
  trackConversion,
  trackError
}
