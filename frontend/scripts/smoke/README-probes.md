# Probes (`_tmp_*`)

A **probe** is a single-use Playwright script written to answer one question a
slice actually asks — "does `delete` refuse the ambiguous name and leave both
objects alive", "does the commit land the value in the slot and not only on
`DObject.name`". It drives the real app in a real browser against the live dev
server, and it dies with the slice.

It is **not** part of `npm run smoke`. `run.ts` is the standing instrument: three
states, five assertions, a three-valued verdict, a committed console baseline
(see `README.md`). A probe is the opposite: disposable, uncommitted, and shaped
by whatever it needs to measure today. The two share this directory and the
helpers in `states.ts`, nothing else.

This file exists because the method findings kept being rediscovered. The
`__name` gotcha below was hit by three different sessions inside 2026-08-30
(`_tmp_s1a_verify.ts` 17:00, `_tmp_s2_probe.ts` 17:28, `_tmp_s1b_verify.ts`
17:32, each carrying its own copy of the shim) and written down once. Every rule
below carries the measurement or the referto it came from. Nothing here is a
preference.

---

## Running one

```bash
cd frontend
npx tsx scripts/smoke/_tmp_<name>.ts
```

The dev server must already be up (`npm start`), same as for the smoke.

Note the runner differs from the committed harness. `npm run smoke` goes through
node's own type stripping (`--experimental-strip-types`, see `README.md` §Node
version); probes go through **tsx**, which is not in `frontend/node_modules` —
it resolves from the npx cache (`~/.npm/_npx/*/node_modules/tsx`, verified
2026-08-30). That difference is not cosmetic: it is the whole of the next
section.

---

## The `__name` gotcha

**Symptom.** A probe dies with `ReferenceError: __name is not defined`, thrown
in the browser *before the first line of the probe body runs*, on any
`page.evaluate` whose body contains an arrow function assigned to a `const`.
Which is nearly every probe.

**Cause, measured.** tsx transforms with esbuild's `keepNames: true` (hard-coded
in tsx's own dist bundle: `{…, minifyWhitespace: true, keepNames: true}`).
`keepNames` rewrites every named function expression to preserve `fn.name`.
Measured 2026-08-30 with the repo's own esbuild:

```
$ esbuild --keep-names kn.ts
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const f = /* @__PURE__ */ __name((x) => x + 1, "f");

$ esbuild kn.ts                      # same input, no flag
const f = (x) => x + 1;
```

The `__name` helper is emitted at **node module scope**. Playwright serializes
the `page.evaluate` callback as source text and evaluates it in the page, where
that helper does not exist — so the rewritten arrow references a free identifier
and throws on the first statement that defines it.

**Fix.** Install an identity shim before any page script:

```ts
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
```

`addInitScript`, not an inline `evaluate`: it has to be in place before the
page's own scripts, and before the first `evaluate` the probe makes. Put it
immediately after `newContext`/`seed` and before `goto`.

It is the smallest honest fix — identity, so the rewritten code runs exactly as
written. It does not patch the app, does not touch the transform, and leaves
`fn.name` merely wrong inside the evaluated body, where nothing reads it.

Referto: `docs/discovery/discovery_2026-08-30_s1b_ambiguita_dichiarata.md` §"Sonda
dedicata". Carried by 30 of the probes on disk at 2026-08-30 18:00 — a count that
drifts, since this directory is written by whatever sessions are running.

---

## Conventions

These are read off the 2026-08-30 referti, not proposed here.

### Naming, and where the ignore rule actually reaches

Probes and their screenshots are named `_tmp_*` and stay out of git:

```
# .gitignore:66
frontend/scripts/smoke/_tmp_*
```

The rule is **path-anchored**, so it protects one directory and nothing else.
The cause is always the same: `page.screenshot({path: ...})` takes a **relative**
path, resolved against a cwd the probe does not control. Where the file lands
therefore depends on where it was launched from, and the ignore rule reaches
exactly one of those places.

Counted 2026-08-30, three landing sites in the tree at once, none of them
ignored:

| written as | launched from | lands in | orphans |
|------------|---------------|----------|---------|
| `_tmp_x.png` | `frontend/` | `frontend/` | 142 (4.4 MB) |
| `scripts/smoke/_tmp_x.png` | repo root | `scripts/smoke/` | 10 |
| `scripts/smoke/_tmp_x.png` | `frontend/scripts/smoke/` | `frontend/scripts/smoke/scripts/smoke/` | 2 |

Only the 142 were in scope of the clean-up that measured this; the other two
sites are still there. Write an **absolute** path, or one built from the probe's
own module URL — the only form invariant to where it was launched. A relative
one that happens to be right today is right only for the cwd that was used, and
`git status` carries the rest until somebody notices.

They are never committed. The referto and the log entry carry the numbers; the
probe carries nothing anyone needs later.

### Outside `src`, so they do not void the run

