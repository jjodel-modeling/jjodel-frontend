# AI providers: false-negative connection test and live model lists (discovery)

Prompt-ID: P-2026-10-18-0045
Chat: C-2026-10-18-0035
Front: release-3-2
Lane: full (more than three files, changes an exported interface of the provider layer)
Status: chiuso 2026-10-18 · discovery only, report on the trunk f891af6ed · Phase 2 handed to the chat of P-2026-10-18-1146

Protocollo: docs/PROTOCOL.md: clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-aiproviders`, branch `ai-providers`, created from the trunk `alfonso-frontend-jjtl` at its current tip. Before anything else: `pwd`, branch, `git log -1` and `git status` match this. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-0045 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

This is Phase 1, read-only. No source file is modified. The only file written is the discovery report.

## Context (do not redo the analysis)

Jjodie talks to three providers (Anthropic, OpenAI, Ollama) from the browser. Alfonso reports two problems:

1. **Anthropic, false negative.** The API key is accepted, "Test connection" always reports a failure, yet real Jjodie calls with the same key sometimes work.
2. **Static model lists.** The models offered for each provider are fixed in the code and go stale. Wanted: the list is fetched when the key is saved, refreshed transparently, with a manual refresh button.

Direction discussed in chat, to be confirmed or refuted by the evidence: the connection test should call the provider's model-listing endpoint (no tokens spent, a clean 401 versus 200, and the result is the list we need). Test and refresh become one operation. Endpoints: Anthropic `GET /v1/models` (paginated, `display_name`, `created_at`), OpenAI `GET /v1/models` (returns non-chat models too, no capability metadata), Ollama `GET /api/tags`.

Target release: 3.2.0.

## WHAT

### A. Root cause of the Anthropic false negative

Find the code path of "Test connection" and the code path of a real Jjodie call for Anthropic, and compare them line by line. For each of the four hypotheses below say confirmed, refuted or not determinable, with `file:line` and the verbatim excerpt:

- **H1, fixed model in the test.** The test sends a model ID hard-coded in the source (possibly retired, so a 404), while real calls use the selected model.
- **H2, missing header.** The test path does not send `anthropic-dangerous-direct-browser-access: true` (or `anthropic-version`), while the real path does; a CORS failure follows.
- **H3, wrong response shape.** The test reads the response as OpenAI-shaped (`choices`) instead of Anthropic-shaped (`content`), so a 200 is judged a failure.
- **H4, transient errors read as a bad key.** A 529 (overloaded), a 429 or a short timeout ends in the same "fail" as a 401.

If none holds, say what the real cause is. If you can reproduce the test from a Node probe without a real key (status codes and headers from a 401 are enough to tell H2 and H3 apart), do it and keep the probe gitignored under `frontend/scripts/smoke/_tmp_*`. Never print, log or commit an API key.

### B. Current model registry

1. Where the model lists live for each provider (file, shape, exported type), who reads them, and where the selected model is persisted (which storage, which key).
2. What happens today when the persisted model is not in the list.
3. Every consumer of the provider/model types: list them, because Phase 2 may add fields.
4. Whether a cache layer, a settings service or an existing "last updated" pattern can be reused. Search before proposing any new identifier (CLAUDE.md, name verification).

### C. Feasibility of the live lists

For each provider: whether the listing endpoint is reachable from the browser with the headers the code already sends (CORS), pagination, and what a filter would need to keep only models Jjodie can use. For OpenAI, list the prefixes the endpoint returns today if you can observe them; otherwise state that it is not observable without a key.

### D. Proposal for Phase 2 (decisions stay with the chat)

A short plan, files to touch and their order, covering: test through the listing endpoint; three distinct outcomes (invalid key, provider unreachable, provider overloaded); fetch at key save; background refresh when the cache is older than 24 h; manual refresh button; static fallback list; a selected model that disappears is flagged, never replaced silently. For each open choice give one `Recommended:` line. The OpenAI filter (prefix rule versus a hand-maintained allowlist of families) is one of them.

## Discovery report (mandatory)

Write the report to `docs/discovery/discovery_2026-10-18_ai_provider_connection_and_models.md` (P4: hypothesis under test, goal, files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions). The hard stop is not reached until the report is written and committed (docs only, pathspec, `Model:` trailer). Commit the probe nowhere.

## HARD STOP

After the report commit. Exit with `Outcome: hard-stop`. No Phase 2 without a GO from the chat.

## DO NOT

- Do not modify any source file, test or config.
- Do not add dependencies.
- Do not touch the critical zone (CLAUDE.md §3.2): this task has no reason to.
- Do not call any provider with a real key.

## REFERENCES

- CLAUDE.md (read first), docs/PROTOCOL.md (P4, P9, P13), docs/decisions.md.
- Anthropic Models API: https://docs.claude.com/en/api/models-list
- `src/ai/` (configurable clients for Jjodie): starting point, not a constraint.
