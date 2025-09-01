#!/usr/bin/env node
/**
 * 開発環境セットアップスクリプト
 * MVP開発に必要な環境確認・セットアップを実行
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

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

async function checkFile(filePath, description) {
  try {
    await fs.access(filePath);
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } catch {
    log(`❌ ${description}: ${filePath}`, 'red');
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 議事録アプリ v2 - MVP開発環境チェック', 'bold');
  log('=' .repeat(50), 'blue');

  // 基本ファイル確認
  log('\n📁 基本ファイル確認:', 'blue');
  const requiredFiles = [
    ['package.json', 'Package configuration'],
    ['tsconfig.json', 'TypeScript configuration'],
    ['vite.config.ts', 'Vite configuration'],
    ['electron-builder.yml', 'Electron Builder configuration']
  ];

  let fileChecks = 0;
  for (const [file, desc] of requiredFiles) {
    if (await checkFile(file, desc)) fileChecks++;
  }

  // コマンド確認
  log('\n⚡ 開発ツール確認:', 'blue');
  const requiredCommands = [
    ['node --version', 'Node.js'],
    ['npm --version', 'npm'],
    ['npx tsc --version', 'TypeScript compiler'],
    ['npx electron --version', 'Electron']
  ];

  let cmdChecks = 0;
  for (const [cmd, desc] of requiredCommands) {
    if (checkCommand(cmd, desc)) cmdChecks++;
  }

  // VSCode設定確認
  log('\n🛠️ VSCode設定確認:', 'blue');
  const vscodeFiles = [
    ['.vscode/settings.json', 'VSCode settings'],
    ['.vscode/extensions.json', 'Recommended extensions'],
    ['.vscode/launch.json', 'Debug configurations'],
    ['.vscode/tasks.json', 'Task configurations']
  ];

  let vscodeChecks = 0;
  for (const [file, desc] of vscodeFiles) {
    if (await checkFile(file, desc)) vscodeChecks++;
  }

  // MVP機能確認
  log('\n🎯 MVP機能フォルダ確認:', 'blue');
  const mvpFolders = [
    ['app/src/main', 'Main process'],
    ['app/src/renderer', 'Renderer process'],
    ['app/src/shared', 'Shared utilities'],
    ['docs', 'Documentation'],
    ['resources', 'Application resources']
  ];

  let mvpChecks = 0;
  for (const [folder, desc] of mvpFolders) {
    if (await checkFile(folder, desc)) mvpChecks++;
  }

  // 結果サマリー
  log('\n📊 チェック結果サマリー:', 'bold');
  log(`基本ファイル: ${fileChecks}/${requiredFiles.length}`, fileChecks === requiredFiles.length ? 'green' : 'yellow');
  log(`開発ツール: ${cmdChecks}/${requiredCommands.length}`, cmdChecks === requiredCommands.length ? 'green' : 'yellow');
  log(`VSCode設定: ${vscodeChecks}/${vscodeFiles.length}`, vscodeChecks === vscodeFiles.length ? 'green' : 'yellow');
  log(`MVP機能: ${mvpChecks}/${mvpFolders.length}`, mvpChecks === mvpFolders.length ? 'green' : 'yellow');

  const totalChecks = fileChecks + cmdChecks + vscodeChecks + mvpChecks;
  const totalMax = requiredFiles.length + requiredCommands.length + vscodeFiles.length + mvpFolders.length;
  const completionRate = Math.round((totalChecks / totalMax) * 100);

  log(`\n🎯 開発環境完成度: ${completionRate}% (${totalChecks}/${totalMax})`, completionRate >= 90 ? 'green' : completionRate >= 70 ? 'yellow' : 'red');

  if (completionRate >= 90) {
    log('\n✅ MVP開発環境の準備が完了しています！', 'green');
    log('次のコマンドで開発を開始できます:', 'blue');
    log('  npm run mvp      # MVP開発モード', 'yellow');
    log('  npm run dev      # 通常開発モード', 'yellow');
    log('  npm run dev:debug # デバッグモード', 'yellow');
  } else {
    log('\n⚠️  開発環境の設定が不完全です', 'yellow');
    log('不足しているファイルや設定を確認してください', 'yellow');
  }

  // 推奨次ステップ
  log('\n🔧 推奨次ステップ:', 'blue');
  log('1. VSCode で推奨拡張機能をインストール', 'reset');
  log('2. npm run info で環境情報を確認', 'reset');
  log('3. npm run mvp でMVP開発モードを開始', 'reset');
  log('4. F5キーでデバッグ実行をテスト', 'reset');

  log('\n🚀 Happy MVP Development!', 'green');
}

main().catch(console.error);