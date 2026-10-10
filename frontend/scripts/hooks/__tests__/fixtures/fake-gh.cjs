// A fake `gh` for the tracking tests of lane-tracking.mjs and lane-run.mjs
// (RC-44): it records its argv, one JSON array per line, in
// $FAKE_GH_STATE/gh-calls.jsonl, and answers the calls syncCard makes from a
// state of issues, Project items and milestones kept in $FAKE_GH_STATE/gh.json.
// Run through a /bin/sh wrapper the tests write (exec node fake-gh.cjs "$@").
//
//   FAKE_GH_MODE=fail      every call exits 1, as with no network
//   FAKE_GH_MODE=noscope   every `gh project` call exits 1 with gh's missing-scope error
//   FAKE_GH_CREATE_MS=<n>  `gh issue create` waits n ms first (the lock test)

'use strict';
const fs = require('node:fs');
const path = require('node:path');

const dir = process.env.FAKE_GH_STATE;
const args = process.argv.slice(2);
fs.appendFileSync(path.join(dir, 'gh-calls.jsonl'), JSON.stringify(args) + '\n');

const stateFile = path.join(dir, 'gh.json');
const MILESTONES = ['maintenance', 'harness', 'codegen-pilot', 'simulator', 'standalone-editor', 'graphvertex', 'release-3-2'];
const load = () => {
    try {
        return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch {
        return { issues: [], items: {}, status: {}, milestones: MILESTONES.map((title, i) => ({ number: i + 1, title, state: 'open' })) };
    }
};
const save = (s) => fs.writeFileSync(stateFile, JSON.stringify(s, null, 1));
const opt = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? null : args[i + 1];
};
const fail = (text) => {
    process.stderr.write(text + '\n');
    process.exit(1);
};
const out = (v) => process.stdout.write((typeof v === 'string' ? v : JSON.stringify(v)) + '\n');

if (process.env.FAKE_GH_MODE === 'fail') fail('error connecting to api.github.com');
if (process.env.FAKE_GH_MODE === 'noscope' && args[0] === 'project') {
    fail('error: your authentication token is missing required scopes [read:project]\nTo request it, run:  gh auth refresh -s read:project');
}

const s = load();
const [cmd, sub] = args;
const issue = (n) => s.issues.find((i) => i.number === Number(n)) || fail('issue ' + n + ' not found');
const milestone = (title) => {
    const m = s.milestones.find((x) => x.title === title);
    return m ? { number: m.number, title: m.title } : fail("could not add to milestone '" + title + "': not found");
};

if (cmd === 'project' && sub === 'view') out({ id: 'PVT_fake', number: Number(args[2]) });
else if (cmd === 'project' && sub === 'field-list') {
    const names = ['Backlog', 'Ready', 'In progress', 'In review', 'Done'];
    out({ fields: [{ id: 'PVTF_title', name: 'Title' }, { id: 'PVTSSF_status', name: 'Status', options: names.map((name) => ({ id: 'opt-' + name, name })) }] });
} else if (cmd === 'project' && sub === 'item-add') {
    const url = opt('--url');
    if (!s.items[url]) s.items[url] = 'PVTI_' + (Object.keys(s.items).length + 1);
    save(s);
    out({ id: s.items[url] });
} else if (cmd === 'project' && sub === 'item-edit') {
    s.status[opt('--id')] = opt('--single-select-option-id');
    save(s);
    out({});
} else if (cmd === 'api' && args.includes('PATCH')) {
    const n = Number(/milestones\/(\d+)$/.exec(args.find((a) => a.startsWith('repos/')))[1]);
    s.milestones.find((m) => m.number === n).state = 'closed';
    save(s);
    out({});
} else if (cmd === 'api') out(s.milestones);
else if (cmd === 'issue' && sub === 'list') {
    const id = (/P-\d{4}-\d{2}-\d{2}-\d{4}/.exec(opt('--search') || '') || [''])[0];
    out(s.issues.filter((i) => id && i.title.includes(id)));
} else if (cmd === 'issue' && sub === 'create') {
    const ms = Number(process.env.FAKE_GH_CREATE_MS || 0);
    if (ms) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    const t = load();
    const number = t.issues.length + 1;
    const repo = opt('--repo');
    const labels = args.flatMap((a, i) => (args[i - 1] === '--label' ? [{ name: a }] : []));
    const url = 'https://github.com/' + repo + '/issues/' + number;
    t.issues.push({ number, title: opt('--title'), url, body: opt('--body'), labels, milestone: opt('--milestone') ? milestone(opt('--milestone')) : null, state: 'OPEN' });
    save(t);
    out(url);
} else if (cmd === 'issue' && sub === 'edit') {
    const i = issue(args[2]);
    for (const l of (opt('--add-label') || '').split(',').filter(Boolean)) if (!i.labels.some((x) => x.name === l)) i.labels.push({ name: l });
    const drop = (opt('--remove-label') || '').split(',').filter(Boolean);
    i.labels = i.labels.filter((x) => !drop.includes(x.name));
    if (opt('--milestone')) i.milestone = milestone(opt('--milestone'));
    if (args.includes('--remove-milestone')) i.milestone = null;
    if (opt('--body') !== null) i.body = opt('--body');
    save(s);
    out(i.url);
} else if (cmd === 'issue' && (sub === 'close' || sub === 'reopen')) {
    issue(args[2]).state = sub === 'close' ? 'CLOSED' : 'OPEN';
    save(s);
} else fail('fake gh: unknown call ' + args.join(' '));
