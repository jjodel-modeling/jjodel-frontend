import { readFileSync, existsSync } from 'node:fs';
for (const t of process.argv.slice(2)) {
  const O = `/tmp/jjodel-mods-probe/out/${t}`;
  console.log(`== ${t} ${existsSync(O + '/run.json') ? readFileSync(O + '/run.json', 'utf8').trim() : ''}`);
  const err = existsSync(O + '/stderr.txt') ? readFileSync(O + '/stderr.txt', 'utf8').trim() : '';
  if (err) console.log('STDERR:', err.slice(0, 400));
  const rows = [];
  for (const f of ['probe.jsonl', 'settings-hook.log']) if (existsSync(`${O}/${f}`)) for (const l of readFileSync(`${O}/${f}`, 'utf8').split('\n')) if (l) rows.push(JSON.parse(l));
  rows.sort((a, b) => a.t - b.t);
  const t0 = rows.length ? rows[0].t : 0;
  for (const r of rows) { const { t, ev, mode, ...rest } = r; if (ev === 'session.measure' || ev === 'turn.start') continue; console.log(`  +${t - t0}ms ${ev} ${JSON.stringify(rest).slice(0, 330)}`); }
  for (const l of readFileSync(O + '/stream.jsonl', 'utf8').split('\n')) {
    if (!l) continue; const j = JSON.parse(l);
    if (j.type === 'user') for (const c of j.message.content || []) if (c.type === 'tool_result') console.log('  TOOL_RESULT:', JSON.stringify(c.content).slice(0, 260), 'is_error:', c.is_error);
    if (j.type === 'result') console.log('  RESULT:', j.subtype, JSON.stringify(j.result).slice(0, 260), 'denials:', (j.permission_denials || []).length);
  }
}
