/**
 * VTT話者名クリーンアップ機能のテストスクリプト
 */

const fs = require('fs');
const path = require('path');

// VTTパーサーのロジックを移植
function cleanSpeakerName(rawSpeaker) {
  if (!rawSpeaker) return '';
  
  let cleaned = rawSpeaker.trim();
  
  // @記号で始まる場合はそのまま返す（システム話者）
  if (cleaned.startsWith('@')) {
    return cleaned;
  }
  
  // 括弧とその中身を除去 (Tsuboi, Yuka) など
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // 行末の数字やハイフンを除去
  cleaned = cleaned.replace(/[-\d]+$/, '');
  
  // 余分な空白を除去
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

function parseVtt(content) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const entries = [];
  let i = 0;
  
  // Skip header lines until first timing line
  while (i < lines.length && !lines[i].includes("-->")) i++;
  
  while (i < lines.length) {
    const tline = lines[i++] || "";
    if (!tline.includes("-->")) continue;
    
    const [start, endPart] = tline.split(/-->\s*/);
    const end = (endPart || '').trim().split(' ')[0];
    const textLines = [];
    
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i++]);
    }
    // skip blank separator
    while (i < lines.length && lines[i].trim() === "") i++;

    const full = textLines.join(" ").trim();
    // Parse speaker from VTT voice tags: <v Speaker>text</v> or "Speaker: text"
    let speaker;
    let text = full;

    // Handle <v Speaker>text</v> format
    const voiceTagMatch = full.match(/^<v\s+([^>]+)>(.+)<\/v>$/);
    if (voiceTagMatch) {
      speaker = cleanSpeakerName(voiceTagMatch[1]);
      text = voiceTagMatch[2].trim();
    } else {
      // Handle "Speaker: text" format
      const colonIdx = full.indexOf(": ");
      if (colonIdx > 0 && colonIdx < 40) {
        speaker = cleanSpeakerName(full.slice(0, colonIdx));
        text = full.slice(colonIdx + 1).trim();
      }
    }
    
    if (full) {
      entries.push({ 
        start: (start || '').trim(), 
        end: end || '', 
        speaker, 
        text,
        original: full
      });
    }
  }
  return entries;
}

function extractFormatted(content) {
  const entries = parseVtt(content);
  return entries
    .map(e => (e.speaker ? `${e.speaker}: ${e.text}` : e.text))
    .join("\n");
}

// テスト実行
console.log('🧪 VTT話者名クリーンアップテスト開始\n');

try {
  // テスト用VTTファイルを読み込み
  const vttPath = './test-vtt-speaker-cleanup.vtt';
  if (!fs.existsSync(vttPath)) {
    console.error('❌ テストファイルが見つかりません:', vttPath);
    process.exit(1);
  }

  const vttContent = fs.readFileSync(vttPath, 'utf-8');
  console.log('📁 VTTファイル読み込み完了:', vttPath);
  
  // VTTパース実行
  const entries = parseVtt(vttContent);
  console.log(`📊 解析結果: ${entries.length} エントリー\n`);
  
  // 話者名のクリーンアップ結果を表示
  console.log('🔍 話者名クリーンアップ結果:');
  console.log('=' .repeat(60));
  
  const speakerStats = {};
  let processedCount = 0;
  
  entries.slice(0, 10).forEach((entry, index) => {
    if (entry.speaker) {
      // オリジナルから話者名を抽出
      let originalSpeaker = '';
      const voiceMatch = entry.original.match(/^<v\s+([^>]+)>/);
      if (voiceMatch) {
        originalSpeaker = voiceMatch[1];
      }
      
      console.log(`${index + 1}. 元の話者: "${originalSpeaker}"`);
      console.log(`   → クリーン: "${entry.speaker}"`);
      console.log(`   テキスト: "${entry.text.substring(0, 50)}..."`);
      console.log('');
      
      // 統計情報
      if (!speakerStats[entry.speaker]) {
        speakerStats[entry.speaker] = 0;
      }
      speakerStats[entry.speaker]++;
      processedCount++;
    }
  });
  
  // 話者統計
  console.log('📈 話者統計:');
  Object.entries(speakerStats).forEach(([speaker, count]) => {
    console.log(`  - ${speaker}: ${count}回`);
  });
  
  // フォーマット済みテキスト生成テスト
  const formatted = extractFormatted(vttContent);
  const formattedLines = formatted.split('\n');
  
  console.log(`\n📝 フォーマット済みテキスト (最初の10行):`);
  console.log('=' .repeat(60));
  formattedLines.slice(0, 10).forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
  
  console.log(`\n✅ テスト完了！`);
  console.log(`   - 総エントリー数: ${entries.length}`);
  console.log(`   - 話者付きエントリー: ${processedCount}`);
  console.log(`   - ユニーク話者数: ${Object.keys(speakerStats).length}`);
  console.log(`   - フォーマット済み行数: ${formattedLines.length}`);

} catch (error) {
  console.error('❌ テスト実行エラー:', error.message);
  console.error(error.stack);
  process.exit(1);
}