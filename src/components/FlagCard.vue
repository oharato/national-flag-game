<script setup lang="ts">
import type { Country } from '../store/countries';

defineProps<{
  country: Country;
}>();
</script>

<template>
  <div class="w-full h-full bg-gray-100 rounded flex items-center justify-center p-4">
    <img 
      :src="country.flag_image_url" 
      :alt="`${country.name}の国旗`" 
      class="max-w-full max-h-full object-contain"
      loading="eager" 
      fetchpriority="high"
    >
  </div>
</template>
