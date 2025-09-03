# 20250902_APIキー設定・AI実行ワークフロー分析レポート

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 📊 調査目的
ポータブル版でテンプレート反映・PDF印刷が成功している一方、**APIキー設定テスト → 本番運用**の移行と、**開発環境 vs 配布環境の差異**を調査・整理する。

## 🔍 現状分析

### ✅ **動作確認済み機能**
1. **ポータブル版テンプレート反映**: DB中心管理により正常動作
2. **PDF印刷機能**: 完全動作、保存場所選択可能
3. **APIキー設定のテスト**: 設定画面で検証成功

### ❓ **課題領域**
1. **テスト → 本番移行**: APIキー設定後の実際のAI処理実行
2. **環境差異**: 開発環境と配布環境でのワークフロー違い

## 📁 関連ファイル・フォルダ構成

### **🎯 AIProcessingService.ts (メインロジック)**
**場所**: `app/src/main/services/AIProcessingService.ts`

**役割**: AI処理の中核サービス
- **プロバイダー自動判定**: `determineProvider()` (600-622行)
- **API環境分岐処理**: 開発・本番での挙動制御 (283-296, 340-353行)

```typescript
// 重要な環境分岐ロジック (283-296行)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VITE_FORCE_USER_API_KEYS === 'true';

if (!apiKey && !isProduction) {
  // 開発環境のみ：フォールバックとして環境変数からAPIキーを取得
  apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  console.log('🔑 [開発環境] Using Gemini API key from environment variables');
}
```

**分岐動作**:
- **開発環境**: SecureStorage → 環境変数 → エラー
- **本番環境**: SecureStorage → エラー（環境変数フォールバック無し）

### **🔐 SecureStorageService.ts (APIキー管理)**
**場所**: `app/src/main/services/SecureStorageService.ts`

**役割**: APIキーの安全な保存・取得
- **keytar統合**: OS標準キーチェーン（Windows Credential Manager等）
- **フォールバック**: ワークスペースベース暗号化保存
- **設定API**: `setCredential()` (198-225行), `getCredential()` (236-268行)

**ストレージ階層**:
1. **Primary**: keytar（OS keychain）
2. **Fallback**: workspace/cache/credentials.json（Base64暗号化）

### **🖥️ AIExecutionSection.tsx (フロントエンドUI)**
**場所**: `app/src/renderer/components/sections/AIExecutionSection.tsx`

**役割**: AI実行ボタンと進捗表示
- **ElectronAPI呼び出し**: `electronAPI.ai.processText()` (94-99行)
- **フォールバック処理**: モック処理への切り替え (114-124行)
- **進捗表示**: 分割処理進捗の可視化 (208-234行)

### **⚙️ SettingsModal.tsx (設定画面)**
**場所**: `app/src/renderer/components/SettingsModal.tsx`

**役割**: APIキー設定とテスト
- **APIキー保存**: localStorage → ElectronAPI → SecureStorage
- **検証機能**: APIキーテスト実行
- **モデル選択**: Gemini/OpenAI選択肢

## 🔄 ワークフロー詳細分析

### **📤 APIキー設定フロー**

```
[設定画面] 
    ↓ APIキー入力・テスト実行
[SettingsModal.tsx] 
    ↓ ElectronAPI呼び出し
[SecureStorageService] 
    ↓ keytar保存試行
[OS Keychain/Credential Manager] 
    ↓ 失敗時フォールバック
[workspace/cache/credentials.json]
```

### **🤖 AI実行フロー**

```
[AI修正実行ボタン]
    ↓ executeAI()
[AIExecutionSection.tsx]
    ↓ electronAPI.ai.processText()
[AIProcessingService.ts]
    ↓ determineProvider()
[SecureStorageService.getCredential()]
    ↓ APIキー取得
[実際のAPI呼び出し - Gemini/OpenAI]
```

## 🔀 開発環境 vs 配布環境の差異

### **🛠️ 開発環境**
**特徴**:
- `NODE_ENV=development`
- 環境変数フォールバック有効
- `npm run dev` での起動

**APIキー取得順序**:
1. SecureStorage（keytar）
2. **環境変数** (.env, process.env.GEMINI_API_KEY)
3. エラー

**利点**:
- `.env`ファイルでAPIキー設定可能
- 開発時の利便性向上

### **📦 配布環境（ポータブル版）**
**特徴**:
- `NODE_ENV=production` or `VITE_FORCE_USER_API_KEYS=true`
- 環境変数フォールバック無効
- Electronパッケージでの起動

**APIキー取得順序**:
1. SecureStorage（keytar）
2. **即エラー**（環境変数フォールバック無し）

**利点**:
- セキュリティ向上（環境変数漏洩防止）
- ユーザー設定強制（設定画面でのAPIキー入力必須）

## ⚡ 実行パス分析

### **✅ 成功パス**
1. **ユーザーがAPIキー設定** → SecureStorage保存成功
2. **AI実行** → SecureStorage取得成功 → API呼び出し成功

### **❌ 失敗パス**
1. **APIキー未設定** → SecureStorage空 → オフライン処理へフォールバック
2. **keytar失敗** → workspace fallback使用
3. **API呼び出し失敗** → オフライン処理へフォールバック

### **🔧 テスト → 本番移行の問題**
**症状**: 設定画面でのAPIキーテストは成功するが、実際のAI実行では失敗

**推定原因**:
1. **ストレージ同期問題**: テスト時の保存が実行時に反映されていない
2. **アカウント名不一致**: `setCredential()`と`getCredential()`でアカウント名が異なる
3. **タイミング問題**: SecureStorage初期化が未完了

## 📋 修正提案

### **1. 即座修正 - デバッグ強化**
```typescript
// AIProcessingService.ts に詳細ログ追加
console.log('🔍 API Key Debug:', {
  provider: 'gemini',
  hasKey: !!apiKey,
  keyLength: apiKey?.length,
  isProduction,
  storageMethod: apiKey ? 'secure_storage' : 'none'
});
```

### **2. ストレージ統一 - アカウント名標準化**
```typescript
// 統一されたAPIキー取得
const geminiKey = await this.secureStorage.getCredential('gemini_api_key', 'main');
const openaiKey = await this.secureStorage.getCredential('openai_api_key', 'main');
```

### **3. 検証強化 - 設定→実行の一貫性確保**
```typescript
// AI実行前の事前チェック
const availableProviders = await this.getAvailableProviders();
if (!availableProviders.includes('gemini') && !availableProviders.includes('openai')) {
  throw new Error('APIキーが設定されていません。設定画面で入力してください。');
}
```

### **4. UIフィードバック改善**
```typescript
// リアルタイムAPIキー状態表示
const apiStatus = await electronAPI.security.getApiConfigStatus();
setApiKeysAvailable(apiStatus.openai.apiKey || apiStatus.gemini.apiKey);
```

## 🎯 結論・優先対応項目

### **🚨 高優先**
1. **デバッグログ強化**: APIキー取得・設定フローの透明化
2. **アカウント名統一**: SecureStorage操作の一貫性確保
3. **実行前検証**: AI実行ボタン押下時の事前チェック

### **📊 中優先**  
1. **設定画面改善**: リアルタイム状態表示
2. **エラーメッセージ詳細化**: ユーザー向け具体的な指示

### **📈 低優先**
1. **環境別設定**: 開発・配布での設定方法ドキュメント化
2. **自動テスト**: APIキー設定→実行フローの統合テスト

---

**調査日時**: 2025-09-01  
**調査者**: Claude (Anthropic)  
**対象バージョン**: 議事録アプリ v2.0.x (CODEX_REVIEW.md準拠版)