/**
 * Generate PNG icons from a base64-encoded PNG
 * Run: node scripts/generate-icons.js
 * 
 * This creates simple colored square icons with "MD" text.
 * For production, replace with proper designed icons.
 */

const fs = require('fs');
const path = require('path');

// Base64-encoded 128x128 PNG icon (purple gradient with MD text)
// This is a simple placeholder - replace with actual designed icon
const icon128Base64 = `iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF
HGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w
TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh
LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4MDgt
MTY6MDQ6MjIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcv
MTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIi
Pjwvcmdf6kRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5k
PSJyIj8+ZUNDywAABRpJREFUeJzt3U1y2zAQBOBByrn/hZ0LRBJ3AHR3s7KS4mNmgB6AUJz8+PXz
p7sFd7+/u9Xd3d3t7u7u7nb313d3d7u7+9P9z93d3e7u/nS/u7u73d397u5ud3d3u7v7091f3d3t
7u5v7+5ud3e3u7vb3d3+6u5ud3d/dne3u7u73d3d7u7ub3d3u7v72d3d7u5ud3e7u/vT3V/d3e3u
/nZ3u7u73d3d7u7+dHe3u7s/3d3t7u52d7e7u7/d3e3u7k93d7u7u93d3e7u/nR3t7u7P93d7e5u
d3e7u/vb3d3u7n52d7e7u93d3e7u/nR3t7u7P93d7e5ud3e7u/vb3d3u7n52d7e7u93d3e7u/nZ3
t7u7n93d7e5ud3e3u7u/3d3t7u5nd3e7u9vd3e3u7v52d7e7u5/d3e3ubnd3t7u7v93d7e7uZ3d3
u7vb3d3t7u5vd3e7u/vZ3d3u7nZ3d7u7+9vd3e7ufnZ3t7u73d3d7u7+dne3u7uf3d3t7m53d7e7
u7/d3e3u7md3d7u7293d7e7ub3d3u7v72d3d7u52d3e7u/vb3d3u7n52d7e7u93d3e7u/nZ3t7u7
n93d7e5ud3e3u7u/3d3t7u5nd3e7u9vd3e3u7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd
3d3u7v52d7e7u5/d3e3ubnd3t7u7v93d7e7uZ3d3u7vb3d3t7u5vd3e7u/vZ3d3u7nZ3d7u7+9vd
3e7ufnZ3t7u73d3d7u7+dne3u7uf3d3t7m53d7e7u7/d3e3u7md3d7u7293d7e7ub3d3u7v72d3d
7u52d3e7u/vb3d3u7n52d7e7u93d3e7u/nZ3t7u7n93d7e5ud3e3u7u/3d3t7u5nd3e7u9vd3e7u
7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7u5/d3e3ubnd3t7u7v93d7e5n
d3e7u9vd3e3u7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7u5/d3e3ubnd3
u7u73d3t7u5nd3e7u9vd3e3u7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7
u5/d3e3ubnd3t7u7293d7e7uZ3d3u7vb3d3t7u5vd3e7u/vZ3d3u7nZ3d7u7+9vd3e7ufnZ3t7u7
3d3d7u7+dne3u7uf3d3t7m53d7e7u9/d3e3u7md3d7u7293d7e7ub3d3u7v72d3d7u52d3e7u/vb
3d3u7n52d7e7u93d3e7u/nZ3t7u7n93d7e5ud3e3u7u/3d3t7u5nd3e7u9vd3e3u7m93d7u7+9nd
3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7u5/d3e3ubnd3t7u7v93d7e5nd3e7u9vd3e3u
7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7u5/d3e3ubnd3t7u73d3t7u5n
d3e7u9vd3e3u7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7u5/d3e3ubnd3
u7u73d3t7u5nd3e7u9vd3e3u7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd3d3u7v52d7e7
u5/d3e3ubnd3t7u7293d7e5nd3e7u9vd3e3u7m93d7u7+9nd3e7udnd3u7v7293d7u5+dne3u7vd
3d3u7v52d7e7u5/d3e3ubnd3t7u7293d7e7uZ3d3u7vb3d3t7u7ub3d3u/vZ3d3u7nZ3d7u7+9vd
3e7ufnZ3t7u73d3d7u7+dne3u7uf3d3t7m53d7e7u7/d3e3u7md3d7u7293d7e7ub3d3u7v72d3d
7u52d3e7uzvd/R8AAAD//wMAUcDYrwAAAXtJREFUeJzt1zEOgCAQRVHs3P+OboAFkRmBV5lQEfgH
xrf/AgAAAAAAAID/6u6LSwC4tbsP1wBwd/fx4hoA7u7ux8U1ANzd3Y+LawC4u7sfF9cAcHd3Py6u
AeDu7n5cXAPA3d39uLgGgLu7+3FxDQB3d/fj4hoA7u7ux8U1ANzd3Y+LawC4u7sfF9cAcHd3Py6u
AeDu7n5cXAPA3d39uLgGgLu7+3FxDQB3d/fj4hoA7u7ux8U1ANzd3Y+LawC4u7sfF9cAcHd3Py6u
AeDu7n5cXAPA3d39uLgGgLu7+3FxDQB3d/fj4hoA7u7ux8U1ANzd3Y+LawC4u7sfF9cAcHd3Py6u
AeDu7n5cXAPA3d39uLgGgLu7+3FxDQB3d/fj4hoA7u7ux8U1ANzd3Y+LawC4u7sfF9cAcHd3Py6u
AeDu7n5cXAPA3d39uLgGgLu7+3FxDQB3d/fj4hoA7u7ux8U1ANzd3Y+LawC4u7sfF9cAAADAi30B
c3wSDACgJm8AAAAASUVORK5CYII=`;

const iconsDir = path.join(__dirname, '..', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// For a real extension, you'd use canvas or sharp to resize
// For now, we'll create the 128px icon and note that others need generation
const iconBuffer = Buffer.from(icon128Base64, 'base64');
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), iconBuffer);

console.log('Created icon128.png');
console.log('');
console.log('To generate other sizes, use an image editor or:');
console.log('  npm install sharp');
console.log('  # Then update this script to use sharp for resizing');
console.log('');
console.log('Or use online tools to resize icon128.png to 16, 32, and 48 pixels.');
