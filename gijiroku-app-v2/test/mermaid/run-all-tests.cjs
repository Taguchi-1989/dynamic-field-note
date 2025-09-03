/**
 * Mermaid機能 総合テストランナー
 * Phase 1-3 の全テストを実行し、投入準備状況を判定
 */

const { spawn } = require('child_process');
const path = require('path');

async function buildProject() {
  console.log('🔧 Building project for tests...');
  
  return new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

async function runElectronTest(testFile) {
  console.log(`\n🧪 Running ${testFile}...`);
  
  return new Promise((resolve) => {
    const electronPath = path.join(__dirname, '../../node_modules/.bin/electron');
    const test = spawn(electronPath, [testFile], {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
    
    test.on('close', (code) => {
      const success = code === 0;
      console.log(`${success ? '✅' : '❌'} ${testFile} ${success ? 'PASSED' : 'FAILED'}`);
      resolve(success);
    });
  });
}

async function checkExistingFeatures() {
  console.log('\n🛡️ === Existing Features Verification ===');
  
  const checks = [
    { name: 'API Keys Service', check: () => checkService('AIProcessingService') },
    { name: 'PDF Generation', check: () => checkService('PdfGenerationService') },
    { name: 'Template Management', check: () => checkService('TemplateHandler') },
    { name: 'Chunking Processing', check: () => checkService('ChunkingService') }
  ];
  
  let passedChecks = 0;
  
  for (const { name, check } of checks) {
    try {
      const exists = await check();
      console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'AVAILABLE' : 'MISSING'}`);
      if (exists) passedChecks++;
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
    }
  }
  
  console.log(`📊 Existing features: ${passedChecks}/${checks.length} available`);
  return passedChecks === checks.length;
}

async function checkService(serviceName) {
  const fs = require('fs/promises');
  const servicePath = path.join(__dirname, `../../dist-electron/main/services/${serviceName}.js`);
  
  try {
    await fs.access(servicePath);
    return true;
  } catch {
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 === Mermaid Feature Comprehensive Test Suite ===');
  console.log('GPT-5レビュー準拠: 安全実装・既存機能保護検証\n');
  
  try {
    // Step 1: プロジェクトビルド
    await buildProject();
    
    // Step 2: 既存機能確認
    const existingFeaturesOk = await checkExistingFeatures();
    
    // Step 3: Mermaid単体テスト
    const workerTestPassed = await runElectronTest('./test/mermaid/mermaid-worker.test.js');
    
    // Step 4: Mermaid統合テスト
    const integrationTestPassed = await runElectronTest('./test/mermaid/mermaid-integration.test.js');
    
    // 最終判定
    console.log('\n📋 === Final Assessment ===');
    
    const results = {
      existingFeatures: existingFeaturesOk,
      workerTests: workerTestPassed,
      integrationTests: integrationTestPassed
    };
    
    console.log(`🛡️ Existing features: ${results.existingFeatures ? 'PROTECTED' : 'AT RISK'}`);
    console.log(`🧪 Worker tests: ${results.workerTests ? 'PASSED' : 'FAILED'}`);
    console.log(`🔗 Integration tests: ${results.integrationTests ? 'PASSED' : 'FAILED'}`);
    
    // 投入判断
    const allPassed = Object.values(results).every(result => result);
    const readyForDeployment = allPassed;
    
    console.log('\n🎯 === Deployment Readiness ===');
    console.log(`📊 Overall status: ${readyForDeployment ? 'READY' : 'NOT READY'}`);
    
    if (readyForDeployment) {
      console.log('✅ ALL TESTS PASSED - Mermaid feature is ready for deployment');
      console.log('🚀 Next steps:');
      console.log('   1. Set FEATURE_FLAGS.mermaidSupport = true');
      console.log('   2. Test in development environment');
      console.log('   3. Create production build');
      console.log('   4. Deploy with confidence');
    } else {
      console.log('❌ TESTS FAILED - DO NOT DEPLOY');
      console.log('🔧 Required fixes:');
      
      if (!results.existingFeatures) {
        console.log('   • Fix existing feature dependencies');
      }
      if (!results.workerTests) {
        console.log('   • Fix Mermaid worker issues');
      }
      if (!results.integrationTests) {
        console.log('   • Fix integration issues');
      }
    }
    
    return readyForDeployment;
    
  } catch (error) {
    console.error('💥 Test suite execution failed:', error);
    console.log('\n❌ CRITICAL ERROR - DO NOT DEPLOY');
    return false;
  }
}

// テスト実行
if (require.main === module) {
  runAllTests().then(success => {
    console.log(`\n🏁 Comprehensive test suite ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests };