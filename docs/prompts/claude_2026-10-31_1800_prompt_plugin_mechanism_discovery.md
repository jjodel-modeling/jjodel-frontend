# Plugin mechanism: census of the existing extension points and sandbox probe

Prompt-ID: P-2026-10-31-1800
Chat: C-2026-10-31-1743
Front: plugins
Status: eseguito 2026-10-31 · lane plugins (full, discovery) · plugin-discovery · 1ea149576 · verifica visiva non applicabile
Lane: full (discovery only, read-only on product code; a new front, decisions not yet ratified)
Depends: none
Worktree: ~/jjodel-w-plugins, branch plugin-discovery (from alfonso-frontend-jjtl 9654de9b6)
Request: none (typed in the project chat on 2026-10-31 at 17:50 and 17:54; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-plugins` on
`plugin-discovery`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1800` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1800 · session <id>]`.

No subagents, no background tasks. One probe run per tool call. Never `cat` a probe log or a whole test output:
grep the summary lines. This is the most frequent reason measurement lanes hit the context ceiling.

## Contesto (do not redo the analysis)

Alfonso wants a plugin mechanism to extend Jjodel. Plugins can be written by any user; plugins of general
interest may later receive a "certified" status. The chat has proposed, and Alfonso has not yet ratified, six
principles. This discovery tests whether the code base can carry them; it does not implement anything.

1. A plugin is untrusted code by default.
2. One sandbox for every plugin, certified or not.
3. A plugin writes only through L-layer actions that the host validates and applies in one undo group
   (the mechanism R-RFB-12 already uses for a script Run).
4. Opening a project never runs plugin code without the user's consent; a missing plugin degrades explicitly
   (ViewpointIR v1.2 §10 and §11, R-IRN-3).
5. Certification is a quality attribute bound to the hash of one plugin version, revocable, and grants no
   technical privilege except narrow capabilities declared in the manifest (network access, for example).
6. The plugin API is a public, versioned contract, with the weight of an IR schema bump.

Two tiers are in view: declarative language packages (metamodel, viewpoints, role bindings, rules, templates,
no code) and code plugins that provide behaviour. The chat's working thesis is that the core of the mechanism is
a role catalog: a plugin declares a small abstract metamodel of roles and interprets any concrete metamodel bound
to it. The simulator's STC roles, instance-of's `ontoBindings` (`model/ontological/bindingCodec.ts`) and the
codegen templates that read the STC roles would then be three instances of one pattern. They share no code today.

## COSA

Three hypotheses to falsify, each with evidence (file:line and verbatim quotes).

H1. Every de facto extension point of Jjodel reduces to: an artifact persisted as data with the metamodel or
project, a binding from concrete metaclasses to abstract roles (possibly empty), and a host-side interpreter.

H2. A sandboxed iframe without `allow-same-origin`, with a CSP that forbids network egress
(`connect-src 'none'` and the related directives), hosting a Web Worker, blocks every network egress and every
access to the host's storage from plugin code, while a `postMessage` channel to the host still works.

H3. There is (or can be made, at one point) a single place where L-layer writes are applied, so that the host can
validate a list of actions proposed by a plugin and apply them in one undo group.

### Part A: census of the extension points

For each mechanism below, report: where it is registered or discovered (file:line); what it reads; what it writes
and through which layer (L-layer action, D-layer, reducer); how it persists and whether it travels with the
metamodel or the project; whether it is data or code; how it is versioned and migrated (VersionFixer); what the
user sees when it is missing or broken. Mechanisms: IR viewpoints and the interpreter; user-defined validation
(R-VAL) and the problems registry with its problem kinds; simulation STC roles (`stcFromRoles.ts` and the role
catalog); instance-of `ontoBindings`; code generators (R-GEN, generators as viewpoints); Jjodie scripts saved as
Refactoring artifacts (R-JJD-14) and Jjodie tools; refactoring operations (R-RFB); the shape registry
(`shapeRegistry.ts`, `contentRect`/`boxForContent`); importers and exporters (Ecore, XMI, `.smv` if present);
JjEL builtins and the evaluation context; panels and commands registered in the shell, if any registry exists.
Add any other mechanism you find; say how you searched (commands), so that an absence is backed by a search.

Then the role-catalog comparison: STC roles, `ontoBindings`, and what codegen reads from the STC. For each, the
shape of the binding, its codec, its validation, its UI. State whether one abstraction (a role catalog plus a
binding codec plus an interpreter) could describe all three, and what each would lose or gain. No code.

Then H3: trace the write paths of a script Run, a refactoring Apply and a Jjodie Apply down to the point where
they enter the store; say whether they converge, where an action list could be validated, and how undo groups are
opened and closed. Note any D-layer write outside the L-layer (critical zone: read only, `CLAUDE.md` §3).

Then evaluation budgets: does the JjEL evaluator (and JjScript, and the codegen worker) have any limit on time,
steps, depth or recursion? Where would a budget go?

### Part B: sandbox probe (H2)

A standalone harness, not product code, in `docs/discovery/harness/plugin-sandbox/`: a host page and a plugin
page served by a throwaway static server on a free port in the 3020..3099 range (never 3000, 3001, 3003), run
with the browser automation the existing probes use (see `frontend/scripts/probe/`). The host loads the plugin
page in `<iframe sandbox="allow-scripts">` (no `allow-same-origin`) with a CSP delivered by the server header and,
separately, by a `<meta>` tag, and the plugin page starts a Web Worker (try both a blob URL and a same-server
script URL; report which ones an opaque origin can start).

From the iframe's main thread and from the worker, attempt and record the outcome of: `fetch` to the static
server and to an external host, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`,
`importScripts` and dynamic `import()` from another origin, an `<img>`/`<link>`/`<script>` with an external URL,
`window.open`, top navigation, access to `parent` storage (`localStorage`, `indexedDB`, `document.cookie`), and a
nested iframe. Then check that a `postMessage` round trip host → plugin → worker → plugin → host works and
measure its latency on a payload of the size of the harness model (about 1.2 MB of JSON; a synthetic payload of
that size is fine). Record which CSP directives were needed for each block. Chromium is required; WebKit and
Firefox only if Playwright already has them installed (do not install browsers).

