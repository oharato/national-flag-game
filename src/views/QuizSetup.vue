<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore, type QuizFormat, type QuizRegion } from '../store/quiz';
import { useCountriesStore } from '../store/countries';
import RegionSelector from '../components/RegionSelector.vue';
import QuizFormatSelector from '../components/QuizFormatSelector.vue';
import AppButton from '../components/AppButton.vue';
import { useTranslation } from '../composables/useTranslation';

const router = useRouter();
const quizStore = useQuizStore();
const countriesStore = useCountriesStore();
const { t } = useTranslation();

// localStorageからニックネームを読み込む
const NICKNAME_STORAGE_KEY = 'quiz_nickname';
const savedNickname = localStorage.getItem(NICKNAME_STORAGE_KEY);
const nickname = ref(savedNickname || quizStore.nickname);
const quizFormat = ref<QuizFormat>(quizStore.quizFormat);
const quizRegion = ref<QuizRegion>(quizStore.quizRegion);
const numberOfQuestions = ref(quizStore.numberOfQuestions);
const nicknameError = ref<string>('');

// 国データがないとクイズが始められないので、ここで読み込んでおく
onMounted(() => {
  countriesStore.fetchCountries();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// キーボードショートカット: Ctrl+Enter でクイズ開始
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    startQuiz();
  }
};

// ニックネームのバリデーション
const validateNickname = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: t.value.quizSetup.nicknameRequired };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: t.value.quizSetup.nicknameTooLong };
  }
  
  // 危険な文字をチェック（HTMLタグ、スクリプトインジェクション対策）
  if (/<|>|&lt;|&gt;|<script|javascript:|on\w+=/i.test(trimmed)) {
    return { valid: false, error: t.value.quizSetup.nicknameInvalidChars };
  }
  
  // 制御文字をチェック
  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
    return { valid: false, error: t.value.quizSetup.nicknameInvalidChars };
  }
  
  return { valid: true };
};

const startQuiz = () => {
  const validation = validateNickname(nickname.value);
  
  if (!validation.valid) {
    nicknameError.value = validation.error || '';
    return;
  }
  
  // エラーをクリア
  nicknameError.value = '';
  
  // ニックネームをトリミングして保存
  const sanitizedNickname = nickname.value.trim();
  localStorage.setItem(NICKNAME_STORAGE_KEY, sanitizedNickname);
  quizStore.setupQuiz(sanitizedNickname, quizFormat.value, quizRegion.value, numberOfQuestions.value);
  router.push('/quiz/play');
};

// ニックネーム入力時にエラーをクリア
const clearNicknameError = () => {
  if (nicknameError.value) {
    nicknameError.value = '';
  }
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-lg">
    <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
    <h2 class="text-3xl font-bold my-6 text-center">{{ t.quizSetup.title }}</h2>

    <form @submit.prevent="startQuiz" class="space-y-6">
      <div>
        <label for="nickname" class="block text-lg font-medium text-gray-700">{{ t.quizSetup.nickname }}</label>
        <input
          type="text"
          id="nickname"
          v-model="nickname"
          @input="clearNicknameError"
          maxlength="20"
          class="mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2"
          :class="nicknameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'"
          :placeholder="t.quizSetup.nicknamePlaceholder"
        />
        <p v-if="nicknameError" class="mt-1 text-sm text-red-600">
          {{ nicknameError }}
        </p>
      </div>

      <QuizFormatSelector 
        v-model="quizFormat" 
        :label="t.quizSetup.quizFormat"
        variant="radio"
      />

      <RegionSelector 
        v-model="quizRegion" 
        :label="t.quizSetup.region"
        always-show-label
      />

      <div>
        <label for="numQuestions" class="block text-sm font-medium text-gray-700 mb-1">{{ t.quizSetup.numberOfQuestions }}</label>
        <select
          id="numQuestions"
          v-model.number="numberOfQuestions"
          class="w-full px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option :value="5">{{ t.quizSetup.questions5 }}</option>
          <option :value="10">{{ t.quizSetup.questions10 }}</option>
          <option :value="30">{{ t.quizSetup.questions30 }}</option>
          <option :value="999">{{ t.quizSetup.questionsAll }}</option>
        </select>
      </div>

      <div>
        <AppButton
          type="submit"
          variant="secondary"
          size="lg"
          full-width
          :disabled="countriesStore.loading || !!countriesStore.error || countriesStore.countries.length === 0"
        >
          <span v-if="countriesStore.loading">{{ t.quizSetup.preparingData }}</span>
          <span v-else-if="countriesStore.error">{{ t.quizSetup.error }}</span>
          <span v-else-if="countriesStore.countries.length === 0">{{ t.quizSetup.noData }}</span>
          <span v-else>{{ t.quizSetup.start }}</span>
        </AppButton>
        <p class="mt-2 text-sm text-gray-500 text-center">{{ t.quizSetup.keyboardHint }}</p>
      </div>
    </form>
  </div>
</template>
