# STYLE2 — il rung viewpoint del tema form: il canale che mancava, e il tab che non c'era

**Data**: 2026-09-01
**Prompt**: `docs/prompts/PROMPT_STYLE2_viewpoint_theme_rung.md` — «tema form a livello
viewpoint (rung vero, SERIALE dopo FL8)», via **2** del referto STYLE1 §5.
**Esito**: ✅ fatto. Campo D nuovo, risoluzione a tre gradini, select nel pannello del
viewpoint, 30/30 verdi sull'app viva e 40/40 in unita'. Due scostamenti dal prompt,
entrambi misurati e riportati qui sotto (§2 e §5).

---

## 0. Il riassunto in cinque righe

`Dense` non era selezionabile da nessuna scrittura dell'applicazione: STYLE1 lo aveva
misurato «via contratto», scrivendo a mano sul nodo radice le custom property che
`themeVars` produce. Da questa slice il quarto preset arriva per via reale, da un
`<select>` nel pannello del viewpoint, e la cascata a tre livelli — view > viewpoint >
default — smette di essere una firma di funzione e diventa una struttura dati.

Due cose non erano dove il prompt le diceva, e una terza non era vera:

| cosa | dove il prompt la dava | dove e' | §|
|---|---|---|---|
| il tab Style del viewpoint | `ViewData.tsx:105`, ramo legacy | non esiste: `<ViewData>` non e' montato per un viewpoint | §2 |
| l'eyebrow di `Dense` | 0, «misurato da STYLE1» | era **1** sul percorso vero; corretto qui | §5 |
| la serializzazione con FL8 | «FL8 prima» | FL8 era in volo in una sessione parallela | §7 |

---

## 1. Il campo D: dove, e perche' senza VersionFixer

`DViewElement.formTheme?: FormThemeName` — `frontend/src/view/viewElement/view.tsx`,
subito sotto `viewpointType`.

**Perche' su `DViewElement` e non su `DViewPoint`.** Il prompt lasciava la scelta chiedendo
di dichiararla. `DViewPoint` (`view/viewPoint/viewpoint.ts:24`) **non ha un solo campo dati
proprio**: ridichiara `id` e `name` e nulla altro, e `Constructors.DViewPoint()`
(`joiner/classes.ts:1271`) collega soltanto il puntatore al progetto. Ogni campo
«solo per i viewpoint» di questo grafo sta invece su `DViewElement` con un commento che lo
dice — `isValidation` («only for root views (ex viewpoints)») e `viewpointType`. Un primo
campo proprio sulla sottoclasse sarebbe stato una struttura nuova per una riga.

**Perche' nessun VersionFixer.** Il prompt lo ammetteva come alternativa
(«VersionFixer per i salvataggi esistenti → default assente») e la seconda e' quella presa:
il campo e' **opzionale e assente per costruzione** nei salvataggi esistenti, e assente
significa «nessuna opinione», che risolve nella resa committata. `CLAUDE.md §3.9` impone la
migrazione quando si tocca la **sorgente delle view di default** (`DV.tsx`,
`defaultViewTemplate.ts`), perche' quelle riscrivono un `jsxString` persistito; questo campo
non riscrive niente. E' la stessa forma di `viewpointType`, `ir`, `irStash`,
`irLegacyClassic`, nessuno dei quali ha una migrazione.

La non-regressione non e' argomentata, e' misurata due volte: fase A della sonda (firma
identica a quella che STYLE1 ha committato) e fase E (tolto il campo dopo quattro cambi, il
DOM torna identico campo per campo, `labelAlign` e `groupBorder` compresi).

## 2. Il reperto: il tab Style del viewpoint non esiste

