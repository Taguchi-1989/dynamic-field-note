# Storybook 使用ガイド

**最終更新**: 2025-10-18

---

## 📚 概要

**Storybook**は、UIコンポーネントを独立した環境で開発・テスト・ドキュメント化するためのツールです。

### 導入の目的

1. **コンポーネントの再利用性向上** - 独立した環境でコンポーネントを確認
2. **開発効率の向上** - アプリ全体を起動せずにコンポーネント開発
3. **ドキュメント化** - 自動的に視覚的なドキュメントを生成
4. **テストケースの整理** - 様々な状態のコンポーネントを一覧表示

---

## 🚀 使い方

### Storybookサーバー起動

```bash
npm run storybook
```

サーバーが起動したら、ブラウザで `http://localhost:7007` にアクセスします。

### React Native版 (デバイス/エミュレータ)

Storybookはアプリ内に統合されています。

```typescript
// App.tsx に以下を追加してStorybookモードに切り替え
import StorybookUI from './.storybook/Storybook';

const STORYBOOK_ENABLED = __DEV__ && false; // trueにするとStorybook表示

export default function App() {
  if (STORYBOOK_ENABLED) {
    return <StorybookUI />;
  }
  // 通常のアプリ
  return <RootNavigator />;
}
```

---

## 📂 構成

### ディレクトリ構造

```
Dynamic Field Note/
├── .storybook/              # Storybook設定
│   ├── main.ts             # メイン設定
│   ├── Storybook.tsx       # エントリーポイント
│   └── storybook.requires.ts # 自動生成ファイル
├── src/
│   └── components/
│       ├── AIStatusIndicator.tsx
│       ├── AIStatusIndicator.stories.tsx  # ストーリーファイル
│       ├── LoadingIndicator.tsx
│       ├── LoadingIndicator.stories.tsx
│       └── ... (その他のコンポーネント)
└── docs/
    └── STORYBOOK_GUIDE.md  # このファイル
```

---

## ✍️ Storyの書き方

### 基本構造

```typescript
/**
 * ComponentName Stories
 * コンポーネント名のStorybook
 */

import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Components/ComponentName',
  component: ComponentName,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ComponentName>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 */
export const Default: Story = {
  args: {
    // props
  },
};

/**
 * カスタム状態
 */
export const CustomState: Story = {
  args: {
    // different props
  },
};
```

### 実例：AIStatusIndicator

```typescript
export const Processing: Story = {
  args: {
    status: 'processing',
    progress: 0.5,
    message: 'AI処理中... 50%',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    errorMessage: 'APIエラーが発生しました',
  },
};
```

---

## 📋 既存コンポーネントのStories

### 現在利用可能なStories

| コンポーネント         | ファイル                         | ストーリー数 |
| ---------------------- | -------------------------------- | ------------ |
| **AIStatusIndicator**  | `AIStatusIndicator.stories.tsx`  | 6            |
| **LoadingIndicator**   | `LoadingIndicator.stories.tsx`   | 4            |
| **PhotoThumbnailGrid** | `PhotoThumbnailGrid.stories.tsx` | 5            |
| **PhotoViewerModal**   | `PhotoViewerModal.stories.tsx`   | 4            |
| **ReportCard**         | `ReportCard.stories.tsx`         | 4            |

### AIStatusIndicator Stories

- ✅ Idle - アイドル状態
- ✅ Processing - 処理中 (50%)
- ✅ ProcessingStart - 処理開始 (10%)
- ✅ ProcessingAlmostDone - 処理終盤 (90%)
- ✅ Success - 成功
- ✅ Error - エラー

### LoadingIndicator Stories

- ✅ Default - デフォルトメッセージ
- ✅ CustomMessage - カスタムメッセージ
- ✅ AIProcessing - AI処理中
- ✅ SavingReport - 報告書保存中

### PhotoThumbnailGrid Stories

- ✅ Empty - 空の状態
- ✅ OnePhoto - 写真1枚
- ✅ ThreePhotos - 写真3枚
- ✅ LimitReached - 上限到達 (10枚)
- ✅ Disabled - 無効状態

### PhotoViewerModal Stories

