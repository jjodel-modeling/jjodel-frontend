# Discovery 2026-08-30 — `NestedView`, il censimento riverificato a sette giorni

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `3f1070573`
**Prompt**: censimento completo di `NestedView`, verdetto per sito, **solo report, nessuna rimozione**
**Base**: `discovery_2026-08-23_nestedview_ui_morta.md` (R-LAY-12) e
`discovery_2026-08-23_perimetro_rimozione_nestedview.md` (R-DEAD-1..6)
**Esito**: verdetto **confermato e invariato**. Un reperto di metodo sul controllo positivo del
2026-08-23, che non tocca la conclusione: §5.

---

## 0. Perché questo report non rifà il censimento

Il censimento che il prompt chiede **esiste già, fatto due volte il 2026-08-23**, e le sue
conclusioni sono a registro come R-DEAD-1..6 in `docs/decisions.md:1753`. R-E/E-1 dispone che un
report esistente non si riscriva: si legge per intero, si confronta punto per punto, e si
aggiunge in coda solo ciò che non è coperto. Entrambi i documenti sono stati letti per intero.

Quello che non era coperto, e che è l'unica ragione per cui questo documento esiste, è il tempo:
fra il 2026-08-23 e oggi sono atterrati l'instance manager, `jjform/` — una directory che il
2026-08-23 non esisteva — e una quantità di lavoro su `editor-v2/`. Una misura di sette giorni fa
è un'ipotesi su una copia passata del codice, non un fatto su questa (CLAUDE.md §5, «non fidarsi
delle fixture a memoria fra sessioni»). Questo report **riesegue le misure portanti su HEAD di
oggi** e riporta la deriva.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep` risolve
in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 1. I siti, con verdetto — HEAD di oggi

`command grep -rn "NestedView" --include="*.ts" --include="*.tsx" --include="*.scss" src` →
exit 0, **11 righe** su 5 file (erano 10 su 5 il 2026-08-23; la riga in più è un secondo commento
in `ViewData.tsx`, vedi §2).

| # | Sito | Natura | Verdetto |
|---|---|---|---|
| 1 | `abstract/tabs/TabDataMaker.tsx:9` | commento | **morto** — nomina il pannello, non lo monta |
| 2 | `abstract/tabs/TabDataMaker.tsx:64` | commento | **morto** — idem |
| 3 | `abstract/Dock.tsx:22` | import **commentato** | **morto**, e verso un path che non esiste: `../rightbar/nestedViewEditor/…` — sotto `rightbar/` c'è solo `viewsEditor` |
| 4 | `editors/index.ts:8` | re-export dal barrel | **raggiungibile solo da percorso morto** — la riga compila, ma nessuno dei due importatori del barrel prende questo simbolo |
| 5 | `editors/views/NestedView.tsx:41` | `function NestedViewComponent` | auto-riferimento |
| 6 | `editors/views/NestedView.tsx:558` | `NestedViewConnected = connect(...)` | auto-riferimento |
| 7 | `editors/views/NestedView.tsx:561` | `)(NestedViewComponent)` | auto-riferimento |
| 8 | `editors/views/NestedView.tsx:563` | `export const NestedView = …` | auto-riferimento |
| 9 | `editors/views/NestedView.tsx:565` | `<NestedViewConnected …/>` | auto-riferimento — **l'unico JSX del simbolo in tutto `src`** |
| 10 | `editors/views/ViewData.tsx:198` | commento | **morto** |
| 11 | `editors/views/ViewData.tsx:220` | commento | **morto** |

**Nessun sito monta il componente.** Le righe 5-9 sono il file che parla di sé; 1-3 e 10-11 sono
prosa; 4 è un re-export che nessuno consuma.

### Il re-export, e perché «morto» è la parola sbagliata per la riga 4

`components/editors/index.ts` ha **due** importatori, entrambi vivi:

```
components/abstract/Dock.tsx:8       import {Collaborative, Console, Logger, MetaData} from "../editors";
components/contextMenu/ContextMenu.tsx:45   import { Info } from '../editors';
```

Il barrel è raggiungibile — questo è il controllo positivo che rende negativo il silenzio su
`NestedView` — e **nessuno dei due prende `NestedView`**. La riga 8 è quindi codice vivo che
esporta un simbolo che nessuno importa: raggiungibile solo in astratto, mai percorsa.

---

## 2. Deriva rispetto al 2026-08-23

| Misura | 2026-08-23 | 2026-08-30 | Deriva |
|---|---|---|---|
| occorrenze in `src` (ts/tsx/scss) | 10 | **11** | +1, un commento in `ViewData.tsx` |
| file coinvolti | 5 | **5** | invariato |
| siti che montano il componente | 0 | **0** | invariato |
| importatori del barrel | 2 | **2** | invariato |
| importatori che prendono `NestedView` | 0 | **0** | invariato |
| import dinamici / `lazy` | 0 | **0** | invariato |
| occorrenze fuori da `.tsx` | 1 (il re-export) | **1** | invariato |
| riferimenti fuori da `src` | 0 | **0** | invariato |
| `NestedView` in `joiner/components.tsx` | assente | **assente** | invariato |
| importatori di `nestedView.scss` | 2 | **2** | invariato |
| orfani della cascata | 3 | **3** | invariato |

Le due righe che si sono spostate (`TabDataMaker.tsx` 7→9 e 37→64, `ViewData.tsx` 202→198+220)
sono scorrimenti da modifiche a quei file, non nuovi riferimenti.

**`jjform/` e l'instance manager non nominano `NestedView`.** La ricerca di §1 gira su tutto `src`
senza filtro di directory, quindi le copre per costruzione.

### Le misure di assenza, con i loro controlli

```
command grep -rnE "(import\(|lazy\().*NestedView" --include="*.ts" --include="*.tsx" src   → exit 1, 0 righe
    controllo positivo: file con il costrutto lazy/import   → 11 file
