<script setup lang="ts">
import { computed } from 'vue';
import { useCountriesStore } from '../store/countries';
import { useTranslation } from '../composables/useTranslation';

interface Props {
  modelValue: string;
  label?: string;
  includeAll?: boolean;
  alwaysShowLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  includeAll: true,
  alwaysShowLabel: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const countriesStore = useCountriesStore();
const { t } = useTranslation();

// 大陸の正規化マップ
const normalizeContinentMap: Record<string, string> = {
  'Africa': 'Africa',
  'アフリカ': 'Africa',
  'Asia': 'Asia',
  'アジア': 'Asia',
  'Europe': 'Europe',
  'ヨーロッパ': 'Europe',
  'North America': 'North America',
  '北アメリカ': 'North America',
  'South America': 'South America',
  '南アメリカ': 'South America',
  'Oceania': 'Oceania',
  'オセアニア': 'Oceania',
  'Antarctica': 'Antarctica',
  '南極': 'Antarctica',
};

// 利用可能な大陸のリスト
const availableContinents = computed(() => {
  const continents = new Set<string>();
  countriesStore.countries.forEach(country => {
    if (country.continent && country.continent !== 'N/A') {
      const normalized = normalizeContinentMap[country.continent] || country.continent;
      continents.add(normalized);
    }
  });
  return Array.from(continents).sort();
});

// 表示用の大陸名を取得
const getDisplayContinentName = (continent: string) => {
  const continentMap: Record<string, string> = {
    'Africa': t.value.region.africa,
    'Asia': t.value.region.asia,
    'Europe': t.value.region.europe,
    'North America': t.value.region.northAmerica,
    'South America': t.value.region.southAmerica,
    'Oceania': t.value.region.oceania,
    'all': t.value.region.all,
  };
  return continentMap[continent] || continent;
};

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const displayLabel = computed(() => props.label || t.value.quizSetup.region);
</script>

<template>
  <div>
    <label v-if="displayLabel" :class="alwaysShowLabel ? 'block text-sm font-medium text-gray-700 mb-1' : 'hidden md:block text-sm font-medium text-gray-700 mb-1'">
      {{ displayLabel }}
    </label>
    <select
      v-model="selectedValue"
      class="w-full px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option v-if="includeAll" value="all">{{ getDisplayContinentName('all') }}</option>
      <option 
        v-for="continent in availableContinents" 
        :key="continent" 
        :value="continent"
      >
        {{ getDisplayContinentName(continent) }}
      </option>
    </select>
  </div>
</template>