- ✅ WithCaption - キャプション付き
- ✅ WithoutCaption - キャプションなし
- ✅ Hidden - 非表示状態
- ✅ NoPhoto - 写真なし (null)

### ReportCard Stories

- ✅ Default - 標準的な報告書
- ✅ LongTitle - 長いタイトル
- ✅ ShortContent - 短いコンテンツ
- ✅ Interactive - クリック時の動作

---

## 🎨 新しいStoryの追加

### 手順

1. **Storyファイルを作成**

   ```bash
   touch src/components/NewComponent.stories.tsx
   ```

2. **基本構造を記述**

   ```typescript
   import type { Meta, StoryObj } from '@storybook/react-native';
   import { NewComponent } from './NewComponent';

   const meta = {
     title: 'Components/NewComponent',
     component: NewComponent,
   } satisfies Meta<typeof NewComponent>;

   export default meta;
   type Story = StoryObj<typeof meta>;

   export const Default: Story = {
     args: {},
   };
   ```

3. **Storyを確認**

   ```bash
   npm run storybook
   ```

---

## 🔧 カスタマイズ

### Decorators (デコレーター)

コンポーネントを特定のコンテキストで表示する場合に使用：

```typescript
decorators: [
  (Story) => (
    <PaperProvider>
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    </PaperProvider>
  ),
],
```

### Args (引数)

コンポーネントのpropsを動的に変更：

```typescript
export const WithCustomProps: Story = {
  args: {
    title: 'カスタムタイトル',
    onPress: () => console.log('Pressed!'),
  },
};
```

### Actions (アクション)

イベントハンドラーのログを確認：

```typescript
import { action } from '@storybook/addon-ondevice-actions';

export const WithActions: Story = {
  args: {
    onPress: action('pressed'),
    onDelete: action('deleted'),
  },
};
```

---

## 🧪 テストとの統合

Storybookで定義したストーリーは、スナップショットテストやビジュアルリグレッションテストにも活用できます。

```typescript
// 将来的に実装予定
import { composeStories } from '@storybook/react';
import * as stories from './Button.stories';

const { Primary, Secondary } = composeStories(stories);

test('Primary button matches snapshot', () => {
  const tree = renderer.create(<Primary />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

---

## 📊 ベストプラクティス

### 1. ストーリーは具体的に

❌ **NG**:

```typescript
export const Example: Story = {
  args: { value: 'test' },
};
```

✅ **OK**:

```typescript
/**
 * エラー状態の表示
 * APIエラーが発生した場合のUI
 */
export const ErrorState: Story = {
  args: {
    status: 'error',
    errorMessage: 'APIエラーが発生しました',
  },
};
```

### 2. 実際のユースケースを反映

コンポーネントが実際のアプリでどう使われるかを示すストーリーを作成：

```typescript
export const RealWorldExample: Story = {
  args: {
    // 実際のアプリで使用される値
    photos: mockPhotosFromAPI,
    maxPhotos: 10,
    onPhotoPress: handlePhotoPress,
  },
};
```

### 3. エッジケースも含める

```typescript
export const EmptyState: Story = {
  /* 空の状態 */
};
export const LoadingState: Story = {
  /* ローディング中 */
};
export const ErrorState: Story = {
  /* エラー状態 */
};
export const FullState: Story = {
  /* 最大データ */
};
```

---

## 🚨 トラブルシューティング

### ストーリーが表示されない

1. **ファイル名を確認**
   - `*.stories.tsx` または `*.stories.ts`
   - `src/components/` 配下に配置

2. **設定ファイルを確認**

   ```typescript
   // .storybook/main.ts
   stories: ['../src/components/**/*.stories.@(ts|tsx|js|jsx)'],
   ```

3. **サーバー再起動**
   ```bash
   # Ctrl+C で停止
   npm run storybook
   ```

### 型エラーが発生する

```typescript
// @ts-expect-error を使用 (一時的)
// または型定義を明示
const meta: Meta<typeof Component> = {
  // ...
};
```

---

## 📚 参考リンク

- [Storybook for React Native 公式ドキュメント](https://storybook.js.org/docs/react-native)
- [Storybook Addons](https://storybook.js.org/addons)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

---

**Storybookを活用して、効率的にコンポーネントを開発しましょう！** 🚀
