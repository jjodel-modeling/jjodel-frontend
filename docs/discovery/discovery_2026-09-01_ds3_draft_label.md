# DS3 — il quinto eyebrow: `&__draft-label` a 0.08em

**Data**: 2026-09-01
**Slice**: DS3, micro, parallela alla chiusura di 10j
**Corregge**: `discovery_2026-09-01_10i_uppercase_columns.md` §4 (divergenza rilevata e lasciata)
**Esito**: ✅ chiusa la divergenza di tracciato; il colore resta divergente **di proposito**

---

## 1. Il perimetro non era dove il prompt lo ipotizzava

Il prompt scriveva: «il tuo perimetro è il foglio della form (`irFormStyle` o dove
`&__draft-label` vive — **verificalo con grep, non assumerlo**)», e subito dopo
«NON toccare `InstanceManagerTab.tsx` né **il foglio della tabella**».

Il grep risponde, e le due clausole si contraddicono:

```
$ command grep -rn "draft-label" --include="*.ts" --include="*.tsx" --include="*.scss" frontend/src
frontend/src/components/abstract/tabs/InstanceManagerTab.tsx:394:   className="instance-manager__draft-label"
frontend/src/components/abstract/tabs/instanceManagerTab.scss:986:  &__draft-label {
frontend/src/components/abstract/tabs/__tests__/instanceManager10i.test.ts:91,94
```

`&__draft-label` **non** vive in `irFormStyle.scss`: vive in
`instanceManagerTab.scss`, cioè **nello stesso foglio della tabella**. Il foglio
della form e il foglio della tabella sono lo stesso file. `irFormStyle.scss`
compare nel perimetro solo di striscio — il commento a `&__draft-body`
(righe 969-974) rimanda a `ir-form__row` / `ir-form__cell` per la griglia, ma
l'etichetta è di questo foglio.

La clausola di esclusione è quindi **insoddisfacibile alla lettera**. Risolta
così: il diff tocca **il solo blocco `&__draft-label`** (righe 986-991 a HEAD),
nessun altro blocco del foglio, e il commit passa per pathspec.
`InstanceManagerTab.tsx` non è toccato.

---

## 2. La divergenza era DOPPIA, non singola

10i §4 aveva dichiarato una sola divergenza — il tracciato. La misura ne trova
due. Il **before**, per esteso come chiesto dal prompt:

```scss
&__draft-label {
    font-size: var(--text-xs);      /* = eyebrow */
    font-weight: 600;               /* = eyebrow */
    letter-spacing: 0.04em;         /* ≠ eyebrow (0.08em)              ← divergenza 1 */
    text-transform: uppercase;      /* = eyebrow */
    color: var(--color-form-section);  /* ≠ eyebrow (--color-form-muted) ← divergenza 2 */
}
```

Tre dichiarazioni su cinque coincidevano già; due no. 10i aveva visto la prima e
non la seconda, e il suo test fissava solo quella.

Il prompt DS3 chiedeva «le stesse quattro dichiarazioni eyebrow di 10i
(11px/600/uppercase/`0.08em`, **colore muted**)» — un «quattro» che ne elenca
cinque, cioè un'ambiguità che cambia il deliverable. Posta la domanda con la
misura in mano (§3); risposta: **solo il letter-spacing**.

## 3. Perché il colore NON converge

I due token, misurati a runtime dalla sonda:

| token | chiaro | scuro |
|---|---|---|
| `--color-form-section` | `#64748b` (slate-500) | `--color-text-tertiary` |
| `--color-form-muted`   | `#94a3b8` (slate-400) | `--color-text-tertiary` |

Contrasto su bianco, per la formula WCAG 2.x:

| colore | luminanza rel. | contrasto | AA (testo normale, 4.5:1) |
|---|---|---|---|
| slate-500 `#64748b` | 0.1706 | **4.76:1** | passa |
| slate-400 `#94a3b8` | 0.3550 | **2.59:1** | **non passa** |

`&__draft-label` non è una testata di sezione: è la `<label>` di un campo da
compilare, a 11px. Portarla a muted la manderebbe sotto AA su una superficie di
input. In **scuro** i due token collassano entrambi su `--color-text-tertiary`,
quindi la divergenza esiste solo in chiaro — che è anche la ragione per cui non
si era mai vista.

