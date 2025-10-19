# Issue #14: Flashlight セットアップ（React Native Android）

## 📋 Issue概要

**タイトル**: Flashlight セットアップ（React Native Android）
**優先度**: P3 (低優先度)
**工数見積**: 3時間
**担当者**: TBD
**ラベル**: `enhancement`, `performance`, `mobile`, `android`
**依存関係**: なし（独立タスク）

---

## 🎯 目的

React Native（Android）アプリのパフォーマンスを測定し、Lighthouse相当のスコアを取得する。ネイティブアプリの品質を保証し、iOS/Androidユーザーに最適な体験を提供する。

---

## 📊 背景

### 現状

- ✅ Expo Web版のパフォーマンス測定完了（Lighthouse使用）
- ✅ Performance: 78/100、Core Web Vitals達成
- ❌ React Native版のパフォーマンス測定未実施

### 課題

- Lighthouse はWeb版のみ対応
- React Native（Android/iOS）の実機パフォーマンスが不明
- ネイティブアプリの品質保証ができていない

---

## 🔧 実装内容

### タスク1: Flashlight パッケージインストール

#### 1. 依存パッケージ追加

```bash
# Flashlight core
npm install --save-dev @perf-profiler/profiler

# 型定義
npm install --save-dev @perf-profiler/types
```

#### 2. 設定ファイル確認

**ファイル**: `flashlight.config.js` (既に作成済み)

```javascript
module.exports = {
  // 測定対象プラットフォーム
  platforms: ['android'], // iOS は今後追加予定

  // パフォーマンス閾値
  thresholds: {
    performanceScore: 90,
    fps: 55,
    cpu: 30,
    ram: 150,
    bundleSize: 10,
  },

  // 測定シナリオ
  scenarios: [
    {
      name: 'App Launch',
      iterations: 10,
      description: 'アプリ起動時のパフォーマンス',
    },
    {
      name: 'Case List Navigation',
      iterations: 10,
      description: '案件一覧画面への遷移',
    },
    {
      name: 'Voice Recording',
      iterations: 10,
      description: '音声録音機能のパフォーマンス',
    },
    {
      name: 'AI Summary Generation',
      iterations: 10,
      description: 'AI要約生成時のパフォーマンス',
    },
  ],

  // レポート設定
  output: {
    path: './performance-reports/flashlight',
    format: ['html', 'json'],
  },
};
```

#### 3. npm スクリプト確認

**ファイル**: `package.json`

```json
{
  "scripts": {
    "perf:flashlight": "flashlight test --config flashlight.config.js",
    "perf:flashlight:report": "flashlight report --open",
    "perf:android": "flashlight measure android"
  }
}
```

---

### タスク2: Android 実機/エミュレータのセットアップ

#### 1. 前提条件確認

- ✅ Android Studio インストール済み
- ✅ ADB (Android Debug Bridge) インストール済み
- ✅ Android実機またはエミュレータが利用可能

#### 2. デバッグモード有効化

**Android実機の場合**:

```bash
# USBデバッグ有効化
adb devices  # デバイスが認識されることを確認

# 開発者オプション → USBデバッグ → ON
```

**Androidエミュレータの場合**:

```bash
# Android Studioからエミュレータ起動
emulator -avd Pixel_6_API_33

# デバイス確認
adb devices
```

#### 3. Expoアプリのビルドとインストール

```bash
# Expo Developmentビルド
eas build --profile development --platform android

# または、ローカルビルド
npx expo run:android
```

---

### タスク3: Flashlight 測定実行

#### 1. ベースライン測定

```bash
# アプリ起動パフォーマンス測定
npm run perf:android

# または、設定ファイルを使用
npm run perf:flashlight
```

#### 2. 測定結果の確認

```bash
# HTMLレポートを開く
npm run perf:flashlight:report

# JSONレポートを確認
cat performance-reports/flashlight/results.json
```

#### 3. 測定指標の分析

**Flashlight 測定指標**:

