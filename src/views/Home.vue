<script setup lang="ts">
import LanguageSelector from '../components/LanguageSelector.vue';
import AppButton from '../components/AppButton.vue';
import { useTranslation } from '../composables/useTranslation';

const { t } = useTranslation();
</script>

<template>
  <div class="container mx-auto p-4 text-center">
    <div class="flex justify-end mb-4">
      <LanguageSelector />
    </div>

    <h1 class="text-4xl font-bold my-8">{{ t.home.title }}</h1>
    <div class="space-y-4">
      <router-link to="/quiz" class="block w-full max-w-sm mx-auto">
        <AppButton variant="primary" full-width>
          {{ t.home.startQuiz }}
        </AppButton>
      </router-link>
      <router-link to="/study" class="block w-full max-w-sm mx-auto">
        <AppButton variant="success" full-width>
          {{ t.home.study }}
        </AppButton>
      </router-link>
      <router-link to="/ranking" class="block w-full max-w-sm mx-auto">
        <AppButton variant="purple" full-width>
          {{ t.home.viewRanking }}
        </AppButton>
      </router-link>
    </div>
  </div>
</template>