`scripts/` is deliberately outside the quiescence perimeter (`README.md`
§verdict): the watched roots are `src/`, `public/`, `vite.config.ts` and
`index.html`. Saving a probe mid-run must not void the smoke. This is the reason
probes live here and not under `src/`.

### Positive *and* negative controls, in the same run

Every assertion of absence carries its own positive control, in the same run.
The standing formulation: *"a rule that refused everything would come out green
on the main criterion"*.

- S1a: three negative controls (a free name accepted in three different
  positions) alongside the rejection cases.
- S1b micro: a positive control (an unknown identifier still prints its own
  line, so the render block is reachable) and a negative control (no "and N
  more" where there is no producer).
- 12bc: row A of the table is the pre-chain state, labelled as the positive
  control.

A silence is only evidence when something in the same run proves the instrument
had signal. Same discipline as CLAUDE.md §5's rule on searches, applied to the
screen.

### «Per contrasto» is the standard form

An assertion that something did **not** happen is verified against the case
where it does. S1b: `set CLK.widthPx` on the ambiguous name does not write —
*and then*, after disambiguation, the same `set` passes and writes (`[] -> [42]`).
Without the second half, "does not write" had been checked against a slot that
was already empty.

Use the word in the probe labels; it makes the pairing greppable across referti.

### Assert the setup, do not wait for it

A setup step whose effect propagates asynchronously must be **asserted**, not
timed. Measured 2026-08-30: writing `composition = true` and calling
`slot.addObject(...)` **inside the same `evaluate`** produces a **root**, not a
child. `get_addObject` reads `composition` to decide whether the father is the
slot or the model (`LModelElement.tsx:7056`), and at zero ms from the write it
still reads `false` — the propagation latency of CLAUDE.md §9.2.

| where | father of the created object |
|-------|------------------------------|
| two separate `evaluate`s, with a wait between | **DValue**, owner `allNine_valued` |
| one single `evaluate` | **DModel** |
| the probe, first version (one `evaluate`) | path `smoke_model/Dup_x`, two segments — the FAIL |

That first run came out **1 FAILURE of 19**, and the failure was the probe's, not
the code's. The fix was not «wait longer»: it was to **assert the father**, so
that an apparent nesting fails instead of passing in silence. A probe that only
waits reports a green whenever the wait happened to be long enough on that
machine, that day.

Generalised: after any setup that depends on propagation, assert the shape you
believe you built — the father, the slot, the count — before asserting anything
about it.

Referto: `docs/discovery/discovery_2026-08-30_s1b_micro_produttore_candidati.md`
§3.

#### The index is the caller's, and `link` owns it

The same rule has a second half, on the write instead of the read. Measured
2026-09-01 (`discovery_2026-09-01_eng1_containment_core.md` §B.1-B.4): a probe
that appends by re-deriving the index from the store

```ts
const idx = (idlookup[slotId]?.values ?? []).length;   // <- stale
lslot.setValueAtPosition(idx, target.id);
```

computes **the same index twice** when two appends fall inside one propagation
window, because every dispatch is deferred by a `setTimeout(…, 0)`
(`redux/action/action.ts:349`). The second write overwrites the first, one value
is lost, and the evicted object keeps `father` on a slot that no longer lists
it — an orphan, returned as `{success: true}`. Measured window: `values.length`
still reads 0 at sync, at a microtask and at `setTimeout 0`; it reads 1 at 50ms.

No read fixes it: inside the window `store.getState()` is exactly as stale as
`context.data`. The contract is therefore the **caller's** — one index per
gesture, or the whole array in a single `set_values`, where the indices are
assigned on an array the caller holds. It is pinned in the core as a comment on
`get_setValueAtPosition` (`LModelElement.tsx:7752`), which is a comment on
purpose: ENG1 measured that the fix is not local, and the "obvious" one — making
`_clearValueAtPosition` read the live store — cures nothing while leaving the
lost value, the half that leaves no trace.

So probes do not pose containment by hand. `states.ts` exports **`link(page,
owner, ref, target)`**, which

- keeps a **per-slot cursor** on `window`, seeded from the store once and never
  re-read, and writes the whole array through a single `values = [...]`;
- writes `father` as a side effect, because that funnel goes through
  `get_setValueAtPosition` per index — which a raw
  `SetFieldAction.new(slot,'values',id,'+=')` does not (the shape behind the
  fatherless models of the 10c..10f probes, `discovery_2026-08-31_10g_outline_doppi.md` §3);
- **asserts** what it built instead of waiting for it: the posed values are a
  prefix of the slot's, and the father is the slot when the reference is a
  composition and is *not* the slot when it isn't. A timeout returns
  `ok: false` carrying its last measurement, never a silence.

Read `composition`, not `containment`, when you need the flag off the D-layer:
`containment` is the legacy spelling (CLAUDE.md §3.8) and reads `false` on
references the L-layer calls compositions. The first version of `link` got this
wrong and its per contrasto failed on a correct write.

Verified by `_tmp_eng2_verify.ts`, 16/16, with the dangerous form kept in the
same run as the positive control: it still loses a value and still leaves an
orphan, so a green on the `link` arms is a green with signal behind it. Mutation
check: removing the cursor turns the in-window arm red (3/16) and leaves the
sequential arms green — the cursor is precisely what the window costs.

The two probes that carried the dangerous form (`_tmp_10g_measure.ts`,
`_tmp_10g_verify.ts`) were migrated and re-run: 24/24, zero orphans measured,
and their `raw` arm — the declared subject of that measurement — untouched.

Referto: `docs/discovery/discovery_2026-09-01_eng2_probe_link_gate.md`.

### Select by name, never by index

Two FAILs on the first 12bc run were the probe's, not the code's, and they were
the same error: rows selected **by index** while the table is sorted **by name**
(`broken`, `noref`, `valued`), so the probe measured a different pair from the
one it had written to. Fixed by selecting on the name; green.

Any list the app sorts — instance tables, pickers, trees — is addressed by name
or by a stable attribute. An index is a claim about an ordering the probe does
not control.

Referto: `docs/discovery/discovery_2026-08-30_slice12bc_multiselect_recursion.md`
§4.

### A run that booted more than once measured a doubled tally

The rule is the smoke's boot ceiling (`countBoots`, `MAX_BOOTS_PER_STATE = 1` in
`assertions.ts`): a page that loaded the document twice gives every count twice,
so arithmetic on it names the application for something the machine did — the
run is **VOID**, repeated on a still tree, and reported as a void, never as a
green and never as a red.

