# log-inbox — lane «gemini-test-connection» (#179)

Entries written by the #179 lane (Gemini «Test connection» on a retired model) on branch
`fix/179-gemini-test-connection`, worktree `jjodel-179`. Whoever closes the batch moves them into
`docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The active
log is not touched by this lane.

---

## 2026-10-06 — fix(#179): «Test connection» e chat chiamano lo stesso modello attuale
**Prompt**: chat di Juri: lavorare la #179 (Gemini, «Test connection» in 404 su `gemini-2.0-flash-exp`, la chat funziona con la stessa chiave): test e chat sullo stesso modello, modello deprecato o fuori lista portato a uno attuale; il test verifica chiave piu' modello effettivo, il modello vecchio migrato e segnalato (raccomandazione di Juri, adottata); completare senza aprire altre issue; alla fine chiedere a Tommaso di testare.
**Files touched**: `e197edff0`: `types/jodie.ts`, `services/AIProviderService.ts`, `services/__tests__/AIProviderService.test.ts`, `components/settings/AISettingsContent.tsx`, `components/settings/AISettingsContent.scss`. Docs: questa inbox. Branch da `dcb13dc55` (= origin/staging), senza lo step B della #157.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14**, l'insieme di §17; vitest del file 16/16, suite intera 5658 passati con i 9 file noti in errore d'import; `npm run build` exit 0. Endpoint reali non chiamati (nessuna chiave Gemini): il test di ogni provider ora usa il modello della chat.
**Out-of-scope changes**: no — 5 file, alla soglia: componente e foglio di stile accoppiato contano come unita' (RC-11).
**Layer Impact Report**: not-required — nessun file di §3.1; servizio AI, tipi Jodie, pannello Settings; nessun D-layer, sync o persistenza di progetto.
**Smoke visivo**: passato — probe `_tmp_179_gemini.ts` sul dev server di questo albero (:3049), 28/28 in due scenari (con e senza scelta della chat), Gemini simulato con `page.route` (404 poi 200); screenshot chiaro e scuro guardati.
**Notes**: Solo Gemini «ritira» modelli (deprecato o fuori lista → prima voce attuale): gli altri provider tengono gli id fuori lista (il test DeepSeek esistente lo fissa). Migrazione al load senza sentinella, scrive solo se sposta; `replacedModel` alimenta l'avviso finche' un test passa. Banco di mutazione 10/10. Il pannello Settings non gira sotto vitest: lo copre la probe. Test con chiave reale chiesto a @tmaog sulla issue.
**Prompt document name**: 2026-10-06 (chat)

**Ticket** (low): nel menu dei modelli di Jodie la sezione «legacy» elenca ancora i Gemini deprecati; sceglierne uno ora porta alla prima voce attuale, e l'etichetta del menu lo mostra (getPreferredModel risolve). Onesto ma inutile: la sezione potrebbe nasconderli. Non toccato: `ProviderModelSelector.tsx` fuori dal perimetro.
