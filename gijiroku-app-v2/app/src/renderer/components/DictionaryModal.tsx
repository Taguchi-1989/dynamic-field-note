import React, { useState, useEffect } from 'react';
import { isFeatureEnabled, shouldShowDevelopmentTag } from '../../shared/feature-flags';
import './DictionaryModal.css';
import './modal-close-style.css';
import './DevelopmentStyles.css';

// Electron API の型定義
declare global {
  interface Window {
    electronAPI: {
      dictionary: {
        list: () => Promise<{ success: boolean; data?: DictionaryEntry[]; error?: string }>;
        get: (id: string) => Promise<{ success: boolean; data?: DictionaryEntry; error?: string }>;
        upsert: (entry: DictionaryEntry) => Promise<{ success: boolean; data?: DictionaryEntry; error?: string }>;
        delete: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
        export: () => Promise<{ success: boolean; data?: DictionaryEntry[]; error?: string }>;
        import: (data: { entries: DictionaryEntry[]; overwrite: boolean }) => Promise<{ success: boolean; data?: { imported: number }; error?: string }>;
      };
    };
  }
}

interface DictionaryEntry {
  id?: string;
  original: string;
  corrected: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DictionaryModal: React.FC<DictionaryModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState<DictionaryEntry>({
    original: '',
    corrected: '',
    description: '',
    category: '一般'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // MVP除外: 辞書機能は開発中
  const isFeatureDisabled = !isFeatureEnabled('dictionaryFunction');
  const showDevTag = shouldShowDevelopmentTag('dictionaryFunction');

  // 辞書エントリの取得
  const fetchEntries = async () => {
    if (isFeatureDisabled) {
      console.warn('🚧 Dictionary function disabled in MVP mode');
      return;
    }
    
    try {
      const response = await window.electronAPI.dictionary.list();
      if (response.success && response.data) {
        setEntries(response.data);
      } else {
        console.error('Failed to fetch dictionary entries:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch dictionary entries:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEntries();
    }
  }, [isOpen]);

  // エントリの追加
  const handleAddEntry = async () => {
    if (!newEntry.original || !newEntry.corrected) {
      alert('誤字と修正後の両方を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await window.electronAPI.dictionary.upsert(newEntry);
      if (response.success) {
        await fetchEntries();
        setNewEntry({
          original: '',
          corrected: '',
          description: '',
          category: '一般'
        });
      } else {
        alert(`エントリの追加に失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('エントリの追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // エントリの更新
  const handleUpdateEntry = async (id: string, updatedEntry: DictionaryEntry) => {
    setIsLoading(true);
    try {
      const response = await window.electronAPI.dictionary.upsert(updatedEntry);
      if (response.success) {
        await fetchEntries();
        setEditingId(null);
      } else {
        alert(`エントリの更新に失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      alert('エントリの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // エントリの削除
  const handleDeleteEntry = async (id: string) => {
    if (!confirm('このエントリを削除しますか？')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await window.electronAPI.dictionary.delete(id);
      if (response.success) {
        await fetchEntries();
      } else {
        alert(`エントリの削除に失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('エントリの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 有効/無効の切り替え
  const handleToggleActive = async (id: string, isActive: boolean) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      await handleUpdateEntry(id, { ...entry, is_active: !isActive });
    }
  };

  // エクスポート（JSON形式）
  const exportDictionaryJSON = async () => {
    try {
      const response = await window.electronAPI.dictionary.export();
      if (response.success && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dictionary_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('辞書をJSON形式でエクスポートしました');
      } else {
        alert(`JSONエクスポートに失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error('JSON export failed:', error);
      alert('JSONエクスポートに失敗しました');
    }
  };

  // エクスポート（テキスト形式）
  const exportDictionaryText = async () => {
    try {
      const response = await window.electronAPI.dictionary.export();
      if (response.success && response.data) {
        const entries = response.data;
        
        // テキスト形式に変換（TSVフォーマット）
        let textContent = '誤字\t修正後\t説明\tカテゴリ\n'; // ヘッダー
        
        entries.forEach((entry: DictionaryEntry) => {
          textContent += `${entry.original}\t${entry.corrected}\t${entry.description || ''}\t${entry.category || '一般'}\n`;
        });
        
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dictionary_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        alert('辞書をテキスト形式でエクスポートしました');
      } else {
        alert(`テキストエクスポートに失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error('Text export failed:', error);
      alert('テキストエクスポートに失敗しました');
    }
  };

  // インポート（JSON/テキスト対応）
  const importDictionary = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        let entries: DictionaryEntry[] = [];
        
        if (file.name.endsWith('.json')) {
          // JSONファイルの処理
          const jsonData = JSON.parse(fileContent);
          entries = Array.isArray(jsonData) ? jsonData : [jsonData];
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.tsv')) {
          // テキストファイルの処理（TSV形式）
          const lines = fileContent.split('\n').filter(line => line.trim());
          
          // ヘッダーをスキップ（最初の行がヘッダーと思われる場合）
          const startIndex = lines[0] && (lines[0].includes('誤字') || lines[0].includes('original')) ? 1 : 0;
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split('\t');
            
            if (parts.length >= 2) {
              entries.push({
                original: parts[0].trim(),
                corrected: parts[1].trim(),
                description: parts[2] ? parts[2].trim() : '',
                category: parts[3] ? parts[3].trim() : '一般'
              });
            }
          }
        } else {
          throw new Error('サポートされていないファイル形式です。JSON、TXT、TSVファイルのみサポートしています。');
        }
        
        if (entries.length === 0) {
          throw new Error('インポートするエントリが見つかりませんでした。');
        }
        
        const response = await window.electronAPI.dictionary.import({
          entries: entries,
          overwrite: true
        });
        
        if (response.success && response.data) {
          await fetchEntries();
          alert(`辞書をインポートしました（${response.data.imported}件）`);
        } else {
          throw new Error(response.error || '不明なエラー');
        }
      } catch (error) {
        console.error('インポートエラー:', error);
        alert(`インポートに失敗しました: ${error instanceof Error ? error.message : error}`);
      }
    };
    reader.readAsText(file);
    
    // ファイル入力をリセット
    event.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-book"></i> カスタム辞書管理
            {showDevTag && <span className="dev-tag">[開発中]</span>}
          </h2>
          <div className="header-actions">
            <div className="export-group">
              <button onClick={exportDictionaryJSON} className="export-btn" title="JSON形式でエクスポート">
                <i className="fas fa-file-code"></i> JSON
              </button>
              <button onClick={exportDictionaryText} className="export-btn" title="テキスト形式でエクスポート">
                <i className="fas fa-file-alt"></i> TXT
              </button>
            </div>
            <label className="import-btn" title="インポート（JSON/TXT/TSV対応）">
              <i className="fas fa-upload"></i>
              <input type="file" accept=".json,.txt,.tsv" onChange={importDictionary} style={{ display: 'none' }} />
            </label>
            <button className="modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* 開発中メッセージ */}
          {isFeatureDisabled && (
            <div className="development-notice">
              <div className="dev-message">
                <i className="fas fa-tools"></i>
                <h3>機能開発中</h3>
                <p>カスタム辞書機能は現在開発中です。MVP版では無効化されています。</p>
                <p>将来のバージョンで利用可能になる予定です。</p>
              </div>
            </div>
          )}

          {/* 新規エントリ追加フォーム */}
          <div className={`add-entry-form ${isFeatureDisabled ? 'disabled' : ''}`}>
            <h3>新規エントリ追加</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>誤字・誤用</label>
                <input
                  type="text"
                  value={newEntry.original}
                  onChange={(e) => setNewEntry({ ...newEntry, original: e.target.value })}
                  placeholder="例: 会儀"
                />
              </div>
              <div className="form-group">
                <label>修正後</label>
                <input
                  type="text"
                  value={newEntry.corrected}
                  onChange={(e) => setNewEntry({ ...newEntry, corrected: e.target.value })}
                  placeholder="例: 会議"
                />
              </div>
              <div className="form-group">
                <label>カテゴリー</label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                >
                  <option value="一般">一般</option>
                  <option value="専門用語">専門用語</option>
                  <option value="固有名詞">固有名詞</option>
                  <option value="フィラー">フィラー</option>
                </select>
              </div>
              <div className="form-group">
                <label>説明（任意）</label>
                <input
                  type="text"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="例: 音声認識の誤認識"
                />
              </div>
            </div>
            <button
              className="add-btn"
              onClick={handleAddEntry}
              disabled={isLoading || isFeatureDisabled}
            >
              <i className="fas fa-plus"></i> {isFeatureDisabled ? '追加 [無効]' : '追加'}
            </button>
          </div>

          {/* エントリ一覧 */}
          <div className="entries-list">
            <h3>登録済みエントリ ({entries.length}件)</h3>
            <div className="entries-table">
              <table>
                <thead>
                  <tr>
                    <th>有効</th>
                    <th>誤字・誤用</th>
                    <th>修正後</th>
                    <th>カテゴリー</th>
                    <th>説明</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className={entry.is_active === false ? 'inactive' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={entry.is_active !== false}
                          onChange={() => handleToggleActive(entry.id!, entry.is_active !== false)}
                        />
                      </td>
                      <td>
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={entry.original}
                            onChange={(e) => {
                              const updated = { ...entry, original: e.target.value };
                              setEntries(entries.map(e => e.id === entry.id ? updated : e));
                            }}
                          />
                        ) : (
                          entry.original
                        )}
                      </td>
                      <td>
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={entry.corrected}
                            onChange={(e) => {
                              const updated = { ...entry, corrected: e.target.value };
                              setEntries(entries.map(e => e.id === entry.id ? updated : e));
                            }}
                          />
                        ) : (
                          entry.corrected
                        )}
                      </td>
                      <td>{entry.category || '一般'}</td>
                      <td>{entry.description || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          {editingId === entry.id ? (
                            <>
                              <button
                                className="save-btn"
                                onClick={() => handleUpdateEntry(entry.id!, entry)}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() => {
                                  setEditingId(null);
                                  fetchEntries();
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="edit-btn"
                                onClick={() => setEditingId(entry.id!)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteEntry(entry.id!)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entries.length === 0 && (
                <div className="no-entries">
                  <p>まだエントリがありません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default DictionaryModal;