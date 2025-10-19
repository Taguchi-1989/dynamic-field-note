# Performance Optimizations Test Plan

## パフォーマンス最適化のテスト計画

**作成日**: 2025-10-19
**対象**: Phase 4 パフォーマンス改善（SEO、コード分割、画像最適化）
**更新理由**: Lighthouse改善実装に伴うテストケース追加

---

## 📋 概要

Phase 4で実装したパフォーマンス最適化機能のテスト計画を定義します。

### 実装済み最適化

1. ✅ **SEO対応**（app.json Meta情報追加）
2. ✅ **コード分割**（React.lazy + Suspense）
3. ✅ **画像最適化**（expo-image導入）
4. ✅ **スプラッシュスクリーン最適化**

---

## 🧪 Unit Tests（単体テスト）

### 1. expo-image コンポーネントテスト

#### 1.1 PhotoThumbnailGrid.test.tsx

**ファイル**: `src/components/__tests__/PhotoThumbnailGrid.test.tsx`

```typescript
/**
 * PhotoThumbnailGrid Unit Tests
 * expo-image統合テスト
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PhotoThumbnailGrid } from '../PhotoThumbnailGrid';
import { Photo } from '../../types/case';

describe('PhotoThumbnailGrid - expo-image integration', () => {
  const mockPhotos: Photo[] = [
    {
      id: 1,
      case_id: 1,
      file_path: '/path/to/photo1.jpg',
      file_name: 'photo1.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      thumbnail_path: '/path/to/thumb1.jpg',
      caption: 'Test Photo 1',
      annotation_data: null,
      created_at: '2025-10-19T00:00:00Z',
    },
  ];

  it('expo-imageでサムネイルを表示', () => {
    const onPhotoPress = jest.fn();
    const onDeletePress = jest.fn();
    const onAddPress = jest.fn();

    const { getAllByLabelText } = render(
      <PhotoThumbnailGrid
        photos={mockPhotos}
        maxPhotos={10}
        onPhotoPress={onPhotoPress}
        onDeletePress={onDeletePress}
        onAddPress={onAddPress}
      />
    );

    // expo-imageのImageコンポーネントが存在することを確認
    expect(getAllByLabelText('写真サムネイル')).toHaveLength(1);
  });

  it('画像タップでonPhotoPressが呼ばれる', () => {
    const onPhotoPress = jest.fn();
    const onDeletePress = jest.fn();
    const onAddPress = jest.fn();

    const { getByLabelText } = render(
      <PhotoThumbnailGrid
        photos={mockPhotos}
        maxPhotos={10}
        onPhotoPress={onPhotoPress}
        onDeletePress={onDeletePress}
        onAddPress={onAddPress}
      />
    );

    fireEvent.press(getByLabelText('写真サムネイル'));
    expect(onPhotoPress).toHaveBeenCalledWith(mockPhotos[0]);
  });

  it('遅延ロードが設定されている', () => {
    const { UNSAFE_getByType } = render(
      <PhotoThumbnailGrid
        photos={mockPhotos}
        maxPhotos={10}
        onPhotoPress={jest.fn()}
        onDeletePress={jest.fn()}
        onAddPress={jest.fn()}
      />
    );

    // expo-imageのpropsを確認（実装に応じて調整）
    const image = UNSAFE_getByType(require('expo-image').Image);
    expect(image.props.transition).toBeDefined();
  });
});
```

#### 1.2 PhotoViewerModal.test.tsx

**ファイル**: `src/components/__tests__/PhotoViewerModal.test.tsx`

```typescript
/**
 * PhotoViewerModal Unit Tests
 * expo-image拡大表示テスト
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoViewerModal } from '../PhotoViewerModal';
import { Photo } from '../../types/case';

describe('PhotoViewerModal - expo-image integration', () => {
  const mockPhoto: Photo = {
    id: 1,
    case_id: 1,
    file_path: '/path/to/photo.jpg',
    file_name: 'photo.jpg',
    file_size: 2048,
    mime_type: 'image/jpeg',
    thumbnail_path: '/path/to/thumb.jpg',
    caption: 'Full Size Photo',
    annotation_data: null,
    created_at: '2025-10-19T00:00:00Z',
  };

  it('expo-imageで拡大画像を表示', () => {
    const { getByLabelText } = render(
      <PhotoViewerModal photo={mockPhoto} visible={true} onDismiss={jest.fn()} />
    );

    expect(getByLabelText('写真拡大表示')).toBeTruthy();
  });

  it('visibleがfalseの場合、画像を表示しない', () => {
    const { queryByLabelText } = render(
      <PhotoViewerModal photo={mockPhoto} visible={false} onDismiss={jest.fn()} />
    );

    expect(queryByLabelText('写真拡大表示')).toBeNull();
  });

  it('高解像度画像のcontentFit設定を確認', () => {
    const { UNSAFE_getByType } = render(
      <PhotoViewerModal photo={mockPhoto} visible={true} onDismiss={jest.fn()} />
    );

    const image = UNSAFE_getByType(require('expo-image').Image);
    expect(image.props.contentFit).toBe('contain');
  });
});
```

