/**
 * Regenerates the launcher icon assets from the mark grid in src/ui/model/mark.ts (the 60 art-pixel mark of the
 * opening screen), so the icon and the opening always share one source:
 *   assets/android-icon-foreground.png  1024 x 1024, transparent, mark in night text #cfc8dc
 *   assets/android-icon-monochrome.png  1024 x 1024, transparent, mark in black (themed icons)
 *   assets/icon.png                     1024 x 1024, dark violet #4a4160 ground, mark in #cfc8dc
 * The adaptive icon background colour (#4a4160) is set in app.json. The mark is about half the visible icon's
 * height (the visible icon is the middle 72 of the 108-unit adaptive layer), at a whole number of pixels per art
 * pixel, centred. Approved in .pi/generated-images/loci-icon-study.html on 2026-10-11.
 * Run with `node scripts/generate-icons.js`. Deterministic: same source, same bytes.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.join(__dirname, '..');
const SIZE = 1024;
const VISIBLE = (SIZE * 72) / 108;
const MARK_SHARE = 0.5;
const FOREGROUND = [0xcf, 0xc8, 0xdc];
const BACKGROUND = [0x4a, 0x41, 0x60];

/** The mark rows as written in mark.ts, cropped to the ink. */
function markRows() {
  const source = fs.readFileSync(path.join(root, 'src/ui/model/mark.ts'), 'utf8');
  const start = source.indexOf('MARK_ROWS');
  const rows = [...source.slice(start).matchAll(/'([.0]+)'/g)].map((m) => m[1]);
  const inkRows = rows.map((r, y) => (r.includes('0') ? y : -1)).filter((y) => y >= 0);
  const inkCols = rows.flatMap((r) => [...r].map((c, x) => (c === '0' ? x : -1))).filter((x) => x >= 0);
  const [y0, y1] = [Math.min(...inkRows), Math.max(...inkRows)];
  const [x0, x1] = [Math.min(...inkCols), Math.max(...inkCols)];
  return rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1));
}

function draw(rows, ink, ground) {
  const png = new PNG({ width: SIZE, height: SIZE });
  if (ground) {
    for (let i = 0; i < SIZE * SIZE; i += 1) png.data.set([...ground, 255], i * 4);
  }
  const px = Math.max(1, Math.floor((VISIBLE * MARK_SHARE) / rows.length));
  const left = Math.round((SIZE - rows[0].length * px) / 2);
  const top = Math.round((SIZE - rows.length * px) / 2);
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '0') return;
      for (let dy = 0; dy < px; dy += 1) {
        for (let dx = 0; dx < px; dx += 1) {
          png.data.set([...ink, 255], ((top + y * px + dy) * SIZE + left + x * px + dx) * 4);
        }
      }
    });
  });
  return { png, px };
}

const rows = markRows();
const outputs = [
  ['assets/android-icon-foreground.png', draw(rows, FOREGROUND, null)],
  ['assets/android-icon-monochrome.png', draw(rows, [0, 0, 0], null)],
  ['assets/icon.png', draw(rows, FOREGROUND, BACKGROUND)],
];
for (const [file, { png, px }] of outputs) {
  fs.writeFileSync(path.join(root, file), PNG.sync.write(png));
  console.log(`${file}: ${SIZE}x${SIZE}, mark ${rows[0].length}x${rows.length} art px at ${px} px each`);
}
