# 20250902_🚀 gijiroku-app-v2 スタンドアロンセットアップガイド

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 📦 **独立リポジトリとしての移行手順**

### **1. フォルダをコピー**
```bash
# gijiroku-app-v2フォルダを新しい場所にコピー
cp -r gijiroku-app-v2 /path/to/new/location/
cd /path/to/new/location/gijiroku-app-v2
```

### **2. Git初期化**
```bash
git init
git add .
git commit -m "Initial commit - 議事録アプリ v2 standalone"
```

### **3. 依存関係のクリーンインストール**
```bash
# 既存のnode_modulesを削除
rm -rf node_modules package-lock.json

# 新規インストール
npm install
```

### **4. 環境変数の設定**
`.env`ファイルを作成:
```env
# OpenAI API (オプション)
OPENAI_API_KEY=your_key_here

# Gemini API (オプション)  
GOOGLE_API_KEY=your_key_here

# Supabase (オプション)
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
```

## ✅ **修正済み項目**

### **ビルド設定**
- ✅ `electron-builder.json` - スタンドアロン設定済み
- ✅ `tsup.config.ts` - バンドル設定最適化済み
- ✅ `vite.config.ts` - 開発/本番環境設定済み

### **パッケージ構成**
- ✅ `package.json` - 全依存関係を含む
- ✅ `.gitignore` - 適切な除外設定
- ✅ `README.md` - プロジェクト説明

## 🐛 **既知の問題と対処法**

### **1. Remark Processor エラー**
**問題**: "Expected usable value but received an empty preset"
**解決策**: 
```typescript
// src/main/services/MarkdownCompilerService.ts
// KaTeXプラグインを一時的に無効化済み
// 基本的なMarkdown処理は動作
```

### **2. Preloadスクリプト エラー**
**問題**: "module not found: zod"
**解決策**:
```typescript
// tsup.config.tsで修正が必要
export default defineConfig({
  entry: {
    main: 'src/main/index.ts',
    preload: 'src/main/preload.ts'
  },
  external: ['electron'], // zodは含める
  noExternal: ['zod'],     // 追加
  // ...
})
```

### **3. Electron Builder アイコンエラー**
**問題**: アイコン処理でEOFエラー
**一時対処**: ポータブル版でビルド（アイコンなし）

## 🔧 **開発開始**

```bash
# 1. 開発サーバー起動
npm run dev

# 2. ビルドテスト
npm run build

# 3. Electronアプリ起動
npm start

# 4. パッケージング（Windows）
npm run dist:win
```

## 📂 **必要なファイル構造**

```
gijiroku-app-v2/
├── src/                    # ソースコード
├── resources/              # リソースファイル
│   ├── icons/             # アプリアイコン
│   ├── fonts/             # 日本語フォント
│   └── templates/         # プロンプトテンプレート
├── electron-builder.json   # ビルド設定
├── tsup.config.ts         # バンドル設定
├── vite.config.ts         # Vite設定
├── tsconfig.json          # TypeScript設定
├── package.json           # パッケージ定義
├── .gitignore            # Git除外設定
└── README.md             # プロジェクト説明
```

## 🎯 **今後の改善点**

1. **Preloadスクリプトのバンドル最適化**
   - zodを含めた完全バンドル化
   - 外部依存の解決

2. **Remarkプロセッサーの修復**
   - KaTeX統合の復活
   - プラグインチェーンの最適化

3. **ビルドパイプラインの改善**
   - アイコン処理の修正
   - CI/CD設定の追加

## 💡 **トラブルシューティング**

```bash
# ビルドエラーの場合
npm run clean
npm install
npm run build

# Electronが起動しない場合
npm run build:electron
npm start

# パッケージングエラーの場合
# electron-builder.jsonのtargetを"dir"に変更してテスト
```

## 📝 **メモ**

- このプロジェクトは元の`gijiroku-app`から独立して動作します
- 全ての依存関係は`package.json`に含まれています
- masterfile.mdの仕様に基づいて実装されています

---

*最終更新: 2025-08-30*