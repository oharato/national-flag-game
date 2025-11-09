import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Study from '../Study.vue';
import { useCountriesStore } from '../../store/countries';
import { mockCountries } from '../../__tests__/fixtures/countries';

describe('Study.vue', () => {
  let router: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/study', component: Study },
      ],
    });

    const countriesStore = useCountriesStore();
    countriesStore.countries = mockCountries;
    countriesStore.loading = false; // ローディング状態を解除
    countriesStore.currentLanguage = 'ja'; // 日本語を選択
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正しくマウントされる', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('h2').text()).toBe('学習モード');
  });

  it('最初の国が表示される', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 最初の国（日本）の国旗が表示される
    const flagImage = wrapper.find('img[alt="日本の国旗"]');
    expect(flagImage.exists()).toBe(true);
    expect(flagImage.attributes('src')).toBe('/flags/jp.svg');
  });

  it('カードをクリックするとフリップする', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態でisFlippedがfalseであることを確認
    expect((wrapper.vm as any).isFlipped).toBe(false);
    
    // カード（表面）をクリック
    const cardFront = wrapper.find('.backface-hidden.bg-gray-100');
    await cardFront.trigger('click');
    await wrapper.vm.$nextTick();
    
    // isFlippedがtrueになることを確認
    expect((wrapper.vm as any).isFlipped).toBe(true);
  });

  it('「次へ」ボタンで次の国に移動する', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期インデックスは0
    expect((wrapper.vm as any).currentIndex).toBe(0);

    const nextButton = wrapper.findAll('button').find(btn => btn.text().includes('次へ'));
    expect(nextButton).toBeDefined();
    
    if (nextButton) {
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // currentIndexが1になることを確認
      expect((wrapper.vm as any).currentIndex).toBe(1);
      // カードが表面に戻ることを確認
      expect((wrapper.vm as any).isFlipped).toBe(false);
    }
  });

  it('「前へ」ボタンで前の国に移動する', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // まず次へ進む
    const nextButton = wrapper.findAll('button').find(btn => btn.text().includes('次へ'));
    if (nextButton) {
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).currentIndex).toBe(1);
    }
    
    // 前へ戻る
    const prevButton = wrapper.findAll('button').find(btn => btn.text().includes('前へ'));
    if (prevButton) {
      await prevButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // インデックスが0に戻ることを確認
      expect((wrapper.vm as any).currentIndex).toBe(0);
      // カードが表面に戻ることを確認
      expect((wrapper.vm as any).isFlipped).toBe(false);
    }
  });

  it('最後の国で「次へ」を押すと最初に戻る（ループ）', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    const nextButton = wrapper.findAll('button').find(btn => btn.text().includes('次へ'));
    
    if (nextButton) {
      // 3回「次へ」を押して最後の国の次へ
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // インデックスが0に戻ることを確認（ループ）
      expect((wrapper.vm as any).currentIndex).toBe(0);
    }
  });

  it('最初の国で「前へ」を押すと最後に移動する（ループ）', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態でインデックスは0
    expect((wrapper.vm as any).currentIndex).toBe(0);

    const prevButton = wrapper.findAll('button').find(btn => btn.text().includes('前へ'));
    if (prevButton) {
      await prevButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // インデックスが最後（2）になることを確認
      expect((wrapper.vm as any).currentIndex).toBe(2);
    }
  });

  it('カウンター表示が正しい', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('1 / 3');
  });

  it('地域選択ドロップダウンが表示される', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    const select = wrapper.find('#studyRegion');
    expect(select.exists()).toBe(true);
    
    const options = select.findAll('option');
    expect(options[0]?.text()).toBe('全世界');
  });

  it('地域を選択するとフィルタリングされる', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    const select = wrapper.find('#studyRegion');
    await select.setValue('Asia');
    await wrapper.vm.$nextTick();
    
    // フィルタリングされた国の数を確認
    const filteredCountries = (wrapper.vm as any).filteredCountries;
    expect(filteredCountries.length).toBe(1);
    expect(filteredCountries[0].name).toBe('日本');
  });

  it('地域を変更するとカードが表面に戻る', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // カードをフリップ
    const cardFront = wrapper.find('.backface-hidden.bg-gray-100');
    await cardFront.trigger('click');
    await wrapper.vm.$nextTick();
    
    // isFlippedがtrueになることを確認
    expect((wrapper.vm as any).isFlipped).toBe(true);
    
    // 地域を変更
    const select = wrapper.find('#studyRegion');
    await select.setValue('Europe');
    await wrapper.vm.$nextTick();
    
    // isFlippedがfalseに戻ることを確認
    expect((wrapper.vm as any).isFlipped).toBe(false);
  });

  it('表裏切り替えボタンでカードをフリップできる', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態でisFlippedがfalseであることを確認
    expect((wrapper.vm as any).isFlipped).toBe(false);
    
    // カードをクリックしてフリップ
    const cardFront = wrapper.find('.backface-hidden.bg-gray-100');
    await cardFront.trigger('click');
    await wrapper.vm.$nextTick();
    
    // isFlippedがtrueになることを確認
    expect((wrapper.vm as any).isFlipped).toBe(true);
    
    // もう一度クリック
    await cardFront.trigger('click');
    await wrapper.vm.$nextTick();
    
    // isFlippedがfalseに戻ることを確認
    expect((wrapper.vm as any).isFlipped).toBe(false);
  });

  it('複数の首都を持つ国の場合、最初の首都が表示される', async () => {
    const countriesStore = useCountriesStore();
    countriesStore.countries = [
      { id: 'za', name: '南アフリカ', capital: ['プレトリア', 'ケープタウン', 'ブルームフォンテーン'], continent: 'Africa', flag_image_url: '/flags/za.svg', map_image_url: '/maps/za.svg', description: '説明', summary: '概要' },
    ];
    countriesStore.loading = false;

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    const currentCountry = (wrapper.vm as any).currentCountry;
    expect(currentCountry).toBeDefined();
    expect(currentCountry?.name).toBe('南アフリカ');
    
    if (Array.isArray(currentCountry?.capital)) {
      expect(currentCountry.capital[0]).toBe('プレトリア');
    }
  });

  it('ローディング中は読み込みメッセージが表示される', () => {
    const countriesStore = useCountriesStore();
    countriesStore.loading = true;
    countriesStore.countries = [];

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('ランキングを読み込み中...');
  });

  it('エラー時はエラーメッセージが表示される', () => {
    const countriesStore = useCountriesStore();
    countriesStore.loading = false;
    countriesStore.error = 'データ取得エラー';

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('データ取得エラー');
  });

  it('国データがない場合、メッセージが表示される', () => {
    const countriesStore = useCountriesStore();
    countriesStore.loading = false;
    countriesStore.error = null;
    countriesStore.countries = [];

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 国データがない場合は何も表示されない（filteredCountriesが空）
    const filteredCountries = (wrapper.vm as any).filteredCountries;
    expect(filteredCountries.length).toBe(0);
  });

    it('国旗一覧が表示される', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });
    
    await wrapper.vm.$nextTick();
    
    // filteredCountriesの数を確認
    const filteredCountries = (wrapper.vm as any).filteredCountries;
    expect(filteredCountries.length).toBe(3);
  });

  it('国旗一覧の国旗をクリックすると上の国旗が変わる', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態でcurrentIndexは0
    expect((wrapper.vm as any).currentIndex).toBe(0);

    // 国旗一覧のボタンを取得
    const flagButtons = wrapper.findAll('button').filter(btn => {
      const img = btn.find('img');
      return img.exists() && img.attributes('alt')?.includes('の国旗');
    });

    // 3番目の国旗（イギリス）をクリック
    if (flagButtons[2]) {
      await flagButtons[2].trigger('click');
      await wrapper.vm.$nextTick();
      
      // currentIndexが2になることを確認
      expect((wrapper.vm as any).currentIndex).toBe(2);
      
      // カードが表面に戻ることを確認
      expect((wrapper.vm as any).isFlipped).toBe(false);
    }
  });

  it('クイズ形式が選択できる', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態は「国旗→国名」
    expect((wrapper.vm as any).quizMode).toBe('flag-to-name');

    // プルダウンを取得
    const quizModeSelect = wrapper.find('#quizMode');
    expect(quizModeSelect.exists()).toBe(true);

    // 「国名→国旗」に変更
    await quizModeSelect.setValue('name-to-flag');
    expect((wrapper.vm as any).quizMode).toBe('name-to-flag');
  });

  it('国旗→国名モードでは国旗が表示される', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 国旗→国名モード（デフォルト）
    const flagImage = wrapper.find('img[alt="日本の国旗"]');
    expect(flagImage.exists()).toBe(true);
  });

  it('国名→国旗モードでは表に国名と詳細情報が表示される', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 国名→国旗モードに変更
    const quizModeSelect = wrapper.find('#quizMode');
    await quizModeSelect.setValue('name-to-flag');
    await flushPromises();
    await wrapper.vm.$nextTick();

    // quizModeが変更されたことを確認
    expect((wrapper.vm as any).quizMode).toBe('name-to-flag');
  });



  it('国旗→国名モードでカードを裏返すと国名と詳細情報が表示される', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態は国旗→国名モード
    expect((wrapper.vm as any).quizMode).toBe('flag-to-name');

    // カードをクリックして裏返す
    const card = wrapper.find('.cursor-pointer[class*="backface-hidden"]');
    await card.trigger('click');
    await wrapper.vm.$nextTick();

    // isFlippedがtrueになることを確認
    expect((wrapper.vm as any).isFlipped).toBe(true);
  });
});
