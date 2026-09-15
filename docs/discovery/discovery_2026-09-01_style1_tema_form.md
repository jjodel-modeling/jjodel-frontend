# STYLE1 — il selettore di tema della form: dove va, e perche' oggi non c'e' un posto

**Data**: 2026-09-01
**Prompt**: STYLE1 — selettore tema form nel tab Style + formSpec di verifica (parallelo a 10j, ENG1)
**Esito**: la verifica visiva dei quattro preset **e' fatta** (23/23, quattro screenshot, un
reperto). Il **select non e' stato scritto**: la clausola di arresto del prompt e' scattata —
«se FL2 non ha lasciato una write surface, fermati e riporta».

---

## 1. La domanda, e la risposta in una riga

Il prompt chiede un select «Form theme» nel tab Style che scriva «dove FL2 ha stabilito che il
tema risolve (cascata metamodel -> viewpoint, punto unico in `formAutoLayout.ts`)».

Misurato: **quella cascata non esiste nel codice**, il **tab Style non e' raggiungibile dalle
view che portano una form**, e il vocabolario dell'unica superficie di scrittura che esiste
**non contiene i quattro preset**. Tre ragioni indipendenti, ciascuna sufficiente.

---

## 2. Il read path, tracciato per intero

Un solo consumatore in tutto il repo (`command grep -rn 'resolveFormTheme'`, controllo
positivo `resolveTheme` = 17 occorrenze, quindi la ricerca aveva segnale):

```
IRForm.tsx:309   const theme: FormTheme = spec?.theme ?? defaultTheme;
IRForm.tsx:319   const preset = resolveFormTheme(theme, spec?.labelPlacement);
IRForm.tsx:177   const spec = resolution?.compiled?.formSpec ?? undefined;
irCompile.ts:322 const formSpec = ir.form ?? null;
```

La sorgente e' quindi **una sola**: il campo `form` dell'`ir` **della view** che risolve.
Nient'altro entra.

`resolveFormTheme(skin, labelPlacement, classTheme)` ha tre parametri e **nessuno dei tre e'
un livello «metamodello» o «viewpoint»**:

| parametro | cos'e' | sorgente nel grafo D |
|---|---|---|
| `skin` | `FormSpec.theme`, una delle 4 skin legacy | `ir.form.theme` della view |
| `labelPlacement` | `FormSpec.labelPlacement` | `ir.form.labelPlacement` della view |
| `classTheme` | il rung per-classe di FL2 | **nessuna** — passato `undefined` all'unico call site |

Il commento a `IRForm.tsx:316` lo dichiara gia': «the per-class rung of the cascade has no
source in the D graph yet». Il precedente su cui FL2 si e' modellato e' nello stesso stato:
`ObjectNode.tsx:607` chiama `resolveInstanceNodeStyle()` **senza argomenti**, e il modulo
scrive di se' «this slice renders from the default (no authoring surface writes the layers
yet)». Le due cascate sono forme, non canali: sono state disegnate perche' aggiungere una
sorgente costi una call e non un meccanismo. Nessuna delle due ha ancora quella sorgente.

## 3. Il tab Style e la form non si incontrano mai

`ViewData.tsx:82` deriva `irKind` da `ir.kind`; `ViewData.tsx:105` sceglie la barra:

- `irKind` definito -> `irTabsForKind(...)`, cioe' **Applies to / Structure / Symbol / Form**
  (+ Source in Advanced). **Nessun tab Style.**
- `irKind` indefinito -> la barra legacy, che contiene `{ id: 'style', label: 'Style' }` ->
  `PaletteData`. La prendono i **viewpoint** e le view **senza `ir`**.

Ma solo una view con `ir.kind === 'vertex'` puo' portare un `ir.form`, ed e' esattamente la
categoria che **non vede** il tab Style. Il tab che il prompt nomina e la sorgente che il read
path legge sono in due rami mutuamente esclusivi dello stesso `if`.

Un select messo in `PaletteData` scriverebbe su un elemento che `resolveFormTheme` non guarda.

