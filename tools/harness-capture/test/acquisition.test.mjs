import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import fsDefault from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { syncBuiltinESMExports } from 'node:module';
import childProcess from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { acquire, verifySnapshot, sha256, encode, LIMITS } from '../acquisition.mjs';
import { runCli } from '../cli.mjs';

const fixtures = JSON.parse(fs.readFileSync(new URL('./fixtures.json', import.meta.url)));
function environment(id = 'single') {
  const root = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), 'harness-capture-test-')));
  const sourceRoot = join(root, 'sources'); const destination = join(root, 'diagnostic');
  fs.mkdirSync(sourceRoot); const laneDir = join(sourceRoot, fixtures.lane); fs.mkdirSync(laneDir);
  const files = fixtures.cases.find(item => item.id === id).files;
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(join(laneDir, name), text);
  const options = { sourceRoot, lane: fixtures.lane, destination };
  return { root, sourceRoot, laneDir, destination, options, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
function withEnvironment(id, fn) {
  const env = environment(id); try { return fn(env); } finally { env.cleanup(); }
}
const source = (result, name) => result.manifest.sources.find(item => item.name === name);
function tree(dir) {
  const result = {};
  for (const name of fs.readdirSync(dir).sort()) {
    const path = join(dir, name); const stat = fs.lstatSync(path);
    result[name] = stat.isDirectory() ? tree(path) : stat.isSymbolicLink() ? { symlink: fs.readlinkSync(path) } : sha256(fs.readFileSync(path));
  }
  return result;
}

for (const id of ['single','resume','chain','missing-ledger','ambiguous','incomplete','malformed-ledger','empty','dedup']) {
  test(`fixture ${id}: capture and verify stored content`, () => withEnvironment(id, env => {
    const result = acquire(env.options);
    assert.equal(result.manifest.schema_version, 1);
    assert.equal(verifySnapshot({ destination: env.destination, manifestSha256: result.manifest_sha256 }).verified, true);
    assert.equal(result.manifest.temporal.status, 'unverified');
    assert.equal(result.manifest.temporal.acc_judgment, 'not_produced');
    assert.equal(result.manifest.lane.invocation, null);
    for (const item of result.manifest.sources) {
      assert.equal(item.invocation, null); assert.equal(item.session, null); assert.equal(item.git_revision, null);
      if (item.preservation === 'full') assert.equal(sha256(fs.readFileSync(join(env.destination, 'blobs', item.sha256))), item.sha256);
    }
  }));
}
test('resume session remains a ledger reference, never an invented input binding', () => withEnvironment('resume', env => {
  const result = acquire(env.options);
  assert.equal(result.manifest.lane.runs.length, 2);
  assert.equal(result.manifest.lane.runs[1].kind, 'resume');
  assert.equal(result.manifest.lane.runs[1].session, 'session-a');
  assert.equal(result.manifest.lane.session, null);
  assert.equal(source(result, 'input-2.md').invocation, null);
}));
test('chain is preserved as declared run kind', () => withEnvironment('chain', env => {
  assert.equal(acquire(env.options).manifest.lane.runs[0].kind, 'chain');
}));
test('reused directory preserves competing task and session references', () => withEnvironment('ambiguous', env => {
  const identity = acquire(env.options).manifest.lane;
  assert.equal(identity.task, null); assert.equal(identity.session, null);
  assert.deepEqual(identity.session_candidates, ['session-a', 'session-b']);
  assert.ok(identity.anomalies.some(item => item.code === 'task_identity_ambiguous'));
  assert.ok(identity.anomalies.some(item => item.code === 'session_identity_ambiguous'));
}));
test('partial ledger retained as bytes but last unterminated row not interpreted', () => withEnvironment('incomplete', env => {
  const result = acquire(env.options);
  assert.equal(result.manifest.lane.runs.length, 1);
  assert.ok(result.manifest.lane.anomalies.some(item => item.code === 'partial_ledger_line'));
  assert.equal(source(result, 'runs.jsonl').preservation, 'full');
}));
test('malformed complete row is an anomaly', () => withEnvironment('malformed-ledger', env => {
  assert.ok(acquire(env.options).manifest.lane.anomalies.some(item => item.code === 'malformed_ledger_line'));
}));
test('missing ledger is explicit', () => withEnvironment('missing-ledger', env => {
  const result = acquire(env.options);
  assert.equal(source(result, 'runs.jsonl').status, 'missing');
  assert.ok(result.manifest.lane.anomalies.some(item => item.code === 'ledger_unavailable'));
}));
test('worktree and external prompt are references only, never dereferenced', () => withEnvironment('single', env => {
  const result = acquire(env.options);
  assert.equal(result.manifest.lane.worktree, '/not-followed/removed-worktree');
  assert.equal(result.manifest.lane.prompt_path, '/not-followed/external-prompt.md');
  assert.equal(result.manifest.sources.length, 7);
}));
test('dedup and repeated snapshots preserve semantic manifest', () => withEnvironment('dedup', env => {
  const first = acquire(env.options); const second = acquire(env.options);
  assert.equal(source(first,'input-1.md').sha256, source(first,'input-2.md').sha256);
  assert.equal(fs.readdirSync(join(env.destination,'blobs')).length, 1);
  assert.equal(first.manifest_sha256, second.manifest_sha256);
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(second.observation.overhead.new_content_bytes, 0);
  assert.notEqual(first.observation_sha256, second.observation_sha256);
}));
test('source files and metadata remain unchanged by capture', () => withEnvironment('resume', env => {
  const before = tree(env.sourceRoot); acquire(env.options); assert.deepEqual(tree(env.sourceRoot), before);
}));
test('unlisted credential and conversational filenames never read', () => withEnvironment('single', env => {
  fs.symlinkSync('/does-not-exist', join(env.laneDir,'.env'));
  fs.symlinkSync('/does-not-exist', join(env.laneDir,'log.jsonl'));
  const result = acquire(env.options);
  assert.equal(result.manifest.sources.some(item => ['.env','log.jsonl'].includes(item.name)), false);
}));
test('file mutates after read: retry captures the stable replacement and retains anomaly', () => withEnvironment('single', env => {
  const file = join(env.laneDir,'input-1.md');
  const result = acquire({ ...env.options, hooks: { afterRead: ({ name, attempt }) => {
    if (name === 'input-1.md' && attempt === 0) fs.appendFileSync(file,'changed\n');
  } } });
  assert.equal(source(result,'input-1.md').status,'acquired');
  assert.equal(source(result,'input-1.md').attempts,2);
  assert.deepEqual(source(result,'input-1.md').anomalies,['source_changed']);
  assert.equal(source(result,'input-1.md').sha256,sha256(fs.readFileSync(file)));
}));
test('same-size inode replacement is detected', () => withEnvironment('single', env => {
  const file = join(env.laneDir,'input-1.md'); const original = fs.readFileSync(file);
  const result = acquire({ ...env.options, maxRetries:0, hooks: { afterRead: ({ name }) => {
    if (name === 'input-1.md') { fs.unlinkSync(file); fs.writeFileSync(file,original); }
  } } });
  assert.equal(source(result,'input-1.md').status,'source_changed');
  assert.equal(source(result,'input-1.md').preservation,'unavailable');
}));
test('truncation during chunked read is detected', () => withEnvironment('single', env => {
  const file = join(env.laneDir,'input-1.md'); fs.writeFileSync(file,'A'.repeat(100000));
  let done = false;
  const result = acquire({ ...env.options, maxRetries:0, hooks: { afterChunk: ({ name }) => {
    if (name === 'input-1.md' && !done) { done = true; fs.truncateSync(file,10); }
  } } });
  assert.equal(source(result,'input-1.md').status,'source_changed');
}));
test('repeated mutations stop at bounded retry limit', () => withEnvironment('single', env => {
  const file = join(env.laneDir,'input-1.md');
  const result = acquire({ ...env.options, hooks: { afterRead: ({ name }) => { if (name === 'input-1.md') fs.appendFileSync(file,'X'); } } });
  assert.equal(source(result,'input-1.md').attempts,3);
  assert.equal(source(result,'input-1.md').status,'source_changed');
  assert.equal(result.observation.overhead.retries,2);
}));
test('interrupted partial input remains completeness unknown; later capture is a distinct snapshot', () => withEnvironment('incomplete', env => {
  const first = acquire(env.options);
  assert.equal(source(first,'input-1.md').completeness,'unknown');
  fs.appendFileSync(join(env.laneDir,'input-1.md'),' completed\n');
  const second = acquire(env.options);
  assert.notEqual(first.manifest_sha256,second.manifest_sha256);
  assert.equal(verifySnapshot({destination:env.destination,manifestSha256:first.manifest_sha256}).verified,true);
}));
test('source symlink to unauthorized target is not followed', () => withEnvironment('single', env => {
  const file = join(env.laneDir,'input-1.md'); fs.unlinkSync(file); fs.symlinkSync('/etc/passwd',file);
  const item = source(acquire(env.options),'input-1.md');
  assert.equal(item.status,'symlink_source'); assert.equal(item.sha256,null);
}));
test('symlink lane directory rejected before capture', () => withEnvironment('single', env => {
  const moved = join(env.root,'moved');fs.renameSync(env.laneDir,moved);fs.symlinkSync(moved,env.laneDir);
  assert.throws(()=>acquire(env.options),/unsafe_directory/);
  assert.equal(fs.existsSync(env.destination),false);
}));
test('traversal and invalid lane rejected', () => withEnvironment('single', env => {
  assert.throws(()=>acquire({...env.options,lane:'../other'}),/invalid_lane/);
  assert.throws(()=>acquire({...env.options,sourceRoot:env.sourceRoot+'/../sources'}),/invalid_path/);
  assert.throws(()=>acquire({...env.options,destination:env.root+'/../escape'}),/invalid_path/);
}));
test('overlapping destination rejected before source contents or storage writes', () => withEnvironment('single', env => {
  assert.throws(()=>acquire({...env.options,destination:join(env.sourceRoot,'storage')}),/overlapping_storage/);
  assert.equal(fs.existsSync(join(env.sourceRoot,'storage')),false);
}));
test('destination within Git repository rejected', () => withEnvironment('single', env => {
  const repo = join(env.root,'repo');fs.mkdirSync(repo);fs.mkdirSync(join(repo,'.git'));
  assert.throws(()=>acquire({...env.options,destination:join(repo,'output')}),/repository_storage/);
}));
test('destination symlink and storage child symlink rejected', () => withEnvironment('single', env => {
  const other = join(env.root,'other');fs.mkdirSync(other);fs.symlinkSync(other,env.destination);
  assert.throws(()=>acquire(env.options),/unsafe_directory/);fs.unlinkSync(env.destination);
  fs.mkdirSync(env.destination);fs.symlinkSync(other,join(env.destination,'blobs'));
  assert.throws(()=>acquire(env.options),/unsafe_directory/);
}));
test('oversized file and directory artifact are not acquired', () => withEnvironment('empty', env => {
  fs.writeFileSync(join(env.laneDir,'input-1.md'),'A'.repeat(LIMITS.fileBytes+1));
  fs.mkdirSync(join(env.laneDir,'input-2.md'));
  const result=acquire(env.options);
  assert.equal(source(result,'input-1.md').status,'file_too_large');
  assert.equal(source(result,'input-2.md').status,'not_regular_file');
}));
test('global source-read budget is bounded', () => withEnvironment('empty', env => {
  for(let i=1;i<=10;i++)fs.writeFileSync(join(env.laneDir,`input-${i}.md`),'A'.repeat(LIMITS.fileBytes));
  const result=acquire(env.options);
  assert.ok(result.observation.overhead.bytes_read<=LIMITS.totalBytes+1);
  assert.ok(result.manifest.sources.some(item=>item.status==='read_budget_exceeded'));
}));
test('input count is bounded before creating storage', () => withEnvironment('empty', env => {
  for(let i=1;i<=LIMITS.inputs+1;i++)fs.writeFileSync(join(env.laneDir,`input-${i}.md`),'');
  assert.throws(()=>acquire(env.options),/too_many_inputs/); assert.equal(fs.existsSync(env.destination),false);
}));
test('corrupt blob is detected and never overwritten', () => withEnvironment('single', env => {
  const result=acquire(env.options);const file=join(env.destination,'blobs',source(result,'input-1.md').sha256);
  fs.writeFileSync(file,'corrupt');
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256}),/storage_hash_mismatch/);
  assert.throws(()=>acquire(env.options),/storage_hash_mismatch/);assert.equal(fs.readFileSync(file,'utf8'),'corrupt');
}));
test('corrupt manifest is detected on verification and reacquisition', () => withEnvironment('single', env => {
  const result=acquire(env.options);const file=join(env.destination,'manifests',result.manifest_sha256);fs.writeFileSync(file,'{}');
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256}),/storage_hash_mismatch/);
  assert.throws(()=>acquire(env.options),/storage_hash_mismatch/);
}));
test('valid hash with invalid manifest schema rejected', () => withEnvironment('single', env => {
  acquire(env.options);const bytes=Buffer.from('{"schema_version":99}');const digest=sha256(bytes);
  fs.writeFileSync(join(env.destination,'manifests',digest),bytes);
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:digest}),/invalid_manifest/);
}));
test('snapshot length mismatch rejected even if manifest hash is correct', () => withEnvironment('single', env => {
  const result=acquire(env.options);const manifest=structuredClone(result.manifest);manifest.sources[0].bytes_acquired++;
  const bytes=Buffer.from(encode(manifest));const digest=sha256(bytes);fs.writeFileSync(join(env.destination,'manifests',digest),bytes);
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:digest}),/snapshot_length_mismatch/);
}));
test('malicious storage reference cannot traverse', () => withEnvironment('single', env => {
  acquire(env.options);assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:'../other'}),/invalid_storage_reference/);
}));
test('symlink blob rejected without reading target', () => withEnvironment('single', env => {
  const result=acquire(env.options);const file=join(env.destination,'blobs',source(result,'input-1.md').sha256);
  fs.unlinkSync(file);fs.symlinkSync('/etc/passwd',file);
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256}),/unsafe_storage_file/);
}));
test('orphan temp from interrupted publication does not overwrite a snapshot', () => withEnvironment('single', env => {
  const first=acquire(env.options);const orphan=join(env.destination,'blobs','.interrupted.tmp');fs.writeFileSync(orphan,'partial');
  const second=acquire(env.options);assert.equal(first.manifest_sha256,second.manifest_sha256);assert.equal(fs.readFileSync(orphan,'utf8'),'partial');
}));
test('temporal indicators never promote acquisition to pre-coding verified', () => withEnvironment('single', env => {
  fs.writeFileSync(join(env.laneDir,'started.txt'),'9999999999999');
  const temporal=acquire(env.options).manifest.temporal;
  assert.equal(temporal.status,'unverified');assert.equal(temporal.acquisition_vs_spawn,'unverified');assert.equal(temporal.acquisition_vs_coding,'unverified');
}));
test('manifest bytes reproducible; timestamps and resource metrics outside manifest', () => withEnvironment('single', env => {
  const first=acquire(env.options);const second=acquire(env.options);
  assert.equal(encode(first.manifest),encode(second.manifest));assert.equal('observed_at' in first.manifest,false);
  assert.equal('overhead' in first.manifest,false);assert.equal(first.observation.overhead.llm_calls,0);
}));
test('CLI capture and verify are explicit machine-readable operations', () => withEnvironment('single', env => {
  let text='';assert.equal(runCli(['capture','--source-root',env.sourceRoot,'--lane',fixtures.lane,'--destination',env.destination],s=>text+=s),0);
  const result=JSON.parse(text);let verified='';
  assert.equal(runCli(['verify','--destination',env.destination,'--manifest',result.manifest_sha256],s=>verified+=s),0);
  assert.equal(JSON.parse(verified).verified,true);
}));
test('CLI refuses missing, duplicate, unknown and conflicting options', () => {
  for(const args of [[],['capture'],['watch'],['capture','--source-root','/tmp','--source-root','/tmp'],['verify','--destination','/tmp','--manifest','0'.repeat(64),'--lane',fixtures.lane]]) {
    let text='';assert.equal(runCli(args,s=>text+=s),2);assert.ok(JSON.parse(text).error);
  }
});
test('invalid retry bounds rejected', () => withEnvironment('single', env => {
  for(const maxRetries of [-1,3,NaN,0.5])assert.throws(()=>acquire({...env.options,maxRetries}),/invalid_retries/);
}));
test('no operational writes, child processes, network or watchers during capture', () => withEnvironment('single', env => {
  const undo=[];const deny=()=>{throw new Error('forbidden_effect');};
  const patch=(obj,names)=>{for(const name of names){const old=obj[name];obj[name]=deny;undo.push(()=>obj[name]=old);}};
  patch(childProcess,['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']);
  patch(net,['connect','createConnection','createServer']);patch(net.Socket.prototype,['connect']);
  patch(http,['request','get','createServer']);patch(https,['request','get','createServer']);patch(globalThis,['fetch','setInterval']);
  patch(fsDefault,['watch','watchFile']);
  const authorizedWrite=path=>assert.ok(String(path)===env.destination || String(path).startsWith(env.destination+'/'),'write outside diagnostic storage');
  for(const name of ['mkdirSync','unlinkSync']){const previous=fsDefault[name];fsDefault[name]=(path,...rest)=>{authorizedWrite(path);return previous(path,...rest);};undo.push(()=>fsDefault[name]=previous);}
  const previousLink=fsDefault.linkSync;fsDefault.linkSync=(from,to)=>{authorizedWrite(from);authorizedWrite(to);return previousLink(from,to);};undo.push(()=>fsDefault.linkSync=previousLink);
  const oldOpen=fsDefault.openSync;
  fsDefault.openSync=(path,flags,...rest)=>{
    const writes=typeof flags==='string'?/[wa+]/.test(flags):Boolean(flags&(fs.constants.O_WRONLY|fs.constants.O_RDWR|fs.constants.O_CREAT|fs.constants.O_TRUNC));
    if(writes)authorizedWrite(path);
    else assert.ok(String(path).startsWith(env.laneDir+'/') || String(path).startsWith(env.destination+'/'),'read outside authorized contents');
    return oldOpen(path,flags,...rest);
  };undo.push(()=>fsDefault.openSync=oldOpen);syncBuiltinESMExports();
  try {const result=acquire(env.options);assert.equal(result.observation.overhead.llm_calls,0);verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256});}
  finally {for(const restore of undo.reverse())restore();syncBuiltinESMExports();}
}));