The probe proves or disproves H2. If something leaks, report the exact vector and the directive or attribute
that closes it, and rerun once.

## DOVE

Read-only on everything under `frontend/src`. New files only: the harness folder above, the discovery report, and
the probe script if it needs to live in `frontend/scripts/probe/` (name it `plugin-sandbox-probe.ts`). No product
code change, no dependency added, no change to `package.json`.

## Report

Save it as `docs/discovery/discovery_2026-10-31_plugin_mechanism.md`: hypotheses and verdicts (H1, H2, H3) up
front, objective, files read with full paths, the census table (one row per mechanism), the role-catalog
comparison, the write-path trace, budgets, the probe results table (vector, main thread, worker, directive that
blocks it), risks, and open questions for Alfonso. For each of the six principles in the context, one paragraph:
supported by the code as it is, supportable with a named change, or contradicted (with the evidence). Then a
proposed first slice: the smallest end-to-end plugin that would exercise the sandbox, the action channel and one
role catalog, and which existing feature it would re-host as dogfooding (the chat suggests the JavaScript
generator of the codegen pilot or the semantic part of instance-of; argue for one).

Commit the report and the harness files (`git add` those paths only), then hard stop: this lane has no Phase 2.

## HARD STOP

After the report is committed. Also stop with `Outcome: question` if the probe cannot run in this environment
(no browser automation available), with what is missing.

## NON FARE

No change to product code, `CLAUDE.md`, `docs/decisions.md`, `PROTOCOL.md`. No R- rows: the principles are not
ratified. No new dependency, no browser installation, no push, no merge.

## RIFERIMENTI

- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (§10 fallbacks, §11 migration and marking)
- `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` (R-VAL-10 portability)
- `docs/spec/claude_spec_2026-09-13_computational_model.md` (STC roles)
- `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` (R-GEN, isolated Web Worker)
- `docs/decisions.md`: R-OI (instance-of), R-RFB-12 (one undo step per Run), R-JJD-14, R-GEN
- `frontend/src/model/ontological/bindingCodec.ts`, `stcFromRoles.ts`, `shapeRegistry.ts`
- `CLAUDE.md` §3 (critical zone: read only here)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1800)`.
Log entry in the front's inbox at the end. Replace `Status: da eseguire` with date, lane, branch and sha in the
same docs-only commit as the log entry. No push, no merge into the trunk. Report closes with «Decisions taken
(unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
