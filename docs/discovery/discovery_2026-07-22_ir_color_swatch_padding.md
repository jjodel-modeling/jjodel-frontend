# Discovery — Swatch colore (Fill/Border) pannello IR: margine bianco intorno al riempimento

**Data**: 2026-07-22
**Tipo**: fix visivo (CSS), read-only discovery
**Branch**: `alfonso-frontend-jjtl`
**Critical zone**: nessuna
**LIR**: not-required
**Hard stop**: rispettato — nessun file sorgente toccato, solo questo report.

---

## 1. Obiettivo

Individuare il componente che renderizza lo swatch colore nelle righe **Fill** e **Border**
del pannello IR (vertex authoring panel) e la regola CSS/inline responsabile dello spazio
bianco/chiaro visibile tra il bordo esterno arrotondato dello swatch e il riempimento colore
effettivo.

Acceptance criterion del fix (Fase 2, non eseguita qui): il colore selezionato riempie tutto
il background dello swatch, bordo a bordo, mantenendo invariati bordo esterno, border-radius e
dimensione complessiva.

---

## 2. File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — pannello IR, righe Fill/Border.
- `frontend/src/components/ui/ColorPicker/ColorPicker.tsx` — componente swatch colore.
- `frontend/src/components/ui/ColorPicker/ColorPicker.module.css` — **stile responsabile del bug**.
- `frontend/src/components/ui/ColorPicker/index.ts` — barrel del componente.
- `frontend/src/components/ui/index.ts` — re-export barrel `ui`.
- `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`, `_radius.scss` — valori dei token coinvolti.

Grep di copertura eseguiti su `frontend/src` per: `ColorPicker`, `type="color"`,
`-webkit-color-swatch`, `::-moz-color-swatch`, `swatch`, label letterali `Fill`/`Border`.

---

## 3. Componente e catena di rendering

Le righe Fill e Border del pannello IR usano **lo stesso** componente riusabile
`components/ui/ColorPicker`:

- `VertexAuthoringPanel.tsx:165` → `<ColorPicker>` per **Fill** (quando il fill è scalare).
- `VertexAuthoringPanel.tsx:171` → `<ColorPicker>` per **Border** (`border.color`).
  La riga Border affianca poi `NumberInput` (stepper spessore `1`) e `Select` ("Solid") —
  elementi **separati**, non parte dello swatch.

`ColorPicker.tsx` renderizza (righe 67-86):
- un `<input type="color" className={styles.swatch}>` — lo **swatch** (elemento del bug),
- un `<input type="text" className={styles.hex}>` — il campo hex accanto (non coinvolto).

---

## 4. Regola esatta responsabile del margine bianco

`frontend/src/components/ui/ColorPicker/ColorPicker.module.css`, classe `.swatch`
(righe 19-28):

```css
.swatch {
  width: 36px;
  height: 32px;
  padding: 2px;                                              /* (A) */
  flex-shrink: 0;
  border: var(--input-border-width) solid var(--input-border-color);
  border-radius: var(--radius-md);                           /* 8px */
  background-color: var(--color-bg-primary);                 /* (B) */
  cursor: pointer;
}
```

**Causa primaria — combinazione (A) + (B):**
Il nativo `<input type="color">` dipinge il colore selezionato nel **content box**
dell'elemento. Con `padding: 2px` il pozzetto colore è rientrato di 2px dal bordo; quell'anello
di padding mostra il `background-color: var(--color-bg-primary)`, che in tema chiaro vale
`$slate-50` (≈ bianco, `_colors-light.scss:80`). Risultato: cornice chiara di ~2px tra il bordo
esterno arrotondato e il colore pieno — esattamente il sintomo dello screenshot. In tema scuro
il background è sovrascritto a `--color-bg-secondary` (`.module.css:64-69`), quindi il margine
resta ma è scuro anziché bianco; lo screenshot di Alfonso è in tema chiaro → margine bianco.

**Causa concorrente — pseudo-elementi nativi non normalizzati:**
Il componente **non** definisce alcuna regola per gli pseudo-elementi dell'input color.
Restano quindi i default del browser, che aggiungono ulteriore margine sopra a (A):
- `::-webkit-color-swatch-wrapper` ha un `padding` di default (alcuni px),
- `::-webkit-color-swatch` ha un `border` di default (~1px),
- equivalenti Firefox: `::-moz-color-swatch { border: ... }`.

