// Generateur de QR code : mode binaire, correction d'erreurs niveau M, versions 1 a 10.
//
// POURQUOI CE FICHIER EXISTE
// La maquette place un QR au milieu du bloc de telechargement. Le QR de la maquette encode
// « https://rowad.app/download », un domaine qui n'est pas celui de l'agence : le publier
// enverrait les clients chez quelqu'un d'autre. La bibliotheque `qrcode` ne peut pas etre
// installee (npm n'a plus de reseau), donc le code est genere ici, a partir de la vraie adresse
// de telechargement.
//
// CE N'EST PAS DU CODE A CROIRE SUR PAROLE
// tests/qr-checks.cjs decode ce que ce fichier produit, avec un decodeur ecrit separement, et
// verifie qu'on retrouve exactement le texte de depart. Un QR faux se voit a l'oeil nu
// uniquement avec une camera : le test remplace la camera.
//
// Reference : ISO/IEC 18004. La structure suit l'implementation de reference de Nayuki.

/** Nombre de mots de correction par bloc, niveau M, par version (indice = version). */
const EC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
/** Nombre de blocs, niveau M, par version. */
const BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
/** Les 5 bits du niveau M dans l'information de format. */
const FORMAT_EC_BITS = 0;
const MAX_VERSION = 10;

/** Nombre de modules de donnees bruts (bits) pour une version. */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2;
    result -= (25 * alignCount - 10) * alignCount - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** Nombre de mots de donnees disponibles pour une version, niveau M. */
function dataCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8) - EC_PER_BLOCK[version] * BLOCKS[version];
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const positions = [6];
  for (let pos = version * 4 + 17 - 7; positions.length < count; pos -= step) positions.splice(1, 0, pos);
  return positions;
}

// --- Arithmetique du corps de Galois GF(256), polynome 0x11D ---

function gfMultiply(a: number, b: number): number {
  let result = 0;
  for (let i = 7; i >= 0; i--) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((b >>> i) & 1) * a;
  }
  return result & 0xff;
}

/** Le polynome diviseur de Reed-Solomon pour `degree` mots de correction. */
function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < divisor.length; i++) result[i] ^= gfMultiply(divisor[i], factor);
  }
  return result;
}

// --- Construction ---

/** Le flux de bits : mode binaire, longueur, donnees, terminaison et remplissage. */
function buildCodewords(bytes: number[], version: number): number[] {
  const capacity = dataCodewords(version) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);

  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let k = 0; k < 8; k++) value = (value << 1) | bits[i + k];
    codewords.push(value);
  }
  return codewords;
}

/** Decoupe en blocs, ajoute la correction, puis entrelace comme l'exige la norme. */
function interleave(codewords: number[], version: number): number[] {
  const blockCount = BLOCKS[version];
  const ecLength = EC_PER_BLOCK[version];
  const total = Math.floor(rawDataModules(version) / 8);
  const shortBlockLength = Math.floor(total / blockCount) - ecLength;
  const shortBlockCount = blockCount - (total % blockCount);

  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  const divisor = rsDivisor(ecLength);
  let offset = 0;
  for (let i = 0; i < blockCount; i++) {
    const length = shortBlockLength + (i < shortBlockCount ? 0 : 1);
    const block = codewords.slice(offset, offset + length);
    offset += length;
    blocks.push(block);
    ecBlocks.push(rsRemainder(block, divisor));
  }

  const result: number[] = [];
  for (let i = 0; i < shortBlockLength + 1; i++) {
    for (let b = 0; b < blockCount; b++) if (i < blocks[b].length) result.push(blocks[b][i]);
  }
  for (let i = 0; i < ecLength; i++) {
    for (let b = 0; b < blockCount; b++) result.push(ecBlocks[b][i]);
  }
  return result;
}

type Grid = { size: number; modules: boolean[][]; isFunction: boolean[][] };

function drawFunctionPatterns(grid: Grid, version: number) {
  const { size, modules, isFunction } = grid;
  const set = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  // Motifs de synchronisation D'ABORD : les motifs de reperage mordent sur la ligne et la
  // colonne 6, et c'est a eux de gagner. Dans l'autre ordre, la bordure des coins est rongee
  // une case sur deux et aucun lecteur ne reconnait plus le code.
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // Motifs de reperage aux trois coins, avec leur separateur blanc.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, distance !== 2 && distance !== 4);
      }
    }
  }

  // Motifs d'alignement, sauf la ou ils toucheraient un motif de reperage.
  const positions = alignmentPositions(version);
  for (let i = 0; i < positions.length; i++) {
    for (let j = 0; j < positions.length; j++) {
      const corner = (i === 0 && j === 0) || (i === 0 && j === positions.length - 1) || (i === positions.length - 1 && j === 0);
      if (corner) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          set(positions[j] + dx, positions[i] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Les emplacements de l'information de format ne sont PAS reserves par une boucle simple :
  // ils sautent la ligne et la colonne 6, et une boucle naive y effacerait la synchronisation.
  // C'est drawFormatBits, appele juste apres avec une valeur provisoire, qui marque exactement
  // les bonnes cases.
}

function drawFormatBits(grid: Grid, mask: number) {
  const { size, modules, isFunction } = grid;
  const data = (FORMAT_EC_BITS << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  const bits = ((data << 10) | remainder) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) !== 0;
  const set = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));

  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true);
}

