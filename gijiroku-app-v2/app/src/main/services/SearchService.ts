/**
 * SearchService - 検索・埋め込み機能サービス [開発中]
 * 
 * ⚠️ MVP除外: 高度な検索機能は開発中のため無効化
 * 
 * masterfile.md 220-231行のembeddingsテーブル準拠
 * - 全文検索（SQLite FTS）
 * - ベクトル検索（埋め込み）
 * - ハイブリッド検索
 * - インデックス管理
 */

import { EventEmitter } from 'events';
import { isFeatureEnabled } from '../../shared/feature-flags';
import { WorkspaceService } from './WorkspaceService';
import { DbService } from './DbService';
import { SecureStorageService } from './SecureStorageService';
import { PdfJobService } from './PdfJobService';

// 検索タイプ定義
export type SearchType = 'fulltext' | 'vector' | 'hybrid';

// 検索対象エンティティ
export type SearchEntity = 
  | 'meetings'
  | 'documents' 
  | 'document_versions'
  | 'transcript_segments'
  | 'tasks';

// 検索クエリ
export interface SearchQuery {
  query: string;
  type: SearchType;
  entities: SearchEntity[];
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    meetingId?: string;
    userId?: string;
    status?: string[];
  };
  limit?: number;
  offset?: number;
}

// 検索結果項目
export interface SearchResultItem {
  id: string;
  entity: SearchEntity;
  entity_id: string;
  title: string;
  content: string;
  snippet: string;
  score: number;
  similarity?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 検索結果
export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  query: SearchQuery;
  took_ms: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

// 埋め込み設定
export interface EmbeddingConfig {
  model: string;
  provider: 'openai' | 'local';
  dimensions: number;
  enabled: boolean;
  batchSize: number;
  autoIndex: boolean;
}

// 埋め込み結果
export interface EmbeddingResult {
  entity_type: string;
  entity_id: string;
  model: string;
  dimensions: number;
  vector: number[];
}

export class SearchService extends EventEmitter {
  private static instance: SearchService;
  private workspaceService: WorkspaceService;
  private dbService: DbService;
  private secureStorageService: SecureStorageService;
  private jobService: PdfJobService;
  private initialized = false;
  private indexingQueue: Array<{ entity: SearchEntity; entity_id: string }> = [];

  private constructor() {
    super();
    this.workspaceService = WorkspaceService.getInstance();
    this.dbService = DbService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();
    this.jobService = PdfJobService.getInstance();
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * サービス初期化 [MVP除外]
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // MVP除外: 検索機能は開発中のため無効化
    if (!isFeatureEnabled('searchFunction')) {
      console.log('🚧 SearchService disabled in MVP mode (under development)');
      this.initialized = true;
      return;
    }

    console.log('🔍 Initializing SearchService...');

    try {
      // FTS（全文検索）インデックス初期化
      await this.initializeFTSIndexes();

      // 埋め込みモデル設定確認
      const embeddingConfig = await this.getEmbeddingConfig();
      
      if (embeddingConfig.enabled) {
        // 既存データの埋め込み状況確認
        await this.checkEmbeddingCoverage();
      }

      // 監査ログ記録
      this.dbService.addAuditLog({
        action: 'search_service_init',
        entity: 'system',
        entity_id: 'search-service',
        detail: JSON.stringify({ 
          fts_enabled: true,
          embeddings_enabled: embeddingConfig.enabled 
        })
      });

      this.initialized = true;
      console.log('✅ SearchService initialized successfully');

    } catch (error) {
      console.error('❌ SearchService initialization failed:', error);
      throw new Error(`SearchService initialization failed: ${error}`);
    }
  }

  /**
   * 検索実行 [MVP除外]
   */
  public async search(query: SearchQuery): Promise<SearchResult> {
    if (!isFeatureEnabled('searchFunction')) {
      console.warn('🚧 Search function disabled in MVP mode');
      return {
        items: [],
        total: 0,
        query,
        took_ms: 0
      };
    }

    if (!this.initialized) {
      throw new Error('SearchService not initialized');
    }

    const startTime = performance.now();
    console.log(`🔍 Searching: "${query.query}" (${query.type})`);

    try {
      let results: SearchResultItem[] = [];

      switch (query.type) {
        case 'fulltext':
          results = await this.performFullTextSearch(query);
          break;
        case 'vector':
          results = await this.performVectorSearch(query);
          break;
        case 'hybrid':
          results = await this.performHybridSearch(query);
          break;
        default:
          throw new Error(`Unsupported search type: ${query.type}`);
      }

      // スコアによる並び替え
      results.sort((a, b) => b.score - a.score);

      // ページネーション適用
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const paginatedResults = results.slice(offset, offset + limit);

      const took_ms = performance.now() - startTime;

      const searchResult: SearchResult = {
        items: paginatedResults,
        total: results.length,
        query,
        took_ms
      };

      // 検索ログ記録
      this.dbService.addAuditLog({
        action: 'search_performed',
        entity: 'search',
        entity_id: 'query',
        detail: JSON.stringify({
          query: query.query,
          type: query.type,
          results_count: results.length,
          took_ms
        })
      });

      this.emit('search:completed', searchResult);
      console.log(`✅ Search completed: ${results.length} results in ${took_ms.toFixed(2)}ms`);

      return searchResult;

    } catch (error) {
      console.error('❌ Search failed:', error);
      throw new Error(`Search failed: ${error}`);
    }
  }

  /**
   * 埋め込み生成
   */
  public async generateEmbedding(
    entity: SearchEntity,
    entity_id: string,
    content: string,
    force: boolean = false
  ): Promise<EmbeddingResult | null> {
    try {
      const config = await this.getEmbeddingConfig();
      if (!config.enabled) {
        return null;
      }

      // 既存埋め込みチェック
      if (!force) {
        const existing = await this.getExistingEmbedding(entity, entity_id, config.model);
        if (existing) {
          return existing;
        }
      }

      console.log(`🧮 Generating embedding for ${entity}:${entity_id}`);

      // 埋め込み生成（プロバイダー別）
      let vector: number[];
      
      if (config.provider === 'openai') {
        vector = await this.generateOpenAIEmbedding(content, config);
      } else {
        vector = await this.generateLocalEmbedding(content, config);
      }

      // データベースに保存
      const result: EmbeddingResult = {
        entity_type: entity,
        entity_id,
        model: config.model,
        dimensions: vector.length,
        vector
      };

      await this.saveEmbedding(result);

      // 埋め込み完了イベント
      this.emit('embedding:generated', result);

      console.log(`✅ Embedding generated: ${entity}:${entity_id} (${vector.length}d)`);
      return result;

    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * インデックス再構築
   */
  public async rebuildIndexes(): Promise<{
    fts_rebuilt: boolean;
    embeddings_generated: number;
    errors: string[];
  }> {
    console.log('🔄 Rebuilding search indexes...');

    const result = {
      fts_rebuilt: false,
      embeddings_generated: 0,
      errors: [] as string[]
    };

    try {
      // FTSインデックス再構築
      try {
        await this.rebuildFTSIndexes();
        result.fts_rebuilt = true;
        console.log('✅ FTS indexes rebuilt');
      } catch (error) {
        result.errors.push(`FTS rebuild failed: ${error}`);
      }

      // 埋め込み再生成（設定が有効な場合）
      const config = await this.getEmbeddingConfig();
      if (config.enabled) {
        try {
          result.embeddings_generated = await this.rebuildEmbeddings();
          console.log(`✅ Generated ${result.embeddings_generated} embeddings`);
        } catch (error) {
          result.errors.push(`Embedding rebuild failed: ${error}`);
        }
      }

      // 監査ログ記録
      this.dbService.addAuditLog({
        action: 'indexes_rebuilt',
        entity: 'search',
        entity_id: 'indexes',
        detail: JSON.stringify(result)
      });

      return result;

    } catch (error) {
      result.errors.push(`Index rebuild failed: ${error}`);
      return result;
    }
  }

  /**
   * 検索統計取得
   */
  public async getSearchStats(): Promise<{
    total_indexed_items: number;
    embeddings_count: number;
    fts_indexes: string[];
    last_index_update: string | null;
  }> {
    try {
      const db = this.dbService['getDb']();

      // インデックス済みアイテム数
      const indexedStmt = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM meetings) +
          (SELECT COUNT(*) FROM documents) +
          (SELECT COUNT(*) FROM document_versions) +
          (SELECT COUNT(*) FROM transcript_segments) +
          (SELECT COUNT(*) FROM tasks) as total
      `);
      const indexedResult = indexedStmt.get() as { total: number };

      // 埋め込み数
      const embeddingsStmt = db.prepare('SELECT COUNT(*) as count FROM embeddings');
      const embeddingsResult = embeddingsStmt.get() as { count: number };

      // FTSインデックス一覧
      const ftsIndexes = [
        'meetings_fts',
        'documents_fts', 
        'document_versions_fts',
        'transcript_segments_fts',
        'tasks_fts'
      ];

      // 最後のインデックス更新
      const lastUpdateStmt = db.prepare(`
        SELECT created_at FROM audit_log 
        WHERE action IN ('search_service_init', 'indexes_rebuilt')
        ORDER BY created_at DESC LIMIT 1
      `);
      const lastUpdateResult = lastUpdateStmt.get() as { created_at: string } | undefined;

      return {
        total_indexed_items: indexedResult.total,
        embeddings_count: embeddingsResult.count,
        fts_indexes: ftsIndexes,
        last_index_update: lastUpdateResult?.created_at || null
      };

    } catch (error) {
      console.error('Failed to get search stats:', error);
      return {
        total_indexed_items: 0,
        embeddings_count: 0,
        fts_indexes: [],
        last_index_update: null
      };
    }
  }

  // === プライベートメソッド ===

  /**
   * FTSインデックス初期化
   */
  private async initializeFTSIndexes(): Promise<void> {
    const db = this.dbService['getDb']();

    const ftsIndexes = [
      // ミーティング検索
      `CREATE VIRTUAL TABLE IF NOT EXISTS meetings_fts USING fts5(
        title, location, content='meetings', content_rowid='id'
      )`,
      
      // ドキュメント検索
      `CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
        title, content='documents', content_rowid='id'
      )`,
      
      // ドキュメント版検索
      `CREATE VIRTUAL TABLE IF NOT EXISTS document_versions_fts USING fts5(
        content_md, content='document_versions', content_rowid='id'
      )`,
      
      // トランスクリプト検索
      `CREATE VIRTUAL TABLE IF NOT EXISTS transcript_segments_fts USING fts5(
        text, speaker_label, content='transcript_segments', content_rowid='id'
      )`,
      
      // タスク検索
      `CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
        title, assignee, content='tasks', content_rowid='id'
      )`
    ];

    for (const indexSQL of ftsIndexes) {
      try {
        db.exec(indexSQL);
      } catch (error) {
        console.warn('FTS index creation warning:', error);
      }
    }

    console.log('✅ FTS indexes initialized');
  }

  /**
   * 全文検索実行
   */
  private async performFullTextSearch(query: SearchQuery): Promise<SearchResultItem[]> {
    const db = this.dbService['getDb']();
    const results: SearchResultItem[] = [];

    // クエリのサニタイズ
    const sanitizedQuery = query.query.replace(/['"]/g, '').trim();
    if (!sanitizedQuery) {
      return results;
    }

    // エンティティ別検索
    for (const entity of query.entities) {
      try {
        const entityResults = await this.searchInEntity(db, entity, sanitizedQuery, query.filters);
        results.push(...entityResults);
      } catch (error) {
        console.warn(`FTS search failed for entity ${entity}:`, error);
      }
    }

    return results;
  }

  /**
   * エンティティ内検索
   */
  private async searchInEntity(
    db: any, 
    entity: SearchEntity, 
    query: string,
    filters?: SearchQuery['filters']
  ): Promise<SearchResultItem[]> {
    let searchSQL: string;
    const params: any[] = [query];

    switch (entity) {
      case 'meetings':
        searchSQL = `
          SELECT m.id, m.title, COALESCE(m.location, '') as content,
                 snippet(meetings_fts, 0, '<mark>', '</mark>', '...', 32) as snippet,
                 bm25(meetings_fts) as score,
                 m.created_at, m.updated_at
          FROM meetings_fts
          INNER JOIN meetings m ON meetings_fts.rowid = m.rowid
          WHERE meetings_fts MATCH ?
        `;
        break;

      case 'document_versions':
        searchSQL = `
          SELECT dv.id, d.title, COALESCE(dv.content_md, '') as content,
                 snippet(document_versions_fts, 0, '<mark>', '</mark>', '...', 64) as snippet,
                 bm25(document_versions_fts) as score,
                 dv.created_at, dv.created_at as updated_at
          FROM document_versions_fts
          INNER JOIN document_versions dv ON document_versions_fts.rowid = dv.rowid
          INNER JOIN documents d ON dv.document_id = d.id
          WHERE document_versions_fts MATCH ?
        `;
        break;

      case 'transcript_segments':
        searchSQL = `
          SELECT ts.id, COALESCE(ts.speaker_label, 'Unknown') as title, ts.text as content,
                 snippet(transcript_segments_fts, 0, '<mark>', '</mark>', '...', 48) as snippet,
                 bm25(transcript_segments_fts) as score,
                 ts.created_at, ts.created_at as updated_at
          FROM transcript_segments_fts
          INNER JOIN transcript_segments ts ON transcript_segments_fts.rowid = ts.id
          WHERE transcript_segments_fts MATCH ?
        `;
        break;

      case 'tasks':
        searchSQL = `
          SELECT t.id, t.title, COALESCE(t.assignee, '') as content,
                 snippet(tasks_fts, 0, '<mark>', '</mark>', '...', 32) as snippet,
                 bm25(tasks_fts) as score,
                 t.created_at, t.updated_at
          FROM tasks_fts
          INNER JOIN tasks t ON tasks_fts.rowid = t.rowid
          WHERE tasks_fts MATCH ?
        `;
        break;

      default:
        return [];
    }

    // フィルター適用
    if (filters?.dateFrom) {
      searchSQL += ` AND created_at >= ?`;
      params.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      searchSQL += ` AND created_at <= ?`;
      params.push(filters.dateTo);
    }
    if (filters?.meetingId && entity !== 'meetings') {
      searchSQL += ` AND meeting_id = ?`;
      params.push(filters.meetingId);
    }

    searchSQL += ` ORDER BY score DESC LIMIT 50`;

    const stmt = db.prepare(searchSQL);
    const rows = stmt.all(...params);

    return rows.map((row: any) => ({
      id: row.id,
      entity,
      entity_id: row.id,
      title: row.title || 'Untitled',
      content: row.content || '',
      snippet: row.snippet || row.content?.substring(0, 100) || '',
      score: Math.abs(row.score) || 0,
      metadata: {},
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * ベクトル検索実行（スタブ実装）
   */
  private async performVectorSearch(query: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const config = await this.getEmbeddingConfig();
      if (!config.enabled) {
        console.warn('Vector search requested but embeddings are disabled');
        return [];
      }

      // TODO: 実際のベクトル検索実装
      // 1. クエリの埋め込み生成
      // 2. コサイン類似度計算
      // 3. 結果返却

      console.log('🔍 Vector search not yet implemented');
      return [];

    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  /**
   * ハイブリッド検索実行
   */
  private async performHybridSearch(query: SearchQuery): Promise<SearchResultItem[]> {
    try {
      // 全文検索とベクトル検索の結果を組み合わせ
      const [fulltextResults, vectorResults] = await Promise.all([
        this.performFullTextSearch({ ...query, type: 'fulltext' }),
        this.performVectorSearch({ ...query, type: 'vector' })
      ]);

      // スコアの正規化と統合
      const combinedResults = new Map<string, SearchResultItem>();

      // 全文検索結果（重み: 0.7）
      for (const item of fulltextResults) {
        const key = `${item.entity}:${item.entity_id}`;
        combinedResults.set(key, {
          ...item,
          score: item.score * 0.7
        });
      }

      // ベクトル検索結果（重み: 0.3）
      for (const item of vectorResults) {
        const key = `${item.entity}:${item.entity_id}`;
        const existing = combinedResults.get(key);
        
        if (existing) {
          // 既存結果にベクトルスコアを追加
          existing.score += (item.similarity || 0) * 0.3;
          existing.similarity = item.similarity;
        } else {
          combinedResults.set(key, {
            ...item,
            score: (item.similarity || 0) * 0.3
          });
        }
      }

      return Array.from(combinedResults.values());

    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw error;
    }
  }

  /**
   * 埋め込み設定取得
   */
  private async getEmbeddingConfig(): Promise<EmbeddingConfig> {
    // デフォルト設定
    return {
      model: 'text-embedding-3-small',
      provider: 'openai',
      dimensions: 1536,
      enabled: false, // デフォルトは無効
      batchSize: 10,
      autoIndex: false
    };
  }

  /**
   * OpenAI埋め込み生成（スタブ実装）
   */
  private async generateOpenAIEmbedding(content: string, config: EmbeddingConfig): Promise<number[]> {
    try {
      // TODO: 実際のOpenAI API呼び出し
      // const apiKey = await this.secureStorageService.getCredential('openai-api-key', 'main');
      // if (!apiKey) {
      //   throw new Error('OpenAI API key not configured');
      // }

      // スタブ: ランダムベクトル生成
      const vector = Array.from({ length: config.dimensions }, () => Math.random() - 0.5);
      
      // 正規化
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map(val => val / magnitude);

    } catch (error) {
      console.error('OpenAI embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * ローカル埋め込み生成（スタブ実装）
   */
  private async generateLocalEmbedding(content: string, config: EmbeddingConfig): Promise<number[]> {
    try {
      // TODO: ローカル埋め込みモデル実装
      // 例: TensorFlow.js、ONNXモデル等

      // スタブ: 簡易ハッシュベースベクトル
      const vector = Array.from({ length: config.dimensions }, (_, i) => {
        const hash = this.simpleHash(content + i);
        return (hash % 2000 - 1000) / 1000; // -1 to 1 range
      });

      return vector;

    } catch (error) {
      console.error('Local embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * 埋め込み保存
   */
  private async saveEmbedding(result: EmbeddingResult): Promise<void> {
    try {
      const db = this.dbService['getDb']();
      
      // 既存の埋め込み削除
      const deleteStmt = db.prepare(`
        DELETE FROM embeddings 
        WHERE entity_type = ? AND entity_id = ? AND model = ?
      `);
      deleteStmt.run(result.entity_type, result.entity_id, result.model);

      // 新しい埋め込み保存
      const insertStmt = db.prepare(`
        INSERT INTO embeddings (entity_type, entity_id, model, dim, vector, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // ベクトルをBLOBとして保存（Float32Array）
      const vectorBuffer = new Float32Array(result.vector).buffer;
      
      insertStmt.run(
        result.entity_type,
        result.entity_id,
        result.model,
        result.dimensions,
        Buffer.from(vectorBuffer),
        new Date().toISOString()
      );

    } catch (error) {
      console.error('Failed to save embedding:', error);
      throw error;
    }
  }

