import React, { useState, useEffect } from 'react';
import { LocalStorageManager } from '../services/storage/localStorageManager';
import type { DocumentRecord, ConflictRecord } from '../services/storage/database';

const DataSyncTester: React.FC = () => {
  const [storageManager] = useState(() => new LocalStorageManager());
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [stats, setStats] = useState({ documentsCount: 0, conflictsCount: 0, unresolvedConflictsCount: 0 });
  const [testResults, setTestResults] = useState<string[]>([]);

  // データを更新
  const refreshData = async () => {
    const docs = await storageManager.getAllDocuments();
    const unresolvedConflicts = await storageManager.getUnresolvedConflicts();
    const statistics = await storageManager.getStats();
    
    setDocuments(docs);
    setConflicts(unresolvedConflicts);
    setStats(statistics);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // テストログ追加
  const addTestLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // テスト1: 基本的なCRUD操作
  const testBasicOperations = async () => {
    try {
      addTestLog('🧪 Test 1: Basic CRUD operations');
      
      // ドキュメント作成
      const docId = await storageManager.saveDocument({
        title: 'Test Document 1',
        content: 'Initial content for testing',
        remoteId: 'remote-123',
        conflictStatus: 'none'
      });
      addTestLog(`✅ Created document with ID: ${docId}`);
      
      // ドキュメント更新
      await storageManager.updateDocument(docId, {
        content: 'Updated content for testing'
      });
      addTestLog(`✅ Updated document ${docId}`);
      
      // ドキュメント取得
      const retrieved = await storageManager.getDocument(docId);
      if (retrieved) {
        addTestLog(`✅ Retrieved document: ${retrieved.title}`);
      }
      
      await refreshData();
    } catch (error) {
      addTestLog(`❌ Test 1 failed: ${error}`);
    }
  };

  // テスト2: NEWEST_WINS競合解決
  const testNewestWinsConflict = async () => {
    try {
      addTestLog('🧪 Test 2: NEWEST_WINS conflict resolution');
      
      // ローカルドキュメント作成
      const docId = await storageManager.saveDocument({
        title: 'Conflict Test Doc',
        content: 'Local content',
        remoteId: 'conflict-test-123',
        conflictStatus: 'none'
      });
      
      const localDoc = await storageManager.getDocument(docId);
      if (!localDoc) throw new Error('Local document not found');
      
      // リモートドキュメント（より新しい）をシミュレート
      const remoteDoc = {
        content: 'Remote content (newer)',
        updatedAt: new Date(Date.now() + 5000), // 5秒後
        title: 'Conflict Test Doc (Remote)',
        remoteId: 'conflict-test-123'
      };
      
      // NEWEST_WINS競合解決
      const resolved = await storageManager.resolveConflictNewestWins(localDoc, remoteDoc);
      addTestLog(`✅ Conflict resolved: Remote won (${resolved.content})`);
      
      await refreshData();
    } catch (error) {
      addTestLog(`❌ Test 2 failed: ${error}`);
    }
  };

  // テスト3: MANUAL競合解決
  const testManualConflict = async () => {
    try {
      addTestLog('🧪 Test 3: MANUAL conflict resolution');
      
      // ローカルドキュメント作成
      const docId = await storageManager.saveDocument({
        title: 'Manual Conflict Test',
        content: 'Local content for manual resolution',
        remoteId: 'manual-test-456',
        conflictStatus: 'none'
      });
      
      // 手動解決が必要な競合を作成
      const conflictId = await storageManager.saveConflictForManualResolution(
        docId,
        'Local content for manual resolution',
        'Remote content for manual resolution',
        new Date(),
        new Date(Date.now() + 1000)
      );
      addTestLog(`✅ Manual conflict created: ${conflictId}`);
      
      // 手動で解決
      await storageManager.resolveConflictManually(
        conflictId,
        'Manually merged content: Local + Remote'
      );
      addTestLog(`✅ Manual conflict resolved: ${conflictId}`);
      
      await refreshData();
    } catch (error) {
      addTestLog(`❌ Test 3 failed: ${error}`);
    }
  };

  // 全データクリア
  const clearAllData = async () => {
    await storageManager.clearAllData();
    addTestLog('🗑️ All data cleared');
    await refreshData();
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>📊 PoC G2: データ同期テスター</h1>
      
      {/* 統計情報 */}
      <div style={{ background: '#f5f5f5', padding: '10px', marginBottom: '20px' }}>
        <h3>📈 Database Stats</h3>
        <p>Documents: {stats.documentsCount}</p>
        <p>Total Conflicts: {stats.conflictsCount}</p>
        <p>Unresolved Conflicts: {stats.unresolvedConflictsCount}</p>
      </div>

      {/* テストボタン */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testBasicOperations} style={{ margin: '5px', padding: '10px' }}>
          🧪 Test 1: Basic CRUD
        </button>
        <button onClick={testNewestWinsConflict} style={{ margin: '5px', padding: '10px' }}>
          🧪 Test 2: NEWEST_WINS
        </button>
        <button onClick={testManualConflict} style={{ margin: '5px', padding: '10px' }}>
          🧪 Test 3: MANUAL Resolution
        </button>
        <button onClick={clearAllData} style={{ margin: '5px', padding: '10px', background: '#ff6b6b' }}>
          🗑️ Clear All Data
        </button>
      </div>

      {/* テスト結果 */}
      <div style={{ background: '#2d2d2d', color: '#fff', padding: '15px', marginBottom: '20px', height: '200px', overflow: 'auto' }}>
        <h3>📋 Test Results</h3>
        {testResults.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {result}
          </div>
        ))}
      </div>

      {/* ドキュメント一覧 */}
      <div style={{ background: '#f9f9f9', padding: '15px', marginBottom: '20px' }}>
        <h3>📄 Documents ({documents.length})</h3>
        {documents.map((doc) => (
          <div key={doc.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
            <strong>{doc.title}</strong><br />
            <small>ID: {doc.id} | Status: {doc.conflictStatus} | Version: {doc.version}</small><br />
            <small>Updated: {doc.updatedAt.toLocaleString()}</small><br />
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
              {doc.content.substring(0, 100)}...
            </div>
          </div>
        ))}
      </div>

      {/* 競合一覧 */}
      <div style={{ background: '#fff3cd', padding: '15px' }}>
        <h3>⚠️ Unresolved Conflicts ({conflicts.length})</h3>
        {conflicts.map((conflict) => (
          <div key={conflict.id} style={{ border: '1px solid #ffc107', padding: '10px', margin: '5px 0' }}>
            <strong>Conflict ID: {conflict.id}</strong><br />
            <small>Document ID: {conflict.documentId} | Strategy: {conflict.resolutionStrategy}</small><br />
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <strong>Local:</strong><br />
                <small>{conflict.localContent}</small>
              </div>
              <div style={{ flex: 1 }}>
                <strong>Remote:</strong><br />
                <small>{conflict.remoteContent}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataSyncTester;