# Discovery 2026-08-23 — perimetro di rimozione di `NestedView` (apertura del fronte R-DEAD)

**Data**: 2026-08-23
**Branch**: `alfonso-frontend-jjtl`, HEAD `9ca37508d`
**Prompt**: «apri un fronte per rimuovere NestedView dal censimento»
**Base**: `discovery_2026-08-23_nestedview_ui_morta.md` (R-LAY-12), che ha accertato
l'irraggiungibilità ma si era fermata prima del perimetro di rimozione
**Esito**: perimetro misurato e affettato. **Nessuna riga di codice toccata.** Il fronte è
aperto, non eseguito: R-DEAD-1..6 in `docs/decisions.md`.

## 0. Il fatto che viene prima di tutti

**Il «censimento del codice morto» non esiste come artefatto.** Le uniche due occorrenze della
frase in tutto il repo sono quelle scritte il 2026-08-23: R-LAY-12 in `docs/decisions.md:1697` e
la conclusione §6.4 di `discovery_2026-08-23_nestedview_ui_morta.md`.

```
command grep -rn "censimento del codice morto" . --include="*.md"
```

→ 2 righe, entrambe di oggi. Controllo positivo, `censimento` da solo → 5+ file
(`discovery_2026-08-05_censimento_primitive_ui.md`, i memo di ratifica, `discovery_2026-08-20_censimento_testo_e_bordi.md`).
La parola è in uso nel repo; quel censimento specifico non c'è.

«Rimuovere `NestedView` dal censimento» significa quindi togliere l'unico elemento da un registro
che non è mai stato aperto. Il fronte R-DEAD è il registro che gli fa le veci, e questo report è
la sua prima misura.

## 1. Strumento

`command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep --ignore-files` a cui risolve
`grep` in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo. Directory
di lavoro `frontend/` salvo dove indicato.

**Una nota di metodo che ha cambiato una misura in corsa.** La prima batteria cercava i
consumatori con `import[^;]*\bSIMBOLO\b[^;]*from`, cioè assumendo l'import su **una riga sola**.
`NestedView.tsx` stesso apre con due import multilinea da `../../../joiner`: quella forma di
ricerca li avrebbe mancati, e con essi qualunque consumatore che importi in blocco. Tutte le
misure di §3 e §4 sono state rifatte sul **simbolo nudo** (`\bSIMBOLO\b` su tutto `src`), che è il
sovrainsieme sicuro. Il risultato non è cambiato per i simboli già misurati, ma la prima forma
non lo garantiva.

## 2. Il barrel `editors` è un cimitero, non un caso isolato

`src/components/editors/index.ts` esporta 10 simboli di valore e 2 di tipo. Ha **due soli
importatori** (misurati in `discovery_2026-08-23_nestedview_ui_morta.md` §3, M2):
`Dock.tsx:8` prende `Collaborative, Console, Logger, MetaData`; `ContextMenu.tsx:45` prende
`Info`. Cinque simboli su dieci non vengono presi da nessuno.

Per ciascuno dei cinque, la domanda successiva è se il **modulo** abbia consumatori per import
diretto, saltando il barrel. Le due risposte si separano nettamente:

| Riga | Export | Il modulo | La riga del barrel |
|---|---|---|---|
| 1 | `Info` | vivo (`ContextMenu.tsx:45`) | viva |
| 2 | `Skeleton` | **morto** — zero riferimenti oltre la riga 2 | morta |
| 3 | `Console` | vivo (`Dock.tsx:8`) | viva |
| 4 | `Settings` | **morto** — `editors/Settings.tsx`, zero riferimenti oltre la riga 4 | morta |
| 5 | `Logger` | vivo (`Dock.tsx:8`) | viva |
| 6 | `Collaborative` | vivo (`Dock.tsx:8`) | viva |
| 7 | `MetaData` | vivo (`Dock.tsx:8`) | viva |
| 8 | `NestedView` | **morto** | morta |
| 9-10 | `EditorToolbar` | **vivo** per import diretto: `languages/Javascript.tsx:17`, `Js.tsx:18`, `Ocl.tsx:8`, `Jsx.tsx:11`, `MTM.tsx:28` | **morta** |
| 11-12 | `EditorFullscreenModal` | **vivo** per import diretto: `languages/Javascript.tsx:18`, `Js.tsx:19`, `Ocl.tsx:9`, `Jsx.tsx:12`, `MTM.tsx:29` | **morta** |

