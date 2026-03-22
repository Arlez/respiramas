#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const publicDir = path.join(__dirname, '..', 'public');
const source = path.join(publicDir, 'respiramas.png');

if (!fs.existsSync(source)) {
  console.error('Error: no se encontró public/respiramas.png. Coloca tu logo en esa ruta y vuelve a ejecutar.');
  process.exit(1);
}

const sizes = [16, 32, 48, 64, 96, 128, 192, 256, 512];

(async () => {
  try {
    const generated = [];
    for (const size of sizes) {
      const outName = `favicon-${size}.png`;
      const outPath = path.join(publicDir, outName);
      await sharp(source).resize(size, size).png().toFile(outPath);
      console.log('Wrote', outPath);
      generated.push(outPath);
    }

    // Crear favicon.ico a partir de 16,32,48
    const icoPngs = [
      path.join(publicDir, 'favicon-16.png'),
      path.join(publicDir, 'favicon-32.png'),
      path.join(publicDir, 'favicon-48.png'),
    ].filter(p => fs.existsSync(p));

    if (icoPngs.length > 0) {
      const icoBuf = await pngToIco(icoPngs);
      const icoPath = path.join(publicDir, 'favicon.ico');
      fs.writeFileSync(icoPath, icoBuf);
      console.log('Wrote', icoPath);
    }

    // Crear icon-192.png y icon-512.png (algunas PWA esperan estos nombres)
    await sharp(source).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(source).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Wrote icon-192.png and icon-512.png');

    // Generar splash screens (fondo theme color + logo centrado)
    const splashDir = path.join(publicDir, 'splash');
    if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir);
    const splashSizes = [
      { w: 1125, h: 2436 },
      { w: 1170, h: 2532 },
      { w: 1242, h: 2688 },
      { w: 828, h: 1792 },
      { w: 1536, h: 2048 },
      { w: 1668, h: 2224 },
      { w: 1668, h: 2388 },
      { w: 2048, h: 2732 },
      { w: 1080, h: 1920 },
      { w: 720, h: 1280 }
    ];

    const themeColor = '#16a34a';
    for (const s of splashSizes) {
      const logoWidth = Math.round(s.w * 0.45);
      const logoBuf = await sharp(source).resize(logoWidth, null).png().toBuffer();
      const splash = await sharp({
        create: {
          width: s.w,
          height: s.h,
          channels: 3,
          background: themeColor
        }
      })
        .composite([{ input: logoBuf, gravity: 'centre' }])
        .png()
        .toFile(path.join(splashDir, `splash-${s.w}x${s.h}.png`));
      console.log('Wrote', path.join(splashDir, `splash-${s.w}x${s.h}.png`));
    }

    console.log('Wrote splash screens to', splashDir);

    console.log('\nGeneración con sharp completada. Revisa public/');
  } catch (err) {
    console.error('Error generando icons:', err);
    process.exit(2);
  }
})();
