<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore } from '../store/quiz';
import { useCountriesStore } from '../store/countries';
import { useTranslation } from '../composables/useTranslation';
import type { Country } from '../store/countries';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorMessage from '../components/ErrorMessage.vue';
import AppButton from '../components/AppButton.vue';

const router = useRouter();
const quizStore = useQuizStore();
const countriesStore = useCountriesStore();
const { t } = useTranslation();

const elapsedTime = ref(0);
let timer: number;

// 選択中の選択肢のインデックス（0-3）
const selectedIndex = ref(0);

// 画像読み込み状態
const imagesLoaded = ref(false);
const loadedImagesCount = ref(0);

// 1問ごとのフィードバック関連のrefを削除
// const selectedOptionId = ref<string | null>(null);
// const isCorrectAnswer = ref<boolean | null>(null);
// const feedbackActive = ref(false);

// 画像の読み込みを監視
const checkImagesLoaded = () => {
  if (!quizStore.currentQuestion) return;
  
  const totalImages = quizStore.quizFormat === 'flag-to-name' 
    ? 1 // 問題の国旗1枚のみ
    : quizStore.currentQuestion.options.length; // 選択肢の国旗すべて
  
  if (loadedImagesCount.value >= totalImages) {
    imagesLoaded.value = true;
  }
};

const onImageLoad = () => {
  loadedImagesCount.value++;
  checkImagesLoaded();
};

// 次の問題の画像をプリロード
const preloadNextQuestion = () => {
  const nextIndex = quizStore.currentQuestionIndex + 1;
  if (nextIndex >= quizStore.questions.length) return;
  
  const nextQuestion = quizStore.questions[nextIndex];
  if (!nextQuestion) return;
  
  if (quizStore.quizFormat === 'flag-to-name') {
    // 問題の国旗をプリロード
    const img = new Image();
    img.src = nextQuestion.correctAnswer.flag_image_url;
  } else {
    // 選択肢の国旗をプリロード
    nextQuestion.options.forEach(option => {
      const img = new Image();
      img.src = option.flag_image_url;
    });
  }
};

// 問題が変わったら画像読み込み状態をリセット & 次の問題をプリロード
watch(() => quizStore.currentQuestionIndex, () => {
  selectedIndex.value = 0;
  imagesLoaded.value = false;
  loadedImagesCount.value = 0;
  
  // 画像が読み込まれたら次の問題をプリロード
  watch(imagesLoaded, (loaded) => {
    if (loaded) {
      preloadNextQuestion();
    }
  }, { once: true });
});

onMounted(async () => {
  if (countriesStore.countries.length === 0 && !countriesStore.loading) {
    await countriesStore.fetchCountries();
  }

  if (countriesStore.error) {
    return;
  }

  if (quizStore.questions.length === 0) {
    router.push('/quiz');
    return;
  }
  quizStore.startQuiz();
  timer = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - quizStore.startTime) / 1000);
  }, 1000);
  
  // キーボードイベントリスナーを追加
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  clearInterval(timer);
  window.removeEventListener('keydown', handleKeydown);
});

watch(() => quizStore.endTime, (newEndTime) => {
  if (newEndTime > 0) {
    clearInterval(timer);
    router.push('/quiz/result');
  }
});

// キーボード操作
const handleKeydown = (e: KeyboardEvent) => {
  if (!quizStore.currentQuestion || !imagesLoaded.value) return;
  
  const optionsCount = quizStore.currentQuestion.options.length;
  // 画面幅をチェック（768px未満はモバイル、1列表示）
  const isMobile = window.innerWidth < 768;
  
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (isMobile) {
        // モバイル: 1つ上に移動
        selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : selectedIndex.value;
      } else {
        // デスクトップ: 2つ上に移動（2列グリッド）
        selectedIndex.value = selectedIndex.value === 0 || selectedIndex.value === 1 
          ? selectedIndex.value 
          : selectedIndex.value - 2;
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (isMobile) {
        // モバイル: 1つ下に移動
        selectedIndex.value = selectedIndex.value < optionsCount - 1 ? selectedIndex.value + 1 : selectedIndex.value;
      } else {
        // デスクトップ: 2つ下に移動（2列グリッド）
        selectedIndex.value = selectedIndex.value >= optionsCount - 2 
          ? selectedIndex.value 
          : selectedIndex.value + 2;
      }
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (!isMobile && selectedIndex.value % 2 === 1) {
        selectedIndex.value--;
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!isMobile && selectedIndex.value % 2 === 0 && selectedIndex.value < optionsCount - 1) {
        selectedIndex.value++;
      }
      break;
    case 'Enter':
      e.preventDefault();
      const selectedOption = quizStore.currentQuestion.options[selectedIndex.value];
      if (selectedOption) {
        handleAnswer(selectedOption);
      }
      break;
  }
};