La divergenza è ora **dichiarata** in tre punti, perché non venga «pulita» di
passaggio da una sessione futura: il commento nel foglio, un `it` dedicato nel
test di 10i, e le asserzioni 2b/2c della sonda.

---

## 4. Il diff

`frontend/src/components/abstract/tabs/instanceManagerTab.scss` — una
dichiarazione, più il commento che motiva ciò che resta divergente:

```diff
+    /* DS3 — il quinto eyebrow del foglio, e ora traccia come gli altri quattro.
+       [...] Il COLORE resta `--color-form-section` (slate-500) e NON diventa
+       `--color-form-muted` (slate-400) [...] su bianco slate-500 da' 4.76:1 e
+       slate-400 da' 2.59:1 [...] Deliberata: non «convergerla» in un
+       passaggio di pulizia. */
     &__draft-label {
         font-size: var(--text-xs);
         font-weight: 600;
-        letter-spacing: 0.04em;
+        letter-spacing: 0.08em;
         text-transform: uppercase;
         color: var(--color-form-section);
     }
```

`0.08em` resta **letterale** per R-RAIL-10, che lo nomina come la sua prima
eccezione. Nessun token `--tracking-eyebrow` inventato: era escluso in 10i e
resta escluso.

Dopo questo cambio **il foglio non contiene più alcun `0.04em`** fuori dai
commenti: era l'ultima occorrenza.

---

## 5. Il test di 10i: da «fissa la divergenza» ad «afferma la convergenza»

L'asserzione non è stata cancellata, ha **cambiato verso**.

**Prima** — dentro l'`it` sul `thead th`, come nota di ciò che restava divergente:
```ts
expect(block(RULES, '&__draft-label {')).toMatch(/letter-spacing:\s*0\.04em/);
```

**Dopo** — tre `it` dedicati, sotto un cartiglio `── DS3 ──`:
- `DS3 — il &__draft-label traccia come l'eyebrow: 0.08em` — asserisce `0.08em`,
  nega `0.04em` sul blocco, e nega `0.04em` **sull'intero foglio** (l'ultima
  occorrenza è sparita), con un controllo positivo che la regex sappia trovare
  un tracciato quando c'è.
- `DS3 — le altre tre erano già quelle dell'eyebrow` — font-size / weight /
  text-transform, confrontate col blocco `&__eyebrow`.
- `DS3 — il COLORE resta divergente, e di proposito` — il guard-rail di §3.

L'`it` sul `thead th` resta e torna a parlare solo del `thead th`.

Il test `nessun valore fuori dalla banda dichiarata (0.04–0.1em)` è invariato e
continua a passare: 0.08em è dentro la banda.

**36 → 39 casi**, tutti verdi.

### 5.1 Mutazioni

| mutazione | rossi | ripristino |
|---|---|---|
| `&__draft-label` torna a `0.04em` | 1 | verde |
| il colore converge a `--color-form-muted` | 1 | verde |
| la dichiarazione `letter-spacing` rimossa del tutto | 1 | verde |

---

## 6. La sonda: la richiesta corretta contro la misura

Il prompt chiedeva la sonda «sul **badge** draft», con «un draft **sporco**: apri
una form e modifica un campo senza salvare».

La misura corregge la richiesta su due punti, e vale la pena scriverlo perché
una sonda costruita sullo stato sbagliato avrebbe misurato un elemento che non
esiste e restituito lo stesso silenzio di un elemento che non si dipinge:

1. **`&__draft-label` non è un badge.** È la `<label>` di ogni campo dentro
   `DraftDialog` (`InstanceManagerTab.tsx:392-398`), col `<span>` del tipo e
   della cardinalità annidato.
2. **Non c'è nessuno stato «sporco» da raggiungere.** Il draft non ha uno stato
   sporco che accenda l'etichetta: le label si rendono al **primo aprirsi del
   dialogo**. Lo stato si raggiunge selezionando una metaclasse **rootable** e
   cliccando `New <Cls>` — la scorciatoia esiste solo lì (`classShape &&
   !newReason`, riga 2199), fatto già misurato il 2026-09-01 nella sessione
   sulle icone bi.

