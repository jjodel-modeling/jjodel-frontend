# Prompt Claude Code: rimozione della scheda Form dal rail (R-VP-14)

**Data**: 2026-09-04 15:09
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`, HEAD `b2f29d8b7`
**Corsia**: veloce (RC-3): 2 file, nessuna critical zone, nessun report separato; la verifica
preventiva sta in §2 e va riportata nella entry in massimo 10 righe.
**Effort**: high

Leggi `CLAUDE.md`, `docs/decisions.md` (R-VP-14) e `docs/claude-code-log.md` prima di iniziare.

## 1. COSA
Togliere per intero la scheda **Form** del rail (Properties | Form, 2026-08-26): il pannello di
destra torna ad avere il solo rendering classico (`Info`). Nessuna modifica a `IRForm`, a
`formHosts.ts`, alla prop `host`, né al Data Manager, che resta l'unico host della form (R-VP-14).

## 2. DOVE (verificato sul working tree il 2026-09-04 15:09)
`frontend/src/components/editors/PropertiesWithTreeView.tsx`:
- `:6` `import IRForm ...` (dopo la rimozione non ha più consumatori nel file: togliere l'import);
- `:544` `formSubjectId` (unico uso: il mount di `IRForm` a `:1110`; togliere);
- `:547-550` `formSubjectIsObject` e `:551` `inspectorTab` con l'effetto `:554-556`;
  `formSubjectIsObject` è usato solo per la barra dei tab e per il mount: togliere entrambi;
- `:1084-1107` la barra `.inspector-tabs` con i due bottoni: togliere;
- `:1109-1115` il ternario `inspectorTab === 'form' && formSubjectIsObject ? <IRForm .../> : <Info .../>`:
  resta il solo `<Info ... />` con le stesse prop;
- `:1120` `advanced && inspectorTab !== 'form' && (` diventa `advanced && (`.
Il commento `:540-543` sul soggetto effettivo spiega `formSubjectId`: va tolto con lui.

`frontend/src/components/editors/properties-with-tree-view.scss`:
- `:2497-2537` il blocco «Inspector tabs (2026-08-26)» (`.inspector-tabs`, `.inspector-tabs__tab`,
  `--active`, `:hover`, `:focus-visible`): togliere per intero, commento di testata compreso.
  `grep -rn "inspector-tabs" frontend/src` deve restituire 0 dopo la rimozione.

Nessun test cita `inspectorTab` o `inspector-tabs` (grep 2026-09-04: 0 file in `__tests__`).
`useState`/`useEffect` restano importati perché usati altrove nel file: non toccare gli import
React.

## 3. COME
Edit puntuali, nessuna riscrittura. Zero refactoring: non rinominare, non riordinare, non
«ripulire» il codice intorno. `formSubjectIsObject` leggeva `state._lastSelected` con
`useSelector`: togliendolo si toglie una subscription, non un comportamento.

## 4. Gate e commit
`npx tsc --noEmit` senza errori nuovi nei due file (baseline 33); `npm run build` exit 0;
vitest non necessario (nessun test tocca il perimetro). Commit:
`refactor(rail): remove the Form tab, the Data Manager is the only form host (R-VP-14)`,
`git commit -- <i due file>`.

**HARD STOP** per verifica visiva: rail con un oggetto M1 selezionato → nessuna barra di tab,
pannello Properties classico come prima del 2026-08-26; con un DClass selezionato → identico a
oggi; sezione NODE in Advanced ancora presente. Data Manager: drawer invariato.

## 5. Cosa NON fare
Non toccare `IRForm.tsx`, `formHosts.ts`, `irTypes.ts` (`FormHost`, `hosts`), `InstanceManagerTab.tsx`.
Non rimuovere `FormHost = 'rail'` dal tipo: è un fronte R-DEAD a parte, con misura.
Entry di log dopo la conferma visiva.
