import { execSync } from 'node:child_process';
const REPO = '/Users/alfonso/jjodel-release';
const BASE = process.argv[2] || '084d99b3b';
const HEAD = process.argv[3] || 'HEAD';
const show = (rev, p) => { try { return execSync(`git -C ${REPO} show ${rev}:${p}`, {encoding:'utf8', maxBuffer:1<<26}); } catch { return null; } };
const MODS = ['frontend/src/components/editor-v2/CLAUDE.md','frontend/src/model/CLAUDE.md','frontend/src/redux/CLAUDE.md','frontend/src/styles/CLAUDE.md','frontend/src/jjel/CLAUDE.md','frontend/src/jjscript/CLAUDE.md','frontend/src/jjtl/CLAUDE.md','frontend/src/services/export/CLAUDE.md'];
const norm = s => s.replace(/\s+/g,' ').trim();

const baseCore = show(BASE,'CLAUDE.md');
const baseJjtl = show(BASE,'frontend/src/jjtl/CLAUDE.md');
const baseProto = show(BASE,'docs/PROTOCOL.md');
const files = {'CLAUDE.md': show(HEAD,'CLAUDE.md'), 'docs/PROTOCOL.md': show(HEAD,'docs/PROTOCOL.md'), 'docs/CODEBASE-MAP.md': show(HEAD,'docs/CODEBASE-MAP.md') ?? ''};
for (const m of MODS) files[m] = show(HEAD,m);
const corpusNorm = Object.entries(files).map(([k,v]) => norm(v)).join(' ');
const corpusExactLines = new Set(Object.values(files).flatMap(v => v.split('\n').map(l=>l.trimEnd())));

// baseline lines with the enclosing heading
const baseLines = baseCore.split('\n');
let fence=false, h2='', h3='';
const out = {missing:[], total:0, exact:0, rewrapped:0};
baseLines.forEach((l,i) => {
  if (/^```/.test(l)) fence=!fence;
  if (!fence) { let m; if ((m=l.match(/^## (.*)/))) {h2=m[1];h3='';} else if ((m=l.match(/^### (.*)/))) h3=m[1]; }
  if (!l.trim()) return;
  out.total++;
  if (corpusExactLines.has(l.trimEnd())) { out.exact++; return; }
  if (corpusNorm.includes(norm(l))) { out.rewrapped++; return; }
  out.missing.push({n:i+1, sec: h3||h2, text:l});
});
console.log(`BASE ${BASE} CLAUDE.md: ${baseCore.length} chars, ${baseLines.length} lines, ${out.total} non-blank`);
console.log(`exact-line present: ${out.exact}; present after whitespace/newline normalization: ${out.rewrapped}; NOT present: ${out.missing.length}`);
const bySec = {};
for (const m of out.missing) (bySec[m.sec] ||= []).push(m);
for (const [s, arr] of Object.entries(bySec)) { console.log(`\n### ${s}  (${arr.length} lines)`); for (const m of arr) console.log(`  L${m.n}: ${m.text}`); }

// ADDED: lines in HEAD files that are not in baseline core (or baseline jjtl/PROTOCOL for those files)
const baseNormAll = norm(baseCore + ' ' + (baseJjtl||'') + ' ' + baseProto);
console.log('\n===== ADDED (HEAD lines whose normalized text is absent from baseline core+jjtl+PROTOCOL) =====');
for (const [f, txt] of Object.entries(files)) {
  const added = txt.split('\n').filter(l=>l.trim() && !baseNormAll.includes(norm(l)));
  console.log(`\n## ${f}: ${added.length} added lines`);
  for (const l of added) console.log('  + ' + l);
}
