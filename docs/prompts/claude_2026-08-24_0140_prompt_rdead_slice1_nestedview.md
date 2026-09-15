# Prompt Claude Code, 2026-08-24 01:40: R-DEAD slice 1, cancellazione di `NestedView`

**Fase**: 2, implementazione scoped, corsia veloce. **Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`.
**Base**: `bacce7836` o successivo, **a repo fermo**: nessun'altra sessione di Claude Code aperta sullo
stesso albero. Non eseguire mentre gira il prompt delle 00:50 (`VersionFixer`): file diversi, ma
stesso `git index`.
**Protocollo**: `docs/PROTOCOL.md` P1..P10. **Decisioni che governano**: `R-DEAD-1..6` (in
particolare R-DEAD-5, che delibera questa slice così com'è), `R-LAY-12`, `R-IRN-27`, `R-RAIL-28`
(ogni asserzione di assenza porta il controllo positivo nella stessa invocazione).
**Report che precede**: `docs/discovery/discovery_2026-08-23_perimetro_rimozione_nestedview.md`.
Leggilo prima: questo prompt esegue la sua §6, non la ridiscute.

## Passo zero, obbligatorio

```
command grep -c "R-DEAD" docs/decisions.md                                   # atteso 11
command grep -rn "views/NestedView" frontend/src --include='*.ts' --include='*.tsx'   # atteso: 1 riga, editors/index.ts:8
command grep -rn "NestedView" frontend/src/joiner/components.tsx             # atteso: 0 righe (R-DEAD-4)
command grep -c "export" frontend/src/joiner/components.tsx                  # controllo positivo, > 0
```
Se il secondo comando trova un importatore in più, o il terzo trova una riga: **fermati**, il
perimetro di R-DEAD-5 non è più quello misurato il 23, e va rimisurato prima di cancellare.

## Cosa fare, e solo questo

1. `git rm frontend/src/components/editors/views/NestedView.tsx`.
2. In `frontend/src/components/editors/index.ts` togliere la riga 8, `export {NestedView} from './views/NestedView';`. Niente altro in quel file: le righe 2, 4 e 9-12 sono la slice 3, non deliberata.

**Non toccare**: `nestedView.scss` (R-DEAD-2: lo importa `ViewData.tsx:24`, vivo), `forEndUser/Tree.tsx`,
`widgets/Widgets.tsx`, `ModeSystem/*` (R-DEAD-3: la cascata è la slice 2), `TabDataMaker.tsx` (i
commenti stale «(NestedView + ViewData)» alle righe 6-7 e 36-39 restano; vanno con la slice 2 o 3),
`docs/decisions.md`.

## Gate

`npm run typecheck`: **diff vuoto** rispetto alla baseline §17 (33 errori, stessa composizione).
Se la cancellazione fa sparire un errore di baseline che stava dentro `NestedView.tsx`, è un
miglioramento da dichiarare nella entry con il conteggio nuovo, non un fallimento; se ne fa
comparire uno nuovo, fermati. `npm run build` exit 0. `npm run test` 1323 pass (le 9 suite rosse per
`window is not defined` sono note). `npm run check:docs`: Check C è già rosso su due entry del 23/8,
dichiaralo e non correggerle.

## Commit ed entry

Un commit, due file:
`chore(editors): remove NestedView, unreachable since the v3 editor (R-DEAD-5 slice 1)`.
Nel corpo del messaggio, tre righe che dichiarano i tre orfani di R-DEAD-3 (`GenericTree`,
`InternalToggle`, `LockedFeature`) come orfani noti lasciati alla slice 2, come R-DEAD-5 prescrive.
Entry in `docs/claude-code-log.md`, `Corregge` e `Causa` vuoti, `Smoke visivo`: non applicabile
(nessun pixel: il componente non era montato, R-LAY-12). **Hard stop** dopo il commit.

## Riferimenti

- `docs/decisions.md`: `R-DEAD-1..6` (righe 1721-1731), `R-LAY-12`
- `docs/discovery/discovery_2026-08-23_perimetro_rimozione_nestedview.md` §3, §5, §6
- `docs/discovery/discovery_2026-08-23_nestedview_ui_morta.md` (la misura di irraggiungibilità)
- `frontend/src/components/editors/index.ts:8`
- `frontend/src/components/editors/views/NestedView.tsx:28-37` (gli import che diventano orfani)
