#!/usr/bin/env python3
"""Generator of docs/harness/lane-lifecycle-bpmn.svg (orchestrated lane, RC-20..30)."""
from html import escape

W, H = 1240, 2080
CX_A, CX_C, CX_E = 180, 540, 990          # lane centres: Alfonso, chat, executor
TASK_W_A, TASK_W_C, TASK_W_E = 220, 270, 260
TH = 44

out = []
def add(s): out.append(s)

def task(cx, y, l1, l2, w, risk=False, user=False, doc=False):
    x = cx - w / 2
    add(f'<rect class="task{" risk" if risk else ""}" x="{x}" y="{y}" width="{w}" height="{TH}"/>')
    if user:
        add(f'<path class="usr" d="M{x+9} {y+10} a2.5 2.5 0 1 1 0.1 0 M{x+5} {y+17} q4 -4 8 0"/>')
    add(f'<text class="tl1" x="{cx}" y="{y+19}">{escape(l1)}</text>'
        f'<text class="tl2" x="{cx}" y="{y+34}">{escape(l2)}</text>')
    if doc:
        dx = x + w + 15
        add(f'<path class="doc" d="M{dx} {y+2} h18 l7 7 v18 h-25 z"/><path class="doc" d="M{dx+18} {y+2} v7 h7"/>')
    return y + TH

def gw(cx, y, label=None, lx=None, ly=None):
    add(f'<polygon class="gw" points="{cx},{y} {cx+14},{y+14} {cx},{y+28} {cx-14},{y+14}"/>'
        f'<text class="gwt" x="{cx}" y="{y+20}">×</text>')
    if label:
        add(f'<text class="fl" x="{lx if lx is not None else cx+20}" y="{ly if ly is not None else y+8}">{escape(label)}</text>')
    return y + 28

def sf(d, label=None, lx=0, ly=0, rot=False):
    add(f'<path class="sf" d="{d}"/>')
    if label:
        t = f' transform="rotate(-90 {lx} {ly})"' if rot else ''
        add(f'<text class="fl" x="{lx}" y="{ly}"{t}>{escape(label)}</text>')

def mf(d, label=None, lx=0, ly=0):
    add(f'<path class="mf" d="{d}"/>')
    if label:
        add(f'<text class="fl" x="{lx}" y="{ly}">{escape(label)}</text>')

def ev(cx, cy, kind='start', lines=(), msg=False):
    if kind == 'end':
        add(f'<circle class="ev end" cx="{cx}" cy="{cy}" r="12"/>')
    elif kind == 'term':
        add(f'<circle class="ev end" cx="{cx}" cy="{cy}" r="12"/><circle class="evfill" cx="{cx}" cy="{cy}" r="6"/>')
    elif kind == 'inter':
        add(f'<circle class="ev" cx="{cx}" cy="{cy}" r="13"/><circle class="ev" cx="{cx}" cy="{cy}" r="10"/>')
    else:
        add(f'<circle class="ev" cx="{cx}" cy="{cy}" r="13"/>')
    if msg:
        add(f'<path class="env" d="M{cx-6} {cy-4} h12 v8 h-12 z M{cx-6} {cy-4} l6 5 l6 -5"/>')
    for i, l in enumerate(lines):
        add(f'<text class="evl" x="{cx}" y="{cy+28+12*i}">{escape(l)}</text>')

def ann(x, y, lines, h=None):
    h = h or 14 * len(lines) + 8
    add(f'<path class="ann" d="M{x+2} {y} h-8 v{h} h8"/>')
    for i, l in enumerate(lines):
        add(f'<text class="an" x="{x}" y="{y+14+14*i}">{escape(l)}</text>')

