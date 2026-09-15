# Discovery — AGENTS.md come proiezione generata di CLAUDE.md (Phase 2 · Step 0 · Fase 1)

**Data**: 2026-07-14
**Tipo**: Phase 2 · Step 0 — **Fase 1 READ-ONLY** (catalogo + verifica). Hard stop prima della Fase 2 (build generatore).
**Branch**: `alfonso-frontend-jjtl`
**Scope dichiarato del passo**: `AGENTS.md`, nuovo script generatore + frammento, `docs/claude-code-log.md`. **`CLAUDE.md` NON va toccato in questo step** (è lo Step 1). Fase 1: zero edit salvo questo report.
**Decisione bloccata**: `AGENTS.md` diventa una **proiezione generata** di `CLAUDE.md` (una fonte, zero drift), non più un file mantenuto a mano.

> ⚠️ **Correzioni alle premesse del prompt** (ground truth verificato):
> 1. `AGENTS.md` **non ha "un §0 diverso"**: non ha **alcun §0**. Salta dal blocco NON-NEGOTIABLE direttamente a `## 1`. Il generatore deve quindi **iniettare** un §0 Codex (oggi assente), non "sostituirlo".
> 2. `CLAUDE.md` è **1093 righe** (non ~1850 come dice il prompt/reference — già trimmato in una sessione precedente). `AGENTS.md` è **1000 righe**.
> 3. `docs/ai-providers.md` **NON esiste** (conferma il flag della sessione precedente). Blocca una dedup successiva, non questo step.
> 4. Il rewrite `claude-code-log → Codex-log` punta a `docs/Codex-log.md`, che **NON esiste** sul disco → l'attuale `AGENTS.md` referenzia già un file inesistente (bug latente pre-esistente).

---

## Obiettivo

Catalogare tutte le differenze reali tra `CLAUDE.md` e `AGENTS.md`, separando (a) le differenze legittime tool-specific da preservare/parametrizzare nel generatore, da (b) staleness/bug che la rigenerazione elimina ri-proiettando da `CLAUDE.md`. Definire l'insieme di sostituzioni completo e reversibile, proporre il design del generatore idiomatico al repo, e raccogliere le domande aperte. Nessuna implementazione in questa fase.

---

## File / directory letti (path completi)