### 2. React.lazy コンポーネントテスト

#### 2.1 RootNavigator.test.tsx

**ファイル**: `src/navigation/__tests__/RootNavigator.test.tsx`

```typescript
/**
 * RootNavigator Unit Tests
 * React.lazy + Suspense テスト
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';

describe('RootNavigator - Code Splitting', () => {
  it('Suspense境界が設定されている', async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // LoadingFallbackが表示されることを確認
    await waitFor(() => {
      expect(getByTestId('loading-fallback')).toBeTruthy();
    });
  });

  it('Lazy loadedコンポーネントがロードされる', async () => {
    const { queryByTestId } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // ローディング完了後、DrawerNavigatorが表示される
    await waitFor(
      () => {
        expect(queryByTestId('loading-fallback')).toBeNull();
      },
      { timeout: 5000 }
    );
  });
});
```

### 3. スプラッシュスクリーンテスト

#### 3.1 App.test.tsx

**ファイル**: `__tests__/App.test.tsx`

```typescript
/**
 * App Unit Tests
 * スプラッシュスクリーン & データベース初期化テスト
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';
import * as SplashScreen from 'expo-splash-screen';
import { databaseService } from '../src/services/DatabaseService';

jest.mock('expo-splash-screen');
jest.mock('../src/services/DatabaseService');

describe('App - Splash Screen & Database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preventAutoHideAsyncが呼ばれる', () => {
    render(<App />);
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  });

  it('データベース初期化成功後、hideAsyncが呼ばれる', async () => {
    (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });

  it('データベース初期化失敗時、エラー画面を表示', async () => {
    (databaseService.initialize as jest.Mock).mockRejectedValue(
      new Error('DB Error')
    );

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('エラー')).toBeTruthy();
      expect(getByText('DB Error')).toBeTruthy();
    });
  });
});
```

---

## 🔄 E2E Tests（統合テスト）

### 4. パフォーマンス測定 E2E

#### 4.1 performance-optimization.test.ts

**ファイル**: `e2e/comprehensive/performance-optimization.test.ts`

```typescript
/**
 * Performance Optimization E2E Tests
 * Phase 4: SEO、コード分割、画像最適化の統合テスト
 */

import { test, expect } from '@playwright/test';

describe('Performance Optimizations E2E', () => {
  test.describe('SEO対応', () => {
    test('Meta descriptionが設定されている', async ({ page }) => {
      await page.goto('http://localhost:8081');

      const metaDescription = await page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /音声メモをAIで自動要約/);
    });

    test('Meta keywordsが設定されている', async ({ page }) => {
      await page.goto('http://localhost:8081');

      const metaKeywords = await page.locator('meta[name="keywords"]');
      await expect(metaKeywords).toHaveAttribute('content', /現場調査,点検/);
    });

    test('Viewportが設定されている', async ({ page }) => {
      await page.goto('http://localhost:8081');

      const viewport = await page.locator('meta[name="viewport"]');
      await expect(viewport).toHaveAttribute('content', /width=device-width, initial-scale=1/);
    });
  });

  test.describe('画像最適化（expo-image）', () => {
    test('画像が遅延ロードされる', async ({ page }) => {
      await page.goto('http://localhost:8081');

      // 画像が非同期でロードされることを確認
      const images = page.locator('img');
      await expect(images.first()).toBeVisible({ timeout: 5000 });
    });

    test('サムネイル画像が表示される', async ({ page }) => {
      await page.goto('http://localhost:8081/case-list');

      // サムネイルが存在することを確認
      const thumbnails = page.locator('[data-testid="photo-thumbnail"]');
      if ((await thumbnails.count()) > 0) {
        await expect(thumbnails.first()).toBeVisible();
      }
    });
  });

  test.describe('コード分割（React.lazy）', () => {
    test('初期ロードが高速化されている', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:8081');

      // First Contentful Paint を測定
      const performanceTiming = await page.evaluate(() =>
        JSON.stringify(window.performance.timing)
      );
      const timing = JSON.parse(performanceTiming);

      const loadTime = timing.loadEventEnd - timing.navigationStart;
      expect(loadTime).toBeLessThan(5000); // 5秒以内
    });

    test('遅延ロードされたコンポーネントが表示される', async ({ page }) => {
      await page.goto('http://localhost:8081');

      // DrawerNavigatorが遅延ロードされて表示される
      await expect(page.locator('[data-testid="drawer-navigator"]')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('スプラッシュスクリーン', () => {
    test('スプラッシュスクリーンが適切に表示・非表示される', async ({ page }) => {
      await page.goto('http://localhost:8081');

      // ローディング完了後、メインコンテンツが表示される
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
```

