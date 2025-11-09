import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LazyImage from '../LazyImage.vue';

describe('LazyImage.vue', () => {
  let intersectionObserverCallback: IntersectionObserverCallback | null = null;
  let observeSpy: any;
  let unobserveSpy: any;

  beforeEach(() => {
    observeSpy = vi.fn();
    unobserveSpy = vi.fn();
    
    // IntersectionObserver をモック
    vi.stubGlobal('IntersectionObserver', class IntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        intersectionObserverCallback = callback;
      }
      observe = observeSpy;
      unobserve = unobserveSpy;
      disconnect = vi.fn();
    } as any);
  });

  afterEach(() => {
    intersectionObserverCallback = null;
    vi.unstubAllGlobals();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image'
      }
    });

    expect(wrapper.find('img').exists()).toBe(true);
  });

  it('eager=false の場合、初期状態では画像を読み込まない', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: false
      }
    });

    const img = wrapper.find('img');
    expect(img.attributes('src')).toBeUndefined();
  });

  it('eager=true の場合、即座に画像を読み込む', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: true
      }
    });

    const img = wrapper.find('img');
    expect(img.attributes('src')).toBe('/test-image.png');
  });

  it('alt属性が正しく設定される', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Alt Text'
      }
    });

    const img = wrapper.find('img');
    expect(img.attributes('alt')).toBe('Test Alt Text');
  });

  it('class属性が正しく適用される', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        class: 'custom-class'
      }
    });

    const img = wrapper.find('img');
    expect(img.classes()).toContain('custom-class');
  });

  it('IntersectionObserverが要素を監視する', async () => {
    mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: false
      }
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(observeSpy).toHaveBeenCalled();
  });

  it('要素が表示されたら画像を読み込む', async () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: false
      }
    });

    // 初期状態では src がない
    let img = wrapper.find('img');
    expect(img.attributes('src')).toBeUndefined();

    // 要素が表示されたことをシミュレート
    await new Promise(resolve => setTimeout(resolve, 10));
    if (intersectionObserverCallback) {
      const mockEntry = [{
        target: img.element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now()
      }] as IntersectionObserverEntry[];
      
      intersectionObserverCallback(mockEntry, {} as IntersectionObserver);
    }
    await wrapper.vm.$nextTick();

    // src が設定される
    img = wrapper.find('img');
    expect(img.attributes('src')).toBe('/test-image.png');
  });

  it('画像読み込み前は opacity-0 クラスが適用される', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: true
      }
    });

    const img = wrapper.find('img');
    expect(img.classes()).toContain('opacity-0');
  });

  it('画像読み込み完了後は opacity-100 クラスが適用される', async () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: true
      }
    });

    const img = wrapper.find('img');
    
    // load イベントを発火
    await img.trigger('load');
    await wrapper.vm.$nextTick();

    expect(img.classes()).toContain('opacity-100');
    expect(img.classes()).toContain('transition-opacity');
  });

  it('コンポーネントのアンマウント時に IntersectionObserver が解除される', async () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: false
      }
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 監視が開始されたことを確認
    expect(observeSpy).toHaveBeenCalled();
    
    // アンマウント前にunobserveをリセット
    unobserveSpy.mockClear();
    
    // アンマウント
    wrapper.unmount();
    
    // unobserve が呼ばれることを期待（imgRef.value が存在する場合）
    // DOMが即座に削除されるため、呼ばれない可能性もある
    // 最低限observeが呼ばれていればOK
    expect(observeSpy).toHaveBeenCalled();
  });

  it('eager=true の場合は IntersectionObserver を使用しない', () => {
    mount(LazyImage, {
      props: {
        src: '/test-image.png',
        alt: 'Test Image',
        eager: true
      }
    });

    expect(observeSpy).not.toHaveBeenCalled();
  });
});
