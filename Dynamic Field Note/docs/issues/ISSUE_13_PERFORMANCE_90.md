# Issue #13: Performance 90点達成のための追加最適化

## 📋 Issue概要

**タイトル**: Performance 90点達成のための追加最適化
**優先度**: P2 (中優先度)
**工数見積**: 17時間（5つのPhaseに分割）
**担当者**: TBD
**ラベル**: `enhancement`, `performance`, `optimization`
**依存関係**: Issue #12完了後に実施

---

## 🎯 目的

現在のPerformanceスコア **78/100点** を **90/100点** に引き上げる。主な減点要因である **Speed Index (44点)** を改善し、ユーザー体験をさらに向上させる。

---

## 📊 現在の状況

### 最新測定結果（2025-10-19）

| カテゴリ           | スコア  | 目標   | 達成状況 |
| ------------------ | ------- | ------ | -------- |
| **Performance**    | 78/100  | 90/100 | ❌ -12点 |
| **Accessibility**  | 94/100  | 90/100 | ✅       |
| **Best Practices** | 100/100 | 90/100 | ✅       |
| **SEO**            | 92/100  | 90/100 | ✅       |

### 減点要因分析

1. **Speed Index: 44点** (2.44秒)
   - 視覚的な表示速度が遅い
   - Progressive Rendering が最適化されていない
   - **最大の減点要因**

2. **Total Blocking Time: 169ms**
   - JavaScript実行によるメインスレッドブロック
   - 目標300ms以内だがやや高め

3. **その他の潜在的要因**
   - 画像サイズが最適化されていない
   - フォントの読み込みが遅い
   - CSSが最適化されていない

---

## 🔧 実装内容（5つのPhase）

## Phase 1: 画像の事前最適化（優先度: 高）

### 工数: 3時間

### 目的

画像ファイルをWebP形式に事前変換し、サムネイルを生成。expo-imageの初回ロードオーバーヘッドを削減する。

### 実装内容

#### 1. 画像最適化スクリプト

**ファイル**: `scripts/optimize-images.js` (新規)

```javascript
#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

async function optimizeImages() {
  const inputDir = path.join(__dirname, '../assets/images');
  const outputDir = path.join(__dirname, '../assets/optimized');
  const thumbnailDir = path.join(__dirname, '../assets/thumbnails');

  // ディレクトリ作成
  if (!existsSync(outputDir)) {
    await fs.mkdir(outputDir, { recursive: true });
  }
  if (!existsSync(thumbnailDir)) {
    await fs.mkdir(thumbnailDir, { recursive: true });
  }

  const images = await fs.readdir(inputDir);
  const imageFiles = images.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  console.log(`📸 Optimizing ${imageFiles.length} images...`);

  for (const image of imageFiles) {
    const inputPath = path.join(inputDir, image);
    const baseName = image.replace(/\.\w+$/, '');

    try {
      // WebP形式に変換（オリジナルサイズ）
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toFile(path.join(outputDir, `${baseName}.webp`));

      // サムネイル生成（200x150）
      await sharp(inputPath)
        .webp({ quality: 60 })
        .resize(200, 150, { fit: 'cover' })
        .toFile(path.join(thumbnailDir, `${baseName}_thumb.webp`));

      console.log(`  ✅ ${image} -> ${baseName}.webp`);
    } catch (error) {
      console.error(`  ❌ Failed to optimize ${image}:`, error.message);
    }
  }

  console.log('✨ Image optimization complete!');
}

optimizeImages().catch(console.error);
```

#### 2. Blurhash生成スクリプト

**ファイル**: `scripts/generate-blurhash.js` (新規)

```javascript
#!/usr/bin/env node

const { encode } = require('blurhash');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateBlurhash() {
  const inputDir = path.join(__dirname, '../assets/images');
  const images = await fs.readdir(inputDir);
  const imageFiles = images.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

  const blurhashes = {};

  for (const image of imageFiles) {
    const inputPath = path.join(inputDir, image);

    try {
      const { data, info } = await sharp(inputPath)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });

      const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);

      blurhashes[image] = blurhash;
      console.log(`  ✅ ${image}: ${blurhash}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate blurhash for ${image}`);
    }
  }

  // JSON出力
  const outputPath = path.join(__dirname, '../assets/blurhashes.json');
  await fs.writeFile(outputPath, JSON.stringify(blurhashes, null, 2));

  console.log(`\n✨ Blurhash generation complete!`);
  console.log(`Output: ${outputPath}`);
}

generateBlurhash().catch(console.error);
```