| 指標                    | 説明                     | 目標値 | 重要度 |
| ----------------------- | ------------------------ | ------ | ------ |
| **Performance Score**   | 総合パフォーマンススコア | ≥90    | P0     |
| **FPS (Frame Rate)**    | 画面描画フレームレート   | ≥55    | P0     |
| **CPU Usage**           | CPU使用率                | ≤30%   | P1     |
| **RAM Usage**           | メモリ使用量             | ≤150MB | P1     |
| **App Launch Time**     | アプリ起動時間           | ≤2.5秒 | P0     |
| **Bundle Size**         | APKサイズ                | ≤10MB  | P1     |
| **JS Bundle Load Time** | JSバンドル読み込み時間   | ≤1.5秒 | P1     |

---

### タスク4: 測定シナリオの実装

#### 1. シナリオスクリプト作成

**ファイル**: `e2e/performance/flashlight-scenarios.ts` (新規)

```typescript
import { device, element, by } from 'detox';

export const scenarios = {
  // Scenario 1: App Launch
  appLaunch: async () => {
    await device.launchApp({ newInstance: true });
    await element(by.id('home-screen')).tap();
  },

  // Scenario 2: Case List Navigation
  caseListNavigation: async () => {
    await element(by.id('drawer-button')).tap();
    await element(by.id('case-list-menu')).tap();
    await element(by.id('case-list-screen')).toBeVisible();
  },

  // Scenario 3: Voice Recording
  voiceRecording: async () => {
    await element(by.id('record-button')).tap();
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5秒録音
    await element(by.id('stop-button')).tap();
  },

  // Scenario 4: AI Summary Generation
  aiSummary: async () => {
    await element(by.id('summarize-button')).tap();
    await waitFor(element(by.id('summary-result')))
      .toBeVisible()
      .withTimeout(30000);
  },
};
```

#### 2. Detox設定（Optional）

**ファイル**: `.detoxrc.js` (新規)

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_33',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

---

### タスク5: 結果の可視化とレポート

#### 1. パフォーマンスレポート生成

```bash
# Flashlight測定実行
npm run perf:flashlight

# 結果をJSON出力
node scripts/format-flashlight-results.js
```

#### 2. フォーマットスクリプト

**ファイル**: `scripts/format-flashlight-results.js` (新規)

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '../performance-reports/flashlight/results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('📱 Flashlight Performance Results\n');
console.log('🎯 Overall Scores:');
console.log(
  `  Performance Score: ${results.performanceScore}/100 ${results.performanceScore >= 90 ? '✅' : '⚠️'}`
);
console.log(`  FPS: ${results.fps} ${results.fps >= 55 ? '✅' : '⚠️'}`);
console.log(`  CPU Usage: ${results.cpu}% ${results.cpu <= 30 ? '✅' : '⚠️'}`);
console.log(`  RAM Usage: ${results.ram}MB ${results.ram <= 150 ? '✅' : '⚠️'}`);

console.log('\n📊 Scenario Results:');
results.scenarios.forEach((scenario) => {
  console.log(`\n  ${scenario.name}:`);
  console.log(`    Duration: ${scenario.duration}ms`);
  console.log(`    FPS: ${scenario.fps}`);
  console.log(`    CPU: ${scenario.cpu}%`);
});
```

#### 3. README更新

**ファイル**: `README.md`（Flashlightセクション追加）

```markdown
### React Native Performance (Flashlight)

