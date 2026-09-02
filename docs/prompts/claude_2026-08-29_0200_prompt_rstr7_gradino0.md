# 2026-08-29 02:00 — R-STR-7 Fase 2: il gradino 0 sul ramo IR

Discovery: `docs/discovery/discovery_2026-08-29_rstr7_inspector_ramo_ir.md`.
Corsia completa (RC-3): interfaccia esportata toccata, 5 file di sorgente.

## Nota di processo (RC-10)

Il prompt di Fase 2 citava il report di discovery come «già a terra». Non esisteva:
`ls` exit 1, controllo positivo a 317 voci nella stessa directory. Dichiarato e
proceduto, perché le tre ratifiche stavano nel prompt e non poggiavano su quel
documento. Il report è stato scritto in apertura di Fase 2 con le misure della Fase 1.

## Prerequisito

Ratificato come bloccante: se `slotRows` fosse vuoto sul ramo IR, il ponte non reggerebbe.
Non è osservabile nel DOM (il ramo IR non disegna le righe native), quindi misurato
leggendo il **fiber React** dell'elemento `.mm-object[data-viewid]` — i props reali di
quell'`ObjectNode`, senza toccare il sorgente. 4/4 PASS: `featureCount: 13`,
`instanceOfClassId` presente. Il ponte regge.

## Scostamenti dichiarati

- **Rilocazione di due funzioni.** `resetViewWidget` e `openInspector` erano definiti
  **dopo** il return anticipato di `:728`: il ramo IR non poteva chiamarli. Sono risaliti
  sopra il return. È una rilocazione pura (nessuna dipendenza sotto 728), ma sposta ~50
  righe che il prompt non nominava.
- **`openInspectorAt` estratto.** `openInspector` voleva un `React.MouseEvent`; il ramo IR
  ha un `DOMRect`. Invece di duplicare la costruzione del payload — cioè la definizione di
  `featureId` — `openInspector` calcola il rect e delega. Un solo posto decide.
- **`inspectorEl` estratto.** Il blocco JSX del pannello era inline nel return nativo.
  Duplicarlo nel ramo IR sarebbe stata una seconda copia da tenere allineata: è ora una
  const sopra i due return, montata da entrambi.
- **Sesto file: `nodes/valueRenderer.ts`.** Il ponte `findRowByFeatureName` è lì e non in
  `ObjectNode.tsx` perché `SlotRow` è locale a `ObjectNode`, e importare quel file in un
  test tira dentro Monaco — la stessa ragione per cui `RENDERER_LABELS` si era già spostata
  lì. Nessun file nuovo: la funzione sta accanto a `SlotShape`, che è il tipo che indicizza.
- **Stile in `irStyle.ts`, non in uno `.scss`.** I nodi IR non hanno un foglio di componente:
  le loro regole vivono nel template literal di `irStyle.ts`. Seguito quell'idioma.

## Reperti

- **Backtick in un commento dentro un template literal.** Il commento CSS scritto con
  `` `margin-left: auto` `` chiudeva la stringa: tre TS1005 su `irStyle.ts`. Chi commenta
  dentro quel file non può usare i backtick.
- **La fixture installa ma non attiva.** `__jjodelInstallIRDemo` crea il viewpoint e lo dice
  («Activate it from the viewpoint selector»), ma il canvas resta in sintassi astratta: la
  prima esecuzione della sonda dava `ir: 0` e quattro FAIL. Ogni sonda sul ramo IR deve
  attivare il viewpoint dal `<select>` reale (`Toolbar.tsx:614`). Causa (g).
- **La classe del pannello è `.inode-inspector`**, non `.renderer-inspector` come il nome del
  componente: il primo giro della sonda 7c leggeva zero caratteri da un pannello aperto.

## Verifica

- `npx tsc --noEmit`: **33** = baseline su output completo, zero errori nei file toccati.
- `npm run build`: exit 0, zero righe di errore, solo il chunk-warning.
- `npx vitest run`: **1812 passed / 0 failed** (erano 1808; +4 sul ponte), i 9 file rotti
  all'import sono la baseline nota. I 21 test di precedenza restano verdi senza modifica.
- Sonda `_tmp_rstr7_rung0.ts` sul canvas vero: **10/10 ALL GREEN**, zero errori di pagina.

## Non coperto

Dark mode (fuori perimetro dalla slice Structure). Il residuo R-4 su `ObjectNode.tsx:1227-1228`
(`title`/`aria-label` italiani dell'affordance **nativa**) resta: micro-voce registrata nel
report §6. Il bottone IR nuovo nasce in inglese.
