# 20250902_AI修正実行ワークフロー改善提案書

## 🎯 改善目標
**「APIキー設定テスト成功 → 実際のAI修正実行失敗」**問題の根本解決と、開発・配布環境での一貫性確保。

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 📊 問題分析結果

### **🔍 現状の問題点**
1. **設定→実行の非同期**: 設定画面でのテスト成功が実際のAI実行で反映されない
2. **デバッグ情報不足**: 失敗理由が特定困難
3. **環境別差異**: 開発環境では動作するが配布環境で失敗
4. **アカウント名不整合**: `setCredential()`と`getCredential()`でのアカウント名違い

### **🎯 目指す状態**
- 設定画面でテスト成功 → AI実行も確実に成功
- エラー時には具体的で actionable なメッセージ表示
- 開発・配布環境での一貫した動作

## 🛠️ 改善提案

### **Phase 1: 緊急修正（即座実装）**

#### **1.1 デバッグログ強化**
**対象**: `AIProcessingService.ts`

```typescript
// determineProvider() メソッドの拡張 (600-622行付近)
private async determineProvider(): Promise<'gemini' | 'openai' | 'offline'> {
  console.log('🔍 [DEBUG] Provider determination started');
  
  try {
    // === Gemini APIキー詳細チェック ===
    console.log('🔑 [DEBUG] Checking Gemini API key...');
    const geminiKey = await this.secureStorage.getCredential('gemini_api_key', 'main');
    console.log('🔑 [DEBUG] Gemini key result:', {
      found: !!geminiKey,
      length: geminiKey?.length || 0,
      firstChars: geminiKey ? geminiKey.substring(0, 8) + '...' : 'none'
    });
    
    if (geminiKey) {
      console.log('✅ [DEBUG] Gemini provider selected');
      return 'gemini';
    }
    
    // === OpenAI APIキー詳細チェック ===
    console.log('🔑 [DEBUG] Checking OpenAI API key...');
    const openaiKey = await this.secureStorage.getCredential('openai_api_key', 'main');
    console.log('🔑 [DEBUG] OpenAI key result:', {
      found: !!openaiKey,
      length: openaiKey?.length || 0,
      firstChars: openaiKey ? openaiKey.substring(0, 8) + '...' : 'none'
    });
    
    if (openaiKey) {
      console.log('✅ [DEBUG] OpenAI provider selected');
      return 'openai';
    }
  } catch (error) {
    console.error('❌ [DEBUG] Provider check error:', error);
    console.error('❌ [DEBUG] SecureStorage health check needed');
  }
  
  console.log('📴 [DEBUG] No API keys found, falling back to offline');
  return 'offline';
}
```

#### **1.2 APIキー取得メソッド統一**
**対象**: `SecureStorageService.ts`

```typescript
// 統一されたAPIキー取得メソッドを追加
public async getApiKey(provider: 'gemini' | 'openai'): Promise<string | null> {
  console.log(`🔑 [DEBUG] Getting ${provider} API key...`);
  
  const keyId = `${provider}_api_key`;
  const account = 'main'; // アカウント名を統一
  
  try {
    const key = await this.getCredential(keyId, account);
    console.log(`🔑 [DEBUG] ${provider} key retrieval:`, {
      found: !!key,
      length: key?.length || 0,
      source: key ? 'secure_storage' : 'not_found'
    });
    
    return key;
  } catch (error) {
    console.error(`❌ [DEBUG] ${provider} key retrieval failed:`, error);
    return null;
  }
}
```

#### **1.3 AI実行前事前チェック**
**対象**: `AIExecutionSection.tsx`

