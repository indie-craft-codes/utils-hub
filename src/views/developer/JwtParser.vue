<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

// State
const inputToken = ref('')
const activeTab = ref('decode')
const autoUpdate = ref(true)
const removeBearerPrefix = ref(true)
const prettyMode = ref(true)
const copied = ref('')
const verifyKey = ref('')
const verifyResult = ref(null)

// JWT Parsing Logic
const normalizeToken = (token) => {
  let normalized = token.trim()

  // Remove Bearer prefix if enabled
  if (removeBearerPrefix.value && normalized.toLowerCase().startsWith('bearer ')) {
    normalized = normalized.substring(7).trim()
  }

  // Remove newlines and extra spaces
  normalized = normalized.replace(/\s+/g, '')

  return normalized
}

const base64UrlDecode = (str) => {
  try {
    // Convert Base64URL to Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

    // Add padding if needed
    const padding = base64.length % 4
    if (padding) {
      base64 += '='.repeat(4 - padding)
    }

    // Decode
    const decoded = atob(base64)
    return decoded
  } catch (e) {
    throw new Error('Base64URL decode failed: ' + e.message)
  }
}

const parseJwt = (token) => {
  const normalized = normalizeToken(token)

  if (!normalized) {
    return {
      valid: false,
      error: 'Empty token',
      parts: null
    }
  }

  const parts = normalized.split('.')

  // Check format
  if (parts.length === 5) {
    return {
      valid: false,
      error: 'JWE format detected (5 parts). JWE decoding is not currently supported.',
      parts: null
    }
  }

  if (parts.length !== 3) {
    return {
      valid: false,
      error: `Invalid JWT format. Expected 3 parts, got ${parts.length}`,
      parts: null
    }
  }

  const [headerB64, payloadB64, signatureB64] = parts

  try {
    // Decode header
    const headerRaw = base64UrlDecode(headerB64)
    let headerJson = null
    let headerError = null
    try {
      headerJson = JSON.parse(headerRaw)
    } catch (e) {
      headerError = 'Not valid JSON'
    }

    // Decode payload
    const payloadRaw = base64UrlDecode(payloadB64)
    let payloadJson = null
    let payloadError = null
    try {
      payloadJson = JSON.parse(payloadRaw)
    } catch (e) {
      payloadError = 'Not valid JSON'
    }

    return {
      valid: true,
      parts: {
        headerB64,
        payloadB64,
        signatureB64
      },
      decoded: {
        headerRaw,
        payloadRaw,
        headerJson,
        payloadJson,
        headerError,
        payloadError
      }
    }
  } catch (e) {
    return {
      valid: false,
      error: e.message,
      parts: { headerB64, payloadB64, signatureB64 }
    }
  }
}

const jwtData = computed(() => {
  if (!inputToken.value.trim() || !autoUpdate.value) {
    return null
  }
  return parseJwt(inputToken.value)
})

const manualParse = () => {
  if (!autoUpdate.value && inputToken.value.trim()) {
    return parseJwt(inputToken.value)
  }
  return jwtData.value
}

const currentData = computed(() => {
  return autoUpdate.value ? jwtData.value : manualParse()
})

// Format JSON for display
const formatJson = (json) => {
  if (!json) return ''
  return prettyMode.value
    ? JSON.stringify(json, null, 2)
    : JSON.stringify(json)
}

// Summary data extraction
const summary = computed(() => {
  if (!currentData.value?.valid || !currentData.value?.decoded) {
    return null
  }

  const { headerJson, payloadJson } = currentData.value.decoded

  // Extract common claims
  const alg = headerJson?.alg || 'Unknown'
  const typ = headerJson?.typ || 'Unknown'
  const kid = headerJson?.kid || null

  const iss = payloadJson?.iss || null
  const sub = payloadJson?.sub || null
  const aud = payloadJson?.aud || null
  const exp = payloadJson?.exp || null
  const iat = payloadJson?.iat || null
  const nbf = payloadJson?.nbf || null

  return {
    alg,
    typ,
    kid,
    iss,
    sub,
    aud,
    exp,
    iat,
    nbf
  }
})

// Time formatting
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null

  // Auto-detect if it's milliseconds (very large number)
  const ts = timestamp > 10000000000 ? timestamp : timestamp * 1000
  const date = new Date(ts)

  // KST format (UTC+9)
  const options = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }

  return date.toLocaleString('ko-KR', options).replace(/\. /g, '-').replace('.', '')
}

