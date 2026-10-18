/**
 * Maakt de app-iconen. Het zijn maar een paar vlakken, dus die tekenen we zelf
 * als PNG: geen extra afhankelijkheid nodig voor vier bestanden.
 *
 * Draaien met: node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const BACKGROUND = [17, 19, 23];
const MARK = [167, 232, 97];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
      offset += 4;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bitdiepte
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Dumbbell: twee gewichten met een stang ertussen. */
function isMark(x, y, size) {
  const unit = size / 32;
  const cy = size / 2;

  const inBand = (top, bottom) => y >= cy - top * unit && y <= cy + bottom * unit;

  // Buitenste gewichten
  if ((x >= 4 * unit && x <= 7.5 * unit) || (x >= 24.5 * unit && x <= 28 * unit)) {
    if (inBand(7, 7)) return true;
  }
  // Binnenste gewichten
  if ((x >= 8.5 * unit && x <= 11.5 * unit) || (x >= 20.5 * unit && x <= 23.5 * unit)) {
    if (inBand(9.5, 9.5)) return true;
  }
  // Stang
  if (x >= 11.5 * unit && x <= 20.5 * unit && inBand(2.2, 2.2)) return true;
  return false;
}

function roundedCorner(x, y, size, radius) {
  const corners = [
    [radius, radius],
    [size - radius, radius],
    [radius, size - radius],
    [size - radius, size - radius],
  ];
  for (const [cx, cy] of corners) {
    const insideX = (cx < size / 2 && x < cx) || (cx > size / 2 && x > cx);
    const insideY = (cy < size / 2 && y < cy) || (cy > size / 2 && y > cy);
    if (insideX && insideY) {
      return Math.hypot(x - cx, y - cy) > radius;
    }
  }
  return false;
}

function write(name, size, { maskable = false } = {}) {
  const radius = maskable ? 0 : size * 0.22;
  const scale = maskable ? 0.72 : 1; // veilige zone voor maskable iconen

  const png = encodePng(size, (x, y) => {
    if (!maskable && roundedCorner(x + 0.5, y + 0.5, size, radius)) return [0, 0, 0, 0];

    const markX = (x - size / 2) / scale + size / 2;
    const markY = (y - size / 2) / scale + size / 2;
    if (isMark(markX, markY, size)) return [...MARK, 255];
    return [...BACKGROUND, 255];
  });

  writeFileSync(join(OUT, name), png);
  console.log(`${name} (${size}x${size})`);
}

write("icon-192.png", 192);
write("icon-512.png", 512);
write("icon-maskable-512.png", 512, { maskable: true });
write("apple-touch-icon.png", 180);
