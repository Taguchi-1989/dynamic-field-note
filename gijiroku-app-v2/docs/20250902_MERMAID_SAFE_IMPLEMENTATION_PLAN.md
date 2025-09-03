# 20250902_Mermaid機能 安全実装計画

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02  
**参考**: 20250903_GPT-5_review_mermaid.md準拠

## 🎯 基本方針

**本体機能への影響ゼロを最優先とした段階的実装**

### ✅ **安全性確保**
- 既存MVP機能（APIキー・PDF・テンプレート・分割処理）に一切影響しない
- Mermaid機能は完全独立・オプション扱い
- 問題発生時は即座に無効化可能

### ✅ **品質重視**
- GPT-5レビュー要件定義書100%準拠
- オフライン動作・パフォーマンス要件クリア
- エンタープライズレベルのエラーハンドリング

## 📊 実装フェーズ

### 🔄 **Phase 1: 基盤整備（本体分離）**
**期間**: 1-2日  
**目標**: 既存実装の問題修正・独立性確保

#### 1.1 オフライン化対応
```bash
# Mermaidライブラリローカル化
mkdir -p resources/vendor/mermaid/
# mermaid.min.js v11.10.1をダウンロード・配置
```

#### 1.2 既存実装の問題修正
- **PdfGenerationService.ts**: タイムアウト問題解決
- **MermaidRenderWorker.ts**: CDN→ローカル読み込み変更
- **初期化遅延**: 初回起動時の問題解決

#### 1.3 完全独立性確保
```typescript
// 既存機能への影響ゼロを保証
if (!FEATURES.mermaidSupport) {
  // Mermaid関連コードは一切実行されない
  return fallbackToCodeBlock(mermaidCode);
}
```

### 🧪 **Phase 2: 単体テスト（独立動作確認）**
**期間**: 1日  
**目標**: Mermaid機能単体での完璧な動作

#### 2.1 単体テストスイート作成
```
test/mermaid/
├── mermaid-worker.test.js      # レンダリングエンジンテスト
├── mermaid-cache.test.js       # キャッシュシステムテスト
├── mermaid-offline.test.js     # オフライン動作テスト
└── mermaid-performance.test.js # パフォーマンステスト
```

#### 2.2 パフォーマンス検証
- **初回レンダリング**: 2-5秒以内
- **キャッシュヒット**: 100ms以内
- **メモリ使用量**: 50MB以下

#### 2.3 エラーケーステスト
- 不正なMermaid構文
- Hidden BrowserWindow初期化失敗
- キャッシュI/Oエラー

### 🔗 **Phase 3: 統合テスト（本体連携）**
**期間**: 1日  
**目標**: 本体機能との安全な連携確認

#### 3.1 既存機能影響確認
- **APIキー設定**: Mermaid有効/無効での動作確認
- **PDF生成**: 通常PDF・Mermaid図表入りPDF両対応
- **テンプレート管理**: Mermaid無関係のテンプレート動作
- **分割処理**: VTTファイル処理への影響なし

#### 3.2 統合シナリオテスト
```javascript
// シナリオ1: Mermaid無効時（既存機能のみ）
FEATURES.mermaidSupport = false;
// → 全ての既存機能が正常動作することを確認

// シナリオ2: Mermaid有効時（拡張機能込み）
FEATURES.mermaidSupport = true;
// → 既存機能 + Mermaid機能の両立確認
```

### 🚀 **Phase 4: 本番投入準備**
**期間**: 1-2日  
**目標**: プロダクション品質での安定動作

#### 4.1 本番環境テスト
- パッケージ版でのMermaid動作確認
- asar内リソース読み込み確認
- Windows 11実機での動作確認

#### 4.2 ドキュメント整備
- ユーザーマニュアル更新
- トラブルシューティングガイド
- 機能紹介・使用方法

#### 4.3 ロールバック準備
```typescript
// 緊急時の即座無効化手順
FEATURES.mermaidSupport = false;
// → 1秒で既存機能のみに戻る
```

