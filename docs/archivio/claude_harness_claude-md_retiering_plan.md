# Piano di ri-tierizzazione di CLAUDE.md

**Data**: 2026-07-14 (preparato di notte, da rivedere a mente fresca)
**Autore**: chat di progetto (co-designer)
**Stato**: proposta da approvare. Nessuna modifica al codice è stata fatta.
**Base**: struttura del `CLAUDE.md` reale letta dal branch `alfonso-frontend-jjtl` via fetch.

---

## Perché (lo stato reale, non ipotizzato)

Il fetch del branch mostra un `CLAUDE.md` di **~1850 righe**, cresciuto dalle 1001 della ricalibrazione del 2026-05-22. La raccomandazione ufficiale di Anthropic per i file di memoria è **sotto le 200 righe**: sei a 9x. E tutto questo è caricato per intero in contesto a ogni sessione di Claude Code, prima di ogni turno.

I tre blocchi che pesano di più:

- **§3 Sync layer & D-L proxy**: ~480 righe (26% del file). È materiale load-bearing ma legato a un path preciso (`frontend/src/components/editor-v2/` e dintorni).
- **§11-§13 linguaggi (JjEL/JjTL/JjScript)**: ~350 righe. Materiale di riferimento, legato a `src/jjel`, `src/jjtl`, `src/jjscript`, e in gran parte già duplicato dai rispettivi `SPEC.md`.
- **§18-§19 registri di file**: ~155 righe di tabelle file→ruolo. Volatili per natura: sono ciò che deriva quando i file si spostano.

## Il principio (tre tier, tre meccanismi)

Non si taglia per argomento, si taglia per **volatilità** e per **always-on**:

- **Tier 1, resta in CLAUDE.md** (sempre in contesto): le regole non negoziabili, i gate, i trigger, il protocollo di misura, un indice. È ciò che, se dimenticato, causa una regressione.
- **Tier 2, esce in memoria on-demand**: playbook profondi ma condizionali. Meccanismo preferito quando il contenuto è legato a una directory: **CLAUDE.md di sottocartella**, che si carica in automatico e in modo deterministico quando Claude Code tocca quella directory (nessuna scommessa sul trigger, zero costo always-on). Skill esplicita solo per i playbook trasversali non legati a una sola dir.
- **Tier 3, esce dal doc e va nella discovery**: i fatti volatili (numeri di riga, tabelle file→ruolo, alberi di struttura). Li ri-deriva il Cartographer per task. Un doc "stabile" che li pinna è esattamente la fonte della deriva.

Nota chiave: quasi tutto il materiale movibile è **legato a un path** (editor-v2, jjel, jjtl, jjscript, model, styles, services). Quindi il meccanismo principale qui è il **CLAUDE.md di sottocartella**, non la skill. Questo è ciò che rende la mossa sicura: le regole load-bearing non spariscono, si caricano da sole quando (e solo quando) tocchi la dir a cui appartengono.

## Disposizione proposta per sezione

