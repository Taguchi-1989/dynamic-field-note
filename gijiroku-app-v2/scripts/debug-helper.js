#!/usr/bin/env node
/**
 * デバッグ支援スクリプト
 * MVP開発時のデバッグ情報収集・ログ出力・問題特定支援
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getFileInfo(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  } catch {
    return { exists: false };
  }
}

async function checkProcesses() {
  log('\n🔍 Electron プロセス確認:', 'blue');
  try {
    const output = execSync('tasklist /fi "imagename eq electron.exe" /fo csv', { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.includes('electron.exe'));
    
    if (lines.length === 0) {
      log('  ✅ Electronプロセスは実行されていません', 'green');
    } else {
      log(`  ⚠️  ${lines.length}個のElectronプロセスが実行中:`, 'yellow');
      lines.forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const pid = parts[1].replace(/"/g, '');
          log(`    ${index + 1}. PID: ${pid}`, 'dim');
        }
      });
    }
  } catch (error) {
    log('  ❌ プロセス確認に失敗しました', 'red');
  }
}

async function checkBuildFiles() {
  log('\n📦 ビルドファイル確認:', 'blue');
  
  const buildFiles = [
    ['dist/index.html', 'Vite build output'],
    ['dist-electron/main.cjs', 'Main process bundle'],
    ['dist-electron/preload.cjs', 'Preload script'],
    ['package.json', 'Package configuration'],
    ['electron-builder.yml', 'Builder configuration']
  ];

  for (const [filePath, description] of buildFiles) {
    const info = await getFileInfo(filePath);
    if (info.exists) {
      const size = info.isDirectory ? '(directory)' : formatFileSize(info.size);
      const modified = new Date(info.modified).toLocaleString();
      log(`  ✅ ${description}: ${filePath}`, 'green');
      log(`     サイズ: ${size}, 更新: ${modified}`, 'dim');
    } else {
      log(`  ❌ ${description}: ${filePath}`, 'red');
    }
  }
}

async function checkFeatureFlags() {
  log('\n🎯 Feature Flags 確認:', 'blue');
  
  const flagsPath = path.join(__dirname, '../app/src/shared/feature-flags.ts');
  try {
    const content = await fs.promises.readFile(flagsPath, 'utf8');
    
    const flagMatches = content.match(/(\w+):\s*(true|false)/g);
    if (flagMatches) {
      const enabled = flagMatches.filter(match => match.includes('true'));
      const disabled = flagMatches.filter(match => match.includes('false'));
      
      log(`  📊 有効機能: ${enabled.length}個`, 'green');
      enabled.forEach(flag => {
        const [name] = flag.match(/(\w+):/);
        log(`    ✅ ${name.replace(':', '')}`, 'green');
      });
      
      log(`  📊 無効機能: ${disabled.length}個`, 'yellow');
      disabled.slice(0, 5).forEach(flag => {
        const [name] = flag.match(/(\w+):/);
        log(`    🚧 ${name.replace(':', '')}`, 'yellow');
      });
      
      if (disabled.length > 5) {
        log(`    ... 他${disabled.length - 5}個`, 'dim');
      }
    }
  } catch (error) {
    log('  ❌ Feature Flags の読み込みに失敗', 'red');
  }
}

async function checkLogFiles() {
  log('\n📋 ログファイル確認:', 'blue');
  
  const logPaths = [
    'temp-files/',
    'testing/output/',
    path.join(process.env.USERPROFILE || '', 'AppData/Roaming/gijiroku-app-v2/logs/')
  ];

  for (const logPath of logPaths) {
    const info = await getFileInfo(logPath);
    if (info.exists && info.isDirectory) {
      try {
        const files = await fs.promises.readdir(logPath);
        const logFiles = files.filter(f => f.endsWith('.log') || f.endsWith('.json'));
        
        if (logFiles.length > 0) {
          log(`  📁 ${logPath}: ${logFiles.length}ファイル`, 'cyan');
          logFiles.slice(0, 3).forEach(file => {
            log(`    - ${file}`, 'dim');
          });
          if (logFiles.length > 3) {
            log(`    ... 他${logFiles.length - 3}ファイル`, 'dim');
          }
        } else {
          log(`  📁 ${logPath}: 空`, 'dim');
        }
      } catch {
        log(`  ❌ ${logPath}: 読み込み失敗`, 'red');
      }
    } else {
      log(`  ❌ ${logPath}: 存在しません`, 'red');
    }
  }
}

async function checkDependencies() {
  log('\n📚 依存関係確認:', 'blue');
  
  try {
    // Check for critical dependencies
    const criticalDeps = [
      'electron',
      'react',
      'react-dom', 
      'vite',
      'typescript'
    ];

    const packagePath = path.join(__dirname, '../package.json');
    const packageContent = await fs.promises.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    criticalDeps.forEach(dep => {
      if (allDeps[dep]) {
        log(`  ✅ ${dep}: ${allDeps[dep]}`, 'green');
      } else {
        log(`  ❌ ${dep}: 未インストール`, 'red');
      }
    });

    // Check node_modules
    const nodeModulesInfo = await getFileInfo('node_modules');
    if (nodeModulesInfo.exists) {
      log('  ✅ node_modules: インストール済み', 'green');
    } else {
      log('  ❌ node_modules: npm install が必要', 'red');
    }

  } catch (error) {
    log('  ❌ 依存関係の確認に失敗', 'red');
  }
}

function printHelp() {
  log('\n🛠️  デバッグヘルパー - 使用方法:', 'bold');
  log('=' .repeat(40), 'blue');
  log('  node scripts/debug-helper.js [command]', 'reset');
  log('', 'reset');
  log('📋 利用可能なコマンド:', 'blue');
  log('  all        - 全チェック実行 (デフォルト)', 'reset');
  log('  processes  - Electronプロセス確認', 'reset');
  log('  build      - ビルドファイル確認', 'reset');
  log('  features   - Feature Flags確認', 'reset');
  log('  logs       - ログファイル確認', 'reset');
  log('  deps       - 依存関係確認', 'reset');
  log('  help       - このヘルプを表示', 'reset');
  log('', 'reset');
  log('💡 例:', 'blue');
  log('  node scripts/debug-helper.js build', 'dim');
  log('  node scripts/debug-helper.js features', 'dim');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  log('🚀 議事録アプリ v2 - デバッグヘルパー', 'bold');
  log('=' .repeat(50), 'blue');

  switch (command) {
    case 'processes':
      await checkProcesses();
      break;
    case 'build':
      await checkBuildFiles();
      break;
    case 'features':
      await checkFeatureFlags();
      break;
    case 'logs':
      await checkLogFiles();
      break;
    case 'deps':
      await checkDependencies();
      break;
    case 'help':
      printHelp();
      break;
    case 'all':
    default:
      await checkProcesses();
      await checkBuildFiles();
      await checkFeatureFlags();
      await checkLogFiles();
      await checkDependencies();
      
      log('\n🎯 デバッグヘルパー完了', 'bold');
      log('問題が見つかった場合は、該当するコマンドで詳細確認してください', 'dim');
      break;
  }
}

main().catch(console.error);