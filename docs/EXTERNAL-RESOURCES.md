# 외부 리소스 관리 문서

> 마지막 업데이트: 2025-12-22
> 이 문서는 Utils Hub 프로젝트에서 사용하는 외부 서비스 및 리소스를 정리한 것입니다.

---

## 목차

1. [Firebase Analytics](#1-firebase-analytics)
2. [Google AdSense](#2-google-adsense)
3. [Google Maps API](#3-google-maps-api)
4. [Google Search Console](#4-google-search-console)
5. [GitHub Pages](#5-github-pages)
6. [Cloudflare](#6-cloudflare)
7. [npm 패키지](#7-npm-패키지)
8. [SEO 관련 파일](#8-seo-관련-파일)

---

## 1. Firebase Analytics

> **상태:** 활성화
> **용도:** 사용자 방문 통계 및 이벤트 분석

### 설정 정보

| 항목 | 값 |
|------|-----|
| Project ID | `utils-hub` |
| Measurement ID | `G-**********` |
| App ID | `index.html` 참조 |
| Auth Domain | `utils-hub.firebaseapp.com` |
| Storage Bucket | `utils-hub.firebasestorage.app` |

### 관련 파일

- `index.html` (59-76줄) - Firebase 초기화 스크립트

### 사용 CDN

```
https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js
https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js
```

### 관리 콘솔

- [Firebase Console](https://console.firebase.google.com/project/utils-hub)
- [Google Analytics](https://analytics.google.com/)

---

## 2. Google AdSense

> **상태:** 활성화
> **용도:** 광고 수익화

### 설정 정보

| 항목 | 값 |
|------|-----|
| Publisher ID | `ca-pub-**************` (index.html 참조) |
| ads.txt | `public/ads.txt`에 설정됨 |

### 관련 파일

| 파일 | 역할 |
|------|------|
| `index.html` (53줄) | AdSense 스크립트 로드 |
| `src/components/AdBanner.vue` | 광고 배너 컴포넌트 |
| `src/router/index.js` | 페이지 전환 시 광고 새로고침 |
| `public/ads.txt` | AdSense 인증 파일 |

### ads.txt 내용

```
google.com, pub-**************, DIRECT, ****************
```

### 관리 콘솔

- [Google AdSense](https://www.google.com/adsense/)

---

## 3. Google Maps API

> **상태:** 활성화
> **용도:** 이미지 메타데이터의 GPS 좌표를 지도로 표시

### 설정 정보

| 항목 | 값 |
|------|-----|
| API Key | `.env` 파일의 `VITE_GOOGLE_MAPS_API_KEY` |

### 관련 파일

| 파일 | 역할 |
|------|------|
| `.env` | API 키 저장 |
| `src/views/converter/ImageMetadata.vue` | Maps Embed API 사용 |

### 사용 API

- Google Maps Embed API (`https://www.google.com/maps/embed/v1/place`)

### 관리 콘솔

- [Google Cloud Console - APIs](https://console.cloud.google.com/apis)

---

## 4. Google Search Console

> **상태:** 활성화
> **용도:** 검색엔진 최적화(SEO) 및 사이트 소유권 인증

### 설정 정보

| 항목 | 값 |
|------|-----|
| Site Verification | `index.html` 참조 |

### 관련 파일

- `index.html` (50줄) - `<meta name="google-site-verification" ...>`

### 관리 콘솔

- [Google Search Console](https://search.google.com/search-console) (속성: `https://utils-hub.app/`)

---

## 5. GitHub Pages

> **상태:** 활성화
> **용도:** 정적 웹사이트 호스팅

### 설정 정보

| 항목 | 값 |
|------|-----|
| Repository | `indie-craft-codes/utils-hub` |
| 배포 브랜치 | `master` |
| Custom Domain | `utils-hub.app` |

### 관련 파일

| 파일 | 역할 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Actions 배포 워크플로우 |
| `public/CNAME` | 커스텀 도메인 설정 |

### 배포 프로세스

1. `master` 브랜치에 푸시
2. GitHub Actions 자동 실행
3. `npm ci` → `npm run build`
4. `404.html` 생성 (SPA 라우팅 지원)
5. GitHub Pages에 배포

### 관리 콘솔

- [GitHub Repository Settings](https://github.com/indie-craft-codes/utils-hub/settings/pages)

---

## 6. Cloudflare

> **상태:** 확인 필요
> **용도:** DNS 관리 / CDN / SSL

### 현재 상태

코드베이스에는 Cloudflare 관련 직접적인 설정이 없습니다.

**확인 필요 사항:**
- `utils-hub.app` 도메인의 DNS가 Cloudflare를 통해 관리되는지 확인
- Cloudflare 대시보드에서 해당 도메인 설정 확인

### 관리 콘솔

- [Cloudflare Dashboard](https://dash.cloudflare.com/)

---

## 7. npm 패키지

### 주요 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `vue` | ^3.5.24 | UI 프레임워크 |
| `vue-router` | ^4.6.4 | 라우팅 |
| `vue-i18n` | ^9.14.5 | 다국어 지원 |
| `crypto-js` | ^4.2.0 | 암호화 유틸리티 |
| `exifr` | ^7.1.3 | 이미지 메타데이터 추출 |
| `gif.js` | ^0.2.0 | GIF 생성 |
| `heic2any` | ^0.0.4 | HEIC 이미지 변환 |
| `html2canvas` | ^1.4.1 | HTML을 이미지로 변환 |
| `qrcode` | ^1.5.4 | QR코드 생성 |

### 관련 파일

- `package.json` - 의존성 목록
- `package-lock.json` - 버전 잠금

---

## 8. SEO 관련 파일

### Sitemap

- **파일:** `public/sitemap.xml`
- **URL:** `https://utils-hub.app/sitemap.xml`
- **포함 URL 수:** 19개

### Robots.txt

- **파일:** `public/robots.txt`
- **설정:** 모든 User-Agent 허용

### Open Graph / Twitter Cards

- **파일:** `index.html`
- **설정:** og:title, og:description, twitter:card 등

### 다국어 지원 (hreflang)

| 언어 | URL |
|------|-----|
| 한국어 (ko) | `https://utils-hub.app/?lang=ko` |
| 영어 (en) | `https://utils-hub.app/?lang=en` |
| 기본값 (x-default) | `https://utils-hub.app/` |

---

## 요약 테이블

| 서비스 | 상태 | 관리 계정 필요 |
|--------|------|---------------|
| Firebase Analytics | 활성 | Google 계정 |
| Google AdSense | 활성 | Google 계정 |
| Google Maps API | 활성 | Google Cloud 계정 |
| Google Search Console | 활성 | Google 계정 |
| GitHub Pages | 활성 | GitHub 계정 |
| Cloudflare | 확인 필요 | Cloudflare 계정 |

---

## 참고 사항

### API 키 관리

- 민감한 API 키는 `.env` 파일에 저장
- `.env` 파일은 `.gitignore`에 포함되어 버전 관리에서 제외
- 빌드 시 `VITE_` 접두사가 붙은 환경 변수만 클라이언트에 노출

### 비용 관련

| 서비스 | 요금 |
|--------|------|
| Firebase Analytics | 무료 |
| Google AdSense | 수익 발생 |
| Google Maps Embed API | 무료 |
| GitHub Pages | 무료 |
| Cloudflare | Free 플랜 (확인 필요) |

---

*이 문서는 프로젝트 유지보수 및 인수인계 시 참조용으로 작성되었습니다.*
