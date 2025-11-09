<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  src: string;
  alt: string;
  class?: string;
  eager?: boolean; // 遅延読み込みをスキップするオプション
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  eager: false
});

const imgRef = ref<HTMLImageElement | null>(null);
const isVisible = ref(props.eager); // eagerの場合は即座に表示
const isLoaded = ref(false);

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (props.eager || !imgRef.value) {
    // eagerモードまたは要素が存在しない場合は遅延読み込みをスキップ
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          if (observer && imgRef.value) {
            observer.unobserve(imgRef.value);
          }
        }
      });
    },
    {
      rootMargin: '50px', // 50px手前から読み込み開始
      threshold: 0.01
    }
  );

  observer.observe(imgRef.value);
});

onUnmounted(() => {
  if (observer && imgRef.value) {
    observer.unobserve(imgRef.value);
  }
});

const handleLoad = () => {
  isLoaded.value = true;
};
</script>

<template>
  <img
    ref="imgRef"
    :src="isVisible ? src : undefined"
    :alt="alt"
    :class="[props.class, { 'opacity-0': !isLoaded, 'opacity-100 transition-opacity duration-300': isLoaded }]"
    @load="handleLoad"
  />
</template>
