/** Read-only audit. Run from repo root: node docs/discovery/harness/audit_2026-11-05_effectiveness.mjs /Users/alfonso/.jjodel-lanes > output.json
 * Output contains metadata only; archives and operational tooling are never mutated.
 * Windows, thresholds and strata are fixed below, not tuned against outcomes.
 */
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readLaneSources} from '../../../tools/harness-observer/reader.mjs';
import {reconstructUsage,reconcileUsage} from '../../../tools/harness-observer/accounting.mjs';
const root=resolve(process.argv[2]||'/Users/alfonso/.jjodel-lanes');
const ID=/P-\d{4}-\d{2}-\d{2}-\d{4}/g;
const field=(t,k)=>t.match(new RegExp('^'+k+':\\s*(.*)$','m'))?.[1]||null;
const hash=t=>createHash('sha256').update(t).digest('hex');
const median=a=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:null};
const sum=a=>a.reduce((s,x)=>s+x,0);
const period=id=>id>='P-2026-10-10'&&id<'P-2026-10-18'?'before':id>='P-2026-10-19'&&id<'P-2026-11-06'?'after':null;
const continuation=t=>/context.ceiling|handoff|\bcontinu(?:ation|ed|e)\b|\breissue\b|\bresume\b|after.*(?:ceiling|time limit)/i.test(t);
const kind=t=>/merge/i.test(t||'')?'merge':/discovery|phase 1/i.test(t||'')?'discovery':/fast/i.test(t||'')?'fast':t?'full':'unknown';
assert.equal(median([3,1,2,4]),2.5); assert.equal(kind('full (Phase 1 read-only)'),'discovery');
assert.equal(continuation('continued after its context ceiling'),true);
const prompts=new Map(), sources=[];
for(const name of readdirSync('docs/prompts').filter(n=>n.endsWith('.md')).sort()){
 const path=join('docs/prompts',name),text=readFileSync(path,'utf8'),id=field(text,'Prompt-ID')?.match(ID)?.[0];
 if(id&&period(id)){if(!prompts.has(id))prompts.set(id,[]);prompts.get(id).push({text,path});sources.push({path,sha256:hash(text)});}
}
const logPaths=['docs/claude-code-log.md','docs/claude-code-log-archive.md',...readdirSync('docs/log-inbox').filter(n=>n.endsWith('.md')).sort().map(n=>'docs/log-inbox/'+n)];
const entries=[];
for(const path of logPaths){const text=readFileSync(path,'utf8');sources.push({path,sha256:hash(text)});
 for(const block of text.split(/(?=^## \d{4}-\d{2}-\d{2} — )/m)){const heading=block.split('\n')[0];if(!/^## \d{4}-/.test(heading))continue;
 const name=block.match(/^\*\*Prompt document name\*\*:\s*(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/m);
 const id=name?`P-${name[1]}-${name[2]}${name[3]}`:null;
 const corregge=block.match(/^\*\*Corregge\*\*:\s*(.*)/m)?.[1]??null;
 const target=corregge?.match(/(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/);
 entries.push({path,heading,id,corregge,target:target?`P-${target[1]}-${target[2]}${target[3]}`:null,text:block});
 }
}
const rows=[], errors=[],callOwners=new Map();
for(const id of readdirSync(root).filter(n=>/^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)&&period(n)&&existsSync(join(root,n,'log.jsonl'))).sort()){
 try{
 const lane=readLaneSources(root,id),stream=reconstructUsage(lane.events),rec=reconcileUsage(lane.events,stream);
 sources.push(...lane.sources.map(s=>({...s,path:'archive/'+s.path})));
 const candidates=prompts.get(id)||[];let p=candidates.length===1?candidates[0]:null,fallback=false;
 if(!p&&existsSync(join(root,id,'input-1.md'))){const text=readFileSync(join(root,id,'input-1.md'),'utf8');if(field(text,'Prompt-ID')?.match(ID)?.[0]===id){p=candidates.find(c=>c.text.split('\n')[0]===text.split('\n')[0])||{text,path:'archive/'+id+'/input-1.md'};fallback=p.path.startsWith('archive/');}}
 const text=p?.text||'',declared=field(text,'Lane'),front=field(text,'Front')?.split(/[\s;(]/)[0]||null;
 const main=stream.calls.filter(c=>!c.agent&&!c.sidechain),contexts=main.map(c=>['input','cacheRead','cacheCreation'].every(k=>Number.isSafeInteger(c.usage[k]))?c.usage.input+c.usage.cacheRead+c.usage.cacheCreation:null).filter(Number.isFinite);
 const results=lane.events.filter(e=>e.kind==='result'&&!e.notification);
 const inits=lane.events.filter(e=>e.kind==='init');
 const records=entries.filter(e=>e.id===id&&!/— merge:/.test(e.heading));
 const doneStatus=/^eseguito\b/.test(field(text,'Status')||'');
 const lastOutcome=lane.events.filter(e=>e.kind==='message'&&!e.agent&&!e.sidechain&&e.outcome).at(-1)?.outcome||null;
 const isForeign=/jjodel.book|book repository|not jjodel.frontend|Overleaf/i.test(text.slice(0,3500));
 const chainText=(text.split(/\n## /)[0]+'\n'+text.split('\n').slice(0,3).join('\n'));
 const links=[];
 // Only explicit continuation links in header/title or matched task log descriptions; ordinary Depends does not join tasks.
 for(const match of chainText.matchAll(ID)){if(match[0]!==id&&continuation(chainText)&&!/^Depends:\s*none/m.test(chainText))links.push({id:match[0],source:p?.path,reason:'continuation header'});}
 for(const e of records){const line=e.text.match(/^\*\*Prompt\*\*:\s*(.*)/m)?.[1]||'';if(continuation(line))for(const match of line.matchAll(ID)){if(match[0]!==id)links.push({id:match[0],source:e.path,reason:'continuation log description'});}}
 const seenDup=[];for(const c of stream.calls){if(!c.sessionId||!c.messageId)continue;const k=c.sessionId+'/'+c.messageId;if(callOwners.has(k)&&callOwners.get(k)!==id)seenDup.push(callOwners.get(k));else callOwners.set(k,id);}
 const invalid=lane.diagnostics.length>0||stream.diagnostics.some(d=>['MESSAGE_ID_MISSING','MESSAGE_ID_CONFLICT'].includes(d.code));
 const eligible=!invalid&&rec.inputEqual&&rec.baselineTechnicalTotal!==null;
 const modelNames=Object.keys(stream.byModel).sort();
 const mainModels=[...new Set(main.map(c=>c.model))].sort();
 const byteOffset=lane.artifacts.runs?.at(-1)?.logFrom??0;
 rows.push({id,period:period(id),prompt:p?.path||null,fallback,front,kind:kind(declared),title:text.split('\n').find(l=>l.startsWith('# '))||null,
 strategy:/Phase 1/i.test(text)&&/Phase 2/i.test(text)?'two-phase':'other',foreign:isForeign,declaredContinuation:continuation(chainText),
 mainModels,modelNames,calls:main.length,subCalls:stream.calls.length-main.length,inputMain:['input','cacheRead','cacheCreation'].every(k=>Number.isSafeInteger(stream.main[k]))?stream.main.input+stream.main.cacheRead+stream.main.cacheCreation:null,
 inputAll:['input','cacheRead','cacheCreation'].every(k=>Number.isSafeInteger(stream.all[k]))?stream.all.input+stream.all.cacheRead+stream.all.cacheCreation:null,technicalTotal:eligible?rec.baselineTechnicalTotal:null,reconciled:eligible,
 peak:contexts.length?Math.max(...contexts):null,overHard:contexts.filter(c=>c>=250000).length,initEvents:inits.length,distinctSessions:new Set(inits.map(e=>e.sessionId).filter(Boolean)).size,
 ledgerRuns:lane.artifacts.runs?.length??null,hasHandoff:existsSync(join(root,id,'handoff.md')),resultCount:results.length,
 runtimeMinutes:results.length&&results.every(e=>e.durationMs!==null)?sum(results.map(e=>e.durationMs))/60000:null,
 outcome:lastOutcome,latestRangeOutcome:lane.events.filter(e=>e.kind==='message'&&!e.agent&&!e.sidechain&&e.outcome&&e.source.byteStart>=byteOffset).at(-1)?.outcome||null,
 statusDone:doneStatus,logRecords:records.length,declaredCorrection:records.some(e=>e.target),links,
 diagnostics:[...new Set([...lane.diagnostics,...stream.diagnostics,...rec.diagnostics].map(d=>d.code))],duplicateOwners:[...new Set(seenDup)],sourceHashes:lane.sources.filter(s=>/log.jsonl$|runs.jsonl$/.test(s.path)).map(s=>({path:s.path,sha256:s.sha256}))});
 }catch(e){errors.push({id,error:e.message});}
}
const stats=rs=>({n:rs.length,peakMedian:median(rs.map(r=>r.peak)),inputAllMedian:median(rs.map(r=>r.inputAll)),reconciled:rs.filter(r=>r.reconciled).length,
 technicalMedian:median(rs.map(r=>r.technicalTotal)),runtimeN:rs.filter(r=>r.runtimeMinutes!==null).length,runtimeMedian:median(rs.map(r=>r.runtimeMinutes)),
 multiInit:rs.filter(r=>r.initEvents>1).length,doneOutcome:rs.filter(r=>r.outcome==='done').length,statusDone:rs.filter(r=>r.statusDone).length,
 declaredCorrection:rs.filter(r=>r.declaredCorrection).length,handoffs:rs.filter(r=>r.hasHandoff).length});
const base=rows.filter(r=>r.calls>0&&!r.foreign&&r.kind!=='merge'&&r.kind!=='unknown'&&r.mainModels.length===1&&r.mainModels[0]==='claude-opus-5-5'&&r.duplicateOwners.length===0);
const strata=[];for(const k of [...new Set(base.map(r=>(r.front||'missing')+'|'+r.kind))].sort()){
 const rs=base.filter(r=>(r.front||'missing')+'|'+r.kind===k),b=rs.filter(r=>r.period==='before'),a=rs.filter(r=>r.period==='after');
 if(b.length>=5&&a.length>=5)strata.push({key:k,before:stats(b),after:stats(a),ids:{before:b.map(r=>r.id),after:a.map(r=>r.id)}});
}
// Connected components of explicit continuation edges only, with ordinary dependencies excluded.
const byId=new Map(rows.map(r=>[r.id,r])),parent=new Map(rows.map(r=>[r.id,r.id]));
const find=x=>{while(parent.get(x)!==x)x=parent.get(x);return x};
const links=[];for(const r of rows)for(const l of r.links)if(byId.has(l.id)&&r.period===byId.get(l.id).period&&r.foreign===byId.get(l.id).foreign&&r.kind!=='merge'&&byId.get(l.id).kind!=='merge'){
 const a=find(r.id),b=find(l.id);if(a!==b)parent.set(a<b?b:a,a<b?a:b);links.push({from:r.id,to:l.id,source:l.source,reason:l.reason});}
const groups=new Map();for(const r of rows){const k=find(r.id);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
const clusters=[...groups].filter(([k,g])=>g.length>1).map(([id,g])=>({id,ids:g.map(r=>r.id),period:g[0].period,fronts:[...new Set(g.map(r=>r.front))],calls:sum(g.map(r=>r.calls)),inputAll:sum(g.map(r=>r.inputAll)),technicalTotal:g.every(r=>r.reconciled)&&g.every(r=>r.duplicateOwners.length===0)?sum(g.map(r=>r.technicalTotal)):null,runtimeMinutes:g.every(r=>r.runtimeMinutes!==null)?sum(g.map(r=>r.runtimeMinutes)):null,statusDone:g.some(r=>r.statusDone),maxPeak:Math.max(...g.map(r=>r.peak||0))}));
const correctionEdges=entries.filter(e=>e.target&&e.id&&(byId.has(e.id)||byId.has(e.target))).map(e=>({from:e.id,to:e.target,path:e.path,heading:e.heading,continuation:continuation(e.text.match(/^\*\*Prompt\*\*:\s*(.*)/m)?.[1]||'')}));
const mature=base.filter(r=>r.period==='before'||r.id<'P-2026-10-30');
const stamp=id=>Date.parse(id.slice(2,12)+'T'+id.slice(-4,-2)+':'+id.slice(-2)+':00Z');
const correction7=mature.map(r=>({id:r.id,period:r.period,edges:correctionEdges.filter(e=>e.to===r.id&&stamp(e.from)>=stamp(r.id)&&stamp(e.from)-stamp(r.id)<=7*86400000)}));
assert.equal(rows.filter(r=>r.period==='before').length+rows.filter(r=>r.period==='after').length,rows.length);
assert.ok(strata.every(s=>s.before.n>=5&&s.after.n>=5));
const groupedStrata=strata.map(s=>({key:s.key,...Object.fromEntries(['before','after'].map(p=>{const g=new Map();for(const id of s.ids[p]){const c=clusters.find(c=>c.ids.includes(id));g.set(c?.id||id,c||byId.get(id));}const list=[...g.values()];return [p,{groups:list.length,technicalMedian:median(list.map(r=>r.technicalTotal)),runtimeMedian:median(list.map(r=>r.runtimeMinutes)),ids:list.map(r=>r.ids||[r.id])}];}))}));
const breachDetails=rows.filter(r=>r.period==='after'&&r.peak>=250000).map(r=>{
 const raw=readFileSync(join(root,r.id,'log.jsonl'),'utf8');const denials=[];
 for(const line of raw.split('\n')){if(!line.trim())continue;let e;try{e=JSON.parse(line);}catch{continue;}if(e.type!=='user')continue;const text=JSON.stringify(e.message?.content||e.content||'');
 if(text.includes('context-ceiling:'))denials.push({soft:text.includes('at or above the soft ceiling'),hard:text.includes('at or above the hard ceiling'),measured:Number(text.match(/context is (\d+) tokens/)?.[1])||null});}
 assert.equal(hash(raw),r.sourceHashes.find(s=>s.path.endsWith('/log.jsonl'))?.sha256,'breach source changed during audit');
 return {id:r.id,peak:r.peak,foreign:r.foreign,denials,distinctSessions:r.distinctSessions,initEvents:r.initEvents,handoff:r.hasHandoff,logHash:hash(raw)};
});
const outputRows=rows.map(({links,sourceHashes,...r})=>({...r,logHash:sourceHashes.find(s=>s.path.endsWith('/log.jsonl'))?.sha256}));
console.log(JSON.stringify({method:{version:1,windows:{before:['2026-10-10','2026-10-17'],after:['2026-10-19','2026-11-05']},matching:'same declared front and kind, main Opus only, >=5 each, foreign and duplicate archives excluded',acceptance:'unknown: outcome/status are proxies only',cost:'technical tokens, not subscription dollars; reconciled observed stream+CLI, not complete history',runtime:'sum of non-notification CLI result duration_ms, not elapsed time to acceptance',continuation:'explicit header/log links only; incomplete, inspect components',sourcesFingerprint:hash(JSON.stringify(sources)),sourcesCount:sources.length},errors,duplicatePromptIds:[...prompts].filter(([id,ps])=>ps.length>1).map(([id,ps])=>({id,paths:ps.map(p=>p.path)})),
 coverage:{before:stats(rows.filter(r=>r.period==='before'&&r.calls)),after:stats(rows.filter(r=>r.period==='after'&&r.calls)),baseBefore:stats(base.filter(r=>r.period==='before')),baseAfter:stats(base.filter(r=>r.period==='after')),foreign:rows.filter(r=>r.foreign).map(r=>r.id),duplicateArchives:rows.filter(r=>r.duplicateOwners.length).map(r=>({id:r.id,owners:r.duplicateOwners}))},strata,
 breaches:breachDetails,clusters,links:[...new Map(links.map(l=>[l.from+'|'+l.to+'|'+l.source,l])).values()],groupedStrata,correctionEdges,correction7,rows:outputRows},null,2));
