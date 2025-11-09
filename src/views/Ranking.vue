<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRankingStore, type RankingType, type QuizFormat } from '../store/ranking';
import RegionSelector from '../components/RegionSelector.vue';
import QuizFormatSelector from '../components/QuizFormatSelector.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorMessage from '../components/ErrorMessage.vue';
import { useTranslation } from '../composables/useTranslation';
import { formatDateTime } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const rankingStore = useRankingStore();
const { t } = useTranslation();

// URLパラメータから初期値を取得
const selectedRegion = ref((route.query.region as string) || rankingStore.currentRegion || 'all');
const selectedType = ref<RankingType>((route.query.type as RankingType) || rankingStore.currentType || 'daily');
const selectedFormat = ref<QuizFormat>((route.query.format as QuizFormat) || rankingStore.currentFormat || 'flag-to-name');

onMounted(() => {
  rankingStore.fetchRanking(selectedRegion.value, selectedType.value, selectedFormat.value);
});

// 画面を離れるときに自分のランク情報をクリアする
onUnmounted(() => {
  rankingStore.myRank = null;
});

// 地域、表示タイプ、形式が変わったらランキングを再取得してURLも更新
watch([selectedRegion, selectedType, selectedFormat], () => {
  rankingStore.fetchRanking(selectedRegion.value, selectedType.value, selectedFormat.value);
  
  router.replace({
    path: '/ranking',
    query: {
      region: selectedRegion.value,
      type: selectedType.value,
      format: selectedFormat.value
    }
  });
});
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
    <h2 class="text-3xl font-bold my-6 text-center">{{ t.ranking.title }}</h2>

    <!-- 地域選択、表示タイプ選択、形式選択 -->
    <div class="flex flex-col md:flex-row gap-2 md:gap-4 mb-6 bg-white p-3 md:p-4 rounded-lg shadow">
      <div class="flex-1">
        <RegionSelector v-model="selectedRegion" :label="t.ranking.region" />
      </div>
      <div class="flex-1">
        <label for="type" class="hidden md:block text-sm font-medium text-gray-700 mb-1">{{ t.ranking.display }}</label>
        <select
          id="type"
          v-model="selectedType"
          class="w-full px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="daily">{{ t.ranking.dailyRanking }}</option>
          <option value="all_time">{{ t.ranking.allTimeTop5 }}</option>
        </select>
      </div>
      <div class="flex-1">
        <QuizFormatSelector v-model="selectedFormat" :label="t.ranking.quizFormat" />
      </div>
    </div>

    <LoadingSpinner v-if="rankingStore.loading" :message="t.ranking.loading" />
    <ErrorMessage v-else-if="rankingStore.error" :message="rankingStore.error" />
    <div v-else-if="rankingStore.ranking.length > 0">
      <!-- デスクトップ: テーブル表示 -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-300">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">{{ t.ranking.rank }}</th>
              <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">{{ t.ranking.nicknameLabel }}</th>
              <th class="py-3 px-6 text-right text-lg font-medium text-gray-600">{{ t.ranking.scoreLabel }}</th>
              <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">{{ t.ranking.registeredAt }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in rankingStore.ranking"
              :key="item.rank"
              class="border-b"
              :class="{ 'bg-yellow-200': rankingStore.myRank && rankingStore.myRank.nickname === item.nickname && rankingStore.myRank.score === item.score }"
            >
              <td class="py-4 px-6 text-xl font-bold">
                <span v-if="item.rank === 1">🥇</span>
                <span v-else-if="item.rank === 2">🥈</span>
                <span v-else-if="item.rank === 3">🥉</span>
                <span v-else class="pl-2">{{ item.rank }}</span>
              </td>
              <td class="py-4 px-6 text-lg">{{ item.nickname }}</td>
              <td class="py-4 px-6 text-lg font-semibold text-right">{{ item.score }} pt</td>
              <td class="py-4 px-6 text-sm text-gray-600">{{ formatDateTime(item.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- モバイル: カード表示 -->
      <div class="md:hidden space-y-3">
        <div
          v-for="item in rankingStore.ranking"
          :key="item.rank"
          class="bg-white p-3 rounded-lg shadow border border-gray-200"
          :class="{ 'bg-yellow-100 border-yellow-400': rankingStore.myRank && rankingStore.myRank.nickname === item.nickname && rankingStore.myRank.score === item.score }"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold">
                <span v-if="item.rank === 1">🥇</span>
                <span v-else-if="item.rank === 2">🥈</span>
                <span v-else-if="item.rank === 3">🥉</span>
                <span v-else class="pl-3 pr-2 text-gray-600">{{ item.rank }}</span>
              </span>
              <span class="text-lg font-semibold">{{ item.nickname }}</span>
            </div>
            <span class="text-xl font-bold text-indigo-600 ml-2">{{ item.score }} pt</span>
          </div>
          <div class="text-xs text-gray-500">
            {{ formatDateTime(item.created_at) }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center">
      <p>{{ t.ranking.noData }}</p>
    </div>
  </div>
</template>
