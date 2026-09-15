# FL9 — il testo delle select tosato nelle form IR

Data: 2026-09-01. Perimetro: `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss`.
Protocollo: `docs/PROTOCOL.md` P1..P10.

## 1. Ipotesi che la discovery sta falsificando

Il prompt ne nominava una: «altezza fissa ereditata dal density theme (Compact/Dense hanno
control height ridotte) con padding pensato per l'altezza piena». E' **falsa in quella
forma**, e vera in un'altra: le altezze non sono ereditate da un tema sbagliato, sono
quelle giuste; e' il **padding di densita'** ad essere dato a controlli che hanno gia'
un'altezza fissa. E i due preset piu' colpiti non sono Compact/Dense ma **Comfortable e
Sectioned**, che hanno il padding piu' generoso — Dense, quello che il sospetto indicava,
e' l'**unico che non tagliava**.

## 2. File letti

- `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss` (1134 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/SelectWidget.tsx`, `TextWidget.tsx`,
  `ReferenceWidget.tsx`
- `frontend/src/components/ui/Select/Select.module.css`, `frontend/src/components/ui/Input/Input.module.css`
- `frontend/src/styles/components/_form-system.scss`
- `frontend/src/styles/tokens/_spacing.scss`, `_typography.scss`, `index.scss`, `frontend/src/styles/tokens.css`
- `frontend/src/jjform/themes.ts`, `frontend/src/components/editor-v2/viewpoint/ir/formAutoLayout.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx`, `IRFormField.tsx`

## 3. Chi vince davvero sul `<select>` della form

La `<select>` che si vede e' `ui/Select` (`SelectWidget.tsx:54` le passa
`className="ir-field__control"`), un CSS module. La catena, misurata a schermo e non
dedotta:

| sorgente | cosa da' | vince? |
|---|---|---|
| `_form-system.scss:135` `select, .select, .form-select` | tutto, con `!important` | **no**: il blocco e' interamente **commentato** (righe 133-176) |
| `Select.module.css:53` `.selectSm` | `height: var(--input-height-sm)`, `padding: 6px 36px 6px 12px` | l'altezza si', il padding **no** |
| `irFormStyle.scss:1104` `.ir-form[data-density] .ir-field__control` | i quattro longhand del padding | **si'**, (0,3,0) contro (0,1,0) |

Quindi il padding verticale dipinto e' `--ir-form-pad-y`, cioe' `DENSITY_SCALE[d].fieldPaddingY`
(`jjform/themes.ts:196`): **7 / 5 / 4** px. L'altezza e' `--input-height-sm`, che
`irFormStyle.scss:49` punta su `--control-height-lg` (28px) e la skin `compact` su
`--control-height-sm` (24px, `:889`). Il bordo e' 1.5px per lato, dichiarato in
`Select.module.css:26` come letterale (`--input-border-width: 1px` di `:54` non lo
raggiunge). `box-sizing: border-box` arriva dall'`*` di `styles/tokens/index.scss:62`.

## 4. L'aritmetica, e perche' morde

Content box = altezza − 2 bordi − 2 padding. Misurato (`_tmp_fl9_recon.ts`, tutti e quattro
i preset in un solo caricamento):

| preset | densita' | altezza | pad-y | content box | riga di testo |
|---|---|---|---|---|---|
| Comfortable | comfortable | 28 | 7 | **12** | 19.5 |
| Sectioned | comfortable | 28 | 7 | **12** | 19.5 |
| Compact | compact | 24 | 5 | **12** | 18 |
| Dense | dense | 28 | 4 | **18** | 19.5 |

Il punto che il prompt chiedeva di verificare e che cambia la diagnosi: su un controllo ad
altezza **fissa** e `border-box`, il padding verticale **non e' spaziatura**. Non sposta
nulla — l'altezza e' gia' decisa — e il suo unico effetto e' rimpicciolire il box in cui il
testo deve stare. E' quanto del glifo viene tagliato, scritto in unita' di spaziatura.

## 5. La misura sui pixel (il Range non era disponibile)

Il prompt chiedeva un Range sul nodo di testo. **Non esiste**: in una `<select>` chiusa le
`<option>` non sono renderizzate e il valore lo disegna lo user agent, quindi non c'e' box
di testo da interrogare. La misura e' quindi sui **pixel** dello screenshot, decodificati a
mano con `zlib` (nessuna dipendenza nuova, Regola 4), dentro il **padding box** — non il
border box: al primo giro la finestra includeva il bordo e la banda saturava a 28/28 a ogni
gradino, cioe' lo strumento misurava il bordo invece del testo.

Scala sul padding, `_tmp_fl9_recon2.ts`, Inter Variable 13px, stringa peggiore `Agjpqy`
(i valori del fixture, `Green` e `DASHED`, non hanno discendenti):

| pad | content | banda dipinta |
|---|---|---|
| 0-3 | 26-20 | 14 |
| 4 | 18 | 14 |
| **5** | 16 | **13** ← primo pixel perso |
| 6 | 14 | 11 |
| **7** | 12 | **10** |
| 8 | 10 | 9 |

Il primo pixel si perde a pad **5**, che e' esattamente quello di `compact`; a pad **7**,
quello di `comfortable`, la banda e' 10 su 14. Il difetto e' quindi **committato in tre
preset su quattro**, e con esso anche gli `input` di testo, che condividono la stessa
regola e la stessa altezza — il prompt li nominava fuori scope perche' lo screenshot
mostrava una select, ma la causa e la riga di CSS sono le stesse.

Metriche dichiarate: `font-family` risolto a `Inter Variable` (`document.fonts.check` =
true), 13px, `line-height` 19.5px, ascender+descender misurati 9.77 + 2.81.

## 6. Il fix

Una regola sola, subito dopo quella di densita', che le toglie i due lati verticali per i
soli controlli ad altezza fissa:

```scss
.ir-form[data-density] select.ir-field__control,
.ir-form[data-density] input.ir-field__control {
    padding-top: 0;
    padding-bottom: 0;
}
```

Scelte, e perche':

- **Zero e non un numero minore.** Il padding non contribuiva un pixel di layout, quindi
  non c'e' un valore «giusto» da tarare: c'e' solo quanto testo si taglia. A zero il content
  box e' l'altezza meno i bordi — 25px sotto plain e card, 21 sotto compact — contro una
  riga da 19.5. Nessun passo di densita' puo' riportare il taglio. Nessun numero inventato:
  la seconda leva del prompt (`line-height: 1` + centratura flex) sarebbe stata necessaria
  solo per far stare la riga in un box piu' stretto, e qui il box e' gia' abbastanza largo.
- **`select` e `input` per tipo di elemento, non `.ir-field__control` in blocco.** La stessa
  classe sta anche sulla `<textarea>` mono (`TextWidget.tsx:81`), che **cresce** e il padding
  verticale ce l'ha per davvero, e sul bottone `.ir-ref` (`ReferenceWidget.tsx:119`), che
  centra col flex e non taglia. La regola di densita' resta intatta per loro.
- **Solo i lati verticali.** `--ir-form-pad-x` non si tocca: e' la larghezza, cioe' FL8.

## 7. Verifica

`scripts/smoke/_tmp_fl9_verify.ts`, **15/15 ALL GREEN, zero errori di pagina**. Criterio di
accettazione, meccanico: la banda dipinta dentro il padding box e' **identica** a quella
dello stesso controllo reso senza vincolo (`height: 60px; padding-block: 0`) — zero pixel
persi, non «piu' di prima». Before e after nello **stesso caricamento**, il before essendo
la regola committata prima di FL9 rimessa a runtime.

| preset | content before → after | banda before → after (su 14, o 13 a 12px) |
|---|---|---|
| Comfortable | 12 → 26 | 10 → **14** |
| Sectioned | 12 → 26 | 10 → **14** |
| Compact | 12 → 22 | 10 → **13** |
| Dense | 18 → 26 | 14 → 14 (non tagliava) |

Controlli con segnale nello stesso giro: il caso libero da' la **stessa** banda a parita' di
riga di testo (14 a 19.5px, 13 a 18px — `compact` porta un tipo piu' piccolo, e la
differenza e' solo quella); il braccio before **riproduce** la perdita.

Non regressione misurata, non affermata:
- **FL8**: zero controlli sotto i 40px e zero overflow dalla cella nei quattro preset
  (minimo 63.3px, 87.8 in Comfortable).
- **FL3 / geometria**: l'impronta di **celle, campi, etichette, controlli e riga del
  messaggio** e' identica before/after nei quattro preset, `formH` compreso (811.2 / 605.8 /
  914.2 / 643.2). E' il modo di misurare «il padding verticale non era layout».
- **«Modified, not saved»**: con il campo sporco il puntino compare e la select non cambia
  ne' altezza ne' `y` (1056.2 / 28 prima e dopo). Nota di metodo: il segno di sporco lo mette
  il **commit**, non la digitazione — il primo giro scriveva senza sfocare e misurava una
  form pulita.

Mutazioni, per provare che il verde ha segnale:
- unita' (`irFormControlPadding.test.ts`, 9/9): `padding-top: 3px` → 1 rosso; blocco spostato
  **prima** della regola di densita' → 1 rosso; blocco rimosso → la suite non collezionava
  affatto (il selettore non c'e').
- sonda: blocco rimosso dal foglio → **ACCETTAZIONE 1 rossa** (e con lei la 3), braccio
  before ancora verde. Ripristinato: 15/15.

## 8. Domande aperte / fuori perimetro

- La stessa regola di densita' scrive `padding-right: var(--ir-form-pad-x)` sulla select,
  che **cancella** i 36px riservati al chevron da `Select.module.css:55`. E' un problema di
  larghezza, non di altezza, quindi fuori dal perimetro di FL9; qui resta registrato perche'
  la prossima slice sulle select lo trovi misurato e non lo riscopra.
- `.ir-form` ridichiara `--radius-md`, `--radius-base`, `--font-size-md`, `--font-size-sm`
  per piegare i due CSS module alla scala della form (`:60-64`). Funziona, ma vuol dire che
  una select della form e una fuori non hanno lo stesso tipo per la stessa classe: e' il
  quarto sistema di token che il commento in testa al foglio gia' denuncia.
