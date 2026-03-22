#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const faviconsModule = require('favicons');
const favicons = faviconsModule.default || faviconsModule;

const publicDir = path.join(__dirname, '..', 'public');
const source = path.join(publicDir, 'respiramas.png');

if (!fs.existsSync(source)) {
  console.error('Error: no se encontró public/respiramas.png. Coloca tu logo en esa ruta y vuelve a ejecutar.');
  process.exit(1);
}

const configuration = {
  path: '/',
  appName: 'Respira Más',
  appShortName: 'RespiraMas',
  appDescription: 'Monitoreo y guía diaria para pacientes con enfermedades crónicas',
  version: '1.0',
  developerName: 'Respira Más',
  developerURL: null,
  background: '#f0fdf4',
  theme_color: '#16a34a',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: false,
    coast: false,
    favicons: true,
    firefox: false,
    windows: true,
    yandex: false
  }
};

favicons(source, configuration, (err, response) => {
  if (err) {
    console.error('favicons error:', err.message || err);
    process.exit(2);
  }

  // Escribir imágenes y archivos de manifiesto/meta en public/
  response.images.forEach(img => {
    const outPath = path.join(publicDir, img.name);
    fs.writeFileSync(outPath, img.contents);
    console.log('Wrote', outPath);
  });

  response.files.forEach(file => {
    const outPath = path.join(publicDir, file.name);
    fs.writeFileSync(outPath, file.contents);
    console.log('Wrote', outPath);
  });

  // Guardar snippet HTML para pegar en layout si se quiere
  const htmlPath = path.join(publicDir, 'favicons.html');
  fs.writeFileSync(htmlPath, response.html.join('\n'));
  console.log('Wrote', htmlPath);

  console.log('\nGeneración completada. Revisa los archivos en public/ y copia los tags desde public/favicons.html en tu layout si quieres ajustes.');
});
