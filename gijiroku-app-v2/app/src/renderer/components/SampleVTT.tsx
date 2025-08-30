import React from 'react';
import './SampleVTT.css';

const SampleVTT: React.FC = () => {
  const sampleVTTContent = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
田中: おはようございます。きょうの会儀を始めさせてもらいます。

2
00:00:05.000 --> 00:00:12.000
佐藤: よろしくお願いします。まず議だいの確認からお願いします。

3
00:00:12.000 --> 00:00:18.000
田中: 承知いたしました。えー、本日は3つのぎだいがあります。

4
00:00:18.000 --> 00:00:25.000
佐藤: ありがとうございます。それでは1つめのぎだいから進めてください。

5
00:00:25.000 --> 00:00:32.000
田中: 1つ目は、新しいプロダクトの件について話し合います。

6
00:00:32.000 --> 00:00:38.000
佐藤: はい。開発スケジュールはどうなっていますでしょうか。

7
00:00:38.000 --> 00:00:45.000
田中: 来月の中旬には、プロトタイプを完成させる予定です。

8
00:00:45.000 --> 00:00:52.000
佐藤: 分かりました。テストも並行して進めていきましょう。`;

  const downloadSampleVTT = () => {
    const blob = new Blob([sampleVTTContent], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_meeting.vtt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySampleVTT = () => {
    navigator.clipboard.writeText(sampleVTTContent).then(() => {
      // 成功時の処理は親コンポーネントで行う
    });
  };

  return (
    <div className="sample-vtt">
      <div className="sample-header">
        <h3>📄 サンプルVTTファイル</h3>
        <p>テスト用のサンプルファイルをダウンロードできます</p>
      </div>
      
      <div className="sample-content">
        <div className="sample-preview">
          <h4>プレビュー</h4>
          <div className="vtt-preview">
            <pre>{sampleVTTContent.split('\n').slice(0, 10).join('\n')}...</pre>
          </div>
          
          <div className="sample-features">
            <h5>このサンプルに含まれる誤字・修正候補：</h5>
            <ul>
              <li>「会儀」→「会議」</li>
              <li>「議だい」→「議題」</li>
              <li>「ぎだい」→「議題」</li>
              <li>「きょう」→「今日」</li>
              <li>フィラー「えー」の除去</li>
            </ul>
          </div>
        </div>
        
        <div className="sample-actions">
          <button className="download-btn" onClick={downloadSampleVTT}>
            📥 VTTファイルをダウンロード
          </button>
          
          <button className="copy-btn" onClick={copySampleVTT}>
            📋 テキストをコピー
          </button>
          
          <div className="usage-tip">
            <strong>使い方：</strong>
            <ol>
              <li>「VTTファイルをダウンロード」をクリック</li>
              <li>保存されたファイルを上記のドロップエリアにドラッグ</li>
              <li>自動修正結果を確認</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleVTT;