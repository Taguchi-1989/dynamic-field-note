/**
 * expo-sqlite Mock for Jest Integration Tests
 *
 * SQLiteのインメモリデータベースをシミュレート
 */

export interface SQLiteDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SQLiteBindValue[]): Promise<RunResult>;
  getFirstAsync<T>(source: string, params?: SQLiteBindValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params?: SQLiteBindValue[]): Promise<T[]>;
  withTransactionAsync<T>(task: () => Promise<T>): Promise<T>;
}

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export type SQLiteBindValue = string | number | null | boolean | Uint8Array;

// インメモリストレージ
class InMemoryDatabase implements SQLiteDatabase {
  private tables: Map<string, Map<number, Record<string, unknown>>> = new Map();
  private autoIncrements: Map<string, number> = new Map();
  private userVersion = 0;
  private transactionActive = false;
  private transactionSnapshot: Map<string, Map<number, Record<string, unknown>>> | null = null;

  async execAsync(source: string): Promise<void> {
    // トランザクション開始
    if (source.match(/BEGIN TRANSACTION/i)) {
      this.transactionActive = true;
      // 現在の状態をスナップショット
      this.transactionSnapshot = new Map();
      for (const [tableName, tableData] of this.tables.entries()) {
        const snapshotTable = new Map<number, Record<string, unknown>>();
        for (const [id, row] of tableData.entries()) {
          snapshotTable.set(id, { ...row });
        }
        this.transactionSnapshot.set(tableName, snapshotTable);
      }
      return;
    }

    // トランザクションコミット
    if (source.match(/COMMIT/i)) {
      this.transactionActive = false;
      this.transactionSnapshot = null;
      return;
    }

    // トランザクションロールバック
    if (source.match(/ROLLBACK/i)) {
      if (this.transactionSnapshot) {
        // スナップショットから復元
        this.tables = this.transactionSnapshot;
        this.transactionSnapshot = null;
      }
      this.transactionActive = false;
      return;
    }

    // CREATE TABLE文のパース
    const createTableMatch = source.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
    if (createTableMatch) {
      const tableName = createTableMatch[1];
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, new Map());
        this.autoIncrements.set(tableName, 0);
      }
    }

    // PRAGMA user_version設定
    const versionMatch = source.match(/PRAGMA user_version = (\d+)/i);
    if (versionMatch) {
      this.userVersion = parseInt(versionMatch[1], 10);
    }

    // INVALID SQL - エラーを投げる
    if (source.match(/INVALID SQL/i)) {
      throw new Error('Syntax error: INVALID SQL');
    }
  }

  async runAsync(source: string, params: SQLiteBindValue[] = []): Promise<RunResult> {
    // INVALID SQL - エラーを投げる
    if (source.match(/INVALID SQL/i)) {
      throw new Error('Syntax error: INVALID SQL');
    }

    // INSERT文
    const insertMatch = source.match(/INSERT INTO (\w+)/i);
    if (insertMatch) {
      const tableName = insertMatch[1];
      const table = this.tables.get(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} does not exist`);
      }

      const id = (this.autoIncrements.get(tableName) || 0) + 1;
      this.autoIncrements.set(tableName, id);

      // カラム名とVALUESを抽出
      const columnsMatch = source.match(/\(([^)]+)\)/);
      const columns = columnsMatch ? columnsMatch[1].split(',').map((c) => c.trim()) : [];

      const now = new Date().toISOString();
      const row: Record<string, unknown> = {
        id,
        is_deleted: 0,
        created_at: now,
        updated_at: now,
        synced_at: null,
      };
      columns.forEach((col, index) => {
        row[col] = params[index] ?? null;
      });

      table.set(id, row);

      return { lastInsertRowId: id, changes: 1 };
    }

    // UPDATE文
    const updateMatch = source.match(/UPDATE (\w+)/i);
    if (updateMatch) {
      const tableName = updateMatch[1];
      const table = this.tables.get(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} does not exist`);
      }

      // WHERE id = ? を抽出
      const whereMatch = source.match(/WHERE id = \?/i);
      if (whereMatch) {
        const id = params[params.length - 1] as number;
        const row = table.get(id);
        if (row) {
          // is_deleted フィルタをチェック
          const isDeletedFilter = source.includes('is_deleted = 0');
          if (isDeletedFilter && row.is_deleted !== 0) {
            return { lastInsertRowId: 0, changes: 0 };
          }

          // SET句から更新するフィールドを抽出
          const setMatch = source.match(/SET (.+?) WHERE/is);
          if (setMatch) {
            const sets = setMatch[1].split(',').map((s) => s.trim());
            let paramIndex = 0;
            sets.forEach((set) => {
              const parts = set.split('=');
              if (parts.length < 2) return;

              const field = parts[0].trim();
              const value = parts.slice(1).join('=').trim();

              // datetime('now', 'localtime') を現在時刻に変換
              if (value && value.includes("datetime('now'")) {
                row[field] = new Date().toISOString();
              } else if (value === '?') {
                row[field] = params[paramIndex];
                paramIndex++;
              } else if (!isNaN(Number(value))) {
                row[field] = Number(value);
              }
            });
          }
        }
      }

      return { lastInsertRowId: 0, changes: 1 };
    }

    // DELETE文
    const deleteMatch = source.match(/DELETE FROM (\w+)/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const table = this.tables.get(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} does not exist`);
      }

      const whereMatch = source.match(/WHERE id = \?/i);
      if (whereMatch) {
        const id = params[0] as number;
        table.delete(id);
      } else {
        // 全削除
        table.clear();
        this.autoIncrements.set(tableName, 0);
      }

      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(source: string, params: SQLiteBindValue[] = []): Promise<T | null> {
    // PRAGMA user_version
    if (source.includes('PRAGMA user_version')) {
      return { user_version: this.userVersion } as T;
    }

    // SELECT文
    const selectMatch = source.match(/FROM (\w+)/i);
    if (selectMatch) {
      const tableName = selectMatch[1];
      const table = this.tables.get(tableName);
      if (!table) {
        return null;
      }

      // WHERE id = last_insert_rowid()
      if (source.includes('last_insert_rowid()')) {
        const lastId = this.autoIncrements.get(tableName) || 0;
        const row = table.get(lastId);
        return (row as T) ?? null;
      }

      // WHERE id = ?
      const whereMatch = source.match(/WHERE id = \?/i);
      if (whereMatch && params.length > 0) {
        const id = params[0] as number;
        const row = table.get(id);
        // is_deleted フィルタをチェック
        if (row && source.includes('is_deleted = 0') && row.is_deleted !== 0) {
          return null;
        }
        return (row as T) ?? null;
      }

      // 最初の行を返す
      const firstRow = Array.from(table.values())[0];
      return (firstRow as T) ?? null;
    }

    return null;
  }

  async getAllAsync<T>(source: string, params: SQLiteBindValue[] = []): Promise<T[]> {
    // SELECT文
    const selectMatch = source.match(/FROM (\w+)/i);
    if (selectMatch) {
      const tableName = selectMatch[1];
      const table = this.tables.get(tableName);
      if (!table) {
        return [];
      }

      let rows = Array.from(table.values());

      // WHERE条件のフィルタリング
      if (source.includes('WHERE')) {
        // is_deleted = 0
        if (source.includes('is_deleted = 0')) {
          rows = rows.filter((row) => row.is_deleted === 0);
        }

        // status = ?
        if (source.includes('status = ?') && params.length > 0) {
          const status = params[0];
          rows = rows.filter((row) => row.status === status);
        }

        // case_id = ?
        if (source.includes('case_id = ?') && params.length > 0) {
          const caseId = params[0];
          rows = rows.filter((row) => row.case_id === caseId);
        }

        // LIKE検索
        const likeMatch = source.match(/(\w+) LIKE \?/i);
        if (likeMatch && params.length > 0) {
          const field = likeMatch[1];
          const pattern = (params[0] as string).replace(/%/g, '');
          rows = rows.filter((row) => {
            const value = row[field];
            return typeof value === 'string' && value.includes(pattern);
          });
        }
      }

      // ORDER BY created_at DESC
      if (source.includes('ORDER BY created_at DESC')) {
        rows.sort((a, b) => {
          const aTime = a.created_at as string;
          const bTime = b.created_at as string;
          return bTime.localeCompare(aTime);
        });
      }

      // ORDER BY updated_at DESC
      if (source.includes('ORDER BY updated_at DESC')) {
        rows.sort((a, b) => {
          const aTime = a.updated_at as string;
          const bTime = b.updated_at as string;
          return bTime.localeCompare(aTime);
        });
      }

      return rows as T[];
    }

    return [];
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return await task();
  }

  async closeAsync(): Promise<void> {
    // In-memory database cleanup
    this.tables.clear();
    this.autoIncrements.clear();
    this.userVersion = 0;
  }

  closeSync(): void {
    // In-memory database cleanup
    this.tables.clear();
    this.autoIncrements.clear();
    this.userVersion = 0;
  }
}

let dbInstance: InMemoryDatabase | null = null;

export async function openDatabaseAsync(_databaseName: string): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = new InMemoryDatabase();
  }
  return dbInstance;
}

export async function deleteDatabaseAsync(_databaseName: string): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
