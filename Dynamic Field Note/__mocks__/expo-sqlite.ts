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

  async execAsync(source: string): Promise<void> {
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
  }

  async runAsync(source: string, params: SQLiteBindValue[] = []): Promise<RunResult> {
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

      const row: Record<string, unknown> = { id };
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
          // SET句から更新するフィールドを抽出
          const setMatch = source.match(/SET (.+?) WHERE/i);
          if (setMatch) {
            const sets = setMatch[1].split(',').map((s) => s.trim());
            sets.forEach((set, index) => {
              const [field] = set.split('=').map((s) => s.trim());
              row[field] = params[index] ?? null;
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

      // WHERE id = ?
      const whereMatch = source.match(/WHERE id = \?/i);
      if (whereMatch && params.length > 0) {
        const id = params[0] as number;
        const row = table.get(id);
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

      return rows as T[];
    }

    return [];
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return await task();
  }
}

let dbInstance: InMemoryDatabase | null = null;

export async function openDatabaseAsync(_databaseName: string): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = new InMemoryDatabase();
  }
  return dbInstance;
}
