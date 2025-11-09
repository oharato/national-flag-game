<script setup lang="ts">
interface Props {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: 'データを読み込み中...',
  size: 'md',
  fullScreen: false,
});

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};
</script>

<template>
  <div :class="[
    'text-center',
    fullScreen ? 'py-10' : 'py-4'
  ]">
    <div 
      :class="[
        'animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4',
        sizeClasses[size]
      ]"
    ></div>
    <p>{{ message }}</p>
  </div>
</template>
