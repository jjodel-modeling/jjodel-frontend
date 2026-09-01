# FL10 — il padding destro di densita' cancella la riserva del chevron

Data: 2026-09-01. Perimetro: `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss`.
Protocollo: `docs/PROTOCOL.md` P1..P10. Origine: referto FL9 §8, che lo aveva misurato e
lasciato fuori perimetro perche' e' larghezza e non altezza.

## 1. Ipotesi che la discovery sta falsificando

Che il problema sia solo potenziale — «la dichiarazione c'e', ma con etichette corte non si
vede». **Falsa**: la geometria e' fuori posto in tutti e quattro i preset a prescindere dal
testo, e con un'etichetta lunga il testo viene davvero dipinto dentro la banda del chevron.

## 2. File letti

- `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss` (regola di densita', :1104)
- `frontend/src/components/ui/Select/Select.tsx` (il chevron e' uno `<span aria-hidden>`
  fratello della `<select>`, dentro il wrapper `position: relative`)
- `frontend/src/components/ui/Select/Select.module.css` (`:34`, `:55`, `:81`)
- `frontend/src/jjform/themes.ts` (`DENSITY_SCALE`, i `fieldPaddingX`)

## 3. La riserva, e chi la cancella

`Select.module.css` riserva il lato destro **due volte**: `.select` a `:34`
(`padding-right: 36px`, col commento «Space for chevron icon») e `.selectSm` a `:55`
(`padding: 6px 36px 6px 12px`). Il chevron e' `.icon` a `:81`: `position: absolute`,
`right: 12px`, `font-size: 16px`, centrato in verticale.

`irFormStyle.scss:1104` scrive i quattro longhand del padding a specificita' (0,3,0), che
batte la (0,1,0) delle classi del modulo. Il lato destro diventa quindi
`var(--ir-form-pad-x)`, cioe' **10 / 9 / 8** px, e la riserva sparisce.

## 4. Misura (`_tmp_fl10_recon.ts`, quattro preset in un solo caricamento)

Geometria: bordo destro del content box contro bordo sinistro del chevron. Il segno del
`gap` e' la diagnosi.

| preset | pad-x | padding-right | gap content ↔ chevron |
|---|---|---|---|
| Comfortable | 10 | 10 | **−17** |
| Compact | 9 | 9 | **−18** |
| Sectioned | 10 | 10 | **−17** |
| Dense | 8 | 8 | **−19** |

Pixel, per contrasto — inchiostro dentro la banda del **solo chevron**, con etichetta corta
(chevron da solo) e lunga (chevron + eventuale testo). Una misura sola non distinguerebbe il
testo dal chevron; la differenza fra i due casi si':

| preset | corto | lungo |
|---|---|---|
| Comfortable | 40 / 65 | **100 / 99** |
| Compact | 40 / 52 | **101 / 98** |
| Sectioned | 86 / 107 | 92 / 109 |
| Dense | 40 / 57 | **96 / 92** |

Nota di metodo su quella riga `Sectioned`: era sbagliata, e come. Il primo giro teneva le
etichette originali in una globale catturata una volta sola; `applySkin` rimonta la form, e
il ripristino finiva per riscrivere le etichette di un preset precedente — il caso «corto»
di Sectioned era in realta' ancora lungo. Rileggendole a ogni giro il caso corto vale
**40 / 52 in tutti e quattro**, che e' l'inchiostro del chevron da solo.

## 5. Le due vie, misurate entrambe

Il prompt ne nominava due. Misurate nello stesso giro, danno **lo stesso identico
risultato**: `padding-right` 36px e `gap` +9 in tutti e quattro i preset.

| via | padding-right risolto | gap |
|---|---|---|
| (A) escludere il lato destro dalla densita' | 36 | +9 |
| (B) `max(var(--ir-form-pad-x), 36px)` | 36 | +9 |

**Scelta: (A).** La (B) non compra nulla — il suo primo argomento non puo' vincere alle
densita' dichiarate (8 / 9 / 10 contro 36) — e restata comunque il 36. Fra due forme
equivalenti passa la piu' corta.

## 6. Il fix

```scss
.ir-form[data-density] select.ir-field__control {
    padding-right: 36px;
}
```

Il 36 e' **ripetuto, non inventato**: e' il numero del modulo, che essendo un CSS module ha
classi hashate e non e' raggiungibile da qui. La ripetizione non e' pero' silenziosa:
`irFormControlPadding.test.ts` legge **entrambi i file** e cade se i due numeri divergono.
Solo il lato destro: la sinistra resta al tema (e' FL8) e i verticali alla regola di FL9. Solo
la `select`: gli `input` condividono la regola verticale ma non hanno chevron, e regalare
loro 36px cambierebbe la larghezza del loro testo.

## 7. Verifica

`scripts/smoke/_tmp_fl10_verify.ts`, **10/10 ALL GREEN, zero errori di pagina**. Before e
after nello stesso caricamento (il before e' la regola pre-FL10 rimessa a runtime).

- **ACCETTAZIONE 1**, geometria: `gap` da −17 / −18 / −17 / −19 a **+9 in tutti e quattro**.
- **ACCETTAZIONE 2**, pixel: con l'etichetta lunga l'inchiostro nella banda del chevron e'
  **identico** a quello del caso corto — 40 / 52 contro 40 / 52 nei quattro preset. Prima
  saliva a un centinaio.
- Controllo con segnale: la banda del chevron **non e' vuota** nel caso corto (altrimenti
  «nessun testo qui» sarebbe vero anche senza chevron), e il braccio before riproduce sia lo
  scavalcamento geometrico sia l'inchiostro in piu'.
- **Non regressione FL8**: zero controlli sotto i 40px, zero overflow dalla cella nei quattro
  preset (minimo 63.3px). **Non regressione FL9**: il content box verticale resta ≥ la riga
  di testo (26 ≥ 19.5, 22 ≥ 18).

Mutazioni, per provare che il verde ha segnale:
- unita' (15/15): `36px` → `32px` = 2 rossi; regola rimossa = 5 rossi; riserva estesa anche
  agli `input` = 5 rossi. Verde al ripristino in tutti e tre.
- sonda: regola rimossa → **ACCETTAZIONE 1 e 2 rosse**, i due bracci before ancora verdi.

## 8. Domande aperte

- Il chevron e' fuori dalla `<select>` (fratello, nel wrapper): la riserva e' percio' una
  convenzione fra due elementi tenuta da due numeri in due file. Un `--select-chevron-reserve`
  dichiarato dal modulo e letto da chi lo riveste chiuderebbe la duplicazione, ma tocca un
  componente condiviso ed e' fuori dal perimetro di questa slice.
- Restano aperte le due note di FL9 §8 sulla ridichiarazione dei token di scala dentro
  `.ir-form` (`--font-size-sm`, `--radius-base`): una select dentro la form e una fuori non
  hanno lo stesso tipo per la stessa classe.