| Sezione | ~righe | Tier | Destinazione proposta |
|---|---|---|---|
| §0 Runtime (model/effort) | 25 | 1 | resta |
| §1 Hard stops | 35 | 1 | resta |
| §2 Preservation + test gates | 65 | 1 | resta (sfoltire prosa) |
| §3.1 lista file zona critica | 30 | 2 | → `editor-v2/CLAUDE.md`; pointer in T1 |
| §3.2 template Layer Impact Report | 45 | 2 | → subtree; trigger "LIR obbligatorio" resta in T1 |
| §3.3–§3.13 invarianti sync/D-L + WRONG/RIGHT | ~400 | 2 | → `frontend/src/components/editor-v2/CLAUDE.md` (deterministico) |
| ↳ numeri di riga dentro §3 (`:527`, `:7484`, …) | — | 3 | riferire per simbolo, ri-derivare via discovery |
| §4 Scope & anti-refactoring | 45 | 1 | resta |
| §5 Discovery before action | 95 | 1 | resta (sfoltire gli esempi lunghi) |
| §6.1–6.3 commit discipline | 50 | 1 | resta |
| §6.4 incident log storico | 15 | 3/arch | → archivio KB |
| §7 Design system | 70 | 2 | → subtree styles / pointer a `docs/DESIGN-SYSTEM.md`; kernel (icone, cyan, no-deps) resta in T1 |
| §8 Conventions | 80 | 1 | resta (sfoltire §8.6/§8.7) |
| §9 Object persistence (DObject temp IDs, deferred attrs) | 90 | 2 | → `src/model/CLAUDE.md` (deterministico) |
| §10 Removed V3 | 30 | 1/arch | 3 righe di divieto in T1; dettaglio → archivio |
| §11 JjEL | 150 | 2 | → `src/jjel/CLAUDE.md` o pointer snello a `SPEC.md` |
| §12 JjTL (incl. §12.7 checklist 5-file) | 180 | 2 | → `src/jjtl/CLAUDE.md` |
| §13 JjScript | 20 | 2 | → `src/jjscript/CLAUDE.md` |
| §14 Ecore/XMI I/O | 30 | 2 | → subtree services |
| §15 Known gotchas | 50 | 2 | → reference gotchas; `windoww` come one-liner in T1 |
| §16 AI provider system | 30 | 2 | → subtree services/AI |
| §17 Dev commands + verification gates | 30 | 1 | resta (i gate sono core della resilienza) |
| §18 Project structure tree | 35 | 3 | discovery-derived; 5 righe top-level in T1 |
| §19 Key files reference (6 tabelle) | 120 | 3 | discovery-derived; §19.1 file critici co-locati con editor-v2 |
| §20 Workflow & anti-patterns | 60 | 1 | resta (deduplicare con §4) |
| §21 Prompt log (lifecycle, format, rubrica onestà) | 70 | 1 | resta (core della misura regressioni) |

## Risultato atteso

Movibili/delegabili: circa **1100-1200 righe** su ~1850. Il nucleo always-on scende a un ordine di ~600-700 righe, e con lo sfoltimento della prosa punta a ~300-400. Non arrivo a promettere "sotto 200" onestamente (le custom instructions riprodotte e la mole di convenzioni always-on hanno un pavimento), ma la riduzione è netta e, soprattutto, il nucleo diventa *solo* invarianti, discipline, trigger e indice. Il resto vive dove è rilevante e si carica da solo quando serve.

## Perché non compromette accuratezza né resilienza

- Le NON-NEGOTIABLE (scope, mai rinominare, hard-stop, git add mirato, i gate di verifica, la rubrica del log) restano sempre in contesto.
- I playbook load-bearing legati a un path (sync/D-L, linguaggi, persistence) vanno in CLAUDE.md di sottocartella: si caricano in automatico e per intero quando Claude Code tocca quella dir. Nessuna scommessa sull'auto-trigger delle skill.
- I fatti volatili (righe, tabelle file) smettono di stare in un doc "stabile" e passano alla discovery, che è già la loro fonte di verità: meno deriva, non più.
- Guadagno collaterale: CLAUDE.md torna leggibile in 15 secondi (l'obiettivo di design di maggio), e il playbook profondo viene letto per intero quando serve invece di essere una sezione fra 1850 righe.

## Rischi e mitigazioni

- **Rischio unico serio**: una regola critica finisce solo in un subtree/skill che non si carica. Mitigazione: la regola di taglio ("se dimenticarla causa una regressione, resta in CLAUDE.md") + per i subtree il caricamento è deterministico sul path, non sul trigger.
- **Staleness di questa mappa**: la disposizione qui sopra è seminata sul `CLAUDE.md` pushato, che può divergere dal tuo working tree. Non è un problema: la Fase 1 di discovery (prompt allegato) verifica tutto sul file reale prima che si tocchi nulla.
- **Migrazione = modifica alla fonte di verità**: va fatta discovery-first e verificata, con la validazione post-migrazione che avevi pianificato il 05-22 (qualche task sotto il nuovo regime, guardando i campi Regressions/Out-of-scope del log).

## Prossimo passo

Esegui in Claude Code il prompt allegato `2026-07-14 01-16 discovery-claude-md-retiering.md` (Fase 1, read-only). Produce il report in `docs/discovery/`, poi HARD STOP. Lo rivediamo in chat: confermiamo/correggiamo la disposizione sul file reale, decidiamo se i sottosistemi vanno in subtree CLAUDE.md o in skill, e solo allora genero il prompt di Fase 2 con lo split effettivo, commit per commit.
