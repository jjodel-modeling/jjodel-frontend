#!/usr/bin/env python3
"""Cost-per-feature measurement for the Jjodel harness (discovery 2026-09-25).
Usage: run from the repo root on alfonso-frontend-jjtl (full clone, not blobless).
Reads git history since 2026-03-01 and the log files under docs/. Read-only."""
import collections, datetime, glob, re, subprocess

def cls(path):
    if '__tests__' in path or '.test.' in path: return 'test'
    if path.startswith('docs/') or path.endswith('.md'): return 'docs'
    if path.startswith('frontend/scripts') or path.startswith('.claude'): return 'harn'
    if path.startswith('frontend/src') and re.search(r'\.(tsx?|s?css|jsx?)$', path): return 'src'
    return 'other'

def period(d):
    return d[:7] if d < '2026-09-01' else ('2026-09a' if d < '2026-09-15' else '2026-09b')

out = subprocess.run(['git', 'log', '--no-merges', '--since=2026-03-01',
                      '--format=@@%h|%cs|%s%n%b@@END', '--numstat'],
                     capture_output=True, text=True).stdout
commits, cur, inbody = [], None, False
for line in out.splitlines():
    if line.startswith('@@') and not line.startswith('@@END'):
        h, d, s = line[2:].split('|', 2)
        cur = dict(h=h, d=d, s=s, files=[], pids=set(re.findall(r'P-2026-\d\d-\d\d-\d{4}', s)))
        commits.append(cur); inbody = True; continue
    if line.startswith('@@END'): inbody = False; continue
    if inbody: cur['pids'] |= set(re.findall(r'P-2026-\d\d-\d\d-\d{4}', line)); continue
    p = line.split('\t')
    if len(p) == 3 and cur is not None:
        a = int(p[0]) if p[0] != '-' else 0; r = int(p[1]) if p[1] != '-' else 0
        if a + r <= 5000: cur['files'].append((p[2], a + r))  # skip bulk/generated files

agg, days = collections.defaultdict(collections.Counter), collections.defaultdict(set)
for c in commits:
    k = period(c['d']); A = agg[k]; A['commits'] += 1; days[k].add(c['d'])
    kinds = {cls(f) for f, _ in c['files']}
    if kinds and kinds <= {'docs'}: A['docs_only'] += 1
    if 'src' in kinds: A['src_commits'] += 1
    for f, n in c['files']: A[cls(f)] += n
print('Table 1: period, active days, commits, docs-only, src commits, src/test/docs/harness lines')
for k in sorted(agg):
    A = agg[k]
    print(k, len(days[k]), A['commits'], A['docs_only'], A['src_commits'], A['src'], A['test'], A['docs'], A['harn'])

lanes = collections.defaultdict(collections.Counter)
for c in commits:
    for p in c['pids']:
        L = lanes[p]; L['commits'] += 1
        if {cls(f) for f, _ in c['files']} <= {'docs'}: L['docs_only'] += 1
        for f, n in c['files']: L[cls(f)] += n
print('\nTable 2: lanes with a Prompt-ID')
for p in sorted(lanes): print(p, dict(lanes[p]))

H = re.compile(r'^## (\d{4}-\d{2}-\d{2})\s*[—-]+\s*(.*)$', re.M)
seen, C = set(), collections.defaultdict(collections.Counter)
for f in ['docs/claude-code-log.md', 'docs/claude-code-log-archive.md'] + glob.glob('docs/log-inbox/*.md'):
    t = open(f, encoding='utf8').read(); ms = list(H.finditer(t))
    for i, m in enumerate(ms):
        key = (m.group(1), m.group(2).strip())
        if key in seen or m.group(1) < '2026-08-02': continue
        seen.add(key)
        body = t[m.end(): ms[i + 1].start() if i + 1 < len(ms) else len(t)]
        k = period(m.group(1)); C[k]['entries'] += 1
        mc = re.search(r'\*\*Corregge\*\*:?\s*(\d{4})', body)
        if mc: C[k]['corregge'] += 1
        ca = re.search(r'\*\*Causa\*\*:?\s*\(?([a-g])\b', body)
        if ca: C[k]['causa_' + ca.group(1)] += 1
print('\nTable 3: log entries since 2026-08-02 (active log, archive, inboxes, de-duplicated)')
for k in sorted(C): print(k, dict(sorted(C[k].items())))
