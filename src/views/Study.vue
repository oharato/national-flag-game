<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import CountryDetailCard from '../components/CountryDetailCard.vue';
import FlagCard from '../components/FlagCard.vue';
import LazyImage from '../components/LazyImage.vue';
import { useTranslation } from '../composables/useTranslation';
import type { Country } from '../store/countries';
import { useCountriesStore } from '../store/countries';

const countriesStore = useCountriesStore();
const { t } = useTranslation();

const currentIndex = ref(0);
const isFlipped = ref(false);
const selectedRegion = ref('all');
const disableTransition = ref(false);
const quizMode = ref<'flag-to-name' | 'name-to-flag'>('flag-to-name');

onMounted(() => {
  countriesStore.fetchCountries(true);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code === 'ArrowLeft') {
    prevCountry();
  } else if (event.code === 'ArrowRight') {
    nextCountry();
  } else if (event.code === 'Space') {
    event.preventDefault();
    isFlipped.value = !isFlipped.value;
  }
};

const availableContinents = computed(() => {
  const continents = new Set<string>();
  countriesStore.countries.forEach((country) => {
    if (country.continent && country.continent !== 'N/A') {
      continents.add(country.continent);
    }
  });
  return Array.from(continents).sort();
});

const filteredCountries = computed<Country[]>(() => {
  if (selectedRegion.value === 'all') {
    return countriesStore.countries;
  }
  return countriesStore.countries.filter((country) => country.continent === selectedRegion.value);
});

const currentCountry = computed(() => {
  if (filteredCountries.value.length === 0) {
    return null;
  }
  return filteredCountries.value[currentIndex.value];
});

watch(selectedRegion, () => {
  currentIndex.value = 0;
  isFlipped.value = false;
});

watch(quizMode, () => {
  isFlipped.value = false;
});

const nextCountry = () => {
  if (filteredCountries.value.length === 0) return;

  // Change index first, then flip the card
  if (currentIndex.value < filteredCountries.value.length - 1) {
    currentIndex.value++;
  } else {
    currentIndex.value = 0;
  }

  if (isFlipped.value) {
    disableTransition.value = true;
    isFlipped.value = false;
    setTimeout(() => {
      disableTransition.value = false;
    }, 0);
  }
};

const prevCountry = () => {
  if (filteredCountries.value.length === 0) return;

  // Change index first, then flip the card
  if (currentIndex.value > 0) {
    currentIndex.value--;
  } else {
    currentIndex.value = filteredCountries.value.length - 1;
  }

  if (isFlipped.value) {
    disableTransition.value = true;
    isFlipped.value = false;
    setTimeout(() => {
      disableTransition.value = false;
    }, 0);
  }
};

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value;
};

const goToCountry = (index: number) => {
  isFlipped.value = false;
  currentIndex.value = index;
};
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="container mx-auto p-4 flex-shrink-0">
      <div class="w-full max-w-2xl mx-auto">
        <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
        <h2 class="text-3xl font-bold my-6 text-center">{{ t.study.title }}</h2>

        <!-- 設定エリア -->
        <div class="mb-4 flex justify-between items-center gap-4">
          <!-- クイズ形式選択 -->
          <div>
            <label for="quizMode" class="mr-2">{{ t.study.quizMode }}:</label>
            <select
              id="quizMode"
              v-model="quizMode"
              class="p-2 border rounded-md"
            >
              <option value="flag-to-name">{{ t.study.flagToName }}</option>
              <option value="name-to-flag">{{ t.study.nameToFlag }}</option>
            </select>
          </div>

          <!-- 大陸選択ドロップダウン -->
          <div>
            <label for="studyRegion" class="mr-2">{{ t.study.region }}:</label>
            <select
              id="studyRegion"
              v-model="selectedRegion"
              class="p-2 border rounded-md"
            >
              <option value="all">{{ t.region.all }}</option>
              <option v-for="continent in availableContinents" :key="continent" :value="continent">
                {{ continent }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="countriesStore.loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p>{{ t.ranking.loading }}</p>
      </div>
    </div>

    <div v-else-if="countriesStore.error" class="flex-1 flex items-center justify-center">
      <div class="text-center text-red-500">
        <p>{{ countriesStore.error }}</p>
        <button @click="countriesStore.fetchCountries(true)" class="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          {{ t.quizSetup.error }}
        </button>
      </div>
    </div>

    <div v-else-if="currentCountry" class="flex-1 flex flex-col overflow-hidden">
      <div class="w-full max-w-2xl mx-auto flex-shrink-0 px-4">
        <div class="perspective-1000">
          <div 
            class="relative w-full h-96 transform-style-3d"
            :class="[
              { 'rotate-y-180': isFlipped },
              disableTransition ? '' : 'transition-transform duration-700'
            ]"
          >
            <!-- Card Front -->
            <div class="absolute w-full h-full backface-hidden border-2 border-gray-300 rounded-lg shadow-lg p-8 bg-gray-100 cursor-pointer"
                 @click="toggleFlip">
              <FlagCard v-if="quizMode === 'flag-to-name'" :country="currentCountry" />
              <CountryDetailCard v-else :country="currentCountry" />
            </div>
            
            <!-- Card Back -->
            <div class="absolute w-full h-full backface-hidden rotate-y-180 border-2 border-gray-300 rounded-lg shadow-lg p-6 bg-gray-100 cursor-pointer"
                 @click="toggleFlip">
              <CountryDetailCard v-if="quizMode === 'flag-to-name'" :country="currentCountry" />
              <FlagCard v-else :country="currentCountry" :flipped="true" />
            </div>
          </div>
        </div>
      </div>

      <div class="w-full max-w-2xl mx-auto px-4 flex-shrink-0">
        <div class="flex justify-between items-center mb-4 mt-4">
          <button 
            @click="prevCountry" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            aria-label="前の国へ"
          >
            {{ t.study.prev }}
          </button>
          <span class="text-lg font-semibold">
            {{ currentIndex + 1 }} / {{ filteredCountries.length }}
          </span>
          <button 
            @click="nextCountry" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            aria-label="次の国へ"
          >
            {{ t.study.next }}
          </button>
        </div>
        <p class="text-sm text-gray-500 text-center mt-2">
          {{ t.study.keyboardHint }}
        </p>
      </div>

      <div class="flex-1 overflow-y-auto px-4 mt-4 pb-4">
        <div class="w-full max-w-2xl mx-auto grid gap-2"
             :class="quizMode === 'flag-to-name' ? 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'">
          <div
            v-for="(country, index) in filteredCountries"
            :key="country.id"
            @click="goToCountry(index)"
            :class="{
              'border-4 border-blue-500': index === currentIndex,
              'border-4 border-transparent': index !== currentIndex,
            }"
            class="cursor-pointer rounded overflow-hidden hover:shadow-lg transition-shadow bg-gray-100 flex items-center justify-center p-1 box-border"
          >
            <LazyImage
              v-if="quizMode === 'flag-to-name'"
              :src="country.flag_image_url"
              :alt="country.name"
              :eager="index === currentIndex"
              class="w-full h-full object-contain aspect-square"
            />
            <span
              v-else
              class="text-xs sm:text-sm font-medium text-center px-2 py-4"
            >
              {{ country.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center">
      <p class="text-gray-500">{{ t.ranking.noData }}</p>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.backface-hidden {
  backface-visibility: hidden;
}
</style>