## 4. Il vocabolario scrivibile non contiene i quattro preset

La superficie di scrittura che **esiste ed e' letta** e' il select «Theme» del tab **Form**
(`FormAuthoringBody.tsx:644-651`), che scrive `FormSpec.theme`. Il suo vocabolario e' quello
delle quattro **skin di pannello** legacy, non dei quattro preset, e `LEGACY_SKIN_PRESET`
(`formAutoLayout.ts:257`) le manda su **tre** preset:

```
plain -> Comfortable    card -> Sectioned    compact -> Compact    inspector -> Sectioned
```

Misurato in pagina sul modulo vero, non letto dalla tabella (fase C della sonda):
raggiungibili `['Comfortable','Compact','Sectioned']`, **non raggiungibile `['Dense']`**.
`Dense` non e' selezionabile da nessuna scrittura dell'applicazione, oggi.

La non-iniettivita' e' voluta e documentata (`formAutoLayout.ts`, blocco su `LEGACY_SKIN_PRESET`):
`card` e `inspector` differiscono per una banda di intestazione, che non e' uno dei tre campi
del tema. Non e' un difetto della mappa; e' che la mappa **non e' un selettore di preset**.

## 5. Le tre vie possibili, tutte decisioni di design

Nessuna e' improvvisabile, ed e' per questo che la slice si ferma qui.

1. **Un campo nuovo su `FormSpec`** (`formTheme?: FormThemeName`). Diretto, ma l'IR salvato
   **non ha VersionFixer** (R-B9): ogni letterale scritto e' **definitivo per sempre**. E
   aprirebbe due dichiarazioni di tema sulla stessa struttura (`theme` skin + `formTheme`
   preset) da riconciliare a ogni lettura.
2. **Un rung viewpoint/metamodello vero**, cioe' un campo D nuovo piu' un secondo argomento
   letto in `IRForm`. E' cio' che il prompt descrive, ed e' un canale nuovo: la cascata a tre
   livelli oggi e' una firma di funzione, non una struttura dati.
3. **Restringere il select esistente ai 3 preset raggiungibili**, rinominando le etichette
   delle skin. Zero schema nuovo, ma cambia cosa significa un controllo committato e **non
   raggiunge comunque `Dense`** — cioe' non fa la cosa che il prompt chiede.

## 6. Cio' che invece e' stato fatto: i quattro preset, guardati

`frontend/scripts/smoke/_tmp_style1_verify.ts`, **23/23 ALL GREEN, exit 0, zero errori di
pagina**. Soggetto: `allNine_valued` della fixture `rowviews`, **14 campi in 3 gruppi su 7
righe**, nel rail Properties a 400px, viewport 1600x2000.

Due vie di applicazione, con statuto **diverso e dichiarato**:

- **(R) via reale** — si scrive `ir.form.theme` su una view IR installata nel viewpoint
  attivo. Copre Comfortable, Compact, Sectioned.
- **(C) via contratto** — si scrivono sul nodo radice le stesse custom property che
  `themeVars(preset)` produce, piu' le tre `data-*`: e' l'**intero** canale con cui il tema
  raggiunge il DOM. Serve per `Dense`, che nessuna scrittura puo' selezionare. I valori non
  sono scritti a mano: si importa `/src/.../formAutoLayout.ts` e si chiede a lui.

**Per contrasto** (fase F): sui tre preset dove entrambe le vie esistono, danno lo **stesso**
DOM. La via (C) usata per Dense non e' quindi una finzione.