Il prompt chiedeva il select «nel tab **Style** del viewpoint (ramo legacy di
`ViewData.tsx:105` — i viewpoint lo prendono gia'; reperto 2 di STYLE1)».

Misurato: **`<ViewData>` e' montato in un posto solo in tutto il repo**, e quel posto
esclude i viewpoint.

```
$ command grep -rn "<ViewData" frontend/src --include="*.tsx"
frontend/src/components/editors/Info.tsx:1394:                    <ViewData
frontend/src/components/editors/views/ViewData.tsx:316:    return <ViewDataConnected ...
```

Due occorrenze: il montaggio e la definizione. La ricerca aveva segnale (ha trovato
entrambe). E il montaggio sta nel ramo `else` di un `if` sul tipo:

```tsx
// Info.tsx:1373-1394
if (tab && selectedView && (selectedViewClass === DViewPoint.cname || selectedViewClass === DViewElement.cname)) {
    const isVP = selectedViewClass === DViewPoint.cname;
    ...
    {isVP ? (
        <ViewpointProperties ... />        // ← il viewpoint finisce QUI
    ) : (
        <ViewData ... />                   // ← e il tab Style sta qui dentro
    )}
```

Il reperto 2 di STYLE1 aveva letto correttamente il **ramo interno** di `ViewData`
(`ViewData.tsx:53`, `const isVP = view.className === DViewPoint.cname`, e la barra legacy
col tab Style per `irKind` indefinito): quel codice esiste. Cio' che non esiste e' qualcuno
che ci instradi un viewpoint. E' un ramo raggiungibile solo da una chiamata che nessuno fa
— la stessa forma del `classTheme` che FL2 aveva lasciato pronto e senza sorgente.

**Conseguenza**: il select e' andato in `ViewpointProperties.tsx`, che e' il pannello che il
viewpoint riceve davvero, accanto a `Name` e `Type`, e scritto con lo stesso gesto con cui
quel file scrive `viewpointType` (assegnazione sul proxy L). Un select messo in
`PaletteData` sarebbe stato codice morto: scritto, compilato, mai montato. **Scostamento di
perimetro dichiarato**: un file al posto di un altro, entrambi UI, nessun file in piu'.

Verificato in positivo sull'app, non solo col grep — fase H0 della sonda: selezionata una
**view**, il pannello del viewpoint non e' a schermo (`hasViewpointPanel: false`, nessuna
etichetta «Form theme»); selezionato il **viewpoint**, il select c'e' con cinque voci.

## 3. La risoluzione: quattro strati, e perche' `skin` diventa opzionale

`resolveFormTheme` guadagna un quarto argomento, `viewpointTheme`, e — la meta' portante —
il primo diventa **opzionale**.

```ts
export function resolveFormTheme(
    skin?: LegacySkin,
    labelPlacement?: 'above' | 'left',
    classTheme?: Partial<PresetTheme> | null,
    viewpointTheme?: FormThemeName | null,
): PresetTheme
```

Prima di questa slice l'unico chiamante passava `spec?.theme ?? defaultTheme`, cioe'
**sempre** una skin: con una skin sempre presente nessuno strato sotto di lei avrebbe mai
potuto vincere, e il rung viewpoint sarebbe stato scritto e inerte. `undefined` e' cio' che
rende «la view non dice niente» distinguibile da «la view dice `plain`» — oggi la stessa
resa, due risposte diverse appena un viewpoint ha un'opinione.