  /**
   * 既存埋め込み取得
   */
  private async getExistingEmbedding(
    entity: SearchEntity, 
    entity_id: string, 
    model: string
  ): Promise<EmbeddingResult | null> {
    try {
      const db = this.dbService['getDb']();
      
      const stmt = db.prepare(`
        SELECT entity_type, entity_id, model, dim, vector
        FROM embeddings
        WHERE entity_type = ? AND entity_id = ? AND model = ?
      `);
      
      const row = stmt.get(entity, entity_id, model) as any;
      if (!row) {
        return null;
      }

      // BLOBからベクトルを復元
      const vectorArray = new Float32Array(row.vector.buffer);
      
      return {
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        model: row.model,
        dimensions: row.dim,
        vector: Array.from(vectorArray)
      };

    } catch (error) {
      console.error('Failed to get existing embedding:', error);
      return null;
    }
  }

  /**
   * 埋め込みカバレッジ確認
   */
  private async checkEmbeddingCoverage(): Promise<void> {
    try {
      const db = this.dbService['getDb']();
      
      // 各エンティティの埋め込み状況を確認
      const entities: SearchEntity[] = ['meetings', 'documents', 'document_versions', 'transcript_segments', 'tasks'];
      
      for (const entity of entities) {
        const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM ${entity}`);
        const totalResult = totalStmt.get() as { total: number };
        
        const embeddedStmt = db.prepare(`
          SELECT COUNT(*) as embedded FROM embeddings 
          WHERE entity_type = ?
        `);
        const embeddedResult = embeddedStmt.get(entity) as { embedded: number };
        
        const coverage = totalResult.total > 0 
          ? Math.round((embeddedResult.embedded / totalResult.total) * 100)
          : 100;
          
        console.log(`📊 ${entity} embedding coverage: ${embeddedResult.embedded}/${totalResult.total} (${coverage}%)`);
      }

    } catch (error) {
      console.error('Failed to check embedding coverage:', error);
    }
  }

  /**
   * FTSインデックス再構築
   */
  private async rebuildFTSIndexes(): Promise<void> {
    const db = this.dbService['getDb']();
    
    // 既存FTSテーブル削除・再作成
    const ftsIndexes = [
      'meetings_fts',
      'documents_fts',
      'document_versions_fts', 
      'transcript_segments_fts',
      'tasks_fts'
    ];
    
    for (const index of ftsIndexes) {
      try {
        db.exec(`DROP TABLE IF EXISTS ${index}`);
      } catch (error) {
        console.warn(`Failed to drop ${index}:`, error);
      }
    }
    
    // インデックス再作成
    await this.initializeFTSIndexes();
    
    // データ再構築
    db.exec(`INSERT INTO meetings_fts(meetings_fts) VALUES('rebuild')`);
    db.exec(`INSERT INTO documents_fts(documents_fts) VALUES('rebuild')`);
    db.exec(`INSERT INTO document_versions_fts(document_versions_fts) VALUES('rebuild')`);
    db.exec(`INSERT INTO transcript_segments_fts(transcript_segments_fts) VALUES('rebuild')`);
    db.exec(`INSERT INTO tasks_fts(tasks_fts) VALUES('rebuild')`);
  }

  /**
   * 埋め込み再構築
   */
  private async rebuildEmbeddings(): Promise<number> {
    // TODO: 実装が必要な場合
    return 0;
  }

  /**
   * 簡易ハッシュ関数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }
}