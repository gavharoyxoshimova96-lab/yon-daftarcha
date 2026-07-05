import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'images', 'logo-source.png');
const outDir = path.join(root, 'assets', 'images');

const BLACK = '#0A0A0A';

async function squareSource(size) {
  const meta = await sharp(source).metadata();
  const side = Math.min(meta.width ?? size, meta.height ?? size);
  return sharp(source)
    .extract({
      left: Math.floor(((meta.width ?? side) - side) / 2),
      top: Math.floor(((meta.height ?? side) - side) / 2),
      width: side,
      height: side,
    })
    .resize(size, size, { fit: 'cover' });
}

async function resizeIcon(size, output, options = {}) {
  const { padding = 0, background, cover = true } = options;
  const inner = size - padding * 2;

  let img = cover
    ? await squareSource(inner)
    : sharp(source).resize(inner, inner, { fit: 'contain' });

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
  const padded = Math.round(size * 0.72);
  const icon = await (await squareSource(padded))
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
  await resizeIcon(512, path.join(outDir, 'splash-icon.png'), { padding: 48, background: BLACK });
  await resizeIcon(1024, path.join(outDir, 'android-icon-foreground.png'), { padding: 120 });
  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: BLACK },
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