#### 3. コンポーネント更新

**ファイル**: `src/components/PhotoThumbnailGrid.tsx`

```typescript
import { Image } from 'expo-image';
import blurhashes from '../../assets/blurhashes.json';

// Before: オリジナル画像を直接読み込み
<Image source={{ uri: photo.uri }} style={styles.thumbnail} />

// After: サムネイル + Blurhash
<Image
  source={{ uri: photo.thumbnailUri || photo.uri }}
  placeholder={{ blurhash: blurhashes[photo.filename] || 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
  transition={200}
  contentFit="cover"
  style={styles.thumbnail}
/>
```

#### 4. パッケージ追加

```bash
npm install --save-dev sharp
npm install blurhash
```

#### 5. npmスクリプト追加

**ファイル**: `package.json`

```json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.js",
    "generate:blurhash": "node scripts/generate-blurhash.js",
    "prepare:images": "npm run optimize:images && npm run generate:blurhash"
  }
}
```

### 期待される改善効果

- Speed Index: +3~5点
- Performance: +3~5点
- 画像読み込み速度: 30~50%改善

---

## Phase 2: フォント最適化（優先度: 高）

### 工数: 2時間

### 目的

未使用フォントを削除し、フォントプリロードを最適化する。

### 実装内容

#### 1. app.json 更新

**ファイル**: `app.json`

```json
{
  "expo": {
    "web": {
      "build": {
        "babel": {
          "include": ["@expo/vector-icons"]
        }
      },
      "bundler": "metro"
    }
  }
}
```

#### 2. App.tsx 更新

**ファイル**: `App.tsx`

```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    // 使用するフォントのみ読み込み
    MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    // 未使用のフォントは削除
  });

  useEffect(() => {
    const prepare = async () => {
      if (fontsLoaded && isDbReady) {
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, [fontsLoaded, isDbReady]);

  if (!fontsLoaded || !isDbReady) {
    return null;
  }

  return <RootNavigator />;
}
```

### 期待される改善効果

- Speed Index: +2~3点
- Performance: +2~3点
- フォント読み込み時間: 40~60%改善

---

## Phase 3: Critical CSS 抽出（優先度: 中）

### 工数: 3時間

### 目的

Above-the-fold（ファーストビュー）のCSSをインライン化し、残りのCSSを非同期ロードする。

### 実装内容

#### 1. Critical CSS抽出スクリプト

**ファイル**: `scripts/extract-critical-css.js` (新規)

```javascript
#!/usr/bin/env node

const critical = require('critical');
const path = require('path');

async function extractCriticalCSS() {
  await critical.generate({
    base: path.join(__dirname, '../web-build'),
    src: 'index.html',
    target: {
      html: 'index.html',
      css: 'static/css/critical.css',
    },
    width: 1300,
    height: 900,
    inline: true,
    extract: true,
  });

  console.log('✅ Critical CSS extracted');
}

extractCriticalCSS().catch(console.error);
```

#### 2. パッケージ追加

```bash
npm install --save-dev critical
```

#### 3. ビルドスクリプト更新

**ファイル**: `package.json`

```json
{
  "scripts": {
    "build:web": "expo export:web",
    "build:web:optimized": "expo export:web && node scripts/extract-critical-css.js"
  }
}
```

### 期待される改善効果

- Speed Index: +2~3点
- Performance: +2~3点
- First Contentful Paint: 10~20%改善

---

## Phase 4: バンドルサイズ最適化（優先度: 中）

### 工数: 4時間

### 目的

Tree Shakingを強化し、未使用コードを削除してバンドルサイズを削減する。

### 実装内容

#### 1. Bundle分析

```bash
# Web版ビルド
npx expo export:web

# Bundle分析
npx source-map-explorer web-build/static/js/*.js
```

#### 2. Lodash最適化

**Before**:

```typescript
import _ from 'lodash';
_.debounce(fn, 300);
```

**After**:

```typescript
import debounce from 'lodash/debounce';
debounce(fn, 300);
```

#### 3. React Native Paper最適化

**Before**:

