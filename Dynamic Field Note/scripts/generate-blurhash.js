#!/usr/bin/env node

const { encode } = require('blurhash');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

async function generateBlurhash() {
  const inputDir = path.join(__dirname, '../assets/images');

  // 画像ディレクトリが存在しない場合
  if (!existsSync(inputDir)) {
    console.log('📁 Creating assets/images directory...');
    await fs.mkdir(inputDir, { recursive: true });
    console.log('ℹ️  No images to process. Add images to assets/images/');
    return;
  }

  const images = await fs.readdir(inputDir);
  const imageFiles = images.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

  if (imageFiles.length === 0) {
    console.log('ℹ️  No images found in assets/images/');
    console.log('💡 Add .jpg, .jpeg, .png, or .webp files to generate blurhashes');
    return;
  }

  const blurhashes = {};

  console.log(`🎨 Generating blurhashes for ${imageFiles.length} images...`);

  for (const image of imageFiles) {
    const inputPath = path.join(inputDir, image);

    try {
      const { data, info } = await sharp(inputPath)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });

      const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);

      blurhashes[image] = blurhash;
      console.log(`  ✅ ${image}: ${blurhash}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate blurhash for ${image}:`, error.message);
    }
  }

  // JSON出力
  const outputPath = path.join(__dirname, '../assets/blurhashes.json');
  await fs.writeFile(outputPath, JSON.stringify(blurhashes, null, 2));

  console.log(`\n✨ Blurhash generation complete!`);
  console.log(`📦 Output: ${outputPath}`);
  console.log(`📊 Generated ${Object.keys(blurhashes).length} blurhashes`);
}

generateBlurhash().catch(console.error);