```typescript
const executeAI = async () => {
  const inputText = uploadedText || directTextInput;
  if (!inputText.trim()) {
    showToast('まずファイルをアップロードするか、テキストを入力してください', 'warning');
    return;
  }

  // === 新規追加: 事前APIキーチェック ===
  console.log('🔍 Pre-execution API key validation...');
  
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const electronAPI = (window as any).electronAPI;
      
      // API設定状況の確認
      const apiStatus = await electronAPI.security.getApiConfigStatus();
      console.log('📊 API Status:', apiStatus);
      
      const hasAnyApiKey = apiStatus.gemini?.apiKey || apiStatus.openai?.apiKey;
      
      if (!hasAnyApiKey) {
        showToast(
          'APIキーが設定されていません。設定画面でGeminiまたはOpenAI APIキーを設定してください。', 
          'error'
        );
        return;
      }
      
      // 利用可能プロバイダーの確認
      const availableProviders = await electronAPI.ai.getAvailableProviders();
      console.log('🎯 Available providers:', availableProviders);
      
      if (!availableProviders.includes('gemini') && !availableProviders.includes('openai')) {
        console.warn('⚠️ No API providers available, will use offline processing');
      }
    }
  } catch (error) {
    console.error('❌ Pre-execution check failed:', error);
    // エラーがあっても実行は継続（オフライン処理にフォールバック）
  }

  setIsProcessing(true);
  // ... 既存のAI処理ロジック
};
```

### **Phase 2: 中期改善（1-2日後）**

#### **2.1 SecureStorage初期化待機**
```typescript
// AIProcessingService constructor に追加
private constructor() {
  this.secureStorage = SecureStorageService.getInstance();
  this.workspaceService = WorkspaceService.getInstance();
  this.dbService = DbService.getInstance();
  this.chunkingService = ChunkingService.getInstance();
  
  // SecureStorage初期化確認
  this.ensureSecureStorageReady();
}

private async ensureSecureStorageReady(): Promise<void> {
  try {
    await this.secureStorage.initialize();
    const health = await this.secureStorage.healthCheck();
    console.log('🏥 SecureStorage health:', health);
    
    if (!health.ok) {
      console.warn('⚠️ SecureStorage not fully operational, using fallback mode');
    }
  } catch (error) {
    console.error('❌ SecureStorage initialization failed:', error);
  }
}
```

#### **2.2 設定画面でのリアルタイム状態表示**
```typescript
// SettingsModal.tsx に状態監視機能を追加
const [apiKeyStatus, setApiKeyStatus] = useState({
  gemini: false,
  openai: false,
  lastCheck: null
});

// APIキー状態の定期チェック
useEffect(() => {
  if (isOpen && activeTab === 'api') {
    const checkApiStatus = async () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        try {
          const status = await (window as any).electronAPI.security.getApiConfigStatus();
          setApiKeyStatus({
            gemini: status.gemini?.apiKey || false,
            openai: status.openai?.apiKey || false,
            lastCheck: new Date().toISOString()
          });
        } catch (error) {
          console.error('API status check failed:', error);
        }
      }
    };
    
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 5000); // 5秒おきにチェック
    
    return () => clearInterval(interval);
  }
}, [isOpen, activeTab]);
```

#### **2.3 エラーメッセージの改善**
```typescript
// AIProcessingService.ts のエラーハンドリング強化
private generateUserFriendlyErrorMessage(error: any, provider: string): string {
  const baseMessage = `${provider}処理中にエラーが発生しました。`;
  
  if (error.message?.includes('API key')) {
    return `${baseMessage}\n\n❗ APIキーが正しく設定されていません。\n📋 対処方法：\n1. 設定画面を開く\n2. ${provider} APIキーを入力\n3. 「テスト」ボタンで動作確認\n4. AI修正を再実行`;
  }
  
  if (error.message?.includes('quota') || error.message?.includes('limit')) {
    return `${baseMessage}\n\n❗ API利用制限に達しました。\n📋 対処方法：\n1. 少し時間をおいてから再実行\n2. 別のAPIプロバイダーに切り替え\n3. オフライン処理を使用`;
  }
  
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return `${baseMessage}\n\n❗ ネットワーク接続に問題があります。\n📋 対処方法：\n1. インターネット接続を確認\n2. しばらく待ってから再実行\n3. オフライン処理を使用`;
  }
  
  return `${baseMessage}\n\n🤖 オフライン処理に自動的に切り替えます。`;
}
```