const getTimeRemaining = (exp) => {
  if (!exp) return null

  const ts = exp > 10000000000 ? exp : exp * 1000
  const now = Date.now()
  const diff = ts - now

  if (diff < 0) {
    // Expired
    const absDiff = Math.abs(diff)
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return { expired: true, text: `${days}d ${hours}h ago` }
    } else {
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
      return { expired: true, text: `${hours}h ${minutes}m ago` }
    }
  } else {
    // Not expired
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return { expired: false, text: `${days}d ${hours}h` }
    } else {
      return { expired: false, text: `${hours}h ${minutes}m` }
    }
  }
}

// Copy functions
const copyToClipboard = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = label
    setTimeout(() => copied.value = '', 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

const copyHeader = () => {
  if (currentData.value?.decoded?.headerJson) {
    copyToClipboard(formatJson(currentData.value.decoded.headerJson), 'header')
  }
}

const copyPayload = () => {
  if (currentData.value?.decoded?.payloadJson) {
    copyToClipboard(formatJson(currentData.value.decoded.payloadJson), 'payload')
  }
}

const copyCurlHeader = () => {
  const token = normalizeToken(inputToken.value)
  if (token) {
    copyToClipboard(`Authorization: Bearer ${token}`, 'curl')
  }
}

const downloadResult = () => {
  if (!currentData.value?.valid) return

  const result = {
    header: currentData.value.decoded.headerJson,
    payload: currentData.value.decoded.payloadJson,
    signature: currentData.value.parts.signatureB64
  }

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'jwt-decoded.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Clear all
const clearAll = () => {
  inputToken.value = ''
  verifyKey.value = ''
  verifyResult.value = null
}

// Verify signature (basic HS256 support using Web Crypto API)
const verifySignature = async () => {
  if (!currentData.value?.valid || !verifyKey.value) {
    verifyResult.value = { success: false, message: 'Invalid token or key' }
    return
  }

  const alg = currentData.value.decoded.headerJson?.alg

  if (!alg) {
    verifyResult.value = { success: false, message: 'Algorithm not found in header' }
    return
  }

  // Only support HS256/384/512 for now (client-side verification)
  if (!['HS256', 'HS384', 'HS512'].includes(alg)) {
    verifyResult.value = { success: false, message: `Algorithm ${alg} verification not supported in browser. Only HS256/384/512 are supported.` }
    return
  }

  try {
    const encoder = new TextEncoder()
    const parts = normalizeToken(inputToken.value).split('.')
    const message = `${parts[0]}.${parts[1]}`
    const signature = parts[2]

    // Import key
    const hashAlg = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : 'SHA-512'
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(verifyKey.value),
      { name: 'HMAC', hash: hashAlg },
      false,
      ['sign']
    )

    // Sign the message
    const signatureArrayBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    )

    // Convert to Base64URL
    const signatureArray = Array.from(new Uint8Array(signatureArrayBuffer))
    const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray))
    const signatureBase64Url = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    // Compare
    if (signatureBase64Url === signature) {
      verifyResult.value = { success: true, message: 'Signature verified successfully!' }
    } else {
      verifyResult.value = { success: false, message: 'Signature verification failed. Invalid signature or key.' }
    }
  } catch (e) {
    verifyResult.value = { success: false, message: `Verification error: ${e.message}` }
  }
}