const handleAnswer = (option: Country) => {
  if (!imagesLoaded.value) return; // 画像が読み込まれるまで回答を無効化
  
  // 1問ごとのフィードバック関連のロジックを削除
  // if (feedbackActive.value) return;

  // feedbackActive.value = true;
  // selectedOptionId.value = option.id;

  // const isCorrect = option.id === quizStore.currentQuestion.correctAnswer.id;
  // isCorrectAnswer.value = isCorrect;

  quizStore.answerQuestion(option.id);

  // setTimeout(() => {
  //   selectedOptionId.value = null;
  //   isCorrectAnswer.value = null;
  //   feedbackActive.value = false;
  //   if (quizStore.currentQuestionIndex < quizStore.questions.length) {
  //     // 次の質問があればそのまま続行（quizStore.answerQuestionが自動で次の質問に進む）
  //   }
  // }, 1000);
};

// マウスホバー時に選択状態を更新
const handleMouseEnter = (index: number) => {
  selectedIndex.value = index;
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-3xl">
    <LoadingSpinner 
      v-if="countriesStore.loading" 
      full-screen 
    />

    <ErrorMessage
      v-else-if="countriesStore.error"
      :message="`${t.quizPlay.loadError}: ${countriesStore.error}`"
      retryable
      @retry="countriesStore.fetchCountries(true)"
    />

    <div v-else-if="quizStore.currentQuestion">
      <div class="flex justify-between items-center mb-6">
        <div class="text-xl font-bold">
          {{ t.quizPlay.question }} {{ quizStore.currentQuestionIndex + 1 }} / {{ quizStore.questions.length }}
        </div>
        <div class="text-xl font-bold">
          {{ t.quizPlay.elapsedTime }}: {{ elapsedTime }}{{ t.quizPlay.seconds }}
        </div>
      </div>

      <div class="text-center p-8 border-2 border-gray-300 rounded-lg shadow-lg bg-gray-100 min-h-[200px] flex items-center justify-center relative">
        <!-- ローディングスピナー -->
        <div v-if="!imagesLoaded" class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <LoadingSpinner message="" />
        </div>
        
        <!-- 国旗を見て国名を選ぶ場合 -->
        <img
          v-if="quizStore.quizFormat === 'flag-to-name'"
          :src="quizStore.currentQuestion.correctAnswer.flag_image_url"
          :alt="t.quizPlay.flagAlt"
          class="max-h-48 object-contain"
          loading="eager"
          fetchpriority="high"
          @load="onImageLoad"
          @error="onImageLoad"
        />
        <!-- 国名を見て国旗を選ぶ場合 -->
        <h2 v-if="quizStore.quizFormat === 'name-to-flag'" class="text-4xl font-bold">
          {{ quizStore.currentQuestion.correctAnswer.name }}
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <button
          v-for="(option, index) in quizStore.currentQuestion.options"
          :key="option.id"
          @click="handleAnswer(option)"
          @mouseenter="handleMouseEnter(index)"
          :disabled="!imagesLoaded"
          class="p-4 border-2 rounded-lg focus:outline-none bg-gray-50 transition-all"
          :class="{
            'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50': selectedIndex === index && imagesLoaded,
            'border-gray-300 hover:bg-gray-100': selectedIndex !== index && imagesLoaded,
            'opacity-50 cursor-not-allowed': !imagesLoaded
          }"
        >
          <!-- 国旗を見て国名を選ぶ場合 -->
          <span v-if="quizStore.quizFormat === 'flag-to-name'" class="text-2xl">
            {{ option.name }}
          </span>
          <!-- 国名を見て国旗を選ぶ場合 -->
          <img
            v-if="quizStore.quizFormat === 'name-to-flag'"
            :src="option.flag_image_url"
            :alt="option.name"
            class="h-24 mx-auto object-contain"
            loading="eager"
            fetchpriority="high"
            @load="onImageLoad"
            @error="onImageLoad"
          />
        </button>
      </div>
    </div>
    <div v-else class="text-center py-10">
      <p>{{ t.quizPlay.noData }}</p>
      <AppButton variant="primary" @click="router.push('/quiz')" class="mt-4">
        {{ t.quizPlay.goToSetup }}
      </AppButton>
    </div>
  </div>
</template>
