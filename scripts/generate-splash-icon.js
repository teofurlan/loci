/**
 * Regenerates assets/splash-icon.png: the first frame of the opening animation (the left end of the Loci path
 * mark), drawn from the same grid and trace order the app uses, nearest-neighbor 4x in palette ink on transparency.
 * Run with `node scripts/generate-splash-icon.js`. Deterministic: same source, same bytes.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { PNG } = require('pngjs');

const root = path.join(__dirname, '..');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};
const { MARK_ROWS } = require(path.join(root, 'src/ui/model/mark.ts'));
const { revealedRows, traceFrame } = require(path.join(root, 'src/ui/model/mark-trace.ts'));

const SCALE = 4;
const INK = [0x1a, 0x1c, 0x2c, 0xff];
const rows = revealedRows(traceFrame(0).revealed);
const png = new PNG({ width: MARK_ROWS[0].length * SCALE, height: MARK_ROWS.length * SCALE });
rows.forEach((row, y) => {
  for (let x = 0; x < row.length; x += 1) {
    if (row[x] !== '0') continue;
    for (let dy = 0; dy < SCALE; dy += 1) {
      for (let dx = 0; dx < SCALE; dx += 1) {
        const i = ((y * SCALE + dy) * png.width + x * SCALE + dx) * 4;
        png.data.set(INK, i);
      }
    }
  }
});
fs.writeFileSync(path.join(root, 'assets/splash-icon.png'), PNG.sync.write(png));
console.log(`splash-icon.png: ${png.width}x${png.height}, ${rows.join('').split('0').length - 1} ink cells`);
