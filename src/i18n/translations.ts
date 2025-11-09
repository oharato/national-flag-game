export type Language = 'ja' | 'en';

export interface Translations {
  common: {
    backToHome: string;
  };
  home: {
    title: string;
    startQuiz: string;
    study: string;
    viewRanking: string;
  };
  quizSetup: {
    title: string;
    nickname: string;
    nicknamePlaceholder: string;
    quizFormat: string;
    flagToName: string;
    nameToFlag: string;
    region: string;
    numberOfQuestions: string;
    questions5: string;
    questions10: string;
    questions30: string;
    questionsAll: string;
    start: string;
    preparingData: string;
    error: string;
    noData: string;
    keyboardHint: string;
    // バリデーションエラー
    nicknameRequired: string;
    nicknameTooLong: string;
    nicknameInvalidChars: string;
  };
  quizPlay: {
    question: string;
    elapsedTime: string;
    seconds: string;
    loadError: string;
    flagAlt: string;
    noData: string;
    goToSetup: string;
  };
  quizResult: {
    title: string;
    settings: string;
    nickname: string;
    quizFormat: string;
    region: string;
    questionCount: string;
    questions: string;
    correctAnswers: string;
    time: string;
    seconds: string;
    score: string;
    points: string;
    answerDetails: string;
    question: string;
    questionLabel: string;
    yourAnswer: string;
    correctAnswer: string;
    unknown: string;
    goToRanking: string;
    backToTop: string;
  };
  ranking: {
    title: string;
    display: string;
    dailyRanking: string;
    allTimeTop5: string;
    rank: string;
    nicknameLabel: string;
    scoreLabel: string;
    registeredAt: string;
    loading: string;
    noData: string;
    region: string;
    quizFormat: string;
  };
  study: {
    title: string;
    quizMode: string;
    flagToName: string;
    nameToFlag: string;
    region: string;
    name: string;
    capital: string;
    continent: string;
    flagOrigin: string;
    summary: string;
    keyboardHint: string;
    next: string;
    prev: string;
  };
  quizFormat: {
    flagToName: string;
    nameToFlag: string;
    flagToNameLong: string;
    nameToFlagLong: string;
  };
  region: {
    all: string;
    africa: string;
    asia: string;
    europe: string;
    northAmerica: string;
    southAmerica: string;
    oceania: string;
  };
}

