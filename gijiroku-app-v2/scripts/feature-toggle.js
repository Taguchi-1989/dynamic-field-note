#!/usr/bin/env node
/**
 * Feature Flag管理スクリプト
 * MVP vs 拡張機能の切り替え・確認
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const FEATURE_FLAGS_PATH = path.join(__dirname, '../app/src/shared/feature-flags.ts');

function readFeatureFlags() {
  if (!fs.existsSync(FEATURE_FLAGS_PATH)) {
    log('❌ feature-flags.ts が見つかりません', 'red');
    return null;
  }

  const content = fs.readFileSync(FEATURE_FLAGS_PATH, 'utf8');
  
  // 簡易的にフラグを抽出（本来はAST解析が理想）
  const flags = {};
  const flagMatches = content.match(/(\w+):\s*(true|false)/g);
  
  if (flagMatches) {
    flagMatches.forEach(match => {
      const [, key, value] = match.match(/(\w+):\s*(true|false)/);
      flags[key] = value === 'true';
    });
  }
  
  return flags;
}

function updateFeatureFlag(flagName, newValue) {
  if (!fs.existsSync(FEATURE_FLAGS_PATH)) {
    log('❌ feature-flags.ts が見つかりません', 'red');
    return false;
  }

  let content = fs.readFileSync(FEATURE_FLAGS_PATH, 'utf8');
  const regex = new RegExp(`(${flagName}:\\s*)(true|false)`, 'g');
  
  if (!regex.test(content)) {
    log(`❌ フラグ '${flagName}' が見つかりません`, 'red');
    return false;
  }

  content = content.replace(regex, `$1${newValue}`);
  fs.writeFileSync(FEATURE_FLAGS_PATH, content, 'utf8');
  
  log(`✅ ${flagName}: ${newValue}`, 'green');
  return true;
}

function showFeatureStatus() {
  const flags = readFeatureFlags();
  if (!flags) return;

  log('🎯 現在のFeature Flags状態:', 'bold');
  log('=' .repeat(40), 'blue');

  // MVP機能
  log('\n🚀 MVP機能 (常時有効):', 'green');
  const mvpFeatures = ['apiKeys', 'pdfGeneration', 'customPrompts', 'chunkingProcessing', 'retryExecution'];
  mvpFeatures.forEach(feature => {
    if (feature in flags) {
      log(`  ${feature}: ${flags[feature] ? '✅' : '❌'}`, flags[feature] ? 'green' : 'red');
    }
  });

  // 高度機能
  log('\n🔧 高度機能 (開発中):', 'yellow');
  const advancedFeatures = ['searchFunction', 'dictionaryFunction', 'logFunction', 'syncFunction'];
  advancedFeatures.forEach(feature => {
    if (feature in flags) {
      log(`  ${feature}: ${flags[feature] ? '✅ 有効' : '🚧 開発中'}`, flags[feature] ? 'green' : 'yellow');
    }
  });

  // 拡張機能
  log('\n📈 拡張機能 (部分実装):', 'blue');
  const extensionFeatures = ['imageSupport', 'latexSupport', 'mermaidSupport'];
  extensionFeatures.forEach(feature => {
    if (feature in flags) {
      log(`  ${feature}: ${flags[feature] ? '✅ 有効' : '🔴 無効'}`, flags[feature] ? 'green' : 'red');
    }
  });
}

function setMVPMode() {
  log('🚀 MVP開発モードに切り替え中...', 'blue');
  
  // 高度機能を無効化
  const advancedFeatures = ['searchFunction', 'dictionaryFunction', 'logFunction', 'syncFunction'];
  advancedFeatures.forEach(feature => {
    updateFeatureFlag(feature, false);
  });

  // 拡張機能を無効化
  const extensionFeatures = ['imageSupport', 'latexSupport', 'mermaidSupport'];
  extensionFeatures.forEach(feature => {
    updateFeatureFlag(feature, false);
  });

  log('\n✅ MVP開発モードが有効になりました', 'green');
  log('有効な機能: APIキー・PDF・プロンプト・分割・再実行のみ', 'green');
}

function setFullDevMode() {
  log('🔧 フル開発モードに切り替え中...', 'blue');
  
  // 高度機能を有効化（開発・テスト用）
  const advancedFeatures = ['searchFunction', 'dictionaryFunction', 'logFunction', 'syncFunction'];
  advancedFeatures.forEach(feature => {
    updateFeatureFlag(feature, true);
  });

  log('\n✅ フル開発モードが有効になりました', 'green');
  log('注意: 高度機能は開発中のため不安定な場合があります', 'yellow');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showFeatureStatus();
    log('\n使用方法:', 'blue');
    log('  node scripts/feature-toggle.js status     # 現在の状態表示', 'reset');
    log('  node scripts/feature-toggle.js mvp       # MVP開発モード', 'reset');
    log('  node scripts/feature-toggle.js full      # フル開発モード', 'reset');
    log('  node scripts/feature-toggle.js <flag> <true|false>  # 個別設定', 'reset');
    return;
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'status':
      showFeatureStatus();
      break;
    
    case 'mvp':
      setMVPMode();
      break;
    
    case 'full':
      setFullDevMode();
      break;
    
    default:
      if (args.length === 2) {
        const flagName = args[0];
        const flagValue = args[1].toLowerCase() === 'true';
        updateFeatureFlag(flagName, flagValue);
      } else {
        log('❌ 不正なコマンドです', 'red');
        log('使用方法: node scripts/feature-toggle.js <command>', 'yellow');
      }
      break;
  }
}

main();