### **Phase 3: 長期改善（1週間後）**

#### **3.1 統合テストスイート**
```typescript
// test/integration/api-workflow.test.ts (新規作成)
describe('API Key Setting → AI Execution Workflow', () => {
  test('Gemini API key setting and execution', async () => {
    // 1. APIキー設定
    await electronAPI.security.setCredential(/* ... */);
    
    // 2. 設定確認
    const status = await electronAPI.security.getApiConfigStatus();
    expect(status.gemini.apiKey).toBe(true);
    
    // 3. AI実行テスト
    const result = await electronAPI.ai.processText(/* ... */);
    expect(result.success).toBe(true);
    expect(result.data.provider).toBe('gemini');
  });
});
```

#### **3.2 自動回復機能**
```typescript
// AIProcessingService.ts に自動回復ロジック追加
private async attemptProviderRecovery(failedProvider: string): Promise<string[]> {
  console.log(`🔄 Attempting recovery for failed provider: ${failedProvider}`);
  
  // 他のプロバイダーをチェック
  const alternatives = [];
  
  if (failedProvider !== 'gemini') {
    const geminiKey = await this.secureStorage.getApiKey('gemini');
    if (geminiKey) alternatives.push('gemini');
  }
  
  if (failedProvider !== 'openai') {
    const openaiKey = await this.secureStorage.getApiKey('openai');
    if (openaiKey) alternatives.push('openai');
  }
  
  alternatives.push('offline'); // 最後のフォールバック
  
  console.log(`🎯 Recovery options: ${alternatives.join(', ')}`);
  return alternatives;
}
```

## 📋 実装優先順位・タイムライン

### **🚨 即座実装（本日中）**
1. ✅ **デバッグログ強化**: AI実行フローの透明化
2. ✅ **事前チェック機能**: 実行前のAPIキー確認
3. ✅ **アカウント名統一**: `getCredential(keyId, 'main')`で統一

### **⚡ 短期実装（2-3日後）**
1. **リアルタイム状態表示**: 設定画面でのAPIキー状態監視
2. **エラーメッセージ改善**: ユーザー向け具体的指示
3. **SecureStorage初期化待機**: 非同期初期化の確実な完了

### **📈 長期実装（1週間後）**
1. **統合テストスイート**: 設定→実行フローの自動テスト
2. **自動回復機能**: 失敗時の他プロバイダー自動切り替え
3. **設定ガイド**: 初回セットアップウィザード

## 🎯 予想される改善効果

### **📊 定量的効果**
- **API実行成功率**: 60% → 95%（推定）
- **ユーザー問い合わせ**: 50%削減（推定）
- **設定完了率**: 70% → 90%（推定）

### **🌟 定性的効果**
- **ユーザー体験**: 「設定したのに動かない」フラストレーション解消
- **開発体験**: デバッグログによる問題特定の高速化
- **システム信頼性**: 一貫した動作による信頼性向上

## 📝 実装チェックリスト

### **Phase 1 (即座実装)**
- [ ] `AIProcessingService.ts` にデバッグログ追加
- [ ] `SecureStorageService.ts` に `getApiKey()` メソッド追加
- [ ] `AIExecutionSection.tsx` に事前チェック機能追加
- [ ] アカウント名の統一（'main'に統一）

### **Phase 2 (短期改善)**
- [ ] SecureStorage初期化待機機能
- [ ] 設定画面リアルタイム状態表示
- [ ] エラーメッセージ改善
- [ ] ヘルスチェック機能の活用

### **Phase 3 (長期改善)**
- [ ] 統合テストスイート作成
- [ ] 自動回復機能実装
- [ ] 設定ガイド・ウィザード作成

---

**作成日**: 2025-09-01  
**作成者**: Claude (Anthropic)  
**対象**: 議事録アプリ v2.0.x  
**優先度**: 🚨 高優先（Phase 1を即座実装推奨）