test('operational source root explicitly refused before scanning', () => {
  const home = process.env.HOME;
  assert.throws(()=>acquire({sourceRoot:join(home,'.jjodel-lanes'),lane:fixtures.lane,destination:'/private/tmp/not-created-capture'}),/operational_source/);
});
test('same-content concurrent publication is deduplicated without replacement', () => withEnvironment('single', env => {
  const oldLink=fsDefault.linkSync; let raced=false;
  fsDefault.linkSync=(from,to)=>{
    if(!raced && to.includes('/blobs/')){raced=true;fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}
    return oldLink(from,to);
  };syncBuiltinESMExports();
  try {const result=acquire(env.options);assert.equal(raced,true);assert.equal(verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256}).verified,true);}
  finally {fsDefault.linkSync=oldLink;syncBuiltinESMExports();}
}));
test('different content racing publication is preserved and rejected', () => withEnvironment('single', env => {
  const oldLink=fsDefault.linkSync; let poisoned;
  fsDefault.linkSync=(from,to)=>{
    if(!poisoned && to.includes('/blobs/')){poisoned=to;fs.writeFileSync(to,'racing invalid content',{flag:'wx'});}
    return oldLink(from,to);
  };syncBuiltinESMExports();
  try {assert.throws(()=>acquire(env.options),/storage_hash_mismatch/);assert.equal(fs.readFileSync(poisoned,'utf8'),'racing invalid content');}
  finally {fsDefault.linkSync=oldLink;syncBuiltinESMExports();}
}));
test('short filesystem reads are accumulated until EOF', () => withEnvironment('single', env => {
  const oldRead=fsDefault.readSync;
  fsDefault.readSync=(fd,buffer,offset,length,position)=>oldRead(fd,buffer,offset,Math.min(length,3),position);syncBuiltinESMExports();
  try {const result=acquire(env.options);assert.equal(source(result,'input-1.md').sha256,sha256(fs.readFileSync(join(env.laneDir,'input-1.md'))));}
  finally {fsDefault.readSync=oldRead;syncBuiltinESMExports();}
}));
test('premature EOF is never published as a complete source', () => withEnvironment('single', env => {
  const oldRead=fsDefault.readSync;let count=0;
  fsDefault.readSync=(fd,buffer,offset,length,position)=>{count++;return count===2?0:oldRead(fd,buffer,offset,Math.min(length,3),position);};syncBuiltinESMExports();
  try {const result=acquire({...env.options,maxRetries:0});assert.equal(source(result,'input-1.md').status,'source_changed');assert.equal(source(result,'input-1.md').preservation,'unavailable');}
  finally {fsDefault.readSync=oldRead;syncBuiltinESMExports();}
}));
test('completion receipt includes observation publication overhead', () => withEnvironment('single', env => {
  const result=acquire(env.options);assert.ok(result.completion.duration_ms>=result.observation.overhead.duration_ms);
  assert.ok(result.completion.storage_bytes_written>result.observation.overhead.storage_bytes_written_before_observation);
}));
test('manifest traversal in descriptive source path is rejected even with matching digest', () => withEnvironment('single', env => {
  const result=acquire(env.options);const manifest=structuredClone(result.manifest);manifest.sources[0].path='../other';
  const bytes=Buffer.from(encode(manifest));const digest=sha256(bytes);fs.writeFileSync(join(env.destination,'manifests',digest),bytes);
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:digest}),/invalid_manifest/);
}));
test('observation envelope and its manifest binding are independently verifiable', () => withEnvironment('single', env => {
  const result=acquire(env.options);
  const verified=verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256,observationSha256:result.observation_sha256});
  assert.equal(verified.observation_sha256,result.observation_sha256);
  const file=join(env.destination,'observations',result.observation_sha256);fs.writeFileSync(file,'corrupt');
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256,observationSha256:result.observation_sha256}),/storage_hash_mismatch/);
}));
test('observation for another manifest is rejected', () => withEnvironment('single', env => {
  const result=acquire(env.options);const observation=structuredClone(result.observation);observation.manifest_sha256='0'.repeat(64);
  const bytes=Buffer.from(encode(observation));const digest=sha256(bytes);fs.writeFileSync(join(env.destination,'observations',digest),bytes);
  assert.throws(()=>verifySnapshot({destination:env.destination,manifestSha256:result.manifest_sha256,observationSha256:digest}),/invalid_observation/);
}));