Tre categorie, e vanno tenute distinte perché il rimedio è diverso:

- **modulo morto + riga morta**: `Skeleton`, `Settings`, `NestedView`. Si cancella il file.
- **modulo vivo + riga morta**: `EditorToolbar`, `EditorFullscreenModal`. Si cancella la riga del
  barrel, il modulo resta. Rischio nullo, quattro righe.
- **vivo**: gli altri cinque. Non si tocca nulla.

`editors/Settings.tsx` è un modulo distinto da `pages/Settings` (che esporta `SettingsPage`,
vivo) e da `src/settings/Settings.ts`. L'omonimia è a tre vie e va disambiguata prima di
cancellare alcunché.

## 3. La cascata esclusiva di `NestedView`

`NestedView.tsx` è 566 righe e importa 12 moduli. La domanda è quali fra i simboli importati
restino **senza alcun consumatore** quando il file se ne va. Misura sul simbolo nudo:

| Simbolo | Definito in | Altri consumatori | Esito |
|---|---|---|---|
| `GenericTree` | `forEndUser/Tree.tsx:212` | **nessuno** | orfano |
| `InternalToggle` | `widgets/Widgets.tsx:26` | **nessuno** | orfano |
| `LockedFeature` | `ModeSystem/LockedFeature.tsx` | **nessuno** | orfano |
| `Tooltip` | `forEndUser/Tooltip.tsx` | 23 altri file | vivo |
| `CommandBar`, `Btn`, `Sep` | `commandbar/CommandBar.tsx` | 13 altri file | vivo |
| `ViewData` | `editors/views/ViewData.tsx` | `Info.tsx`, `irTabs.tsx`, `EnableIRPanel.tsx`, `PropertiesWithTreeView.tsx:242`, `TemplateData.tsx` | vivo |
| `activateViewpoint`, `VersionFixer`, `ActivityLogger`, simboli `joiner` | — | molti | vivi |

**I tre orfani non autorizzano a cancellare i file che li ospitano**, ed è la distinzione che
separa una rimozione corretta da una rottura:

- `widgets/Widgets.tsx` esporta anche `HRule`, vivo in `views/data/TemplateData.tsx:9,31` e
  `views/data/PaletteData.tsx:24`. **Il file resta**, sparisce il simbolo.
- `ModeSystem/index.ts` riesporta anche `useInterfaceMode`, `isAdvancedMode`, `isBasicMode`,
  `useAdvancedSections`. `isAdvancedMode` è il gate di `ContextMenu.tsx:486`, vivo. **La
  directory resta**, spariscono `LockedFeature.tsx` e la riga 11 del suo indice.
- `forEndUser/Tree.tsx` è l'unico caso in cui muore tutto, ma **non da solo**: oltre a
  `GenericTree` esporta `Tree` come default, e il suo unico consumatore è `editors/Skeleton.tsx:7`
  — che è a sua volta morto (§2). `Tree.tsx` muore quando muoiono sia `NestedView` sia `Skeleton`,
  non prima.

## 4. Il trabocchetto: `nestedView.scss` non si tocca

```
command grep -rn "nestedView.scss" src
```

exit 0, **due** righe:

```
src/components/editors/views/NestedView.tsx:29:import "./nestedView.scss"
src/components/editors/views/ViewData.tsx:24:import "./nestedView.scss";
```

`nestedView.scss` è **3736 righe**, contro le 566 del componente che gli dà il nome: 6,6 volte
tanto. Ed è importato anche da `ViewData.tsx`, che è vivo su cinque siti, fra cui l'authoring IR
di editor-v2 (`irTabs.tsx`, `EnableIRPanel.tsx`), area dichiarata in sviluppo attivo da
CLAUDE.md §2.5.

Cancellare il foglio insieme al componente omonimo è la mossa che il nome suggerisce ed è
sbagliata: spoglia un componente vivo in un'area calda. **Il foglio resta per intero.** Quanta
parte di quelle 3736 righe serva davvero a `ViewData` è una domanda legittima e non è di questo
fronte: separarla richiede una misura di selettori usati, non una misura di import.