- `/Users/alfonso/jjodel/CLAUDE.md` (1093 righe) — sorgente della proiezione
- `/Users/alfonso/jjodel/AGENTS.md` (1000 righe) — gemello Codex stale da rimpiazzare
- `/Users/alfonso/jjodel/docs/DESIGN-SYSTEM.md` (430 righe) — esiste ✓
- `/Users/alfonso/jjodel/docs/ai-providers.md` — **MANCANTE** ✗
- `/Users/alfonso/jjodel/frontend/package.json` (unico `package.json`; nessun `package.json` al root)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/CLAUDE.md` (nested; vedi sotto)
- `/Users/alfonso/jjodel/docs/mde-intelligence-2026/{evidence/inventory-and-traces.md, harness-evolution-phases.md, paper/*}` — unica documentazione interna che menziona Codex
- Normalizzazioni/diff temporanei prodotti in scratchpad (non nel repo).

---

## HOW-1 — Existence check (richiesto dal prompt)

| File | Stato | Righe |
|------|-------|-------|
| `docs/DESIGN-SYSTEM.md` | **esiste** | 430 |
| `docs/ai-providers.md` | **MANCANTE** | — |

`docs/ai-providers.md` è citato da `CLAUDE.md §16` (`**Full details**: docs/ai-providers.md`) ma non esiste. **Non blocca** questo step (la generazione proietta il riferimento così com'è); blocca una dedup futura (Step 1+). Da registrare come debito, non da correggere qui (scope: non toccare CLAUDE.md).

---

## HOW-2 — Delta catalog completo `CLAUDE.md` ↔ `AGENTS.md`

**Metodo**: normalizzazione inversa di `AGENTS.md` (rewrite `Codex-log→claude-code-log`, `Codex→Claude Code`, `AGENTS.md→CLAUDE.md`) e `diff` contro `CLAUDE.md`. Dopo normalizzazione i token residui `Codex`/`AGENTS` sono **0** → l'insieme di sostituzioni cattura **tutte** le differenze di nome; ogni delta rimanente è semantico. Le righe citate sono di `CLAUDE.md`.

| # | Regione | Contenuto CLAUDE.md (breve) | Contenuto AGENTS.md (breve) | Classificazione | Azione nel generatore |
|---|---------|------------------------------|------------------------------|-----------------|------------------------|
| D1 | Titolo `:1` | `# CLAUDE.md — Jjodel Project Reference` | `# AGENTS.md — …` | **Tool-diff legittima** | sub `CLAUDE.md→AGENTS.md` |
| D2 | Intro `:3` | `> Operational reference for Claude Code.` | `> … for Codex.` | **Tool-diff legittima** | sub `Claude Code→Codex` |
| D3 | NON-NEG rule 8 `:23` | `Read docs/claude-code-log.md …` | `Read docs/Codex-log.md …` | **Tool-diff legittima** (ma vedi OQ-3: target inesistente) | sub `claude-code-log→Codex-log` |
| D4 | **§0 Runtime** `:28-39` | blocco `## 0. Runtime — model & effort` (Opus 4.8, `/effort`, `claude update`) | **ASSENTE** (nessun §0) | **Tool-diff + BUG (mancante)** | **inietta frammento §0 Codex** al posto del §0 CLAUDE |
| D5 | §3.10 cross-ref `:94-95` | paragrafo "Cross-reference: … `handlePosition.ts`/`DynamicHandles.tsx` … vedi §5.1" | **ASSENTE** | **Staleness (mancante)** | ri-proietta da CLAUDE |
| D6 | §3.10 Note 2026-05-27 `:264-265` | blockquote sul bucketing role-keyed / `nodeHandles` scartato | **ASSENTE** | **Staleness (mancante)** | ri-proietta da CLAUDE |
| D7 | **§3.12** `:288-310` | "Identity slot ↔ instance name — slot→name è sempre un `SetFieldAction` diretto" (invariante critical-zone) | **ASSENTE** | **Staleness (mancante, load-bearing)** | ri-proietta da CLAUDE |
| D8 | **§3.13** `:311-329` | "L-layer proxies riportano il className D-layer" (typo `=== 'LValue'` sempre falso) | **ASSENTE** | **Staleness (mancante, load-bearing)** | ri-proietta da CLAUDE |
| D9 | **§5.1** `:377-404` | "Visual bugs: specify before diagnosing" + 3 sub-rules (consumers/sort/fixtures) | **ASSENTE** | **Staleness (mancante, load-bearing)** | ri-proietta da CLAUDE |
| D10 | **§6.4** `:434-437` | "Incident log" (scope violation 2026-05-25) | **ASSENTE** | **Staleness (mancante)** | ri-proietta da CLAUDE |
| D11 | **§17 comandi** `:907-912` vs AGENTS `:821-826` | `npm start`=vite; `npm run dev`=docker-compose; `typecheck`; `test`; `build`; **niente lint** | `npm run dev`=Vite dev server (**errato**); `npm run test`; `test:watch`; `typecheck`; `build`; **`npm run lint`** (**inesistente**) | **STALENESS/BUG** (il difetto principale citato dal prompt) | ri-proietta da CLAUDE (fixa `dev` e rimuove `lint`) |
| D12 | §17 gate `:915-921` | "No `lint` script: ESLint non installato…" + verification gates (build/typecheck/test baseline) | **ASSENTE** | **Staleness (mancante)** | ri-proietta da CLAUDE |

**Sintesi**: 3 tool-diff legittime pure (D1–D3), 1 regione tool-specific da iniettare come frammento (D4), 8 regioni di staleness/bug (D5–D12) che la ri-proiezione da `CLAUDE.md` corregge automaticamente. **Nessuna** differenza "buona" di `AGENTS.md` va persa: tutto ciò che AGENTS ha in più rispetto a una proiezione è o rumore di nome (catturato dalle sub) o un difetto (D11).

**Effetto dimensionale atteso**: la nuova `AGENTS.md` cresce da 1000 → ~parità con CLAUDE (1093) ± delta del frammento §0 Codex vs §0 CLAUDE (12 righe). L'aumento è corretto: recupera 8 sezioni mancanti.

---

## HOW-3 — Insieme di sostituzioni (case-sensitive, completo, verificato)

Ordine consigliato (specifico → generico, per evitare match parziali):

| Ordine | Da (CLAUDE) | A (AGENTS) | Occorrenze in CLAUDE (corpo proiettato) | Rischio |
|--------|-------------|------------|------------------------------------------|---------|
| 1 | `claude-code-log` | `Codex-log` | 10 (tutte `docs/claude-code-log.md`) | ⚠️ **il target `docs/Codex-log.md` non esiste** → OQ-3 |
| 2 | `Claude Code` | `Codex` | 3 totali: `:3` intro, `:30` (dentro §0 → sostituito dal frammento), `:1044` §21 → **2 nel corpo proiettato** | basso (frase ancorata) |
| 3 | `CLAUDE.md` | `AGENTS.md` | 3+ self-ref (`:1` titolo, `:375` §5, `:1069` §21.3) + riferimenti nel testo | basso (`.md` ancora il match; non collide con `claude-code-log.md` che è lowercase) |

**Sostituzioni da NON fare** (flag di sicurezza — verificato):
- ❌ **`Claude`→…` "nudo"**: in `CLAUDE.md` ogni `Claude` è dentro `Claude Code` o `Claude Opus` (`grep` conferma 0 occorrenze standalone). Un `s/Claude/…/g` rischierebbe di toccare `Claude Opus 4.8`. Usare **solo la frase intera `Claude Code`**.
- ❌ **`CLAUDE`→…` "nudo"**: ogni `CLAUDE` maiuscolo è `CLAUDE.md` (`grep` conferma 0 standalone). `s/CLAUDE\.md/AGENTS.md/g` è sufficiente e sicuro.
- ✅ Case-sensitivity: `CLAUDE.md` (maiuscolo) ≠ `claude-code-log.md` (minuscolo) → nessuna collisione tra la regola 1 e la 3.

L'insieme è **reversibile**: applicando le inverse (`Codex-log→claude-code-log`, `Codex→Claude Code`, `AGENTS.md→CLAUDE.md`) si ottiene 0 token residui (verificato in fase di normalizzazione), quindi è completo.

---

## HOW-4 — Support check subtree / nested files

- **Nested `CLAUDE.md` esistente**: **sì, uno** — `frontend/src/components/editor-v2/CLAUDE.md`. **Ma non è contenuto migrato**: è una singola riga **canary** — `"When reading or editing any file in this directory, begin your reply with the token [CANARY]."` (0 righe a `wc -l` perché senza newline finale). È una sonda di test del meccanismo subtree, non una subtree-memory reale. **Confermo che il meccanismo funziona**: leggendo un file in quella directory il canary si è attivato (questo report è stato preceduto dal token in chat). Rilevante per il re-tiering: prova che i subtree `CLAUDE.md` caricano deterministicamente.
- **Nested `AGENTS.md` esistente**: **nessuno** (`find` conferma: solo `./AGENTS.md` al root).
- **Evidenza d'uso subtree-memory nel tooling**: nessuna configurazione dedicata; il meccanismo è nativo del harness (caricamento on-demand per directory), non richiede setup nel repo.
- **Codex legge i nested `AGENTS.md`?** **Non verificabile dai fatti nel repo** → OQ-4. La documentazione interna (`docs/mde-intelligence-2026/evidence/inventory-and-traces.md:42,92`, `harness-evolution-phases.md:79`) descrive `AGENTS.md` come "the Codex twin (1000 lines)" / "Codex constitution (twin)" ma **non** dice nulla sul comportamento nested. Il prompt vieta di indovinare → registrato come domanda aperta, non assunto.

---

## HOW-5 — Design del generatore proposto

**Convenzioni del repo verificate**:
- **Nessun `package.json` al root**; solo `frontend/package.json` (script vite/tsc/vitest). `AGENTS.md`/`CLAUDE.md` vivono al **root del repo**, fuori da `frontend/`.
- Nessuna dir `scripts/` esistente. Il repo ha `ts-node` disponibile (script `build_2: ts-node esbuild.config.ts`) ma quello è per il build dell'app, non per tooling docs.
- Nessun tool esistente al root; il generatore sarebbe il primo.

**Design consigliato (idiomatico, zero-dipendenze)**:
1. **Script**: un singolo file Node **plain, senza dipendenze** — `scripts/generate-agents.mjs` (nuova dir `scripts/` al root). Motivazione: i file target sono al root, non sotto `frontend/`; un `.mjs` eseguibile con `node scripts/generate-agents.mjs` **non richiede** `package.json` al root né ts-node. Solo `fs.readFileSync`/`replace`/`writeFileSync`. (Alternativa TS scartata: aggiungerebbe dipendenza da ts-node al root senza `package.json`.)
2. **Frammento §0 Codex**: file markdown separato **`docs/_agents/runtime-codex.md`** (path proposto dal prompt, variante). Contiene il blocco `## 0. Runtime …` in forma **finale Codex** (già senza token da sostituire). Motivo del file separato: editabile senza toccare lo script; estendibile per-tool in futuro. (Alternativa: inline nello script — più compatto ma meno leggibile; sconsigliata.)
3. **Algoritmo (deterministico + idempotente)**:
   a. Leggi `CLAUDE.md`.
   b. **Estrai/rimuovi il §0**: individua la regione dal heading `^## 0\. ` fino al successivo separatore `^---$` che precede `## 1` (incluso il §0, lasciando un solo `---`). Poiché in questo step **non** possiamo aggiungere marcatori a `CLAUDE.md`, l'ancoraggio è per pattern del heading `## 0.`; se in futuro si vuole robustezza, si valuterà un commento-marker HTML in `CLAUDE.md` (Step 1). Fallback: se `## 0.` non trovato, abort con errore esplicito (no silent).
   c. Applica le sostituzioni (regole 1→3 in ordine) al corpo rimanente.
   d. **Inietta** il contenuto di `runtime-codex.md` al posto del §0 (frammento già in forma finale → nessuna doppia sostituzione).
   e. Scrivi `AGENTS.md`.
   - **Idempotenza**: output = funzione pura di (`CLAUDE.md`, `runtime-codex.md`) → due run consecutive producono `AGENTS.md` byte-identico. ✓
4. **Estensione futura ai nested** (quando esisteranno subtree `CLAUDE.md` reali): lo stesso script scandisce ricorsivamente ogni `**/CLAUDE.md`, applica le sole sostituzioni di nome (i nested non hanno §0) e scrive il sibling `AGENTS.md` accanto. **Ma**: (a) dipende da OQ-4 (Codex legge i nested?); (b) l'attuale nested è un canary di test — non è chiaro se vada proiettato (OQ-5). In questo Step 0 il generatore tratta **solo il root**.
5. **Wiring opzionale**: dato che non c'è `package.json` al root, l'entry point è `node scripts/generate-agents.mjs`. In Fase 2 si può valutare uno script npm in `frontend/package.json` (es. `"gen:agents": "node ../scripts/generate-agents.mjs"`) — da decidere (OQ-6), non obbligatorio.

**Header di provenienza**: lo script dovrebbe premettere ad `AGENTS.md` un commento `<!-- GENERATED FROM CLAUDE.md — DO NOT EDIT BY HAND. Run: node scripts/generate-agents.mjs -->` per prevenire futuri edit manuali (reintroducendo il drift). Da confermare (OQ).

---

## Dipendenze e rischi

1. **Ancoraggio del §0 per pattern** (non per marker): fragile se il heading `## 0.` cambia. Mitigato con abort-on-not-found. Uno Step 1 potrebbe aggiungere un marker HTML in `CLAUDE.md` per robustezza (fuori scope ora).
2. **`docs/Codex-log.md` inesistente** (OQ-3): qualunque sia la scelta, l'attuale AGENTS.md è già rotto su questo punto; la generazione lo rende esplicito.
3. **Frammento §0 Codex da scrivere ex-novo**: Codex non ha `/effort`/`Opus 4.8`; il contenuto va deciso (OQ-1). Finché non deciso, il generatore non può produrre un §0 corretto — ma può girare con un frammento placeholder.
4. **Nested/canary** (OQ-4, OQ-5): il generatore root-only non è bloccato da questo, ma la strategia nested resta indecisa.
5. **Scope creep**: la tentazione di correggere `CLAUDE.md §16` (ai-providers.md mancante) o §17 va **resistita** — questo step non tocca `CLAUDE.md`. Il fix di §17 in AGENTS avviene **solo** via ri-proiezione, non editando CLAUDE.

---

## Domande aperte per Alfonso (da sciogliere in chat prima della Fase 2)

- **OQ-1 · Contenuto del §0 Codex**: cosa mette il frammento `runtime-codex.md`? Codex non ha `/effort` né "Opus 4.8". Opzioni: (a) un §0 minimale con l'equivalente Codex di modello/effort; (b) nessun §0 per Codex (mantiene il comportamento attuale, ma allora il generatore semplicemente **omette** §0). Serve la tua indicazione sul runtime Codex.
- **OQ-2 · Log unico o separato**: `AGENTS.md` deve puntare a un `docs/Codex-log.md` **separato** (da creare — frammenta la storia operativa) oppure alla **stessa** `docs/claude-code-log.md` (coerente con "una fonte", ma due tool scrivono sullo stesso file)? Impatta la regola di sostituzione 1: tenerla (log separato) o **rimuoverla** (log condiviso).
- **OQ-3 · Se log separato**: creare `docs/Codex-log.md` (vuoto/con header) fa parte della Fase 2 o è un passo a sé?
- **OQ-4 · Nested AGENTS.md**: Codex legge i `AGENTS.md` annidati per-directory (come i subtree `CLAUDE.md`)? Se sì, il generatore deve produrre i sibling nested. Se no/ignoto, il generatore resta root-only. (Non indovinato: nessuna evidenza nel repo.)
- **OQ-5 · Canary nested**: `frontend/src/components/editor-v2/CLAUDE.md` è un canary di test. Il generatore deve proiettarlo in un `AGENTS.md` sibling, ignorarlo, o è un artefatto temporaneo che verrà rimosso?
- **OQ-6 · Wiring**: aggiungere uno script npm in `frontend/package.json` per invocare il generatore, o lasciare l'invocazione a `node scripts/generate-agents.mjs`?
- **OQ-7 · Header anti-edit**: premettere ad `AGENTS.md` un banner "GENERATED — DO NOT EDIT"?
- **OQ-8 · Path del frammento**: `docs/_agents/runtime-codex.md` va bene, o preferisci `scripts/agents-runtime-codex.md` (vicino allo script) o inline?

---

## HARD STOP

Fase 1 completata. Nessuno script creato, `AGENTS.md` non toccato, `CLAUDE.md` non toccato, nessun commit. Working tree invariato salvo questo report. La Fase 2 (build del generatore + rigenerazione + commit) parte **solo** dopo go-ahead esplicito in chat, che potrà aggiustare l'insieme di sostituzioni o la gestione del §0.