export const translations: Record<Language, Translations> = {
  ja: {
    common: {
      backToHome: '< トップページに戻る',
    },
    home: {
      title: '国旗ゲーム',
      startQuiz: 'クイズに挑戦する',
      study: '国旗を学習する',
      viewRanking: 'ランキングを見る',
    },
    quizSetup: {
      title: 'クイズ設定',
      nickname: 'ニックネーム（最大20文字）',
      nicknamePlaceholder: 'ニックネームを入力',
      quizFormat: 'クイズ形式',
      flagToName: '国旗 → 国名',
      nameToFlag: '国名 → 国旗',
      region: '出題範囲',
      numberOfQuestions: '問題数',
      questions5: '5問',
      questions10: '10問',
      questions30: '30問',
      questionsAll: 'すべて',
      start: 'スタート',
      preparingData: 'データ準備中...',
      error: 'エラー発生',
      noData: 'データなし',
      keyboardHint: 'ヒント: Ctrl+Enter でクイズ開始',
      nicknameRequired: 'ニックネームを入力してください。',
      nicknameTooLong: 'ニックネームは20文字以内で入力してください。',
      nicknameInvalidChars: 'ニックネームに使用できない文字が含まれています。',
    },
    quizPlay: {
      question: '問題',
      elapsedTime: '経過時間',
      seconds: '秒',
      loadError: 'データの読み込みに失敗しました',
      flagAlt: '国旗',
      noData: 'クイズデータがありません。設定画面に戻ってください。',
      goToSetup: 'クイズ設定へ',
    },
    quizResult: {
      title: '結果発表',
      settings: 'クイズ設定',
      nickname: 'ニックネーム',
      quizFormat: 'クイズ形式',
      region: '出題範囲',
      questionCount: '問題数',
      questions: '問',
      correctAnswers: '正解数',
      time: 'タイム',
      seconds: '秒',
      score: 'スコア',
      points: 'pt',
      answerDetails: '回答詳細',
      question: '問題',
      questionLabel: '問題',
      yourAnswer: 'あなたの回答',
      correctAnswer: '正解',
      unknown: '不明',
      goToRanking: 'ランキングを見る',
      backToTop: 'トップに戻る',
    },
    ranking: {
      title: 'ランキング',
      display: '表示',
      dailyRanking: '今日のランキング',
      allTimeTop5: '歴代トップ5',
      rank: '順位',
      nicknameLabel: 'ニックネーム',
      scoreLabel: 'スコア',
      registeredAt: '登録日時',
      loading: 'ランキングを読み込み中...',
      noData: 'まだランキングデータがありません。',
      region: '出題範囲',
      quizFormat: 'クイズ形式',
    },
    study: {
      title: '学習モード',
      quizMode: 'クイズ形式',
      flagToName: '国旗 → 国名',
      nameToFlag: '国名 → 国旗',
      region: '地域',
      name: '国名',
      capital: '首都',
      continent: '大陸',
      flagOrigin: '国旗の由来',
      summary: '概要',
      keyboardHint: '矢印キーで移動、スペースキーで表裏切り替え',
      next: '次へ →',
      prev: '← 前へ',
    },
    quizFormat: {
      flagToName: '国旗 → 国名',
      nameToFlag: '国名 → 国旗',
      flagToNameLong: '国旗を見て国名を選ぶ',
      nameToFlagLong: '国名を見て国旗を選ぶ',
    },
    region: {
      all: '全世界',
      africa: 'アフリカ',
      asia: 'アジア',
      europe: 'ヨーロッパ',
      northAmerica: '北アメリカ',
      southAmerica: '南アメリカ',
      oceania: 'オセアニア',
    },
  },
  en: {
    common: {
      backToHome: '< Back to Home',
    },
    home: {
      title: 'National Flag Game',
      startQuiz: 'Start Quiz',
      study: 'Study Flags',
      viewRanking: 'View Ranking',
    },
    quizSetup: {
      title: 'Quiz Setup',
      nickname: 'Nickname (max 20 characters)',
      nicknamePlaceholder: 'Enter nickname',
      quizFormat: 'Quiz Format',
      flagToName: 'Flag -> Name',
      nameToFlag: 'Name -> Flag',
      region: 'Region',
      numberOfQuestions: 'Number of Questions',
      questions5: '5 questions',
      questions10: '10 questions',
      questions30: '30 questions',
      questionsAll: 'All',
      start: 'Start',
      preparingData: 'Preparing data...',
      error: 'Error occurred',
      noData: 'No data',
      keyboardHint: 'Hint: Ctrl+Enter to start quiz',
      nicknameRequired: 'Please enter a nickname.',
      nicknameTooLong: 'Nickname must be 20 characters or less.',
      nicknameInvalidChars: 'Nickname contains invalid characters.',
    },
    quizPlay: {
      question: 'Question',
      elapsedTime: 'Elapsed Time',
      seconds: 'seconds',
      loadError: 'Failed to load data',
      flagAlt: 'Flag',
      noData: 'No quiz data. Please return to the setup screen.',
      goToSetup: 'Go to Quiz Setup',
    },
    quizResult: {
      title: 'Results',
      settings: 'Quiz Settings',
      nickname: 'Nickname',
      quizFormat: 'Quiz Format',
      region: 'Region',
      questionCount: 'Questions',
      questions: 'questions',
      correctAnswers: 'Correct',
      time: 'Time',
      seconds: 'seconds',
      score: 'Score',
      points: 'pt',
      answerDetails: 'Answer Details',
      question: 'Question',
      questionLabel: 'Question',
      yourAnswer: 'Your Answer',
      correctAnswer: 'Correct Answer',
      unknown: 'Unknown',
      goToRanking: 'View Ranking',
      backToTop: 'Back to Home',
    },
    ranking: {
      title: 'Ranking',
      display: 'Display',
      dailyRanking: "Today's Ranking",
      allTimeTop5: 'All-Time Top 5',
      rank: 'Rank',
      nicknameLabel: 'Nickname',
      scoreLabel: 'Score',
      registeredAt: 'Registered At',
      loading: 'Loading ranking...',
      noData: 'No ranking data yet.',
      region: 'Region',
      quizFormat: 'Quiz Format',
    },
    study: {
      title: 'Study Mode',
      quizMode: 'Quiz Format',
      flagToName: 'Flag -> Name',
      nameToFlag: 'Name -> Flag',
      region: 'Region',
      name: 'Country',
      capital: 'Capital',
      continent: 'Continent',
      flagOrigin: 'Flag Origin',
      summary: 'Summary',
      keyboardHint: 'Arrow keys to navigate, Space to flip',
      next: 'Next →',
      prev: '← Prev',
    },
    quizFormat: {
      flagToName: 'Flag -> Name',
      nameToFlag: 'Name -> Flag',
      flagToNameLong: 'See flag, choose country name',
      nameToFlagLong: 'See country name, choose flag',
    },
    region: {
      all: 'All World',
      africa: 'Africa',
      asia: 'Asia',
      europe: 'Europe',
      northAmerica: 'North America',
      southAmerica: 'South America',
      oceania: 'Oceania',
    },
  },
};
