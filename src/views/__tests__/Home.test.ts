import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Home from '../Home.vue';
import { useCountriesStore } from '../../store/countries';

describe('Home.vue', () => {
  let router: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        { path: '/quiz', component: { template: '<div>Quiz</div>' } },
        { path: '/study', component: { template: '<div>Study</div>' } },
        { path: '/ranking', component: { template: '<div>Ranking</div>' } },
      ],
    });

    const countriesStore = useCountriesStore();
    countriesStore.currentLanguage = 'ja'; // 日本語を選択
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正しくマウントされる', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('h1').text()).toBe('国旗ゲーム');
  });

  it('言語選択ドロップダウンが表示される', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    
    const options = select.findAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]?.text()).toBe('日本語');
    expect(options[1]?.text()).toBe('English');
  });

  it('デフォルトで日本語が選択されている', () => {
    mount(Home, {
      global: {
        plugins: [router],
      },
    });

    const countriesStore = useCountriesStore();
    expect(countriesStore.currentLanguage).toBe('ja');
  });

  it('言語を変更するとストアが更新される', async () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    const countriesStore = useCountriesStore();
    const select = wrapper.find('select');
    
    await select.setValue('en');
    
    expect(countriesStore.currentLanguage).toBe('en');
  });

  it('クイズへのリンクが正しく表示される', async () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    await router.isReady();
    
    const links = wrapper.findAllComponents({ name: 'RouterLink' });
    const quizLink = links.find(link => link.props('to') === '/quiz');
    expect(quizLink).toBeDefined();
  });

  it('学習モードへのリンクが正しく表示される', async () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    await router.isReady();
    
    const links = wrapper.findAllComponents({ name: 'RouterLink' });
    const studyLink = links.find(link => link.props('to') === '/study');
    expect(studyLink).toBeDefined();
  });

  it('ランキングへのリンクが正しく表示される', async () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    await router.isReady();
    
    const links = wrapper.findAllComponents({ name: 'RouterLink' });
    const rankingLink = links.find(link => link.props('to') === '/ranking');
    expect(rankingLink).toBeDefined();
  });

  it('すべてのナビゲーションボタンが表示される', async () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
      },
    });

    await router.isReady();
    
    const links = wrapper.findAllComponents({ name: 'RouterLink' });
    const navLinks = links.filter(link => 
      link.props('to') === '/quiz' || 
      link.props('to') === '/study' || 
      link.props('to') === '/ranking'
    );
    
    expect(navLinks).toHaveLength(3);
  });
});