Screenshot: `_tmp_style1_{comfortable,compact,sectioned,dense}.png` (piu' i `_full`).

| preset | via | placement / density / section | row-gap | pad-y | font | label-col | eyebrow | altezza form |
|---|---|---|---|---|---|---|---|---|
| Comfortable | R (`plain`) | top / comfortable / flat | 14px | 7px | 12.5px | — | 3 | 811.2px |
| Compact | R (`compact`) | left / compact / divided | 8px | 5px | 12px | 72px | 3 | 565.8px |
| Sectioned | R (`card`) | top / comfortable / card | 14px | 7px | 12.5px | — | 3 | 914.2px |
| Dense | C | left / dense / none | 6px | 4px | 11.5px | 72px | **0** | 536.2px |

Quattro firme distinte, non tre travestite. La geometria e' **identica** sotto tutti e quattro
(`14 campi / 3 gruppi / 7 righe`): il tema non muove un campo, che e' il criterio di
accettazione dell'intero disegno.

**Non-regressione, due volte.** Con una view IR il cui `form` **non dichiara** un tema, il DOM
e' byte per byte quello del before (nessuna view IR affatto): `top|comfortable|flat|14px|7px|
12.5px||3`. E per contrasto: **rimosso** il tema dopo averlo cambiato quattro volte, il DOM
**torna identico** al before.

## 7. Il reperto: due preset su quattro non si leggono nel rail

Questo e' cio' che la verifica visiva serviva a trovare, ed e' la ragione per cui il debito era
un debito.

Misurato (fase H, larghezza dei controlli; le caselle di spunta sono escluse — sono 14px per
costruzione in tutti e quattro i preset, e contarle era un errore dello **strumento**, corretto
nel corso della sessione):

| preset | controlli sotto 40px | controlli che sbordano dalla cella | controllo piu' stretto |
|---|---|---|---|
| Comfortable | 0 | 0 | 87.8px |
| Sectioned | 0 | 0 | 63.3px |
| **Compact** | **4** | **2** (+12.3px) | **7.8px** |
| **Dense** | **4** | **2** (+10.3px) | **7.8px** |

A schermo: nella riga a tre colonne `tint / stroke / visible / locked` il select di `tint` esce
**vuoto**, l'etichetta di `stroke` finisce sopra il proprio controllo, `visible` si legge
«isible», e nella riga `widthPx / plainCount / created` gli stepper perdono il campo numerico.
Si vede in `_tmp_style1_compact.png` e `_tmp_style1_dense.png`; i due preset a etichetta sopra
sono puliti negli altri due scatti (controllo positivo: lo strumento ha segnale).

**Causa, letta nel foglio**: `irFormStyle.scss:1030-1035`

```scss
.ir-form[data-label-placement="left"] .ir-field {
    grid-template-columns: var(--ir-form-label-col, 72px) minmax(0, 1fr);
}
```

La regola vale per **ogni** `.ir-field`, qualunque sia la span della cella che lo contiene. Nel
rail a 400px una riga a tre colonne da' una cella di **87.8px**: 72 se li prende la colonna
etichetta, ~8 restano al controllo. La colonna fissa e' pensata per un campo a riga piena; il
packer a 12 colonne di FL1 produce anche celle da 4/12, e le due cose non si sono mai viste
insieme perche' nessuno aveva mai cambiato tema.

Fuori perimetro di questa slice (il foglio e' del renderer FL4). Va aperto come slice propria:
o la colonna etichetta e' condizionata alla span della cella, o il placement `left` degrada a
`top` sotto una larghezza di cella minima.

---

## 8. Cosa serve per sbloccare STYLE1

Una decisione fra le tre di §5 — e' una scelta di schema, non di implementazione. Con quella
presa, il select e' una mezza giornata: il vocabolario esiste gia' come `FORM_THEME_NAMES`
(«per un chooser che deve elencarli senza riscrivere i quattro nomi una seconda volta», dice
`themes.ts`), e `themeName(theme)` esiste gia' per decidere quale voce mostrare selezionata.
Entrambe le funzioni sono state scritte da FL2 **per questo select** e oggi non hanno
consumatori.

Raccomandazione: **la 2**, il rung viewpoint vero. E' l'unica che fa quello che il disegno dice
(un tema si sceglie per viewpoint, non per singola view), non tocca l'IR persistito, e serve
anche a `resolveInstanceNodeStyle`, che aspetta la stessa sorgente dallo stesso posto. Ma e'
una decisione, e la prende chi possiede il disegno.
