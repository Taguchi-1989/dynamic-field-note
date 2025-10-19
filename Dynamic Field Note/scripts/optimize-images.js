#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

async function optimizeImages() {
  const inputDir = path.join(__dirname, '../assets/images');
  const outputDir = path.join(__dirname, '../assets/optimized');
  const thumbnailDir = path.join(__dirname, '../assets/thumbnails');

  // ディレクトリ作成
  if (!existsSync(outputDir)) {
    await fs.mkdir(outputDir, { recursive: true });
  }
  if (!existsSync(thumbnailDir)) {
    await fs.mkdir(thumbnailDir, { recursive: true });
  }

  // 画像ディレクトリが存在しない場合は作成
  if (!existsSync(inputDir)) {
    console.log('📁 Creating assets/images directory...');
    await fs.mkdir(inputDir, { recursive: true });
    console.log('ℹ️  No images to optimize. Add images to assets/images/');
    return;
  }

  const images = await fs.readdir(inputDir);
  const imageFiles = images.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  if (imageFiles.length === 0) {
    console.log('ℹ️  No images found in assets/images/');
    console.log('💡 Add .jpg, .jpeg, or .png files to optimize them');
    return;
  }

  console.log(`📸 Optimizing ${imageFiles.length} images...`);

  for (const image of imageFiles) {
    const inputPath = path.join(inputDir, image);
    const baseName = image.replace(/\.\w+$/, '');

    try {
      // WebP形式に変換（オリジナルサイズ、最大1920x1080）
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toFile(path.join(outputDir, `${baseName}.webp`));

      // サムネイル生成（200x150）
      await sharp(inputPath)
        .webp({ quality: 60 })
        .resize(200, 150, { fit: 'cover' })
        .toFile(path.join(thumbnailDir, `${baseName}_thumb.webp`));

      console.log(`  ✅ ${image} -> ${baseName}.webp`);
    } catch (error) {
      console.error(`  ❌ Failed to optimize ${image}:`, error.message);
    }
  }

  console.log('\n✨ Image optimization complete!');
  console.log(`📂 Optimized: ${outputDir}`);
  console.log(`📂 Thumbnails: ${thumbnailDir}`);
}

optimizeImages().catch(console.error);