## 5. Vincolo di metodo: il grep statico non basta, e qui basta

`joiner/components.tsx` (29 export) è il namespace che le view persistite come `jsxString`
possono nominare a runtime: riesporta `Input`, `Select`, `Try`, `Grid`, `ContextMenu`,
`Measurable`, `Control` e altri sotto i nomi che l'utente scrive nel template. Un simbolo che
passa di lì è raggiungibile da un progetto salvato, e **nessun grep su `src` lo vedrà mai**: è la
stessa lezione di R-IRN-23 e R-LAY-12, una catena statica non dice se il percorso è raggiungibile,
qui applicata al verso opposto — l'assenza di catena statica non dice che il simbolo sia morto.

Verifica su questo perimetro:

```
command grep -n "Tree" src/joiner/components.tsx      → exit 1, nessuna riga
command grep -c "export" src/joiner/components.tsx    → 29   (controllo positivo)
```

`NestedView`, `Tree` e `GenericTree` **non** sono nel namespace runtime. Per questo perimetro la
misura statica è valida. Per ogni slice futura la verifica va rifatta, prima di cancellare.

Verifica complementare, fuori da `src`: nessun riferimento a `NestedView` in `frontend/scripts`,
`frontend/public` o nei file di configurazione (`status=1`, zero righe; controllo positivo con la
stessa forma di comando su `vite` → `status=0`, 100 righe). `frontend/dist/` è output di build ed
è escluso per costruzione.

## 6. Affettatura proposta

RC-3 manda in corsia completa i task sopra i 3 file, e Rule 19 impone la pausa sopra i 5. La
rimozione completa ne toccherebbe 6. Quindi:

- **Slice 1 — `NestedView`**: cancella `views/NestedView.tsx`, toglie la riga 8 di
  `editors/index.ts`. **Due file**, corsia veloce. I tre orfani di §3 restano in piedi e vengono
  dichiarati tali nel commit: è codice morto nuovo, creato consapevolmente, non dimenticato.
- **Slice 2 — la cascata**: `GenericTree` + `InternalToggle` + `LockedFeature` e la riga 11 di
  `ModeSystem/index.ts`. Tre file toccati, uno solo cancellato per intero
  (`ModeSystem/LockedFeature.tsx`).
- **Slice 3 — il resto del barrel** (candidata, non deliberata): `Skeleton` e `Settings` con
  `forEndUser/Tree.tsx` che cade con `Skeleton`; le quattro righe morte 9-12 del barrel.

Nessuna slice parte senza un prompt suo. Questo documento apre il fronte, non lo esegue.

## 7. DS-3 non è un mandato utilizzabile

`claude_ratifiche_2026-08-05_design_system_piattaforma.md` DS-3 dispone che un `chore` porti via
«`ModeSystem` intero (`CollapsibleSection`, `ModeToggle`), `useAdvancedSections`, …». Due ragioni
per non usarla come mandato:

1. **La premessa è decaduta.** Misurato oggi, `ModeSystem/index.ts:14` riesporta `isAdvancedMode`,
   che governa `ContextMenu.tsx:486`, vivo. «`ModeSystem` intero» oggi è falso.
2. **Non è mai arrivata a registro.** `command grep -c "DS-" docs/decisions.md` → **0**, controllo
   positivo `R-IRN` → **57**. È esattamente il caso RC-4: una decisione che non sta nel repo non
   vincola l'esecutore, e in questo caso è un bene, perché vincolerebbe a una misura vecchia di
   diciotto giorni che nel frattempo si è rotta.

Chi vorrà eseguire DS-3 riparte da una misura nuova. Questo fronte non la eredita.

## 8. Conclusione

Il perimetro di `NestedView` è di **due file** in slice 1, non di uno né di sei, e la sua parte
insidiosa non è ciò che si cancella ma ciò che sembra cancellabile e non lo è: 3736 righe di SCSS
che portano il nome del morto e vestono un vivo.

La misura ha anche mostrato che `NestedView` non era solo. Il barrel `editors` porta cinque righe
che nessuno importa, di cui tre su moduli morti. Sono registrate in §2 come candidate di slice 3,
misurate ma non deliberate: allargare il perimetro senza che sia chiesto sarebbe la Rule 1 rotta
esattamente nel modo che questo repo passa il tempo a correggere.