command grep -rn "NestedView" src | command grep -v "\.tsx:"                                → 1 riga (il re-export)
command grep -n "Tree\|NestedView" src/joiner/components.tsx                                → exit 1, 0 righe
    controllo positivo: export in components.tsx            → 29
command grep -rn "NestedView" scripts/ public/                                              → exit 1, 0 righe
    controllo positivo: file che nominano vite in scripts/  → 3
```

---

## 3. La cascata esclusiva, riverificata

I tre simboli che R-DEAD-3 dichiara orfani alla rimozione di `NestedView` **lo sono ancora**:
ciascuno ha esattamente due file che lo nominano, il proprio e `NestedView.tsx`.

| Simbolo | Definito in | Altri consumatori oggi | Esito |
|---|---|---|---|
| `GenericTree` | `forEndUser/Tree.tsx` | nessuno | **orfano**, invariato |
| `InternalToggle` | `widgets/Widgets.tsx` | nessuno | **orfano**, invariato |
| `LockedFeature` | `ModeSystem/LockedFeature.tsx` (+ riga 11 di `ModeSystem/index.ts`) | nessuno | **orfano**, invariato |

R-DEAD-3 resta valida parola per parola, inclusa la parte che conta: i file che li ospitano **non**
si cancellano, perché `Widgets.tsx` tiene `HRule` e `ModeSystem/index.ts` riesporta
`isAdvancedMode`, gate vivo.

E resta valido il trabocchetto di R-DEAD-2: `nestedView.scss` ha ancora **due** importatori,
`NestedView.tsx:29` e `ViewData.tsx:24`, e `ViewData` è vivo. Il foglio che porta il nome del
morto veste un vivo.

---

## 4. Verdetto

`NestedView` è **UI morta**, come il 2026-08-23 e per le stesse ragioni, riverificate oggi. Il
perimetro di rimozione resta quello di R-DEAD-5 slice 1 — `views/NestedView.tsx` e la riga 8 di
`editors/index.ts`, due file.

**Nessuna rimozione in questo task**, come il prompt dispone: la slice è già affettata e
deliberata in R-DEAD-5, e non parte senza un prompt suo.

---

## 5. Reperto di metodo: un controllo positivo che misurava un'altra cosa

Il report del 2026-08-23 §3 M1c porta come controllo positivo del costrutto dinamico:

```
command grep -rncE --include="*.ts" --include="*.tsx" "(React\.lazy\(|[^a-zA-Z]lazy\(|import\()" src | wc -l   → 938
```

`-c` stampa `file:conteggio` per **ogni file esaminato**, compresi quelli con zero occorrenze:
`wc -l` conta quindi i file cercati, non quelli che contengono il costrutto. Misurato oggi, lo
stesso comando dà **1011**, che è esattamente il numero totale di file `.ts`/`.tsx` sotto `src`;
la forma corretta, `-rlE`, ne dà **11**.

Il controllo del 2026-08-23 **aveva comunque segnale** — nominava due siti concreti,
`SaveManager.lazy.tsx:3` e `jjodie/rag/index.ts:161-164` — quindi la conclusione regge e non
cambia. Ma il numero citato non misurava ciò che dichiarava di misurare: 938 non erano i file col
costrutto, erano i file cercati, ed è la stessa famiglia di errore che CLAUDE.md §5 registra alla
voce «un conteggio preso su una finestra è un conteggio su quella finestra». Un controllo
positivo va letto per la forma del comando, non solo per il fatto che il numero sia grande.
