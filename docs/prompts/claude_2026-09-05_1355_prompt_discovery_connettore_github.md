# Prompt Claude Code: discovery connettore GitHub (Fase 1, read-only)

**Data**: 2026-09-05 13:55
**Tipo**: discovery (Fase 1 del two-phase). Nessuna modifica al codice.
**Effort**: high
**Repo**: `~/jjodel` (jjodel-frontend), branch `alfonso-frontend-jjtl`
**Memo di riferimento**: `docs/ratifiche/claude_2026-09-05_1355_memo_ratifica_connettore_github.md` (leggerlo per intero; contiene le regole proposte R-GH-1..7 e le domande aperte)

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di tutto.

## COSA

Raccogliere i fatti che decidono come il connettore GitHub si innesta senza toccare il ciclo di salvataggio: come si persiste e si importa un progetto, quanto pesa, come si conservano oggi le chiavi lato client, come si registra una voce di export. Output: un discovery report, niente codice.

## DOVE (file da leggere)

- `frontend/src/api/persistance/projects.ts`: `ProjectsApi`, `Offline`, `Online`, `import`, `save`.
- `frontend/src/common/libraries/saveProject.tsx` e `lastSaved.ts`.
- `frontend/src/services/export/JsonModelService.ts`, `EcoreService.ts`, `XMIService.ts`, `index.ts`.
- `frontend/src/components/common/ExportImportMenu.tsx` e `ImportDropZone.tsx`, `frontend/src/components/import/buildImportSummary.ts`.
- `frontend/src/services/AIProviderPreferences.ts` e `AIProviderService.ts`.
- `frontend/src/components/forEndUser/Try.tsx` :100-135.
- `frontend/src/services/storage/` (`IActivityStorage`, `LocalStorageActivityStorage`, `BackendActivityStorage`).
- `frontend/package.json` (dipendenze HTTP disponibili).

## COME

Per ogni punto riporta il dato con il comando o il riferimento `file:riga`; un'asserzione di assenza vale solo con la ricerca dichiarata.

1. **Persistenza**. Cosa contiene esattamente il payload salvato da `Offline.save` e `Online.save` (`DProject`, `compressedState`, contatori): campi, formato, compressione. È lo stesso oggetto che `JsonModelService` esporta, o un altro? Se sono diversi, quale dei due è il candidato per "il progetto intero" (domanda 1 del memo).
2. **Import**. Percorso completo dell'import da file: da `ImportDropZone` / `ExportImportMenu` fino a `ProjectsApi.import` o altro. Firma della funzione a cui passare un `string` o un `Blob` ricevuto dalla rete per ottenere lo stesso effetto del drop di un file.
3. **Peso**. Misura in byte i progetti di esempio presenti nel repo (cerca `.json`, `.jjodel`, fixture in `public/`, `frontend/src/examples`, `__tests__`) sia nella forma esportata sia, se ricostruibile, nella forma `compressedState`. Riporta il massimo e quanti superano 1 MB (R-GH-4).
4. **Chiavi lato client**. Come `AIProviderPreferences` conserva le chiavi (localStorage? sessionStorage? chiave, cifratura, serializzazione) e se esiste una utility condivisa per preferenze persistenti riutilizzabile per il token GitHub (R-GH-2).
5. **HTTP**. Come i servizi esistenti chiamano la rete (`axios`, `fetch`, `XMLHttpRequest`), se esiste un client `axios` configurato con `baseURL` o interceptor che intercetterebbero una chiamata a `api.github.com`, e come `U.isOffline()` è determinato (una chiamata a GitHub deve funzionare anche in modalità offline rispetto al backend).
6. **Menu di export**. Come si aggiunge una voce a `ExportImportMenu.tsx` e a quale evento o callback risponde, e se esiste un pattern di dialogo modale già usato per gli export (nome del componente).
7. **Nomi** (R-GH-7). Grep globale per `github`, `GitHub`, `GitHubService`, `githubToken`, `services/github`: riporta ogni occorrenza esistente (la chiamata in `Try.tsx` è nota).
8. **Test**. Come i test esistenti mockano la rete (`vi.mock('axios')`, `msw`, `fetch` stub) in `frontend/src/api/__tests__/` e in `services/export/__tests__/`, per riusare lo stesso pattern.

## HARD STOP

Al termine degli otto punti scrivi il report e fermati. Nessuna implementazione, nessuna modifica a file esistenti.

## DISCOVERY REPORT (obbligatorio)

Salva il report in `docs/discovery/discovery_2026-09-05_connettore_github.md` (suffisso `_2` se esiste). Contenuto minimo: obiettivo; file letti con path completi; per ciascuno degli otto punti il dato misurato; dipendenze e rischi (in particolare qualunque via per cui il connettore finirebbe dentro il ciclo di salvataggio SAVE1/DIRTY1/VER1/VER2); domande aperte per Alfonso, con una risposta documentata alle quattro domande del §4 del memo dove il codice permette di rispondere.

## COMMIT E LOG

Committa il solo report: `git add -- docs/discovery/discovery_2026-09-05_connettore_github.md` poi `git commit -m "docs(discovery): GitHub connector, phase 1" -- docs/discovery/discovery_2026-09-05_connettore_github.md`. Non pushare. Prima del commit verifica che non esista `.git/index.lock`; se esiste, fermati e segnalalo. Aggiungi l'entry in `docs/claude-code-log.md` (tipo `docs`, esito, nome del documento prompt `2026-09-05 13:55`) e committala insieme al report.