In `IRForm.tsx` la chiamata passa `spec?.theme` (che puo' essere `undefined`) mentre la
costante `theme` **resta** `spec?.theme ?? defaultTheme`, perche' serve ancora alla classe
della skin: un viewpoint con un tema e una view senza rende la skin `plain` che indossa le
custom property di un altro preset. E' esattamente la disposizione che STYLE1 aveva
misurato end-to-end, e la sonda la riafferma preset per preset (`skin=plain` sotto tutti e
quattro).

L'ordine degli argomenti **non** e' l'ordine di precedenza — il viewpoint e' l'ultimo
argomento ed e' lo strato meno specifico — perche' spostarlo in prima posizione avrebbe
mosso ogni call site esistente. La precedenza sta nel corpo, in una riga:

```ts
const base = resolveTheme(viewpoint, preset, stated);
return classTheme ? resolveTheme(base, classTheme) : base;
```

Due `resolveTheme` e non uno perche' gli strati sono quattro e la funzione ne prende tre; il
primo fold produce un tema **completo** (parte dal default di fabbrica), quindi usarlo come
base del secondo e' un quarto strato e non un secondo defaulting.

**La guardia.** `isFormThemeName` filtra il valore letto dal campo D, che torna da un file di
progetto ed e' quindi non fidato al confine. Senza, un nome ritirato o modificato a mano
finirebbe in `FORM_THEME_PRESETS[...]` come `undefined` e raggiungerebbe il default per
caso; con, risolve sul gradino sotto **per costruzione**. Misurato sull'app (fase F): scritto
`"Cosy"` nel campo, la firma e' quella del before.

## 4. Cosa dicono le misure

**Unita'** — `__tests__/formAutoLayout.test.ts`, da 32 a **40 casi**, tutti verdi. Otto
nuovi: i tre gradini uno per uno, la view che dichiara solo un placement, il rung per-classe
che resta sopra a tutti, le cinque forme di chiamata preesistenti riasserite con il quarto
argomento assente, il valore spazzatura, e il vocabolario del select.

La suite e' stata provata contro **cinque** versioni difettose del modulo, per non
consegnare un verde che non distingue nulla:

| mutazione | rossi |
|---|---|
| lo strato viewpoint scartato (`resolveTheme(null, preset, stated)`) | 2 |
| precedenza invertita (`resolveTheme(preset, viewpoint, stated)`) | 2 |
| guardia rimossa (`typeof v === 'string'`) | 1 |
| `skin` di nuovo defaultata a `plain` quando assente | 2 |
| il rung per-classe scartato | 3 |

Verde al ripristino in tutte e cinque.

**Sull'app viva** — `frontend/scripts/smoke/_tmp_style2_verify.ts`, **30/30 ALL GREEN,
exit 0, zero errori di pagina**. Soggetto `allNine_valued` della fixture `rowviews`, 14
campi / 3 gruppi / 7 righe, rail a 400px, viewport 1600x2000. I quattro preset **tutti per
via reale**: la via contratto di STYLE1 non compare in questa sonda.

| preset | placement / density / section | row-gap | pad-y | font | label-col | eyebrow | altezza |
|---|---|---|---|---|---|---|---|
| Comfortable | top / comfortable / flat | 14px | 7px | 12.5px | — | 3 | 811.2px |
| Compact | left / compact / divided | 8px | 5px | 12px | 72px | 3 | 659.2px |
| Sectioned | top / comfortable / card | 14px | 7px | 12.5px | — | 3 | 811.2px |
| **Dense** | left / dense / none | 6px | 4px | 11.5px | 72px | **0** | 580.2px |

Un giro **end-to-end vero** (fase H3): selezionato il viewpoint nell'albero, scelto `Dense`
dal `<select>` con Playwright, riselezionato l'oggetto — il campo D vale `Dense` e la form
rende la firma Dense. Gli altri giri scrivono sul proxy L, che e' la stessa assegnazione che
l'`onChange` del select esegue; dichiarato nell'intestazione della sonda, perche' ogni giro
dal controllo costa due cambi di selezione e la form sparisce nel mezzo.

Geometria: `14/3/7` sotto tutti e quattro. Il tema non muove un campo.

## 5. L'eyebrow che STYLE1 non poteva vedere

Il criterio del prompt — «`Dense` → 6px/11.5px/**0** eyebrow» — al primo giro e' uscito
**rosso**: la form rendeva **1** eyebrow.

La causa non e' nel rung. `IRForm.tsx` monta un gruppo «Identity» quando la metaclasse non
ha uno slot `name`, e la sua intestazione era renderizzata **incondizionatamente**, mentre
le intestazioni delle sezioni sono sotto `chrome.eyebrow`. Con `sectionStyle: 'none'` — che
solo `Dense` produce (`SECTION_CHROME`, `themes.ts:272`) — sparivano le due delle sezioni e
restava quella di Identity. Da qui i numeri: `groups: 3` = Identity + due sezioni;
Comfortable `1 + 2 = 3` eyebrow, Dense `1 + 0 = 1`.

**Perche' STYLE1 aveva letto 0.** La sua via contratto replicava l'assenza dell'eyebrow
nascondendo a mano ogni `.ir-form__group-title` (`el.style.display = chrome.eyebrow ? '' :
'none'`). Quella riga nascondeva anche l'intestazione statica, che React invece rendeva. Lo
0 era una misura della sonda, non del renderer — il caso esatto della sotto-regola di
`CLAUDE.md §5`: uno stato non riproducibile sul codice corrente e' un'ipotesi su una versione
passata, non un fatto.

**Perche' non degrada nulla.** `eyebrow: false` vale solo per `none`, `none` viene solo da
`Dense`, e `Dense` non era selezionabile da nessuna scrittura dell'applicazione fino a
questa slice. Quel ramo non si e' **mai** eseguito in produzione: non c'e' comportamento
committato da preservare.

Correzione: l'intestazione statica passa sotto `chrome.eyebrow`, come le sezioni.
**Scostamento di perimetro dichiarato**: una riga in piu' in `IRForm.tsx`, che e' un file
gia' nel perimetro (e' il consumatore della risoluzione). Dopo, 30/30 e la firma Dense
combacia con quella committata da STYLE1.

## 6. Cosa NON e' stato costruito

- **Il rung metamodello.** Il prompt lo mette fuori scope («non richiesto da nessuna misura
  — non costruirlo *già che ci sei*»). Non c'e'.
- **Il rung per-classe.** Resta il terzo parametro senza sorgente, com'era. La suite ne
  asserisce solo che sta ancora sopra agli altri tre.
- **Il select «Theme» del tab Form** (le quattro skin di pannello) e' intatto. Skin e preset
  restano due strutture diverse: `LEGACY_SKIN_PRESET` continua a essere la sola mappa fra
  loro, e non e' iniettiva per disegno.
- **Nuovi temi.** `FORM_THEME_NAMES` resta a quattro; il select lo legge invece di riscrivere
  i nomi, quindi un quinto preset comparirebbe da solo (e la suite ha un caso che lo verifica).

## 7. Coordinamento: FL8 era gia' in volo

Il prompt dichiara STYLE2 **seriale dopo FL8**. All'apertura della sessione FL8 non risultava
fatto: nessuna entry di log, nessun commit, e `irFormStyle.scss` con la colonna etichetta
fissa a 72px, ultimo tocco `beeea12ae` (FL4). Tre minuti dopo lo stesso file portava in
albero la leva (a) di FL8 — `minmax(0, cap)` sull'etichetta piu' un pavimento sul controllo —
scritta da una sessione parallela (mtime 09:51:25). Piu' tardi quella sessione ha anche
**messo in indice** il proprio lavoro (`irFormStyle.scss`, `irFormLabelColumn.test.ts`, il
suo referto).

Due conseguenze operative:

1. **`irFormStyle.scss` non e' stato toccato** da questa slice. P6: lo stato dell'albero non
   corrispondeva al prompt, e la cosa da fare era segnalarlo, non lavorarci sopra.
2. **Ogni commit e' passato con pathspec esplicito** (`git commit -- <file>`), perche'
   l'indice conteneva lavoro altrui: `git commit` avrebbe committato anche quello
   (`CLAUDE.md §6.1`).

La leva di FL8 e' visibile nelle misure di leggibilita' della fase I, riportate e **non**
rivendicate: a rail 400px, con FL8 in albero, Compact e Dense danno `squeezed: 0`,
`overflow: 0`, controllo piu' stretto **63.5px** — contro i 4 schiacciati, 2 sbordanti e
**7.8px** che STYLE1 aveva misurato. Il picker si espone quindi su quattro preset tutti
leggibili, che era la ragione della serializzazione.

## 8. Domande aperte

- **Il viewpoint selezionato non e' il viewpoint attivo.** `IRForm` legge il rung da
  `state.viewpoint` (il viewpoint **attivo**, la stessa sorgente con cui `irResolveCore`
  indicizza le view); il select scrive sul viewpoint **selezionato nell'albero**. Se sono
  diversi, la scelta e' corretta e non si vede finche' quel viewpoint non viene attivato.
  E' la semantica giusta — il tema appartiene al viewpoint, non alla sessione — ma un
  utente potrebbe leggerlo come «il controllo non fa niente». Se serve, la cura e' un
  affordance nel pannello, non un cambio di sorgente.
- **`resolveInstanceNodeStyle` aspetta la stessa sorgente dallo stesso posto** (STYLE1 §2:
  «this slice renders from the default (no authoring surface writes the layers yet)»). Ora
  che il posto esiste, quel modulo e' una slice di una riga piu' un secondo campo D. Non
  fatto qui: nessuna misura lo chiedeva.
- **L'intestazione statica «Identity» ora sparisce sotto `Dense`**, e con essa il conteggio
  `1` che portava. E' cio' che `sectionStyle: 'none'` dichiara; se all'uso risultasse che il
  campo nome ha bisogno di un'etichetta anche li', la cura sta nel campo, non nel preset.
