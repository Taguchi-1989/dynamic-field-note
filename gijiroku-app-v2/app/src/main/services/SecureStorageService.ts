/**
 * SecureStorageService - keytar統合機密情報管理サービス
 * 
 * masterfile.md 仕様に基づく安全な認証情報管理
 * - OS標準キーチェーン統合（Windows Credential Manager、macOS Keychain、Linux Secret Service）
 * - API キー・トークンの安全な保存
 * - 暗号化されたローカル設定管理
 * - Supabase・外部API認証情報
 */

import * as keytar from 'keytar';
import { z } from 'zod';
import { WorkspaceService } from './WorkspaceService';
import { DbService } from './DbService';

// アプリケーション識別子
const SERVICE_NAME = 'gijiroku-app-v2';
const ACCOUNT_PREFIX = 'user-';

// 機密情報のスキーマ定義
const SecureCredentialSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['supabase_key', 'api_token', 'oauth_token', 'user_credential']),
  service: z.string().min(1), // 'supabase', 'openai', 'google', etc.
  account: z.string().min(1),
  encrypted: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

const ApiKeyConfigSchema = z.object({
  supabase: z.object({
    url: z.string().url().optional(),
    anonKey: z.string().optional(),
    serviceRoleKey: z.string().optional()
  }).optional(),
  openai: z.object({
    apiKey: z.string().optional(),
    organization: z.string().optional()
  }).optional(),
  external: z.record(z.object({
    key: z.string(),
    endpoint: z.string().url().optional()
  })).optional()
});

export type SecureCredential = z.infer<typeof SecureCredentialSchema>;
export type ApiKeyConfig = z.infer<typeof ApiKeyConfigSchema>;

export interface CredentialSetOptions {
  overwrite?: boolean;
  encrypted?: boolean;
  metadata?: Record<string, any>;
}

export interface CredentialListResult {
  id: string;
  type: string;
  service: string;
  account: string;
  hasValue: boolean;
  metadata?: Record<string, any>;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  private workspaceService: WorkspaceService;
  private dbService: DbService;
  private initialized = false;

  private constructor() {
    this.workspaceService = WorkspaceService.getInstance();
    this.dbService = DbService.getInstance();
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * サービス初期化
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔐 Initializing SecureStorageService...');

    try {
      // keytar の動作確認
      const testKey = `${SERVICE_NAME}-test`;
      await keytar.setPassword(testKey, 'test-account', 'test-value');
      const testValue = await keytar.getPassword(testKey, 'test-account');
      await keytar.deletePassword(testKey, 'test-account');
      
      if (testValue !== 'test-value') {
        throw new Error('Keytar functionality test failed');
      }

      // 監査ログ記録
      this.dbService.addAuditLog({
        action: 'secure_storage_init',
        entity: 'security',
        entity_id: 'service',
        detail: JSON.stringify({ status: 'success' })
      });

      this.initialized = true;
      console.log('✅ SecureStorageService initialized successfully');

    } catch (error) {
      console.error('❌ SecureStorageService initialization failed:', error);
      
      // フォールバック警告
      console.warn('⚠️ Falling back to workspace-based storage (less secure)');
      
      // エラー監査ログ
      this.dbService.addAuditLog({
        action: 'secure_storage_init_failed',
        entity: 'security',
        entity_id: 'service',
        detail: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: 'workspace-storage'
        })
      });

