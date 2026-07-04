import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'images', 'logo-source.png');
const outDir = path.join(root, 'assets', 'images');

const GREEN = '#2E7D32';
const LIGHT_GREEN = '#E8F5E9';

async function resizeIcon(size, output, options = {}) {
  const { padding = 0, background } = options;
  const inner = size - padding * 2;

  let img = sharp(source).resize(inner, inner, { fit: 'contain' });

  if (background) {
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background,
      },
    });
    const buffer = await img.toBuffer();
    await canvas
      .composite([{ input: buffer, gravity: 'centre' }])
      .png()
      .toFile(output);
    return;
  }

  if (padding > 0) {
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: await img.toBuffer(), gravity: 'centre' }])
      .png()
      .toFile(output);
    return;
  }

  await img.png().toFile(output);
}

async function makeMonochrome(size, output) {
  const padded = Math.round(size * 0.62);
  const icon = await sharp(source)
    .resize(padded, padded, { fit: 'contain' })
    .greyscale()
    .threshold(128)
    .negate()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(output);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  await resizeIcon(1024, path.join(outDir, 'icon.png'));
  await resizeIcon(48, path.join(outDir, 'favicon.png'));
  await resizeIcon(512, path.join(outDir, 'splash-icon.png'), { padding: 64, background: '#ffffff' });
  await resizeIcon(1024, path.join(outDir, 'android-icon-foreground.png'), { padding: 180 });
  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: LIGHT_GREEN },
  })
    .png()
    .toFile(path.join(outDir, 'android-icon-background.png'));
  await makeMonochrome(1024, path.join(outDir, 'android-icon-monochrome.png'));

  console.log('Icons generated in assets/images/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