// Get all claims from payload
const allClaims = computed(() => {
  if (!currentData.value?.decoded?.payloadJson) return []

  const payload = currentData.value.decoded.payloadJson
  const standardClaims = ['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'jti']

  return Object.entries(payload).map(([key, value]) => {
    const isStandard = standardClaims.includes(key)
    const isTimestamp = ['exp', 'iat', 'nbf'].includes(key) && typeof value === 'number'

    return {
      key,
      value,
      isStandard,
      isTimestamp,
      formattedValue: isTimestamp ? formatTimestamp(value) : null,
      type: Array.isArray(value) ? 'array' : typeof value
    }
  })
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.jwt.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('tools.jwt.description') }}
      </p>
    </div>

    <!-- Options -->
    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="autoUpdate" class="rounded text-primary-600 focus:ring-primary-500" />
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.jwt.autoUpdate') }}</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="removeBearerPrefix" class="rounded text-primary-600 focus:ring-primary-500" />
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.jwt.removeBearer') }}</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="prettyMode" class="rounded text-primary-600 focus:ring-primary-500" />
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.jwt.prettyJson') }}</span>
      </label>
      <button @click="clearAll" class="btn btn-secondary text-sm ml-auto">
        {{ t('common.clear') }}
      </button>
    </div>

    <!-- Input Token -->
    <div class="card mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {{ t('tools.jwt.inputToken') }}
      </h2>
      <textarea
        v-model="inputToken"
        class="textarea font-mono text-sm h-32"
        :placeholder="t('tools.jwt.placeholder')"
      ></textarea>
    </div>

    <!-- Status Badge -->
    <div v-if="inputToken.trim()" class="mb-6">
      <div v-if="currentData?.valid" class="flex items-center gap-2 text-green-600 dark:text-green-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-medium">{{ t('tools.jwt.validFormat') }}</span>
      </div>
      <div v-else class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400 font-medium">
          {{ currentData?.error || t('tools.jwt.invalidFormat') }}
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div v-if="currentData?.valid" class="mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'decode'"
            :class="[
              activeTab === 'decode'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ t('tools.jwt.tabs.decode') }}
          </button>
          <button
            @click="activeTab = 'claims'"
            :class="[
              activeTab === 'claims'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ t('tools.jwt.tabs.claims') }}
          </button>
          <button
            @click="activeTab = 'verify'"
            :class="[
              activeTab === 'verify'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ t('tools.jwt.tabs.verify') }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Decode Tab -->
    <div v-if="currentData?.valid && activeTab === 'decode'" class="space-y-6">
      <!-- Summary Card -->
      <div v-if="summary" class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.jwt.summary') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.algorithm') }}</p>
            <p class="font-mono text-gray-900 dark:text-white">{{ summary.alg }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.type') }}</p>
            <p class="font-mono text-gray-900 dark:text-white">{{ summary.typ }}</p>
          </div>
          <div v-if="summary.kid">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.keyId') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white break-all">{{ summary.kid }}</p>
          </div>
          <div v-if="summary.iss">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.issuer') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white break-all">{{ summary.iss }}</p>
          </div>
          <div v-if="summary.sub">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.subject') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white break-all">{{ summary.sub }}</p>
          </div>
          <div v-if="summary.aud">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.audience') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white break-all">{{ Array.isArray(summary.aud) ? summary.aud.join(', ') : summary.aud }}</p>
          </div>
          <div v-if="summary.exp" class="md:col-span-2">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.expiration') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white">{{ formatTimestamp(summary.exp) }}</p>
            <div v-if="getTimeRemaining(summary.exp)" class="mt-1">
              <span
                :class="[
                  'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                  getTimeRemaining(summary.exp).expired
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                ]"
              >
                {{ getTimeRemaining(summary.exp).expired ? '⚠️ ' : '✓ ' }}
                {{ getTimeRemaining(summary.exp).text }}
              </span>
            </div>
          </div>
          <div v-if="summary.iat">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.issuedAt') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white">{{ formatTimestamp(summary.iat) }}</p>
          </div>
          <div v-if="summary.nbf">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('tools.jwt.notBefore') }}</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white">{{ formatTimestamp(summary.nbf) }}</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3">
        <button @click="copyHeader" class="btn btn-secondary">
          {{ copied === 'header' ? t('common.copied') : t('tools.jwt.copyHeader') }}
        </button>
        <button @click="copyPayload" class="btn btn-secondary">
          {{ copied === 'payload' ? t('common.copied') : t('tools.jwt.copyPayload') }}
        </button>
        <button @click="copyCurlHeader" class="btn btn-secondary">
          {{ copied === 'curl' ? t('common.copied') : t('tools.jwt.copyCurl') }}
        </button>
        <button @click="downloadResult" class="btn btn-secondary">
          {{ t('common.download') }}
        </button>
      </div>

      <!-- Decoded Parts -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Header -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {{ t('tools.jwt.header') }}
          </h3>
          <div v-if="currentData.decoded.headerError" class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 mb-2">
            <p class="text-xs text-yellow-700 dark:text-yellow-400">{{ currentData.decoded.headerError }}</p>
          </div>
          <pre class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-auto max-h-96 font-mono text-xs text-gray-900 dark:text-gray-100">{{
            currentData.decoded.headerJson
              ? formatJson(currentData.decoded.headerJson)
              : currentData.decoded.headerRaw
          }}</pre>
        </div>

        <!-- Payload -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {{ t('tools.jwt.payload') }}
          </h3>
          <div v-if="currentData.decoded.payloadError" class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 mb-2">
            <p class="text-xs text-yellow-700 dark:text-yellow-400">{{ currentData.decoded.payloadError }}</p>
          </div>
          <pre class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-auto max-h-96 font-mono text-xs text-gray-900 dark:text-gray-100">{{
            currentData.decoded.payloadJson
              ? formatJson(currentData.decoded.payloadJson)
              : currentData.decoded.payloadRaw
          }}</pre>
        </div>

        <!-- Signature -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {{ t('tools.jwt.signature') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {{ t('tools.jwt.signatureLength') }}: {{ currentData.parts.signatureB64.length }}
          </p>
          <pre class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-auto max-h-96 font-mono text-xs text-gray-900 dark:text-gray-100 break-all">{{ currentData.parts.signatureB64 }}</pre>
        </div>
      </div>
    </div>

    <!-- Claims Tab -->
    <div v-if="currentData?.valid && activeTab === 'claims'" class="space-y-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.jwt.allClaims') }}
        </h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('tools.jwt.claimName') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('tools.jwt.claimValue') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('tools.jwt.claimType') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="claim in allClaims" :key="claim.key">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <code class="text-sm font-mono text-gray-900 dark:text-white">{{ claim.key }}</code>
                    <span v-if="claim.isStandard" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      Standard
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div v-if="claim.isTimestamp">
                    <p class="font-mono text-sm text-gray-900 dark:text-white">{{ claim.formattedValue }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">({{ claim.value }})</p>
                  </div>
                  <div v-else-if="claim.type === 'array'" class="flex flex-wrap gap-1">
                    <span v-for="(item, i) in claim.value" :key="i" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {{ item }}
                    </span>
                  </div>
                  <code v-else class="text-sm font-mono text-gray-900 dark:text-white break-all">{{ JSON.stringify(claim.value) }}</code>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ claim.type }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Claims Dictionary -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.jwt.claimsDictionary') }}
        </h3>
        <div class="space-y-3 text-sm">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">iss (Issuer)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.iss') }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">sub (Subject)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.sub') }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">aud (Audience)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.aud') }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">exp (Expiration Time)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.exp') }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">iat (Issued At)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.iat') }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">nbf (Not Before)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.nbf') }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p class="font-mono font-semibold text-gray-900 dark:text-white">jti (JWT ID)</p>
            <p class="text-gray-600 dark:text-gray-400">{{ t('tools.jwt.claims.jti') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Verify Tab -->
    <div v-if="currentData?.valid && activeTab === 'verify'" class="space-y-6">
      <!-- Warning -->
      <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="text-sm text-yellow-700 dark:text-yellow-300">
            <p class="font-medium">{{ t('tools.jwt.verifyWarningTitle') }}</p>
            <p class="mt-1">{{ t('tools.jwt.verifyWarning') }}</p>
            <p class="mt-1 text-xs">{{ t('tools.jwt.verifyLocalOnly') }}</p>
          </div>
        </div>
      </div>

      <!-- Verification Form -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.jwt.verifySignature') }}
        </h3>

        <div class="mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {{ t('tools.jwt.detectedAlgorithm') }}: <code class="font-mono font-semibold">{{ summary?.alg }}</code>
          </p>
          <div v-if="summary?.alg && ['HS256', 'HS384', 'HS512'].includes(summary.alg)" class="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <p class="text-sm text-green-700 dark:text-green-300">
              ✓ {{ t('tools.jwt.algorithmSupported') }}
            </p>
          </div>
          <div v-else class="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-700 dark:text-red-300">
              ✗ {{ t('tools.jwt.algorithmNotSupported') }}
            </p>
          </div>
        </div>

        <div v-if="summary?.alg && ['HS256', 'HS384', 'HS512'].includes(summary.alg)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tools.jwt.secretKey') }}
            </label>
            <input
              v-model="verifyKey"
              type="password"
              class="input w-full font-mono text-sm"
              :placeholder="t('tools.jwt.secretKeyPlaceholder')"
            />
          </div>

          <button
            @click="verifySignature"
            :disabled="!verifyKey"
            class="btn btn-primary disabled:opacity-50"
          >
            {{ t('tools.jwt.verify') }}
          </button>

          <!-- Verification Result -->
          <div v-if="verifyResult" class="mt-4">
            <div
              :class="[
                'p-4 rounded-lg border',
                verifyResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              ]"
            >
              <p
                :class="[
                  'font-medium',
                  verifyResult.success
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                ]"
              >
                {{ verifyResult.message }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="3456789012" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700;
}

.textarea {
  @apply w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.input {
  @apply px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}
</style>
