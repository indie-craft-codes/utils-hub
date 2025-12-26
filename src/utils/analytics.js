import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js'

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBAUlUusX5g2HEIlReXplvmoUkNprMmcek",
  authDomain: "utils-hub.firebaseapp.com",
  projectId: "utils-hub",
  storageBucket: "utils-hub.firebasestorage.app",
  messagingSenderId: "837485702440",
  appId: "1:837485702440:web:53395f0e532d3f20fdb41d",
  measurementId: "G-P9R4JCL6WD"
}

// Firebase 앱 초기화
let app
let analytics

try {
  app = initializeApp(firebaseConfig)
  analytics = getAnalytics(app)
} catch (error) {
  console.error('Firebase Analytics 초기화 실패:', error)
}

/**
 * 페이지 뷰 이벤트 추적
 * @param {string} pagePath - 페이지 경로
 * @param {string} pageTitle - 페이지 제목
 */
export function trackPageView(pagePath, pageTitle) {
  if (!analytics) return

  try {
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href
    })
    console.log('📊 Page View:', pagePath, pageTitle)
  } catch (error) {
    console.error('페이지 뷰 추적 실패:', error)
  }
}

/**
 * 도구 사용 이벤트 추적
 * @param {string} toolName - 도구 이름
 * @param {Object} params - 추가 매개변수
 */
export function trackToolUsage(toolName, params = {}) {
  if (!analytics) return

  try {
    logEvent(analytics, 'tool_usage', {
      tool_name: toolName,
      ...params
    })
    console.log('🔧 Tool Usage:', toolName, params)
  } catch (error) {
    console.error('도구 사용 추적 실패:', error)
  }
}

/**
 * 커스텀 이벤트 추적
 * @param {string} eventName - 이벤트 이름
 * @param {Object} params - 이벤트 매개변수
 */
export function trackEvent(eventName, params = {}) {
  if (!analytics) return

  try {
    logEvent(analytics, eventName, params)
    console.log('📈 Event:', eventName, params)
  } catch (error) {
    console.error('이벤트 추적 실패:', error)
  }
}

/**
 * 버튼 클릭 이벤트 추적
 * @param {string} buttonName - 버튼 이름
 * @param {Object} params - 추가 매개변수
 */
export function trackButtonClick(buttonName, params = {}) {
  if (!analytics) return

  try {
    logEvent(analytics, 'button_click', {
      button_name: buttonName,
      ...params
    })
    console.log('🖱️ Button Click:', buttonName, params)
  } catch (error) {
    console.error('버튼 클릭 추적 실패:', error)
  }
}

/**
 * 파일 변환 이벤트 추적
 * @param {string} conversionType - 변환 유형 (예: 'image_to_webp', 'json_parse')
 * @param {Object} params - 추가 매개변수
 */
export function trackConversion(conversionType, params = {}) {
  if (!analytics) return

  try {
    logEvent(analytics, 'conversion_complete', {
      conversion_type: conversionType,
      ...params
    })
    console.log('🔄 Conversion:', conversionType, params)
  } catch (error) {
    console.error('변환 추적 실패:', error)
  }
}

/**
 * 에러 이벤트 추적
 * @param {string} errorType - 에러 유형
 * @param {string} errorMessage - 에러 메시지
 */
export function trackError(errorType, errorMessage) {
  if (!analytics) return

  try {
    logEvent(analytics, 'error_occurred', {
      error_type: errorType,
      error_message: errorMessage
    })
    console.log('❌ Error:', errorType, errorMessage)
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
