<script setup>
import { onMounted, nextTick } from 'vue'

const props = defineProps({
  adSlot: { type: String, required: true },
  adFormat: { type: String, default: 'auto' },
  fullWidth: { type: Boolean, default: true }
})

onMounted(() => {
  // DOM이 완전히 렌더링된 후 광고 로드
  nextTick(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      // 광고 로드 실패 시 무시 (광고 차단기 등)
      console.debug('AdSense load failed:', e.message)
    }
  })
})
</script>

<template>
  <div class="ad-container my-4">
    <ins
      class="adsbygoogle"
      style="display: block"
      data-ad-client="ca-pub-4977445987108311"
      :data-ad-slot="adSlot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="fullWidth"
    ></ins>
  </div>
</template>

<style scoped>
.ad-container {
  min-height: 90px;
  text-align: center;
  overflow: hidden;
}

/* 광고가 없을 때 빈 공간 최소화 */
.ad-container:empty {
  min-height: 0;
}
</style>
