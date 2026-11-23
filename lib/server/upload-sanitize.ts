/**
 * Upload checks that do not trust the browser:
 *  - detectType(): decides the real type from the file's first bytes (magic numbers), ignoring file.type / file.name
 *  - sanitizeImage(): removes metadata (EXIF incl. GPS, XMP, text chunks, comments) from JPEG / PNG / WebP
 * Pure functions on bytes, no dependencies.
 */

export type Detected = { mime: string; ext: string; kind: 'image' | 'pdf' | 'audio' };

const eq = (b: Uint8Array, off: number, sig: number[]) => sig.every((v, i) => b[off + i] === v);
const ascii = (b: Uint8Array, off: number, s: string) => [...s].every((c, i) => b[off + i] === c.charCodeAt(0));

export function detectType(b: Uint8Array): Detected | null {
  if (b.length < 12) return null;
  if (eq(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png', kind: 'image' };
  if (eq(b, 0, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' };
  if (ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')) return { mime: 'image/webp', ext: 'webp', kind: 'image' };
  if (ascii(b, 0, 'RIFF') && ascii(b, 8, 'WAVE')) return { mime: 'audio/wav', ext: 'wav', kind: 'audio' };
  if (ascii(b, 0, '%PDF-')) return { mime: 'application/pdf', ext: 'pdf', kind: 'pdf' };
  if (eq(b, 0, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: 'audio/webm', ext: 'webm', kind: 'audio' };
  if (ascii(b, 0, 'OggS')) return { mime: 'audio/ogg', ext: 'ogg', kind: 'audio' };
  if (ascii(b, 4, 'ftyp')) return { mime: 'audio/mp4', ext: 'm4a', kind: 'audio' };
  if (ascii(b, 0, 'ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { mime: 'audio/mpeg', ext: 'mp3', kind: 'audio' };
  return null;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** JPEG: drop APP1 (EXIF/XMP), APP13 (Photoshop/IPTC) and COM segments. null = malformed. */
function stripJpeg(b: Uint8Array): Uint8Array | null {
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    let m = b[i + 1];
    while (m === 0xff) {
      i++;
      m = b[i + 1]; // fill bytes
    }
    if (m === 0xd9) {
      parts.push(b.subarray(i, i + 2));
      return concat(parts);
    }
    if (m === 0xda) {
      parts.push(b.subarray(i)); // start of scan: the rest is image data
      return concat(parts);
    }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) {
      parts.push(b.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 4 > b.length) return null;
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > b.length) return null;
    if (!(m === 0xe1 || m === 0xed || m === 0xfe)) parts.push(b.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  return null;
}

/** PNG: drop eXIf, tEXt, iTXt, zTXt, tIME chunks. null = malformed. */
function stripPng(b: Uint8Array): Uint8Array | null {
  const drop = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  let i = 8;
  let sawEnd = false;
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const end = i + 12 + len;
    if (end > b.length) return null;
    if (!drop.has(type)) parts.push(b.subarray(i, end));
    i = end;
    if (type === 'IEND') {
      sawEnd = true;
      break;
    }
  }
  return sawEnd ? concat(parts) : null;
}

/** WebP: drop EXIF and XMP chunks, clear their flags in VP8X, rewrite the RIFF size. null = malformed. */
function stripWebp(b: Uint8Array): Uint8Array | null {
  const chunks: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const fourcc = String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
    const size = (b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24)) >>> 0;
    const end = i + 8 + size + (size % 2);
    if (i + 8 + size > b.length) return null;
    const chunk = b.slice(i, Math.min(end, b.length));
    if (fourcc === 'VP8X' && size >= 1) chunk[8] &= ~0x0c; // EXIF (0x08) and XMP (0x04) flags
    if (fourcc !== 'EXIF' && fourcc !== 'XMP ') chunks.push(chunk);
    i = end;
  }
  const body = concat(chunks);
  const head = new Uint8Array(12);
  head.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const riffSize = body.length + 4;
  head[4] = riffSize & 0xff;
  head[5] = (riffSize >> 8) & 0xff;
  head[6] = (riffSize >> 16) & 0xff;
  head[7] = (riffSize >>> 24) & 0xff;
  return concat([head, body]);
}

/** Returns the image without metadata, or null when it is malformed (caller should reject the upload). */
export function sanitizeImage(bytes: Uint8Array, mime: string): Uint8Array | null {
  try {
    if (mime === 'image/jpeg') return stripJpeg(bytes);
    if (mime === 'image/png') return stripPng(bytes);
    if (mime === 'image/webp') return stripWebp(bytes);
  } catch {
    return null;
  }
  return null;
}
