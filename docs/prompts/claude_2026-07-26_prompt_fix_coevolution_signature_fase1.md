# Prompt Claude Code: Fix Fase 1 — la firma del metamodello traccia i nomi delle feature (co-evoluzione rename → connect)

**Data**: 2026-07-26
**Tipo**: fix (Fase 2 del two-phase; RCA già completa, NON ridiscuterla)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl` (HEAD `420657f98` o successivo)
**Working tree**: WIP lane-separation noto + 3 discovery report non committati: procedere, stage finale SOLO come da sezione Commit.
**RCA di riferimento**: `docs/discovery/discovery_2026-07-26_coevolution_edge_rename.md` — verdetto H1 (meccanismo) + H3 (radice). Ratifiche in chat: Fase 1 sola; firma con nomi di reference E attributi; Fase 2 by-id rinviata a slice con LIR; reaper intoccato.
**Hard stop**: dopo implementazione + gate verdi, PRIMA del commit. Commit solo dopo verifica visiva di Alfonso.

## Root cause (dal report, sintesi)

`metamodelClassSignature` (`useEditorMode.ts:111-164`, emit `:161`) firma ogni classe come `${id}:${name}:${abstract}:${refCount}`: **conta** le feature ma non ne include i **nomi**. Un rename di reference a M2 (id-preserving, `joiner/classes.ts:2144-2163`) non cambia la firma → il `useMemo` di `modeInfo` (`:205`) non ricalcola → il connect M1 riceve `metaRef.name` **stale** → entrambe le risoluzioni by-name del write path (`canvasToJjom.ts:602-616` e accessor `$name` `:1524`) mancano in **silenzio** → il valore di reference non atterra mai, l'edge ottimistico resta orfano e sparisce.

## Vincoli di scope (rigidi)
- **File toccati, SOLO questi**:
  1. `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (la firma)
  2. (se fattibile senza refactoring) un file di test nuovo secondo la convenzione dei test esistenti degli hooks/utils
- **NON toccare**: `canvasToJjom.ts` (Fase 2 separata, critical zone → LIR), `useJjomSync.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts` (il reaper è corretto), `EditorV2.tsx`, `jjomTransformers.ts`. Se sembra necessario, STOP e segnala.
- Zero refactoring; nessun rename di identificatori esistenti.

## COSA / COME

### Estendere la firma (`useEditorMode.ts:111-164`)
Includere nella firma per-classe i **nomi delle reference e degli attributi** (criterio ratificato: la firma copre i campi che `modeInfo` espone e che i consumer leggono per nome). Direzione dal report, da adattare alle strutture reali già camminate dalla funzione (che già conta `refCount`, quindi ha accesso alle feature):

```
parts.push(`${id}:${cls.name}:${cls.abstract}:${refCount}:${refNames.join(',')}:${attrNames.join(',')}`)
```

- Calcolo O(#feature) con concatenazione semplice: la firma gira a ogni notifica dello store, niente `JSON.stringify`, niente allocazioni superflue.
- Ordine deterministico (l'ordine di dichiarazione già usato per il count va bene).
- **Verify consumers**: grep degli usi di `metamodelClassSignature` (e del valore firmato) per confermare che sia solo la dep del memo/selector e che nessun altro sito confronti o persista il formato della firma. Se emergono altri consumer, riportarli PRIMA di cambiare formato.
- Bounds/type NON entrano nella firma (fuori criterio, ratificato).

### Test (se fattibile senza refactoring)
Test che due firme differiscono quando cambia il nome di una reference e quando cambia il nome di un attributo, e restano identiche a parità di nomi. Se `metamodelClassSignature` non è esportata, aggiungere l'export è ammesso (modifica additiva; dichiararla nel log). Se il setup di store/mock rendesse il test sproporzionato, riportarlo nel log come rinuncia motivata invece di forzare.

## Verifica
1. `npm run build` verde; typecheck baseline; vitest verde.
2. **Visiva (Alfonso, su localhost:3001)**:
   - (a) repro chiuso: rename di una reference a M2 → a M1 il connect sulla stessa reference ora **atterra**: l'edge resta, la label mostra il nome NUOVO, il valore compare (pannello Slots / treeview);
   - (b) controllo: connect su una reference mai rinominata continua a funzionare;
   - (c) rename di un attributo a M2: nessun malfunzionamento/thrash evidente del canvas (il memo ricalcola, atteso e benigno);
   - (d) opzionale, confermativo: probe console del report RCA → `landed=true` dopo il fix.
   - Nota: eventuali edge orfani creati dai tentativi falliti PRE-fix possono restare finché un cambio di valori non attiva il reap (o si puliscono col reload): non sono un fallimento del fix.
3. **HARD STOP**: non committare. Consegnare diff + esito gate.

## Commit (solo dopo GO di Alfonso) — DUE commit separati
1. `chore(docs): edge discovery reports (substrate, authoring panel, coevolution rename)` — stage dei SOLI 3 report in `docs/discovery/` + `docs/claude-code-log.md` se sporco di sole entry.
2. `fix(editor-v2): include feature names in metamodel signature so M2 renames invalidate modeInfo` — stage di `useEditorMode.ts` + eventuale file di test.
- Il WIP lane-separation resta FUORI da entrambi.
- Entry di log per il fix: data, fix, prompt in una riga, file, esito, nota "Fase 2 by-id (canvasToJjom) pianificata come slice separata con LIR".

## RIFERIMENTI
- RCA: `docs/discovery/discovery_2026-07-26_coevolution_edge_rename.md` (catena causale, siti `file:riga`, probe).
- Prior art della classe di bug: `4f1ff6aa6` (picker by-id), `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md` (memo con firma che ignora la feature-signature).
- Fase 2 (futura, NON in questo task): write path by-id in `canvasToJjom.ts` (id-puro senza fallback-nome, ratificato), go-ahead + Layer Impact Report.
