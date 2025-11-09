<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore } from '../store/quiz';
import { useRankingStore } from '../store/ranking';
import { useCountriesStore } from '../store/countries';
import { useTranslation } from '../composables/useTranslation';
import AppButton from '../components/AppButton.vue';

const router = useRouter();
const quizStore = useQuizStore();
const rankingStore = useRankingStore();
const countriesStore = useCountriesStore();
const { t } = useTranslation();

onMounted(() => {
  if (quizStore.endTime === 0) {
    // クイズが終了していないのにこの画面に来た場合はリダイレクト
    router.push('/quiz');
    return;
  }
  // 選択した地域とクイズ形式でランキングにスコアを登録
  rankingStore.submitScore(quizStore.nickname, quizStore.finalScore, quizStore.quizRegion, quizStore.quizFormat);
});

const goToRanking = () => {
  // クイズ設定をURLパラメータとしてランキング画面に渡す
  router.push({
    path: '/ranking',
    query: {
      region: quizStore.quizRegion,
      format: quizStore.quizFormat,
      type: 'daily'
    }
  });
};

const goToHome = () => {
  router.push('/');
};

// 回答履歴から選択肢のCountryオブジェクトを取得するヘルパー
const getCountryById = (id: string) => {
  return countriesStore.countries.find(c => c.id === id);
};

// クイズ形式の表示名を取得
const getQuizFormatLabel = computed(() => {
  return quizStore.quizFormat === 'flag-to-name' ? t.value.quizFormat.flagToName : t.value.quizFormat.nameToFlag;
});

// 地域の表示名を取得
const getRegionLabel = (region: string) => {
  const regionMap: Record<string, () => string> = {
    'all': () => t.value.region.all,
    'Africa': () => t.value.region.africa,
    'Asia': () => t.value.region.asia,
    'Europe': () => t.value.region.europe,
    'North America': () => t.value.region.northAmerica,
    'South America': () => t.value.region.southAmerica,
    'Oceania': () => t.value.region.oceania,
  };
  return regionMap[region]?.() || region;
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-3xl text-center">
    <h2 class="text-4xl font-bold my-8">{{ t.quizResult.title }}</h2>

    <!-- クイズ設定表示 -->
    <div class="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
      <h3 class="text-xl font-bold mb-3">{{ t.quizResult.settings }}</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div class="text-gray-600">{{ t.quizResult.nickname }}</div>
          <div class="font-semibold">{{ quizStore.nickname }}</div>
        </div>
        <div>
          <div class="text-gray-600">{{ t.quizResult.quizFormat }}</div>
          <div class="font-semibold">{{ getQuizFormatLabel }}</div>
        </div>
        <div>
          <div class="text-gray-600">{{ t.quizResult.region }}</div>
          <div class="font-semibold">{{ getRegionLabel(quizStore.quizRegion) }}</div>
        </div>
        <div>
          <div class="text-gray-600">{{ t.quizResult.questionCount }}</div>
          <div class="font-semibold">{{ quizStore.questions.length }}{{ t.quizResult.questions }}</div>
        </div>
      </div>
    </div>

    <div class="space-y-6 bg-white p-8 border-2 border-gray-300 rounded-lg shadow-lg">
      <div class="text-2xl flex items-baseline">
        <span class="inline-block w-32 text-right flex-shrink-0">{{ t.quizResult.correctAnswers }}</span><span class="flex-shrink-0">:&nbsp;</span><span class="font-bold text-3xl">{{ quizStore.correctAnswers }} / {{ quizStore.questions.length }}</span> <span class="ml-1">{{ t.quizResult.questions }}</span>
      </div>
      <div class="text-2xl flex items-baseline">
        <span class="inline-block w-32 text-right flex-shrink-0">{{ t.quizResult.time }}</span><span class="flex-shrink-0">:&nbsp;</span><span class="font-bold text-3xl">{{ quizStore.totalTime.toFixed(2) }}</span> <span class="ml-1">{{ t.quizResult.seconds }}</span>
      </div>
      <div class="text-3xl font-bold text-indigo-600 flex items-baseline">
        <span class="inline-block w-32 text-right flex-shrink-0">{{ t.quizResult.score }}</span><span class="flex-shrink-0">:&nbsp;</span><span class="text-5xl">{{ quizStore.finalScore }}</span> <span class="ml-1">{{ t.quizResult.points }}</span>
      </div>
    </div>

    <div class="mt-10 text-left">
      <h3 class="text-2xl font-bold mb-4">{{ t.quizResult.answerDetails }}</h3>
      <div class="space-y-6">
        <div v-for="(record, index) in quizStore.answerHistory" :key="index" class="p-4 border rounded-lg shadow-sm" :class="{ 'bg-green-50': record.isCorrect, 'bg-red-50': !record.isCorrect }">
          <p class="font-bold text-lg mb-2">{{ t.quizResult.question }} {{ index + 1 }}</p>
          <div class="flex items-center mb-2">
            <span class="inline-block w-33 text-right mr-2">{{ t.quizResult.questionLabel }}:</span>
            <img v-if="record.question.questionType === 'flag-to-name'" :src="record.question.correctAnswer.flag_image_url" :alt="record.question.correctAnswer.name" class="h-12 w-auto object-contain border mr-2">
            <span v-else class="font-semibold">{{ record.question.correctAnswer.name }}</span>
          </div>
          <div class="flex items-center mb-2">
            <span class="inline-block w-33 text-right mr-2">{{ t.quizResult.yourAnswer }}:</span>
            <template v-if="record.question.questionType === 'flag-to-name'">
              <span :class="{ 'text-green-700 font-bold': record.isCorrect, 'text-red-700 font-bold': !record.isCorrect }">
                {{ getCountryById(record.selectedAnswerId)?.name || t.quizResult.unknown }}
              </span>
            </template>
            <template v-else>
              <img :src="getCountryById(record.selectedAnswerId)?.flag_image_url || ''" :alt="getCountryById(record.selectedAnswerId)?.name || t.quizResult.unknown" class="h-12 w-auto object-contain border mr-2" :class="{ 'border-green-500': record.isCorrect, 'border-red-500': !record.isCorrect }">
            </template>
          </div>
          <div v-if="!record.isCorrect" class="flex items-center">
            <span class="inline-block w-33 text-right mr-2">{{ t.quizResult.correctAnswer }}:</span>
            <template v-if="record.question.questionType === 'flag-to-name'">
              <span class="text-green-700 font-bold">{{ record.question.correctAnswer.name }}</span>
            </template>
            <template v-else>
              <img :src="record.question.correctAnswer.flag_image_url" :alt="record.question.correctAnswer.name" class="h-12 w-auto object-contain border border-green-500 mr-2">
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10 space-y-4">
      <AppButton variant="purple" full-width @click="goToRanking" class="max-w-sm mx-auto text-lg">
        {{ t.quizResult.goToRanking }}
      </AppButton>
      <AppButton variant="gray" full-width @click="goToHome" class="max-w-sm mx-auto text-lg">
        {{ t.quizResult.backToTop }}
      </AppButton>
    </div>
  </div>
</template>