![Performance Score](https://img.shields.io/badge/Performance-90-brightgreen)
![FPS](https://img.shields.io/badge/FPS-58-brightgreen)
![CPU](https://img.shields.io/badge/CPU-28%25-green)
![RAM](https://img.shields.io/badge/RAM-142MB-green)

**測定環境**: Android (Pixel 6, API 33)
**最終測定日**: TBD

詳細: [Flashlight Report](performance-reports/flashlight/index.html)
```

---

## ✅ 成功条件

- ✅ Flashlight がAndroid実機/エミュレータで正常動作
- ✅ 4つのシナリオで測定完了
- ✅ Performance Score ≥ 90点
- ✅ FPS ≥ 55
- ✅ HTMLレポートが生成される
- ✅ README にFlashlightスコアが表示される

---

## 📂 作成・更新ファイル

### 新規作成

- `e2e/performance/flashlight-scenarios.ts`
- `scripts/format-flashlight-results.js`
- `.detoxrc.js` (Optional)
- `performance-reports/flashlight/` (ディレクトリ)

### 更新

- `package.json` (スクリプト確認)
- `README.md` (Flashlightセクション追加)

### 既存（確認のみ）

- `flashlight.config.js` (既に作成済み)

---

## 🔄 実装手順

### Step 1: 環境セットアップ（30分）

```bash
# 1. パッケージインストール
npm install --save-dev @perf-profiler/profiler @perf-profiler/types

# 2. Android実機/エミュレータ確認
adb devices

# 3. Expoアプリビルド
npx expo run:android
```

### Step 2: ベースライン測定（1時間）

```bash
# 1. Flashlight測定実行
npm run perf:android

# 2. 結果確認
npm run perf:flashlight:report

# 3. レポート保存
cp performance-reports/flashlight/results.json \
   docs/flashlight-baseline.json
```

### Step 3: シナリオ測定（1時間）

```bash
# 1. シナリオスクリプト作成
touch e2e/performance/flashlight-scenarios.ts
# 内容を実装

# 2. 全シナリオ測定
npm run perf:flashlight

# 3. 結果フォーマット
node scripts/format-flashlight-results.js
```

### Step 4: レポート作成（30分）

```bash
# 1. README更新
npm run perf:update-readme

# 2. コミット
git add .
git commit -m "feat: Flashlight パフォーマンス測定完了 📱"
```

---

## 📊 期待される結果

### 目標スコア

| 指標              | 目標  | 現実的な範囲 |
| ----------------- | ----- | ------------ |
| Performance Score | 90    | 85~95        |
| FPS               | 55    | 55~60        |
| CPU Usage         | 30%   | 25~35%       |
| RAM Usage         | 150MB | 130~160MB    |
| App Launch Time   | 2.5秒 | 2.0~3.0秒    |

### ボトルネック分析

Flashlight測定により、以下が明らかになる：

- ✅ アプリ起動時のボトルネック
- ✅ 画面遷移のパフォーマンス
- ✅ メモリリーク箇所
- ✅ CPU使用率が高い処理

---

## 🎯 今後の改善提案

### Flashlight測定でパフォーマンス問題が見つかった場合

#### 1. FPSが低い場合（<55）

- React Native Reanimated の導入
- useMemo / useCallback の活用
- FlatList の最適化（windowSize調整）

#### 2. CPUが高い場合（>30%）

- 重い処理をWeb Workerに移行
- 画像処理の最適化
- 不要な再レンダリングの削減

#### 3. メモリが多い場合（>150MB）

- 画像キャッシュのクリア
- メモリリーク箇所の修正
- useEffect のクリーンアップ関数実装

#### 4. 起動時間が長い場合（>2.5秒）

- コード分割（React.lazy）
- バンドルサイズ削減
- Hermes Engine の活用

---

## 📝 注意事項

### 測定環境

- **推奨**: Android実機（Pixel 6以降）
- **代替**: Androidエミュレータ（API 33以降、高性能PCが必要）

### iOS対応

- 現時点ではAndroidのみ対応
- iOS版は今後のIssueで対応予定（Flashlight iOS support）

### CI/CD統合

- Flashlight のCI/CD統合はIssue #11（Icebox）で実施予定
- 手動測定のみ実施

---

## 🔗 参考リンク

- [Flashlight Documentation](https://docs.flashlight.dev/)
- [React Native Performance Best Practices](https://reactnative.dev/docs/performance)
- [Expo Performance Guide](https://docs.expo.dev/guides/performance/)

---

**作成日**: 2025-10-19
**最終更新**: 2025-10-19