`scripts/smoke/_tmp_ds3_verify.ts`, due giri sulla stessa fixture
(StateMachine rootable con `name` / `entryAction` / `documentation`, tre chiavi
di lunghezza diversa perché la larghezza dipinta si misura sui caratteri):

- **before 15 PASS / 3 FAIL**, **after 18 PASS / 0 FAIL**, zero errori di pagina
  in entrambi i giri.
- I controlli positivi (blocco 0) e le non-regressioni (blocco 2) sono **verdi
  in entrambi i giri**: è quello che li rende controlli. Solo il blocco 1 vira.

### 6.1 La prova nei pixel

Il computed style dice `0.44px → 0.88px` (0.04em e 0.08em su 11px). Ma un valore
dichiarato non è un pixel dipinto, e la sonda misura anche **l'inchiostro**: la
larghezza del solo nodo di testo della `<label>`, presa con un `Range`. Il
`getBoundingClientRect` dell'elemento avrebbe dato la larghezza della **cella**,
che col tracciato non cambia e avrebbe detto «nessun delta» — un falso negativo
che sarebbe passato per una misura.

Ogni carattere guadagna 0.44px, quindi una parola di N caratteri deve crescere
di N × 0.44px. Il predetto e il misurato:

| chiave | char | ink before | ink after | Δ misurato | Δ predetto (N × 0.44) |
|---|---|---|---|---|---|
| `name` | 4 | 34.92px | 36.69px | **+1.77** | 1.76 |
| `entryAction` | 11 | 83.78px | 88.63px | **+4.85** | 4.84 |
| `documentation` | 13 | 103.94px | 109.66px | **+5.72** | 5.72 |

Tre su tre entro 0.01px del predetto. I pixel si sono mossi, e si sono mossi
della quantità giusta.

### 6.2 Le non-regressioni verificate

Verdi in entrambi i giri, cioè non toccate dal diff:

- il suffisso tipo/cardinalità (`&__draft-card`) **non eredita** il tracciato —
  dichiara `letter-spacing: 0`, computa `normal`. Senza quel reset esplicito il
  cambio si sarebbe propagato dentro l'etichetta, perché `letter-spacing` è
  ereditato;
- il colore delle label resta `rgb(100,116,139)` = slate-500, e **non** è quello
  dell'eyebrow `rgb(148,163,184)`;
- le intestazioni di tabella di 10i: uppercase, 0.88px, intatte;
- l'eyebrow del pannello: 11px/600/0.88px/slate-400, intatto;
- il titolo del dialogo (18px, `tracking: normal`) non è un eyebrow e non si muove;
- i testi restano quelli del metamodello — `entryAction`, non `ENTRYACTION`: il
  maiuscolo lo fa il CSS anche qui.

---

## 7. Verifica

- `npm run typecheck` — **33** errori, baseline invariata (conteggio su output
  **completo**, non su un `tail`).
- `npm run build` — exit **0**, solo il warning noto di chunk-size.
- `npm run test` — **2799 test passati, 0 falliti**; 9 file rossi in raccolta,
  tutti il noto `window is not defined`. I 3 test rossi dell'entry precedente
  (`instanceManager10c` ×2, `10d` ×1) sono **verdi**: erano causati da 10i non
  committata in albero, e ora 10i è in `dc6ae5c52`.
- `instanceManager10i.test.ts` — 39/39, provata con tre mutazioni.

---

## 8. Coordinamento

Slice parallela alla chiusura di 10j. Due fatti da mettere a verbale:

1. **Stesso foglio.** DS3 e 10j insistono entrambe su `instanceManagerTab.scss`
   (§1): 10j sull'empty state e la tabella, DS3 sul solo blocco
   `&__draft-label`. Nessuna sovrapposizione di righe, ma il commit **deve**
   passare per pathspec.
2. **Un diff non mio in albero.** Durante la sessione è comparsa una modifica a
   `frontend/src/model/logicWrapper/LModelElement.tsx` (`LReference.set_*`, il
   `return true` → `return false` sul rifiuto di auto-composizione, con
   riferimento al referto 10g). Non è di DS3, **non è stata toccata** e resta
   fuori dal commit. Segnalata qui perché chi legge il `git status` di questa
   giornata non la attribuisca a questa slice.
