/**
 * Regenerates assets/splash-icon.png: the first frame of the opening animation, which draws nothing, so the image is
 * fully transparent (384 x 448, the 4x mark canvas the splash config sizes against). The native splash then shows only
 * its black #000000 ground, the same colour as the JS loading screen that takes over, and the pen starts writing there.
 * Run with `node scripts/generate-splash-icon.js`. Deterministic: same source, same bytes.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.join(__dirname, '..');
const SCALE = 4;
const WIDTH = 96 * SCALE;
const HEIGHT = 112 * SCALE;
const png = new PNG({ width: WIDTH, height: HEIGHT }); // zero-filled: every pixel is transparent
fs.writeFileSync(path.join(root, 'assets/splash-icon.png'), PNG.sync.write(png));
console.log(`splash-icon.png: ${png.width}x${png.height}, fully transparent`);
