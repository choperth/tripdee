import fs from 'node:fs';
import path from 'node:path';

// Lists files under src/ that still contain Thai letters (the ฿ sign is ignored).
// Usage: node scan-all.mjs [dir]
const root = process.argv[2] || 'src';
// Thai letters + marks, deliberately excluding U+0E3F (THAI CURRENCY SYMBOL BAHT).
const thai = /[\u0E01-\u0E3A\u0E47-\u0E5B]/g;
const skipDirs = new Set(['node_modules', '.next', '.git']);

const out = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(fp);
      continue;
    }
    if (!/\.tsx?$/.test(entry.name)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    const hits = src.split(/\r?\n/).filter((l) => thai.test(l) && (l.match(thai) || []).length > 0);
    const chars = hits.reduce((s, l) => s + (l.match(thai) || []).length, 0);
    if (hits.length) out.push({ file: fp, lines: hits.length, chars });
  }
})(root);

const filter = process.env.SKIP_I18N === '1';
out.sort((a, b) => b.chars - a.chars);
for (const o of out) {
  if (filter && o.file.includes(path.join('src', 'i18n'))) continue;
  if (filter && o.file.includes(path.join('src', 'data'))) continue;
  console.log(String(o.chars).padStart(6) + '  ' + String(o.lines).padStart(4) + 'L  ' + o.file);
}
console.log('TOTAL FILES:', out.length, 'THAI CHARS:', out.reduce((s, o) => s + o.chars, 0));