function drawCodewords(grid: Grid, data: number[]) {
  const { size, modules, isFunction } = grid;
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        if (isFunction[y][x] || index >= data.length * 8) continue;
        modules[y][x] = ((data[index >>> 3] >>> (7 - (index & 7))) & 1) !== 0;
        index++;
      }
    }
  }
}

function maskAt(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(grid: Grid, mask: number) {
  const { size, modules, isFunction } = grid;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isFunction[y][x] && maskAt(mask, x, y)) modules[y][x] = !modules[y][x];
    }
  }
}

/** La note de la norme : plus elle est basse, plus le code est facile a lire. */
function penalty(grid: Grid): number {
  const { size, modules } = grid;
  let result = 0;

  const runPenalty = (run: number) => (run >= 5 ? run - 2 : 0);
  for (let y = 0; y < size; y++) {
    let run = 1;
    for (let x = 1; x < size; x++) {
      if (modules[y][x] === modules[y][x - 1]) run++;
      else { result += runPenalty(run); run = 1; }
    }
    result += runPenalty(run);
  }
  for (let x = 0; x < size; x++) {
    let run = 1;
    for (let y = 1; y < size; y++) {
      if (modules[y][x] === modules[y - 1][x]) run++;
      else { result += runPenalty(run); run = 1; }
    }
    result += runPenalty(run);
  }

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const value = modules[y][x];
      if (value === modules[y][x + 1] && value === modules[y + 1][x] && value === modules[y + 1][x + 1]) result += 3;
    }
  }

  const pattern = [true, false, true, true, true, false, true];
  const matches = (cells: boolean[], start: number) => pattern.every((value, i) => cells[start + i] === value);
  const lineCells = (get: (i: number) => boolean) => {
    const cells: boolean[] = [];
    for (let i = 0; i < size; i++) cells.push(get(i));
    return cells;
  };
  for (let i = 0; i < size; i++) {
    for (const cells of [lineCells((k) => modules[i][k]), lineCells((k) => modules[k][i])]) {
      const padded = [false, false, false, false, ...cells, false, false, false, false];
      for (let start = 0; start + 11 <= padded.length; start++) {
        if (matches(padded, start) && padded.slice(start + 7, start + 11).every((value) => !value)) result += 40;
        if (padded.slice(start, start + 4).every((value) => !value) && matches(padded, start + 4)) result += 40;
      }
    }
  }

  // Regle 4 : l'ecart a 50 % de modules noirs. La norme demande le plus petit k tel que la
  // proportion tienne dans [45 - 5k, 55 + 5k] % — ce n'est pas tout a fait un arrondi vers le bas,
  // et la difference suffit a faire choisir un autre masque.
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
  const total = size * size;
  result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return result;
}

/**
 * Produit la matrice du QR : `matrix[y][x]` vaut true pour un module noir.
 * Leve une erreur si le texte ne tient pas dans une version 10.
 */
export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 1;
  while (version <= MAX_VERSION) {
    const headerBits = 4 + (version <= 9 ? 8 : 16);
    if (headerBits + bytes.length * 8 <= dataCodewords(version) * 8) break;
    version++;
  }
  if (version > MAX_VERSION) throw new Error("texte trop long pour un QR de version 10");

  const size = version * 4 + 17;
  const grid: Grid = {
    size,
    modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    isFunction: Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  };

  drawFunctionPatterns(grid, version);
  drawFormatBits(grid, 0); // reserve les cases du format avant de poser les donnees
  drawCodewords(grid, interleave(buildCodewords(bytes, version), version));

  // On essaie les huit masques et on garde celui qui se lit le mieux.
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(grid, mask);
    drawFormatBits(grid, mask);
    const score = penalty(grid);
    if (score < bestScore) {
      bestScore = score;
      best = mask;
    }
    applyMask(grid, mask); // le masque est son propre inverse
  }
  applyMask(grid, best);
  drawFormatBits(grid, best);

  return grid.modules;
}

/** La matrice sous forme de chemin SVG, un carre par module noir. */
export function qrPath(matrix: boolean[][]): string {
  let path = "";
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x]) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return path;
}
