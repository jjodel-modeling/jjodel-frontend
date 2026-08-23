# Discovery 2026-08-23 — verifica delle premesse di R-LAY-10 (Fase 0, read-only)

**Data**: 2026-08-23
**Branch**: `alfonso-frontend-jjtl`, HEAD `9971ba29c` (allineato al tip di origin su cui il
prompt è stato scritto: nessuno scostamento del working tree, `git status` pulito)
**Prompt**: 2026-08-23 16:47 — R-LAY-11 a registro e sorgente unica dell'attivazione
**Esito**: 4 premesse su 4 confermate. Nessun hard stop. Si procede con i commit A e B.

## Obiettivo

Le premesse del prompt sono state misurate su un clone di origin. Prima di scrivere qualsiasi
diff vanno riprodotte sul working tree locale, con `command grep` (BSD grep 2.6.0-FreeBSD, non
il wrapper `ugrep --ignore-files` a cui risolve `grep` in questa shell) e con controllo positivo
dove l'esito atteso è un'assenza (CLAUDE.md §5, «un'asserzione di assenza richiede la prova che
la ricerca sia girata»).

## Comandi eseguiti ed esito

### Premessa 1 — due sole scritture di `project.activeViewpoint` in `NestedView.tsx`

```
command grep -n "project.activeViewpoint" frontend/src/components/editors/views/NestedView.tsx
command grep -c "project\.activeViewpoint = ptr as any;" frontend/src/components/editors/views/NestedView.tsx
command grep -n "select(ptr\|previousViewpoint" frontend/src/components/editors/views/NestedView.tsx
```

exit 0. Cinque occorrenze del campo, di cui **esattamente due** in forma di scrittura:

| Riga | Forma | Contesto |
|---|---|---|
| 82 | lettura | `activeViewpointId = project.activeViewpoint?.id` (alimenta `isActive` a 130 e 336) |
| 110 | lettura | `const previousViewpoint = project.activeViewpoint;` — primo `select` |
| **111** | **scrittura** | `project.activeViewpoint = ptr as any;` |
| 314 | lettura | `const previousViewpoint = project.activeViewpoint;` — secondo `select` |
| **315** | **scrittura** | `project.activeViewpoint = ptr as any;` |
| 546 | lettura | `ret.active = ret.project.activeViewpoint` (mapStateToProps) |

Il conteggio esatto della forma di scrittura è 2. Le due funzioni sono dichiarate a 109
(`function select(ptr: Pointer<DViewPoint>) {`) e 313 (`function select(ptr: Pointer<DViewPoint>){`,
senza spazio: due copie non identiche byte a byte, quindi la sostituzione va fatta per riga di
scrittura, non con un `sed` globale sulla firma). In entrambe la lettura di `previousViewpoint`
precede la scrittura, e la scrittura è seguita dal confronto `ptr !== previousViewpoint?.id`
che gate l'`ActivityLogger` dentro un `try/catch` con `console.warn` nel ramo di errore.
Confermata come descritta dal prompt.

### Premessa 2 — `setLastEditedViewpoint` / `clearLastEditedViewpoint` hanno zero call site

```
command grep -rn "setLastEditedViewpoint\|clearLastEditedViewpoint" frontend/src
```

exit 0, due sole righe, entrambe le **dichiarazioni**:

```
frontend/src/utils/lastViewpoint.ts:18:export function setLastEditedViewpoint(id: string, name: string): void {
frontend/src/utils/lastViewpoint.ts:31:export function clearLastEditedViewpoint(): void {
```

Nessuna chiamata, nessun import altrove. **Controllo positivo** sulla stessa forma di grep
(stessa flag `-rn`, stessa radice `frontend/src`, stesso binario): `createViewInWorkbench`
restituisce 9 righe fuori da `lastViewpoint.ts`, di cui 3 import e 3 chiamate effettive —
`EditorV2.tsx:105`/`:3066`, `ContextMenu.tsx:51`/`:641`, `TreeViewContent.tsx:24`/`:479` —
più 3 menzioni in commento (`default-view.scss:3`, `irCreationSeed.ts:44`,
`TreeViewContent.tsx:440`). Soglia del prompt (≥4 chiamanti fuori dal file) superata: la
ricerca ha segnale, quindi il silenzio sulla premessa 2 è un risultato negativo e non un
comando che non è girato.

Il getter è invece vivo: `getLastEditedViewpointId()` alimenta i tre gate
`ContextMenu.tsx:487`, `ContextMenu.tsx:531`, `TreeViewContent.tsx:483` (verificati per riga,
tutti e tre nella forma `const hasWorkbenchVP = !!getLastEditedViewpointId();`). Con nessuno
scrittore, `lastEditedViewpointId` resta al suo valore iniziale `null` per tutta la vita della
pagina: i tre gate sono affordance permanentemente disabilitate. È un difetto UX, non una
sorgente dell'attivazione.

