import { execSync } from 'node:child_process';
const REPO='/Users/alfonso/jjodel-release';
const show=(rev,p)=>execSync(`git -C ${REPO} show ${rev}:${p}`,{encoding:'utf8',maxBuffer:1<<26});
const MODS=['frontend/src/components/editor-v2/CLAUDE.md','frontend/src/model/CLAUDE.md','frontend/src/redux/CLAUDE.md','frontend/src/styles/CLAUDE.md','frontend/src/jjel/CLAUDE.md','frontend/src/jjscript/CLAUDE.md','frontend/src/jjtl/CLAUDE.md','frontend/src/services/export/CLAUDE.md'];
const norm=s=>s.replace(/\s+/g,' ').trim();
const files={'CLAUDE.md':show('HEAD','CLAUDE.md'),'docs/PROTOCOL.md':show('HEAD','docs/PROTOCOL.md')};
for(const m of MODS)files[m]=show('HEAD',m);
const fn=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,norm(v)]));
const lines=show('084d99b3b','CLAUDE.md').split('\n');
const blocks=[];let cur=null,fence=false;
for(const l of lines){if(/^```/.test(l))fence=!fence;if(!fence&&/^#{2,3} /.test(l)){cur={h:l,body:[l]};blocks.push(cur);continue;}if(cur)cur.body.push(l);}
let whole=0;
for(const b of blocks){
  const body=b.body.filter(l=>l.trim()!=='---');            // drop the horizontal rules between sections
  const txt=norm(body.join('\n'));
  const where=Object.keys(fn).filter(f=>fn[f].includes(txt));
  if(where.length){whole++;if(process.env.VERBOSE)console.log(`ok ${b.h.slice(0,60).padEnd(60)} -> ${where.join(' + ')}`);continue;}
  // whole block not contiguous anywhere: locate the file that holds most of its lines, and list the lines held elsewhere
  const nb=body.filter(l=>l.trim());
  const perFile={};for(const l of nb){for(const f of Object.keys(fn))if(fn[f].includes(norm(l)))(perFile[f]||=0),perFile[f]++;}
  const miss=nb.filter(l=>!Object.values(fn).some(t=>t.includes(norm(l))));
  console.log(`\n${b.h.slice(0,80)}  lines=${nb.length}  perFile=${JSON.stringify(perFile)}  absent=${miss.length}`);
}

console.log(`\nblocks=${blocks.length} whole-and-verbatim-in-one-file(ignoring '---' rules)=${whole} not-whole=${blocks.length-whole}`);