Questi contribuiscono allo stesso vuoto interno indipendentemente da (A)/(B). Per un riempimento
davvero bordo-a-bordo la Fase 2 dovrà sia azzerare il padding dell'elemento sia normalizzare
questi pseudo-elementi (wrapper `padding: 0`, swatch `border: none` + eventuale `border-radius`
interno), mantenendo `border`, `border-radius` e dimensione 36×32 invariati.

---

## 5. Altri punti d'uso dello stesso componente

Il componente condiviso `components/ui/ColorPicker` ha come **unici** consumer:

- `components/ui/index.ts:43-44` — re-export barrel.
- `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — **righe Fill e Border**
  (le due sole istanze reali, entrambe nel pannello IR).

Non è usato altrove. I seguenti risultati del grep sono **feature distinte** con componenti/stili
propri, **non** toccate da un fix a `ColorPicker.module.css`:

- `components/forEndUser/Color.tsx` — usa un componente locale `ColorPickerArea` (non `ui/ColorPicker`) + `components/forEndUser/color.scss`.
- `components/editor-v2/components/ColorSchemeSelector.tsx` + `_color-schemes.scss` — color scheme selector.
- `components/editors/views/data/palette-data.scss`, `components/colorScheme/defaultColorScheme.scss`, `styles/style.scss` — palette/scheme separati.

**Conseguenza per lo scope:** siccome `ColorPicker.module.css` è un CSS Module (classi
localmente scoperte/hashate) usato solo dal pannello IR, il fix è naturalmente confinato alle
sole righe Fill/Border. Il bug è visibile su **entrambe** (Fill e Border) perché sono la stessa
primitiva — coerente con lo screenshot; non serve differenziarle.

---

## 6. Fix proposto (Fase 2, in attesa di go-ahead)

Ambito: **solo** `frontend/src/components/ui/ColorPicker/ColorPicker.module.css`, classe
`.swatch` (+ nuovi pseudo-elementi). Nessuna modifica a `ColorPicker.tsx` né al pannello.

1. Azzerare `padding: 2px` → `padding: 0` sullo swatch (rimuove la fonte (A)).
2. Aggiungere normalizzazione degli pseudo-elementi nativi per riempire bordo-a-bordo:
   - `.swatch::-webkit-color-swatch-wrapper { padding: 0; }`
   - `.swatch::-webkit-color-swatch { border: none; border-radius: calc(var(--radius-md) - var(--input-border-width)); }`
   - `.swatch::-moz-color-swatch { border: none; }`
3. Lasciare `background-color: var(--color-bg-primary)` invariato (non più visibile una volta
   che il colore riempie il content box; utile solo come fallback per valori non `#rrggbb`).

Invarianti da preservare (da prompt): bordo esterno (spessore/colore), `border-radius`,
dimensione 36×32, il campo hex accanto, lo stepper `+/-` e il select "Solid" della riga Border,
stati hover/disabled. Nessuna rinomina di classi/variabili.

Verifica Fase 2: `npm run build` verde + controllo visivo su `localhost:3001` (hard refresh):
swatch Fill e Border pieni bordo a bordo, nessun altro elemento della riga toccato, nessun
layout shift, tema chiaro e scuro.

---

## 7. Rischi e domande aperte

- **Rischio basso**: CSS Module scoperto localmente, un solo consumer (pannello IR). Nessun
  rischio di collisione classi o regressione su altre feature colore.
- **Cross-browser**: gli pseudo-elementi `::-webkit-*` coprono Chrome/Safari/Edge; `::-moz-*`
  copre Firefox. Nessuna dipendenza nuova.
- **Domanda aperta (minore)**: se in Fase 2 si preferisca il fix minimo (solo `padding: 0`,
  lasciando i default degli pseudo-elementi) vs. il fix completo (padding 0 + normalizzazione
  pseudo-elementi). Il fix completo è consigliato perché il solo `padding: 0` può lasciare un
  residuo di ~1px dovuto al border di default di `::-webkit-color-swatch`. Da confermare con
  Alfonso alla verifica visiva.

---

**Prossimo passo**: attendo go-ahead esplicito per la Fase 2. Hard stop qui.