function prepareHistorical(env, pid = 2147483647) {
  const began = Date.now() - 10000;
  fs.writeFileSync(join(env.laneDir,'pid.txt'),String(pid)+'\n');
  fs.writeFileSync(join(env.laneDir,'started.txt'),String(began)+'\n');
  fs.writeFileSync(join(env.laneDir,'exit.txt'),'0\n');
  for(const name of ['pid.txt','started.txt'])fs.utimesSync(join(env.laneDir,name),began/1000,began/1000);
  fs.utimesSync(join(env.laneDir,'exit.txt'),(began+9000)/1000,(began+9000)/1000);
  return {...env.options,allowHistoricalLane:env.laneDir};
}
test('historical mode: concluded wrapper requires completion markers and absent process',()=>withEnvironment('single',env=>{
  const options=prepareHistorical(env);const before=tree(env.sourceRoot);const result=acquire(options);
  assert.equal(result.manifest.historical_acquisition.state,'concluded_observed_wrapper');
  assert.equal(result.manifest.temporal.status,'unverified');assert.deepEqual(tree(env.sourceRoot),before);
}));
test('historical mode: live PID remains potentially active despite exit marker',()=>withEnvironment('single',env=>{
  assert.throws(()=>acquire(prepareHistorical(env,process.pid)),/historical_potentially_active/);
  assert.equal(fs.existsSync(env.destination),false);
}));
test('historical mode: missing PID is unknown, not concluded',()=>withEnvironment('single',env=>{
  const options=prepareHistorical(env);fs.unlinkSync(join(env.laneDir,'pid.txt'));
  assert.throws(()=>acquire(options),/historical_state_unknown/);
}));
test('historical mode: missing exit or stale exit chronology is unknown',()=>withEnvironment('single',env=>{
  const options=prepareHistorical(env);fs.utimesSync(join(env.laneDir,'exit.txt'),1,1);
  assert.throws(()=>acquire(options),/historical_state_unknown/);fs.unlinkSync(join(env.laneDir,'exit.txt'));
  assert.throws(()=>acquire(options),/historical_state_unknown/);
}));
test('historical mode: process probe permission failure is unknown',()=>withEnvironment('single',env=>{
  const options=prepareHistorical(env);const previous=process.kill;
  process.kill=()=>{const error=new Error('denied');error.code='EPERM';throw error;};
  try{assert.throws(()=>acquire(options),/historical_state_unknown/);}finally{process.kill=previous;}
}));
test('historical mode: capability authorizes only the explicitly selected directory',()=>withEnvironment('single',env=>{
  const options=prepareHistorical(env);
  for(const allowHistoricalLane of [env.sourceRoot,env.laneDir+'-other',env.laneDir+'/../other'])
    assert.throws(()=>acquire({...options,allowHistoricalLane}),/historical_lane_not_authorized|invalid_path/);
}));
test('historical mode preserves ambiguous task and session identities',()=>withEnvironment('ambiguous',env=>{
  const result=acquire(prepareHistorical(env));assert.equal(result.manifest.lane.task,null);assert.equal(result.manifest.lane.session,null);
  assert.ok(result.manifest.lane.anomalies.some(x=>x.code==='task_identity_ambiguous'));
}));
test('historical mode rejects an invocation restarting during acquisition',()=>withEnvironment('single',env=>{
  const options=prepareHistorical(env);options.hooks={afterRead:({name})=>{if(name==='input-1.md')fs.writeFileSync(join(env.laneDir,'pid.txt'),String(process.pid));}};
  assert.throws(()=>acquire(options),/historical_potentially_active|historical_state_changed/);
  assert.equal(fs.existsSync(join(env.destination,'manifests'))?fs.readdirSync(join(env.destination,'manifests')).length:0,0);
}));
test('historical CLI requires an exact lane path capability and preserves source bytes',()=>withEnvironment('single',env=>{
  prepareHistorical(env);const before=tree(env.sourceRoot);let output='';
  assert.equal(runCli(['capture','--source-root',env.sourceRoot,'--lane',fixtures.lane,'--destination',env.destination,'--allow-historical-lane',env.laneDir],s=>output+=s),0);
  assert.equal(JSON.parse(output).manifest.historical_acquisition.process_probe,'ESRCH');assert.deepEqual(tree(env.sourceRoot),before);
}));
