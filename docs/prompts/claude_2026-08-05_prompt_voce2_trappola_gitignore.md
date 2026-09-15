# Voce 2: trappola `.gitignore` su CLAUDE.md, più atterraggio della modifica pendente

> **Corsia veloce, RC-3 del 2026-08-05**: niente discovery report separato, verifica
> preventiva inline riportata nella entry di log. Decisione già ratificata (voce 2 della
> coda in `contesto_progetto.md`): il fix è `/CLAUDE.md`. Se CLAUDE.md di root contraddice
> qualcosa di questo prompt, segnala citando questa ratifica.
>
> **Contesto in tre righe.** `.gitignore:61` contiene `CLAUDE.md` nudo, che matcha a ogni
> livello: `frontend/src/jjtl/CLAUDE.md` è ignorato (verificato con `check-ignore` il
> 2026-08-05). Nel working tree c'è la modifica non committata che porta il CLAUDE.md di
> root da 934 a 778 righe spostando 156 righe proprio in quel file ignorato. Committarla
> senza il fix farebbe sparire quelle regole dal repo in silenzio.

Da eseguire **solo dopo** la chiusura della slice di recupero e la verifica visiva di
Alfonso, sullo stesso working tree.

## COSA

1. **Verifica preventiva** (riporta l'output, max 6 righe):
   - `git check-ignore -v frontend/src/jjtl/CLAUDE.md` (atteso: match su `.gitignore:61`);
   - censimento di tutti i CLAUDE.md: `find . -name 'CLAUDE.md' -not -path '*/node_modules/*'`;
   - `git diff --stat CLAUDE.md`.
   Se il censimento trova CLAUDE.md **diversi** da root e `frontend/src/jjtl/`, fermati e
   riporta prima di committare: col fix diventerebbero trackabili e comparirebbero come
   untracked.
2. **Edit**: in `.gitignore`, il pattern nudo `CLAUDE.md` diventa `/CLAUDE.md` (se la riga
   non è più la 61, cerca il pattern, non il numero).
3. **Conferma**: `git check-ignore -v frontend/src/jjtl/CLAUDE.md` non deve più matchare
   nulla.
4. **Sanity sul contenuto, prima del commit**: le 156 righe uscite dal root devono esistere
   in `frontend/src/jjtl/CLAUDE.md`. Confronto per sezioni e titoli, non byte a byte. Se
   manca qualcosa: **STOP e riporta cosa manca**, senza committare.
5. **Un commit unico** con `git add` per path espliciti: `.gitignore`,
   `frontend/src/jjtl/CLAUDE.md` (nuovo), `CLAUDE.md` (sfoltito). Messaggio:
   `fix: anchor CLAUDE.md gitignore rule to repo root and land jjtl CLAUDE.md`.
6. **Entry** in `docs/claude-code-log.md` (tipo fix), con la verifica preventiva del punto 1
   in forma sintetica. La rotazione del log resta housekeeping separato: non farla qui.

## DOVE

`.gitignore`, `CLAUDE.md`, `frontend/src/jjtl/CLAUDE.md`, `docs/claude-code-log.md`.
Qualsiasi altro file: STOP e segnala.

## Gate

Nessun codice toccato: niente build, niente tsc, niente vitest. I gate sono il punto 3
(check-ignore muto) e un `git status --short` finale riportato in chat. Nessun push senza
go-ahead.

## RIFERIMENTI

- Bug ALTA in `contesto_progetto.md`, sezione "Bug aperti" (trappola `.gitignore`).
- Scoperta della sessione 2 del 2026-08-05 (`claude/sessione_2026-08-05_2.md` nel KB, non
  nel repo: questo prompt è autosufficiente).

---
**Nome del documento prompt**: 2026-08-05 23:09 prompt_voce2_trappola_gitignore