## 🔧 技術実装詳細

### オフライン化実装
```typescript
// Before (CDN依存)
const mermaidUrl = 'https://cdn.jsdelivr.net/npm/mermaid@11.10.1/dist/mermaid.min.js';

// After (ローカル同封)
const mermaidPath = path.join(resourcesDir, 'vendor/mermaid/mermaid.min.js');
const mermaidUrl = `file://${mermaidPath}`;
```

### パフォーマンス最適化
```typescript
// Hidden BrowserWindowの効率化
this.renderWindow = new BrowserWindow({
  show: false,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,
    offscreen: true,
    // 📈 メモリ最適化
    additionalArguments: ['--no-sandbox', '--disable-gpu']
  },
  // 📏 サイズ最適化
  width: 800,  // 1200 → 800
  height: 600  // 800 → 600
});
```

### エラーハンドリング強化
```typescript
try {
  const svgResult = await this.mermaidWorker.renderToSvg(mermaidCode);
  const imgTag = `<img src="${dataUrl}" alt="Mermaid diagram" class="mermaid-diagram" />`;
  return imgTag;
} catch (error) {
  // 📝 詳細ログ出力
  console.warn('⚠️ Mermaid preprocessing failed:', error);
  warnings.push(`Mermaid diagram could not be rendered: ${error}`);
  
  // 🔄 フォールバック処理
  const fallback = `<pre><code class="language-mermaid">${mermaidCode}</code></pre>`;
  return fallback;
}
```

## 📋 品質保証チェックリスト

### ✅ **機能要件**
- [ ] オフライン動作（CDN依存なし）
- [ ] 主要図表対応（flowchart, sequence, gantt, class, state, er）
- [ ] キャッシュシステム（SHA256ハッシュベース）
- [ ] PDF統合（ベクター品質保持）
- [ ] テーマ・日本語フォント対応

### ✅ **非機能要件**
- [ ] 初回レンダリング: 2-5秒以内
- [ ] キャッシュヒット: 100ms以内  
- [ ] メモリ使用量: 50MB以下
- [ ] オフライン動作: 100%

### ✅ **安全性確保**
- [ ] 既存MVP機能への影響ゼロ
- [ ] フィーチャーフラグによる即座無効化
- [ ] エラー時の安全なフォールバック
- [ ] ログによる透明な動作状況

### ✅ **運用・管理**
- [ ] キャッシュ管理コマンド
- [ ] エラーハンドリング・ログ出力
- [ ] パフォーマンス監視
- [ ] ロールバック手順

## 🎯 投入判断基準

### ✅ **必須条件（すべてクリア必要）**
1. **既存機能影響なし**: MVP機能が100%正常動作
2. **パフォーマンス要件**: GPT-5レビュー基準クリア
3. **オフライン動作**: インターネット接続不要
4. **エラー耐性**: すべてのエラーケースで安全動作
5. **ロールバック可能**: 問題時の即座無効化

### ⚠️ **投入延期条件（1つでも該当時は延期）**
1. 既存機能に何らかの影響がある
2. パフォーマンス要件を満たさない  
3. オフライン動作に問題がある
4. エラー時に不安定動作する
5. ロールバックできない

## 📅 推定スケジュール

**Phase 1-2（基盤・単体）**: 2-3日  
**Phase 3（統合テスト）**: 1日  
**Phase 4（本番準備）**: 1-2日  
**合計**: 4-6日

## 🔄 継続的改善計画

### 短期（実装後1ヶ月）
- パフォーマンス監視・チューニング
- ユーザーフィードバック収集・改善
- エラーログ分析・対策

### 長期（実装後3ヶ月）
- リアルタイムプレビュー機能
- インタラクティブ図表対応
- テーマエディタUI

---

**基本方針**: 「安全第一・品質重視・段階的実装」  
**成功指標**: 「既存機能への影響ゼロ」「パフォーマンス要件100%達成」  
**リスク管理**: 「問題時の即座ロールバック体制確保」