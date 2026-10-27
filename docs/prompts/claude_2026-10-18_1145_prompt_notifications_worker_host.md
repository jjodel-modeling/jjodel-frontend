# Notifications widget: point API_URL at the renamed workers.dev subdomain

Prompt-ID: P-2026-10-18-1145
Chat: C-2026-10-17-1518
Front: maintenance
Lane: fast (one constant in one file, outside the critical zone; tier drawn (RC-45): light)
Status: eseguito 2026-10-18 · lane notif-url · code 4e8bdbcc7 · typecheck 0, build exit 0, no test imports the widget · new host answers 200 · no visual check (P8 derogated)
Request: Alfonso, 2026-10-18 11:43, «confermo, usa /lane auto» (the chat found this breakage while preparing the AI-provider discovery, P-2026-10-18-1146)
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 (discovery report) does not apply: the cause is measured by the chat (below) and the change is one line. P8 in its RC-23 form: no visual check in the app beyond the gates, since the widget's look does not change; the chat verifies the endpoint answers.

Worktree: `~/jjodel-w-notifurl`, branch `notif-url`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`. Runs in parallel with P-2026-10-18-1146 (RC-22): disjoint DOVE.

Model and tier: light, drawn (RC-45).

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1145 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the log entry under «Decisions taken (unattended)».
Time limit: 30 minutes.

## Context (do not redo the analysis)
On 2026-10-18 Alfonso renamed the `workers.dev` subdomain of his Cloudflare account from `alfonso-pierantonio` to `alfonso99`, to restore the AI proxy at `jjodel-ai-proxy.alfonso99.workers.dev` (the URL already in `frontend/src/types/jodie.ts:231`). The rename moves every Worker of the account. Measured by the chat at 11:44 with `nslookup <host> 8.8.8.8`: `jjodel-notifications.alfonso-pierantonio.workers.dev` is NXDOMAIN, `jjodel-notifications.alfonso99.workers.dev` resolves to Cloudflare. `frontend/src/components/NotificationWidget/NotificationWidget.tsx:22` still holds the old host, so the notifications widget receives nothing on app and beta.

## COSA
1. In `NotificationWidget.tsx` line 22, change the host of `API_URL` to `https://jjodel-notifications.alfonso99.workers.dev`. Add one comment line above it, in English, saying that the host depends on the Cloudflare account's workers.dev subdomain and must change with it (the AI proxy in `types/jodie.ts` lives on the same subdomain). Nothing else in the file.
2. Grep `frontend/src` and `frontend/public` for `alfonso-pierantonio.workers.dev`: if any other hit exists, change it the same way and name it in the entry; if none, say so with the command used (R-RAIL-28).
3. With `curl -sS -o /dev/null -w '%{http_code}'` on the new host (try the root path and any path the widget fetches, read from the file), put the codes in the entry.

## Gates
`npm run typecheck` at the baseline (14), `npx vitest run` on any test that imports `NotificationWidget` (say if none), `npm run build`.

## Commits (P13, RC-17), explicit pathspecs
Commit 1: `fix(notifications): point API_URL at the renamed workers.dev host`, the touched source files. Trailer `Model:` (P6).
Commit 2, docs: the log entry in `docs/log-inbox/maintenance.md` (§21.2, `Corregge: —`) and the Status flip of this prompt.
No push, no merge (RC-19).

## HARD STOP
None planned.

## NON FARE
No refactoring of the widget, no environment variable for the host (that belongs to P-2026-10-18-1146).

## RIFERIMENTI
`frontend/src/types/jodie.ts:231`, `docs/handover/2026-02-03-cloudflare-worker-anthropic-proxy.md`.