# ------------------------------------------------------------------ frame
add(f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="BPMN of one orchestrated lane of the Jjodel harness across Alfonso, the project chat and Claude Code">
<style>
.pool{{fill:none;stroke:#dbe2ea;stroke-width:1.2}}
.lane{{stroke:#dbe2ea;stroke-width:1;stroke-dasharray:3 4}}
.lane-h{{fill:#e8edf3}}
.lt{{font-size:12px;fill:#475569;font-weight:600}}
.lh{{font-size:11px;fill:#64748b;font-weight:600;letter-spacing:.06em;text-transform:uppercase}}
.task{{rx:6;fill:#ffffff;stroke:#334155;stroke-width:1.4}}
.task.risk{{fill:#fde2e2;stroke:#b91c1c}}
.tl1{{font-size:11.5px;font-weight:600;fill:#1e293b;text-anchor:middle}}
.tl2{{font-size:10px;fill:#475569;text-anchor:middle}}
.gw{{fill:#ffffff;stroke:#334155;stroke-width:1.4}}
.gwt{{font-size:16px;fill:#334155;text-anchor:middle;font-weight:600}}
.ev{{fill:#ffffff;stroke:#334155;stroke-width:1.4}}
.ev.end{{stroke-width:3}}
.evfill{{fill:#334155}}
.env{{fill:none;stroke:#334155;stroke-width:1.1}}
.evl{{font-size:10.5px;fill:#475569;text-anchor:middle}}
.sf{{stroke:#334155;stroke-width:1.3;fill:none;marker-end:url(#ah)}}
.mf{{stroke:#64748b;stroke-width:1.2;fill:none;stroke-dasharray:6 4;marker-end:url(#mh);marker-start:url(#ms)}}
.fl{{font-size:10px;fill:#64748b}}
.usr{{fill:none;stroke:#64748b;stroke-width:1.1}}
.doc{{fill:#ffffff;stroke:#64748b;stroke-width:1}}
.ann{{fill:none;stroke:#64748b;stroke-width:1}}
.an{{font-size:10px;fill:#64748b}}</style><defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#334155"/></marker>
<marker id="mh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffffff" stroke="#64748b"/></marker>
<marker id="ms" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7"><circle cx="5" cy="5" r="3.5" fill="#ffffff" stroke="#64748b"/></marker>
</defs>
<rect x="0" y="0" width="{W}" height="{H}" fill="#ffffff"/>
<rect class="pool" x="30" y="20" width="{W-60}" height="{H-40}"/>
<rect class="lane-h" x="30" y="20" width="{W-60}" height="30"/>
<text class="lt" x="{W/2}" y="40" text-anchor="middle">One orchestrated lane of the Jjodel harness (RC-20..30): full lane, fast lane as the executor's shortcut</text>
<line class="lane" x1="330" y1="50" x2="330" y2="{H-20}"/><line class="lane" x1="750" y1="50" x2="750" y2="{H-20}"/>
<text class="lh" x="{CX_A}" y="70" text-anchor="middle">Alfonso · decision maker</text>
<text class="lh" x="{CX_C}" y="70" text-anchor="middle">Project chat · architect</text>
<text class="lh" x="{CX_E}" y="70" text-anchor="middle">Claude Code · executor</text>''')

# ------------------------------------------------------------------ opening
ev(CX_A, 110, 'start', ['feature, bug or gate'])
mf(f'M{CX_A+13} 110 L{CX_C} 110 L{CX_C} 148')
y = task(CX_C, 148, 'Write the prompt', 'Prompt-ID · Chat · Lane · Status: da eseguire', TASK_W_C)
ann(706, 148, ['COSA / DOVE / COME / RIFERIMENTI,', 'hard stops, scope-out list; a fast prompt', 'carries the GO and the measured cause;', 'committed at once in docs/prompts/'])
sf(f'M{CX_C} {y} L{CX_C} {y+26}')
y = task(CX_C, y + 26, 'Launch the session', 'lane-run start <worktree> <prompt-file> (RC-20)', TASK_W_C)
ann(406, 276, ['claude -p, bypassPermissions (RC-19), stream-json in ~/.jjodel-lanes/<Prompt-ID>/;', '--critical-zone-goahead <Prompt-ID> when Alfonso pre-authorised §3.2 (RC-30)'])
LAUNCH_Y = y   # bottom of Launch task = 262
mf(f'M{CX_C+TASK_W_C/2} {y-22} L{CX_E-13} {y-22}', 'prompt on stdin', 720, y-28)
ev(CX_E, y - 22, 'start', ['session started'], msg=True)
sf(f'M{CX_E} {y-9} L{CX_E} {y+26}')
gy = gw(CX_E, y + 26, 'ID and Status guards pass?')
sf(f'M{CX_E+14} {gy-14} L1150 {gy-14}')
ev(1165, gy - 14, 'term', ['Outcome: blocked'])
sf(f'M{CX_E} {gy} L{CX_E} {gy+24}')
gy2 = gw(CX_E, gy + 24, 'Lane: full?')
FAST_TOP = gy2 - 14
sf(f'M{CX_E} {gy2} L{CX_E} {gy2+26}', 'full', CX_E + 6, gy2 + 18)
y = task(CX_E, gy2 + 26, 'Phase 1: read-only discovery', 'CLAUDE.md first, then the files the prompt names', TASK_W_E)
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
y = task(CX_E, y + 26, 'Discovery report, committed', 'docs/discovery/discovery_<date>_<slug>.md', TASK_W_E, doc=True)
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
HS = y + 39
ev(CX_E, HS, 'inter', ['HARD STOP: the session exits', 'Outcome: hard-stop | question'], msg=True)

# ------------------------------------------------------------------ chat analysis and ratification
ay = HS - 22
mf(f'M{CX_E-13} {HS} L{CX_C+TASK_W_C/2} {HS}', 'lane-run status <Prompt-ID>', 700, HS - 6)
y = task(CX_C, ay, 'Analyse the report in chat', 'from the saved file, never from memory', TASK_W_C)
sf(f'M{CX_C} {y} L{CX_C} {y+26}')
y = task(CX_C, y + 26, 'Decide as recommended (RC-25)', 'R- rows provisional, unattended; digest at lane close', TASK_W_C)
ann(706, y - 40, ['RC-26 short list waits for Alfonso:', 'critical zone, exported interfaces,', 'amending a ratified R-, deletions,', 'MODELS demo, model/effort/cost, push'])
RY = y + 4
mf(f'M{CX_C-TASK_W_C/2} {y-22} L{CX_A} {y-22} L{CX_A} {y+14}', 'only the RC-26 list', 215, y - 28)
y2 = task(CX_A, y + 14, 'Ratify or amend', '"si", "confermo", "decidi tu"', TASK_W_A, user=True)
mf(f'M{CX_A+TASK_W_A/2} {y2-22} L{CX_C} {y2-22} L{CX_C} {y2+14}')
sf(f'M{CX_C} {y} L{CX_C} {y2+14}')
y = task(CX_C, y2 + 14, 'Ratification memo + decisions.md row', 'docs/ratifiche/ · R-<series>-<n> · Verified: (RC-27)', TASK_W_C)
sf(f'M{CX_C} {y} L{CX_C} {y+26}')
P2_Y = y + 26
y = task(CX_C, P2_Y, 'Write the Phase 2 prompt', 'same Prompt-ID, scoped file list, gates, mutants', TASK_W_C)
sf(f'M{CX_C} {y} L{CX_C} {y+23}')
gy = gw(CX_C, y + 23, 'critical zone?')
sf(f'M{CX_C+14} {gy-14} L640 {gy-14} L640 {gy+46} L{CX_C+TASK_W_C/2} {gy+46}', 'yes', 648, gy + 16)
y = task(CX_C, gy + 24, 'Layer Impact Report + explicit go-ahead', 'useJjomSync, portDistribution… or the RC-30 flag', TASK_W_C, risk=True)
sf(f'M{CX_C-14} {gy-14} L440 {gy-14} L440 {y+28} L{CX_C-14} {y+28}', 'no', 446, gy + 16)
sf(f'M{CX_C} {y} L{CX_C} {y+14}')
gy = gw(CX_C, y + 14)
sf(f'M{CX_C} {gy} L{CX_C} {gy+26}')
RESUME_Y = gy + 26
y = task(CX_C, RESUME_Y, 'Resume the session', 'lane-run resume <Prompt-ID> <message-file>', TASK_W_C)
RESUME_BOTTOM = y
mf(f'M{CX_C+TASK_W_C/2} {y-22} L{CX_E-13} {y-22}', 'Phase 2 prompt or GO', 700, y - 28)
ev(CX_E, y - 22, 'start', ['message received (same guard)'], msg=True)

# ------------------------------------------------------------------ executor implementation
sf(f'M{CX_E} {y-9} L{CX_E} {y+22}')
BG_Y = y + 22
# fast lane shortcut: from the "Lane: full?" gateway straight to the baseline gates
sf(f'M{CX_E+14} {FAST_TOP} L1160 {FAST_TOP} L1160 {BG_Y-12} L{CX_E+TASK_W_E/2+8} {BG_Y-12} L{CX_E+TASK_W_E/2+8} {BG_Y+2}')
add(f'<text class="fl" x="1166" y="{(FAST_TOP+BG_Y)/2}" transform="rotate(-90 1166 {(FAST_TOP+BG_Y)/2})" text-anchor="middle">fast lane: no discovery, no memo, no resume; the prompt is the GO; inline checks in the log entry</text>')
add(f'<text class="fl" x="1120" y="{FAST_TOP-6}">fast</text>')
y = task(CX_E, BG_Y, 'Baseline gates, numbers stated first', 'typecheck · vitest · build · check:docs', TASK_W_E)
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
y = task(CX_E, y + 26, 'Tests first, red on the feature', 'one test per mutant at least', TASK_W_E)
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
y = task(CX_E, y + 26, 'Implement, minimal diff', 'name check · no rename · declared files only', TASK_W_E)
ann(768, y - 48, ['deny list:', 'fails closed;', 'hooks add', 'refusals only'])
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
y = task(CX_E, y + 26, 'Mutation bench', 'applied, run, reverted; table in the commit body', TASK_W_E)
sf(f'M{CX_E} {y} L{CX_E} {y+24}')
gy = gw(CX_E, y + 24, 'every mutant killed?')
sf(f'M{CX_E+14} {gy-14} L1150 {gy-14}')
ev(1165, gy - 14, 'term', ['stop, never weaken', 'the mutant'])
sf(f'M{CX_E} {gy} L{CX_E} {gy+24}')
y = task(CX_E, gy + 24, 'Gates on the commit, then commit', 'git add <files> · Model: trailer · 72-char subject', TASK_W_E)
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
y = task(CX_E, y + 26, 'Log entry + Status flip, written', 'uncommitted while a visual check is due (RC-17)', TASK_W_E, doc=True)
ann(760, y - 118, ['a question with a', 'Recommended: line', 'is adopted by the', 'chat (RC-21)'])
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
EX = y + 39
ev(CX_E, EX, 'inter', ['the session exits', 'Outcome: hard-stop (visual check due)'], msg=True)

# ------------------------------------------------------------------ visual check in the chat, GO by Alfonso
vy = EX - 22
mf(f'M{CX_E-13} {EX} L{CX_C+TASK_W_C/2} {EX}', 'lane-run status', 700, EX - 6)
y = task(CX_C, vy, 'Visual checklist in the built-in browser', 'DOM and console measures (P8, RC-23)', TASK_W_C)
sf(f'M{CX_C} {y} L{CX_C} {y+23}')
gy = gw(CX_C, y + 23, 'checks pass?')
# rework loop from the gateway back to the Phase 2 prompt
sf(f'M{CX_C+14} {gy-14} L730 {gy-14} L730 {P2_Y+22} L{CX_C+TASK_W_C/2} {P2_Y+22}')
add(f'<text class="fl" x="724" y="{(gy+P2_Y)/2}" transform="rotate(-90 724 {(gy+P2_Y)/2})" text-anchor="middle">rework: a new Phase 2 prompt that Corregge the old one, same session; a new discovery only if the cause is the analysis</text>')
add(f'<text class="fl" x="{CX_C-32}" y="{gy-4}">no</text>')
GO_Y = gy + 26
mf(f'M{CX_C} {gy} L{CX_C} {GO_Y+22} L{CX_A+TASK_W_A/2} {GO_Y+22}', 'yes: measures, then GO or veto', 300, GO_Y + 16)
y = task(CX_A, GO_Y, 'Visual GO', 'every lane until 2026-10-03, then sampled', TASK_W_A, user=True)
sf(f'M{CX_A} {y} L{CX_A} {y+24}')
gy = gw(CX_A, y + 24, 'GO or rework?', 60, y + 32)
# rework from Alfonso joins the chat's rework loop
sf(f'M{CX_A+14} {gy-14} L730 {gy-14}')
add(f'<text class="fl" x="{CX_A+22}" y="{gy-20}">rework</text>')
sf(f'M{CX_A} {gy} L{CX_A} {gy+22}', 'GO', CX_A + 8, gy + 16)
CL_Y = gy + 22
mf(f'M{CX_A} {CL_Y} L{CX_A} {CL_Y+14} L{CX_C} {CL_Y+14} L{CX_C} {CL_Y+30}')
y = task(CX_C, CL_Y + 30, 'Resume the session for the closure', 'lane-run resume, GO visivo line', TASK_W_C)
mf(f'M{CX_C+TASK_W_C/2} {y-22} L{CX_E-TASK_W_E/2} {y-22}')
y = task(CX_E, y - TH, 'Closure: one docs commit (RC-17)', 'log entry · Status flip · visual line', TASK_W_E, doc=True)
sf(f'M{CX_E} {y} L{CX_E} {y+26}')
ev(CX_E, y + 39, 'end', ['Outcome: done'])
DY = y + 39
mf(f'M{CX_E-13} {DY} L{CX_C+TASK_W_C/2} {DY}', 'lane-run status', 700, DY - 6)
y = task(CX_C, DY - 22, 'Merge --no-ff into the trunk (RC-14)', 'one branch per lane (RC-24) · push on request', TASK_W_C)
sf(f'M{CX_C} {y} L{CX_C} {y+26}')
y = task(CX_C, y + 26, 'Digest of the unattended decisions', 'most consequential first (RC-25), waits measured', TASK_W_C)
mf(f'M{CX_C-TASK_W_C/2} {y-22} L{CX_A+13} {y-22}', 'veto right', 300, y - 28)
ev(CX_A, y - 22, 'end', ['lane closed;', 'silence does not block'])
ann(406, y + 18, ['At ~60% of context the architect writes the checkpoint:', 'its own section of sessione_CORRENTE.md in the KB', '(one section per active chat), copy in docs/sessioni/'])

add('</svg>')
open('lane-lifecycle-bpmn.svg', 'w').write('\n'.join(out))
print('height used', y + 70, 'of', H)
