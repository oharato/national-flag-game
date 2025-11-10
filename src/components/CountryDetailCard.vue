<script setup lang="ts">
import type { Country } from '../store/countries';
import { useTranslation } from '../composables/useTranslation';

defineProps<{
  country: Country;
}>();

const { t } = useTranslation();

const formatCapital = (capital: string | string[]) => {
  if (Array.isArray(capital)) {
    return capital[0];
  }
  return capital;
};
</script>

<template>
  <div class="relative flex flex-col">
    <h3 class="text-2xl font-bold mb-2">{{ country.name }}</h3>
    <p><strong>{{ t.study.capital }}:</strong> {{ formatCapital(country.capital) }}</p>
    <p><strong>{{ t.study.continent }}:</strong> {{ country.continent }}</p>
    <div v-if="country.map_image_url" class="absolute top-0 right-0 w-24 h-auto border border-gray-300 bg-white p-1 shadow-md">
      <img :src="country.map_image_url" :alt="`${country.name}の地図`" class="max-w-full max-h-full object-contain" loading="eager">
    </div>
    <hr class="my-4">
    <h4 class="font-bold mt-4">{{ t.study.flagOrigin }}</h4>
    <p class="text-sm overflow-y-auto max-h-42">{{ country.description || t.study.noInformation }}</p>
  </div>
</template>
