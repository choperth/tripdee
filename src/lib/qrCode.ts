/**
 * Lightweight Zero-Dependency QR Code Generator for TripDee Smart E-Cards
 * Generates clean 2D boolean matrices and scalable SVG paths for URLs, phone numbers, and vCards.
 */

// QR Code Error Correction Levels
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// Lookup tables for Reed-Solomon and Galois Field GF(256)
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // polynomial 0x11d
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsComputePoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const factor = new Uint8Array([1, GF256_EXP[i]]);
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      for (let k = 0; k < factor.length; k++) {
        next[j + k] ^= gfMultiply(poly[j], factor[k]);
      }
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: Uint8Array, ecCount: number): Uint8Array {
  const genPoly = rsComputePoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      remainder[j] ^= gfMultiply(genPoly[j + 1], factor);
    }
  }
  return remainder;
}

// Versions 1 - 6 capacity info (Byte mode, Level M)
// [totalDataCodewords, ecCodewordsPerBlock, numBlocks]
const VERSION_SPECS_LEVEL_M: Record<number, { dataCodewords: number; ecCodewords: number }> = {
  1: { dataCodewords: 16, ecCodewords: 10 },
  2: { dataCodewords: 28, ecCodewords: 16 },
  3: { dataCodewords: 44, ecCodewords: 26 },
  4: { dataCodewords: 64, ecCodewords: 18 * 2 },
  5: { dataCodewords: 86, ecCodewords: 24 * 2 },
  6: { dataCodewords: 108, ecCodewords: 16 * 4 },
};

function pickVersion(textBytesLength: number): number {
  for (let v = 1; v <= 6; v++) {
    // In byte mode: 4 bits mode + 8 bits count + data
    const maxCapacity = VERSION_SPECS_LEVEL_M[v].dataCodewords - 2;
    if (textBytesLength <= maxCapacity) return v;
  }
  return 6;
}

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const version = pickVersion(textBytes.length);
  const size = version * 4 + 17;
  const spec = VERSION_SPECS_LEVEL_M[version];

  // 1. Bit Buffer Encode (Byte Mode: 0100)
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(textBytes.length, 8); // Character count
  for (let i = 0; i < textBytes.length; i++) {
    pushBits(textBytes[i], 8);
  }

  // Terminator
  const totalDataBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, termLen);

  // Align to byte
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes 0xEC and 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to bytes
  const dataBytes = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // 2. Error Correction Codewords
  const ecBytes = rsComputeRemainder(dataBytes, spec.ecCodewords);

  // Combined codewords
  const allCodewords = new Uint8Array(spec.dataCodewords + spec.ecCodewords);
  allCodewords.set(dataBytes, 0);
  allCodewords.set(ecBytes, spec.dataCodewords);

  // Convert all codewords to bit stream
  const finalBits: number[] = [];
  for (let i = 0; i < allCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((allCodewords[i] >>> b) & 1);
    }
  }

  // 3. Matrix setup
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  const isFunction = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const setFunc = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  // Finder Patterns (top-left, top-right, bottom-left)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack =
            r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunc(nr, nc, isBlack);
        } else {
          setFunc(nr, nc, false); // Separator
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment Pattern for version >= 2
  if (version >= 2) {
    const alignPos: Record<number, number[]> = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
    };
    const pos = alignPos[version];
    if (pos) {
      for (const ar of pos) {
        for (const ac of pos) {
          if (isFunction[ar][ac]) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
              setFunc(ar + r, ac + c, isBlack);
            }
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunc(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunc(i, 6, i % 2 === 0);
  }

  // Dark module
  setFunc(version * 4 + 9, 8, true);

  // Reserve format bits
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunc(8, i, false);
    if (!isFunction[i][8]) setFunc(i, 8, false);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) setFunc(8, i, false);
    if (!isFunction[i][8]) setFunc(i, 8, false);
  }

  // 4. Place Data with Mask 0 ((row + col) % 2 === 0)
  let bitIdx = 0;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    for (let vert = 0; vert < size; vert++) {
      const row = upwards ? size - 1 - vert : vert;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = right - colOffset;
        if (!isFunction[row][col]) {
          let bit = false;
          if (bitIdx < finalBits.length) {
            bit = finalBits[bitIdx] === 1;
            bitIdx++;
          }
          // Apply Mask 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = bit !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 5. Format info for Level M + Mask 0 = 0b101010000010010
  const formatBits = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >>> (14 - i)) & 1) === 1;
    // Around top-left
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Around other finders
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix.map((row) => row.map((cell) => Boolean(cell)));
}

/**
 * Render QR matrix to pure SVG path string for crisp vector display at any scale
 */
export function renderQrSvgPath(matrix: boolean[][]): string {
  let path = '';
  const size = matrix.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        path += `M${c},${r}h1v1h-1z `;
      }
    }
  }
  return path;
}