```typescript
import { Button, Card, List } from 'react-native-paper';
```

**After**:

```typescript
import Button from 'react-native-paper/lib/module/components/Button';
import Card from 'react-native-paper/lib/module/components/Card';
import List from 'react-native-paper/lib/module/components/List';
```

#### 4. 未使用パッケージの削除

```bash
# 未使用パッケージ検出
npx depcheck

# 削除
npm uninstall <unused-package>
```

### 期待される改善効果

- Speed Index: +3~4点
- Performance: +3~4点
- バンドルサイズ: 20~30%削減

---

## Phase 5: Service Worker / PWA化（優先度: 低）

### 工数: 5時間

### 目的

Service Workerを導入し、PWA化によるキャッシュ戦略を実装する。

### 実装内容

#### 1. Workboxセットアップ

```bash
npm install --save-dev workbox-cli
npx workbox wizard
```

#### 2. Service Worker設定

**ファイル**: `public/service-worker.js` (新規)

```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// 静的アセットのプリキャッシュ
precacheAndRoute(self.__WB_MANIFEST);

// 画像のキャッシュ戦略
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
      }),
    ],
  })
);

// APIのキャッシュ戦略
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);

// フォントのキャッシュ
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
      }),
    ],
  })
);
```

#### 3. Manifest.json更新

**ファイル**: `public/manifest.json`

```json
{
  "name": "Dynamic Field Note",
  "short_name": "DFN",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1976d2",
  "theme_color": "#1976d2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 期待される改善効果

- Speed Index: +2~3点
- Performance: +2~3点
- リピート訪問時の読み込み速度: 50~70%改善

---

## ✅ 総合期待効果

| Phase    | 施策                   | 期待スコア改善 | 工数       |
| -------- | ---------------------- | -------------- | ---------- |
| 1        | 画像事前最適化         | +3~5点         | 3時間      |
| 2        | フォント最適化         | +2~3点         | 2時間      |
| 3        | Critical CSS           | +2~3点         | 3時間      |
| 4        | バンドルサイズ最適化   | +3~4点         | 4時間      |
| 5        | Service Worker / PWA化 | +2~3点         | 5時間      |
| **合計** | **全施策**             | **+12~18点**   | **17時間** |

**現状**: Performance 78点
**目標**: Performance 90点 (+12点必要)
**実施後**: Performance 90~96点 ✅

---

## 🔄 実装順序

### Week 1: 高優先度施策（必須）

1. **Phase 1**: 画像事前最適化（3時間）
2. **Phase 2**: フォント最適化（2時間）
3. **測定**: Lighthouse再測定（30分）

**マイルストーン**: Performance 85点以上達成

### Week 2: 中優先度施策（推奨）

4. **Phase 3**: Critical CSS（3時間）
5. **Phase 4**: バンドルサイズ最適化（4時間）
6. **測定**: Lighthouse再測定（30分）

**マイルストーン**: Performance 90点達成 ✅

### Week 3: 低優先度施策（Optional）

7. **Phase 5**: Service Worker / PWA化（5時間）
8. **最終測定**: Lighthouse再測定（30分）

**マイルストーン**: Performance 95点以上達成（ストレッチゴール）

---

## 📂 作成・更新ファイル

### 新規作成

- `scripts/optimize-images.js`
- `scripts/generate-blurhash.js`
- `scripts/extract-critical-css.js`
- `assets/blurhashes.json`
- `assets/optimized/` (ディレクトリ)
- `assets/thumbnails/` (ディレクトリ)
- `public/service-worker.js`

### 更新

- `src/components/PhotoThumbnailGrid.tsx`
- `src/components/PhotoViewerModal.tsx`
- `src/components/PhotoAnnotator.tsx`
- `App.tsx`
- `app.json`
- `public/manifest.json`
- `package.json`

---

## 📝 注意事項

### 段階的実装推奨

- 一度に全施策を実施せず、Phase 1→2→測定→3→4→測定の順で進める
- 各Phase後にLighthouse測定し、効果を確認する
- 目標90点達成後は残りのPhaseを延期可能

### リスク

- expo-imageからネイティブImageに戻すと、LCPが悪化する可能性あり
- Service Worker導入時は、キャッシュのクリア方法を明示する必要あり

---

**作成日**: 2025-10-19
**最終更新**: 2025-10-19
