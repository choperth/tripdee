import fs from 'fs';
const src = fs.readFileSync('src/i18n/dictionaries.ts', 'utf8');
// crude split: find "const en" and "const zh"
const thPart = src.slice(src.indexOf('const th ='), src.indexOf('const en:'));
const enPart = src.slice(src.indexOf('const en:'), src.indexOf('const zh:'));
const zhPart = src.slice(src.indexOf('const zh:'));
function keys(part) {
  const re = /'([^']+)'\s*:/g;
  const s = new Set();
  let m;
  while ((m = re.exec(part))) s.add(m[1]);
  return s;
}
const th = keys(thPart), en = keys(enPart), zh = keys(zhPart);
console.log('counts', th.size, en.size, zh.size);
const onlyTh = [...th].filter(k => !en.has(k));
const onlyThZh = [...th].filter(k => !zh.has(k));
const onlyEn = [...en].filter(k => !th.has(k));
console.log('missing in en (' + onlyTh.length + '):');
onlyTh.slice(0, 100).forEach(k => console.log('  ' + k));
console.log('missing in zh (' + onlyThZh.length + '):');
onlyThZh.slice(0, 100).forEach(k => console.log('  ' + k));
console.log('extra en not in th:', onlyEn.slice(0, 20));
function dupes(part, name) {
  const re = /'([^']+)'\s*:/g;
  const seen = {};
  const d = [];
  let m;
  while ((m = re.exec(part))) {
    seen[m[1]] = (seen[m[1]] || 0) + 1;
    if (seen[m[1]] === 2) d.push(m[1]);
  }
  console.log(name + ' dupes (' + d.length + '):', d.slice(0, 30));
}
dupes(thPart, 'th'); dupes(enPart, 'en'); dupes(zhPart, 'zh');