Probes inherit the rule and, measured 2026-08-30, **none of them wires it**:
0 of the `_tmp_*` files import `countBoots`, against 150 that import from
`states.ts`. The zero is the load-bearing half; the 150 is the positive control
that the search reached the files at all.
So today it is on the author. If a probe's numbers look like a clean multiple of
what you expected, suspect the boot before the code, and repeat on a still tree
— which, with another session editing `frontend/src`, is often the second run.
Every probe does capture page errors and reports them (`page.on('pageerror', …)`,
"zero errori di pagina" in the referti); that part is universal.

### Output shape

The convention across every probe: one line per check, counted, plus raw
measurements that assert nothing.

```ts
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const note = (label: string, d: unknown) =>
    console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
```

Referti quote the result as `n/n ALL GREEN, zero errori di pagina`. `MEAS` lines
are how a probe reports a number it has no expectation for yet — they are what
turns a probe into a measurement instead of a guess confirmed.

### Reaching the real module

The dev server is Vite, so the page can `import()` a source path directly:

```ts
const m = await import('/src/jjscript/executor/commands/instance.ts');
```

No mock, no rewritten path: live store, real L proxies, the file in this tree.
Pair it with a positive control that the import resolved and exports what you
expect, or a typo gives you a silent skip.

### Reuse from the harness

`states.ts` is the shared part. `BASE_URL`, `seed(ctx, advanced)` (the offline
localStorage seeding, `README.md` §Reaching the app), `createProject`,
`VIEWPORT_*`, the `*_MS` timings. Import them; do not re-derive the offline user
shape in a probe.

---

## The fixture precedent: append, never reorder

`examples/RowViewSmoke/index.ts` is shared by the probes of several sessions at
once, and **they address instances by position through `createdIds`**.

So: a new instance goes **at the end of `order`**. Existing entries keep their
position and therefore their ids. Adding one in the middle, or sorting the list,
silently repoints every other session's probe at a different object — with no
error, and with assertions that still pass on the wrong subject.

The same reasoning rules out changing the metamodel where an instance would do.
2026-08-30: a third `AllNine` was appended rather than a second reference added,
because a new feature adds a row to *every* `AllNine` node and would have
falsified the counts two other probes assert ("12 rows, 0 empty", "24 rows =
12 features × 2 instances").

Referto: `docs/discovery/discovery_2026-08-30_5_brokenref_fixture.md` §2.2.

### No nested objects in it: 7 of 7 are roots

Measured 2026-08-30 on `rowviews`: **7 `DObject`, all seven with `father` =
`DModel`** (`smoke_model`). Not one is nested. The five of `order` minus
`Config_old`, which the fixture deletes to make the broken reference, plus the
three singletons `Red`/`Green`/`Blue` the persist callback creates on its own.

So a probe that needs a child **fabricates it and asserts it**. Do not read a
nesting into the fixture that is not there: with roots only, every path comes out
`smoke_model/<name>`, and any code branch that walks up to an owner is **never
exercised** — the probe would prove half a walker while believing it proved all
of it. `_tmp_s1bmicro_recon.ts` is the measurement; the probe that needed a child
turned `cfg` into a composition, created an object inside `allNine_valued`, and
checked it had actually landed there («Assert the setup, do not wait for it»)
before using it.

Changing the fixture to add one is the wrong move for the same reason as above:
it changes what every other session's probe is counting.

Referto: `docs/discovery/discovery_2026-08-30_s1b_micro_produttore_candidati.md`
§2.