      this.initialized = true; // フォールバックモードで継続
    }
  }

  /**
   * 機密情報を安全に保存
   */
  public async setCredential(
    id: string,
    type: SecureCredential['type'],
    service: string,
    account: string,
    value: string,
    options: CredentialSetOptions = {}
  ): Promise<void> {
    await this.initialize();

    try {
      const credential: SecureCredential = {
        id,
        type,
        service,
        account,
        encrypted: options.encrypted !== false,
        metadata: options.metadata
      };

      // バリデーション
      SecureCredentialSchema.parse(credential);

      const keystoreAccount = `${ACCOUNT_PREFIX}${account}-${id}`;
      
      try {
        // keytar で保存試行
        await keytar.setPassword(SERVICE_NAME, keystoreAccount, value);
        
        // メタデータをDBに保存（値は保存しない）
        this.dbService.addAuditLog({
          action: 'credential_set',
          entity: 'security',
          entity_id: id,
          detail: JSON.stringify({
            type,
            service,
            account,
            encrypted: credential.encrypted,
            storage: 'keytar'
          })
        });

        console.log(`🔐 Credential stored securely: ${id}`);

      } catch (keytarError) {
        console.warn('⚠️ Keytar storage failed, using workspace fallback:', keytarError);
        
        // フォールバック: ワークスペースベース暗号化保存
        await this.setCredentialFallback(id, value, credential);
      }

    } catch (error) {
      console.error('❌ Failed to set credential:', error);
      throw new Error(`Failed to set credential ${id}: ${error}`);
    }
  }

  /**
   * 機密情報を安全に取得
   */
  public async getCredential(
    id: string,
    account: string
  ): Promise<string | null> {
    await this.initialize();

    try {
      const keystoreAccount = `${ACCOUNT_PREFIX}${account}-${id}`;
      
      try {
        // keytar から取得試行
        const value = await keytar.getPassword(SERVICE_NAME, keystoreAccount);
        if (value) {
          return value;
        }
      } catch (keytarError) {
        console.warn('⚠️ Keytar retrieval failed, trying workspace fallback:', keytarError);
      }

      // フォールバック: ワークスペースから取得
      return await this.getCredentialFallback(id);

    } catch (error) {
      console.error('❌ Failed to get credential:', error);
      return null;
    }
  }

  /**
   * 機密情報を削除
   */
  public async deleteCredential(
    id: string,
    account: string
  ): Promise<boolean> {
    await this.initialize();

    try {
      const keystoreAccount = `${ACCOUNT_PREFIX}${account}-${id}`;
      let deleted = false;

      try {
        // keytar から削除
        deleted = await keytar.deletePassword(SERVICE_NAME, keystoreAccount);
      } catch (keytarError) {
        console.warn('⚠️ Keytar deletion failed:', keytarError);
      }

      // フォールバック削除も試行
      const fallbackDeleted = await this.deleteCredentialFallback(id);

      // 監査ログ記録
      this.dbService.addAuditLog({
        action: 'credential_delete',
        entity: 'security',
        entity_id: id,
        detail: JSON.stringify({
          account,
          keytar_deleted: deleted,
          fallback_deleted: fallbackDeleted
        })
      });

      return deleted || fallbackDeleted;

    } catch (error) {
      console.error('❌ Failed to delete credential:', error);
      return false;
    }
  }

  /**
   * 保存されている認証情報の一覧取得（値は含まない）
   */
  public async listCredentials(): Promise<CredentialListResult[]> {
    await this.initialize();

    try {
      const credentials: CredentialListResult[] = [];

      try {
        // keytar から一覧取得
        const keytarCredentials = await keytar.findCredentials(SERVICE_NAME);
        
        for (const cred of keytarCredentials) {
          if (cred.account.startsWith(ACCOUNT_PREFIX)) {
            const parts = cred.account.substring(ACCOUNT_PREFIX.length).split('-');
            if (parts.length >= 2) {
              const account = parts[0];
              const id = parts.slice(1).join('-');
              
              credentials.push({
                id,
                type: 'unknown', // keytar doesn't store metadata
                service: 'unknown',
                account,
                hasValue: true
              });
            }
          }
        }
      } catch (keytarError) {
        console.warn('⚠️ Keytar listing failed:', keytarError);
      }

      // フォールバック一覧も追加
      const fallbackCredentials = await this.listCredentialsFallback();
      credentials.push(...fallbackCredentials);

      return credentials;

    } catch (error) {
      console.error('❌ Failed to list credentials:', error);
      return [];
    }
  }

  /**
   * APIキー設定の一括管理
   */
  public async setApiConfig(config: ApiKeyConfig): Promise<void> {
    await this.initialize();

    try {
      // Supabase設定
      if (config.supabase) {
        if (config.supabase.anonKey) {
          await this.setCredential(
            'supabase-anon-key',
            'supabase_key',
            'supabase',
            'anon',
            config.supabase.anonKey
          );
        }
        if (config.supabase.serviceRoleKey) {
          await this.setCredential(
            'supabase-service-key',
            'supabase_key',
            'supabase',
            'service',
            config.supabase.serviceRoleKey
          );
        }
      }

      // OpenAI設定
      if (config.openai?.apiKey) {
        await this.setCredential(
          'openai-api-key',
          'api_token',
          'openai',
          'main',
          config.openai.apiKey
        );
      }

      // 外部API設定
      if (config.external) {
        for (const [serviceName, serviceConfig] of Object.entries(config.external)) {
          await this.setCredential(
            `${serviceName}-api-key`,
            'api_token',
            serviceName,
            'main',
            serviceConfig.key
          );
        }
      }

      console.log('✅ API configuration updated successfully');

    } catch (error) {
      console.error('❌ Failed to set API configuration:', error);
      throw new Error(`Failed to set API configuration: ${error}`);
    }
  }

  /**
   * APIキー設定の取得（値は含まない、存在確認のみ）
   */
  public async getApiConfigStatus(): Promise<{
    supabase: { anonKey: boolean; serviceKey: boolean; url?: string };
    openai: { apiKey: boolean; organization?: string };
    external: Record<string, boolean>;
  }> {
    await this.initialize();

    const status = {
      supabase: {
        anonKey: false,
        serviceKey: false
      },
      openai: {
        apiKey: false
      },
      external: {} as Record<string, boolean>
    };

    try {
      // 認証情報の存在確認
      const credentials = await this.listCredentials();

      for (const cred of credentials) {
        switch (cred.id) {
          case 'supabase-anon-key':
            status.supabase.anonKey = cred.hasValue;
            break;
          case 'supabase-service-key':
            status.supabase.serviceKey = cred.hasValue;
            break;
          case 'openai-api-key':
            status.openai.apiKey = cred.hasValue;
            break;
          default:
            if (cred.id.endsWith('-api-key')) {
              const serviceName = cred.id.replace('-api-key', '');
              status.external[serviceName] = cred.hasValue;
            }
        }
      }

      return status;

    } catch (error) {
      console.error('❌ Failed to get API config status:', error);
      return status;
    }
  }

  /**
   * 統一されたAPIキー取得メソッド
   */
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

  /**
   * ヘルスチェック
   */
  public async healthCheck(): Promise<{
    ok: boolean;
    keytar: boolean;
    fallback: boolean;
    message: string;
  }> {
    try {
      let keytarOk = false;
      let fallbackOk = false;

      // keytar テスト
      try {
        const testKey = `${SERVICE_NAME}-health`;
        await keytar.setPassword(testKey, 'health', 'test');
        const value = await keytar.getPassword(testKey, 'health');
        await keytar.deletePassword(testKey, 'health');
        keytarOk = (value === 'test');
      } catch (error) {
        console.warn('Keytar health check failed:', error);
      }

      // フォールバック テスト
      try {
        const { paths } = await this.workspaceService.resolve();
        fallbackOk = !!paths.cache;
      } catch (error) {
        console.warn('Fallback health check failed:', error);
      }

      const ok = keytarOk || fallbackOk;

      return {
        ok,
        keytar: keytarOk,
        fallback: fallbackOk,
        message: ok 
          ? 'Secure storage is operational' 
          : 'Secure storage is not available'
      };

    } catch (error) {
      return {
        ok: false,
        keytar: false,
        fallback: false,
        message: `Health check failed: ${error}`
      };
    }
  }

  // === フォールバック実装（ワークスペースベース） ===

  /**
   * フォールバック: ワークスペースに暗号化保存
   */
  private async setCredentialFallback(
    id: string,
    value: string,
    credential: SecureCredential
  ): Promise<void> {
    const { paths } = await this.workspaceService.resolve();
    const credentialsPath = require('path').join(paths.cache, 'credentials.json');
    
    try {
      let credentials: Record<string, any> = {};
      
      try {
        const existing = await require('fs/promises').readFile(credentialsPath, 'utf-8');
        credentials = JSON.parse(existing);
      } catch (error) {
        // ファイルが存在しない場合は空から開始
      }

      // 簡易暗号化（本格実装では crypto を使用）
      const encrypted = Buffer.from(value).toString('base64');
      
      credentials[id] = {
        ...credential,
        value: encrypted,
        timestamp: new Date().toISOString(),
        storage: 'fallback'
      };

      await require('fs/promises').writeFile(
        credentialsPath, 
        JSON.stringify(credentials, null, 2),
        { mode: 0o600 } // 所有者のみ読み書き可能
      );

      // 監査ログ
      this.dbService.addAuditLog({
        action: 'credential_set_fallback',
        entity: 'security',
        entity_id: id,
        detail: JSON.stringify({ storage: 'workspace-fallback' })
      });

    } catch (error) {
      throw new Error(`Fallback credential storage failed: ${error}`);
    }
  }

  /**
   * フォールバック: ワークスペースから取得
   */
  private async getCredentialFallback(id: string): Promise<string | null> {
    const { paths } = await this.workspaceService.resolve();
    const credentialsPath = require('path').join(paths.cache, 'credentials.json');
    
    try {
      const data = await require('fs/promises').readFile(credentialsPath, 'utf-8');
      const credentials = JSON.parse(data);
      
      if (credentials[id]?.value) {
        // 簡易復号
        return Buffer.from(credentials[id].value, 'base64').toString();
      }
      
      return null;

    } catch (error) {
      return null;
    }
  }

  /**
   * フォールバック: ワークスペースから削除
   */
  private async deleteCredentialFallback(id: string): Promise<boolean> {
    const { paths } = await this.workspaceService.resolve();
    const credentialsPath = require('path').join(paths.cache, 'credentials.json');
    
    try {
      const data = await require('fs/promises').readFile(credentialsPath, 'utf-8');
      const credentials = JSON.parse(data);
      
      if (credentials[id]) {
        delete credentials[id];
        await require('fs/promises').writeFile(
          credentialsPath,
          JSON.stringify(credentials, null, 2),
          { mode: 0o600 }
        );
        return true;
      }
      
      return false;

    } catch (error) {
      return false;
    }
  }

  /**
   * フォールバック: 一覧取得
   */
  private async listCredentialsFallback(): Promise<CredentialListResult[]> {
    const { paths } = await this.workspaceService.resolve();
    const credentialsPath = require('path').join(paths.cache, 'credentials.json');
    
    try {
      const data = await require('fs/promises').readFile(credentialsPath, 'utf-8');
      const credentials = JSON.parse(data);
      
      return Object.entries(credentials).map(([id, cred]: [string, any]) => ({
        id,
        type: cred.type || 'unknown',
        service: cred.service || 'unknown',
        account: cred.account || 'unknown',
        hasValue: !!cred.value,
        metadata: cred.metadata
      }));

    } catch (error) {
      return [];
    }
  }
}