Le tre `commit-ish` citate nel testo di R-LAY-11 risolvono tutte:
`5999f50c6` «refactor: remove editor v3 and complete legacy CSS token migration»,
`bb0bc6c58` «feat: integrate viewpoint editor into Properties panel with unified styling»,
`49b7524cd` «feat(classic): pixel-level visual parity of M1 default views with flow editor».

### Premessa 3 — `activateViewpoint` in `lastViewpoint.ts:49`

```
sed -n '1,80p' frontend/src/utils/lastViewpoint.ts
```

`lastEditedViewpointId` è dichiarata a riga 15. `activateViewpoint(viewpointId: string | null): void`
è dichiarata a riga **49**, accetta `string | null` come da premessa, e fa tre cose: (1)
`SetFieldAction.new(projectId, 'activeViewpoint', viewpointId || null, '', true)` sotto guardia
sul solo `projectId`; (2) `SetRootFieldAction.new('viewpoint', viewpointId || null, '', true)`;
(3) `warnOnGlobalCss`. Il commento alle righe **43-45** motiva la `SetFieldAction` diretta fuori
da `TRANSACTION` («to avoid async TRANSACTION batching issues that caused the SetRootFieldAction
to interfere with the project.activeViewpoint update»). La forma del vuoto è `null` in entrambe
le scritture, con il rimando esplicito a R-IRN-11 e R-IRN-21. Confermata; il file non si tocca.

Conseguenza per il commit B: `activateViewpoint` scrive lo **stesso** campo `activeViewpoint`
dello stesso `projectId`, quindi la lettura di riga 82 e i due `isActive` (130, 336) continuano
a funzionare senza modifiche. Cambia il *meccanismo* della scrittura (proxy L → `SetFieldAction`
diretta) e si aggiunge la scrittura della root, che oggi manca: è esattamente l'ambiguità che
R-LAY-10 chiedeva di chiudere.

### Premessa 4 — R-LAY-11 non esiste ancora in `docs/decisions.md`

```
command grep -n "R-LAY-11" docs/decisions.md      # exit 1, nessuna riga
command grep -c "R-LAY-10" docs/decisions.md      # 1  (controllo positivo)
```

Ricerca sul testo della sigla, non sul numero. Exit status 1 registrato, e il controllo positivo
sulla sigla adiacente restituisce 1: la ricerca ha segnale. La sezione `## R-LAY — layout per
viewpoint` apre a riga 1669 e la sua ultima decisione è R-LAY-10 a riga **1693**, come da prompt.

**Scostamento non bloccante da segnalare**: R-LAY-10 non è l'ultima riga del file. Dopo di essa,
a riga 1695, apre la sezione `## Superate`. «Appendere in coda alla sezione R-LAY» va quindi letto
come inserimento *fra* R-LAY-10 e `## Superate`, non come append in coda al file. L'ancoraggio al
testo richiesto dal prompt è ciò che rende la differenza visibile; annotato qui perché resti a
verbale.

## Premesse confermate

| # | Premessa | Esito |
|---|---|---|
| 1 | Due sole scritture `project.activeViewpoint = ptr as any;`, righe 111 e 315, una per `select` | Confermata |
| 2 | `setLastEditedViewpoint` / `clearLastEditedViewpoint` a zero call site (controllo positivo passato) | Confermata |
| 3 | `activateViewpoint` a `lastViewpoint.ts:49`, `string \| null`, commento 43-45 | Confermata |
| 4 | Nessuna R-LAY-11 preesistente; sezione R-LAY chiusa da R-LAY-10 | Confermata |

## Domande aperte

1. **Rimosso il difetto, resta l'affordance morta.** Con i tre gate su `getLastEditedViewpointId()`
   permanentemente falsi, «Create View» e «Add view» del menu contestuale e di TreeViewContent
   mostrano da aprile la dicitura «— open a viewpoint first» qualunque cosa l'utente faccia. Il
   prompt lo dichiara fronte separato e non bloccante (Rule 9: la macchineria resta con la sua
   dichiarazione). Aperto: se il rimedio sia ricablare i gate su `activeViewpoint` — ora che
   diventa sorgente unica — oppure ripristinare uno scrittore per `lastEditedViewpointId`.
2. **Il cambio di meccanismo non è verificabile staticamente.** Il commit B sostituisce
   un'assegnazione via proxy L con una `SetFieldAction` diretta. Il caveat è già censito in
   `discovery_2026-08-23_2228_slice2b_riallineamento.md` §4.3; la conferma è l'osservabile 4
   della verifica visiva di Alfonso (highlight del pannello che segue il gesto senza doppio
   click, nessun warning nuovo). Non chiudibile dai gate automatici.
3. **`resolveParentViewpoint` fuori perimetro.** Non toccata e non misurata in questa Fase 0,
   per istruzione esplicita del prompt.