#### 4.2 lighthouse-performance.test.ts

**ファイル**: `e2e/comprehensive/lighthouse-performance.test.ts`

```typescript
/**
 * Lighthouse Performance E2E Tests
 * Lighthouseスコア検証テスト
 */

import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import lighthouse from 'lighthouse';

describe('Lighthouse Performance Tests', () => {
  test('Performance スコア >= 90', async ({ page, context }) => {
    await page.goto('http://localhost:8081');

    // Lighthouse監査実行
    const report = await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
      },
    });

    expect(report.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.9);
  });

  test('LCP <= 2.5秒', async ({ page }) => {
    await page.goto('http://localhost:8081');

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });

    expect(lcp).toBeLessThanOrEqual(2500); // 2.5秒以内
  });

  test('FCP <= 2.0秒', async ({ page }) => {
    await page.goto('http://localhost:8081');

    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[0].startTime);
        }).observe({ type: 'paint', buffered: true });
      });
    });

    expect(fcp).toBeLessThanOrEqual(2000); // 2.0秒以内
  });
});
```

---

## 📊 テスト実行計画

### Phase 1: Unit Tests実装（Week 1）

```bash
# テストファイル作成
touch src/components/__tests__/PhotoThumbnailGrid.test.tsx
touch src/components/__tests__/PhotoViewerModal.test.tsx
touch src/navigation/__tests__/RootNavigator.test.tsx
touch __tests__/App.test.tsx

# Unit Tests実行
npm run test -- src/components/__tests__/Photo*.test.tsx
npm run test -- src/navigation/__tests__/RootNavigator.test.tsx
npm run test -- __tests__/App.test.tsx
```

### Phase 2: E2E Tests実装（Week 2）

```bash
# E2Eテストファイル作成
touch e2e/comprehensive/performance-optimization.test.ts
touch e2e/comprehensive/lighthouse-performance.test.ts

# E2E Tests実行
npm run test:comprehensive
```

### Phase 3: Lighthouse統合テスト（Week 3）

```bash
# Lighthouse測定
npm run perf:lighthouse

# スコア検証
node scripts/validate-lighthouse-scores.js
```

---

## ✅ 成功基準

### Unit Tests

- ✅ expo-image統合: 全テストパス
- ✅ React.lazy統合: Suspense境界動作確認
- ✅ スプラッシュスクリーン: 適切な表示/非表示
- ✅ カバレッジ: 90%以上

### E2E Tests

- ✅ SEO: Meta情報検証
- ✅ 画像最適化: 遅延ロード確認
- ✅ コード分割: ロード時間5秒以内
- ✅ LCP: 2.5秒以内
- ✅ FCP: 2.0秒以内

### Lighthouse

- ✅ Performance: ≥ 90点
- ✅ Accessibility: ≥ 90点
- ✅ Best Practices: ≥ 90点
- ✅ SEO: ≥ 90点

---

## 🚀 実装スケジュール

| Week | Phase      | タスク                           | 担当 |
| ---- | ---------- | -------------------------------- | ---- |
| 1    | Unit Tests | PhotoThumbnailGrid.test.tsx      | Dev  |
| 1    | Unit Tests | PhotoViewerModal.test.tsx        | Dev  |
| 1    | Unit Tests | RootNavigator.test.tsx           | Dev  |
| 1    | Unit Tests | App.test.tsx                     | Dev  |
| 2    | E2E Tests  | performance-optimization.test.ts | QA   |
| 2    | E2E Tests  | lighthouse-performance.test.ts   | QA   |
| 3    | 統合テスト | Lighthouse検証                   | QA   |

---

## 📝 テストデータ

### サンプル写真データ

```typescript
export const mockPhotos: Photo[] = [
  {
    id: 1,
    case_id: 1,
    file_path: '/path/to/photo1.jpg',
    file_name: 'photo1.jpg',
    file_size: 1024,
    mime_type: 'image/jpeg',
    thumbnail_path: '/path/to/thumb1.jpg',
    caption: 'Test Photo 1',
    annotation_data: null,
    created_at: '2025-10-19T00:00:00Z',
  },
];
```

---

**作成日**: 2025-10-19
**次回更新予定**: Unit Tests実装完了時
