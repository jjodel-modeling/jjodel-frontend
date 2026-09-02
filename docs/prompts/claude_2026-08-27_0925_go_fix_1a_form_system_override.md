# GO: esito verifica visiva Slice 1a e commit C di correzione

**Data**: 2026-08-27 09:25
**Riferimento**: `claude_2026-08-26_2230_prompt_form_views_slice1a_impl.md`, commit A `d49143031`, B `918b0ec75`.
**Verifica**: fatta dalla chat pilotando il Chrome di Alfonso su `http://localhost:3000/`, progetto
"State Machine v1", modello `model_1` (State Machine), oggetti S0 e T2, più il progetto "dd".

## Esito

| Criterio | Esito | Misura |
|---|---|---|
| V1 | ✅ | Tab `Properties \| Form` su S0 e T2 (DObject); su `model_1` (DModel) nessuna barra tab. |
| V2 | ✅ | `name` S0 → `S0form` con Enter: slot `["S0form"]`, `DObject.name` `S0form`, header della form, nodo sulla tela e riga dell'albero aggiornati, `U.isProjectModified === true`. Ritorno a `S0` con Tab (blur): stesso esito. Nessun debounce percepibile (letto a 2 s). |
| V3 | ⚠️ non esercitato | Nessun modello nel corpus locale ha slot M1 di tipo number, boolean o enum (State Machine v1: solo EString e riferimenti; dd: solo riferimenti; Persona con `age: EInt` e `anno: Anno` è in `metamodel_1` senza modello). Coperto solo da unit test e smoke. Da chiudere nella 1b con una fixture, che serve comunque agli stati di validazione. |
| V4 | ✅ | `.ir-form__summary` 32px con "No issues"; `.ir-field__message` 16px vuoto su ogni campo; campo `name` = labelrow 13 + input 36 + message 16 + gap = 73px. |
| V5 | ✅ | Basic mostra solo `name` (lower ≥ 1); Advanced tutto; chiave `jjodel.formPrefs.Pointer1787735346550_USER_39 = {"mode":"basic"}`. |
| V6 | ✅ | `view.ir = {...ir, form: {widgets: {name: 'textarea'}, basic: ['name']}}` dal setter `.ir`: textarea IBM Plex Mono 12px, 56px, senza reload; ripristinato l'IR dopo la prova. |
| V7 | ✅ | T2: `nextState` (S1) ed `event` ("No values") read-only con punto required e `1..1`; S0: `ownedTransitions` (T2) read-only con `0..*`. |
| Focus | ✅ | bordo `rgb(51,65,85)` + `0 0 0 3px rgba(51,65,85,.15)`. |
| Label row | ✅ | label 11px `#475569`, molteplicità IBM Plex Mono 10px, punto required 4px `#0ea5e9`. |

## Difetti trovati

**D1 (da correggere ora): l'input è alto 36px, font 14px, padding 8px 12px, invece di 28 / 13 / 4-8.**
Causa misurata con una passeggiata sugli stylesheet (`input.matches(rule.selectorText)`): vince la
regola globale di `frontend/src/styles/components/_form-system.scss:44-57`

```
.input, input.input, input[type="text"], input[type="number"], ... , .form-textarea {
  height: var(--form-input-height);            /* 36px, :root, riga 8 */
  padding: var(--form-input-padding-y) var(--form-input-padding-x);   /* 8px 12px */
  font-size: var(--form-input-font-size);      /* 14px */
  ...
}
```

con specificità (0,1,1) contro la `._input-sm` del CSS module di `ui/Input` (0,1,0). Il re-puntamento
di `--input-height-sm` in `.ir-form` è corretto ma inerte: la regola che vince legge `--form-input-*`.
È un **quarto sistema di token** (`--form-input-*`, esadecimali cablati in `:root`), non censito nel
finding 7 del report: da aggiungere a `contesto_progetto.md` alla prossima occasione.

Correzione, stessa tecnica già usata, nello stesso blocco `.ir-form` di `irFormStyle.scss`:

```scss
.ir-form {
    /* _form-system.scss:44 targets input[type=text|number|...] with (0,1,1) and reads these. */
    --form-input-height: var(--control-height-lg);
    --form-input-padding-y: 4px;
    --form-input-padding-x: 8px;
    --form-input-font-size: var(--text-sm);        /* 13px; use the token that holds 13px */
    --form-input-border-radius: var(--radius-sm);
}
```

Non toccare `_form-system.scss`: ha consumatori in tutta l'app. Poi **ripeti la passeggiata sugli
stylesheet** per `input[type="number"]` (`_form-system.scss:189`), `textarea` (`:123`, `min-height:
80px; resize: vertical`) e `select` (`:135`, verifica se il blocco è dentro il commento aperto a
`:130`), e per la checkbox, e riporta quali regole globali colpiscono i quattro widget e cosa hai
dovuto ri-puntare. Criterio di accettazione: `getBoundingClientRect().height` dell'input `name` =
28, `getComputedStyle(input).fontSize` = 13px; la textarea di V6 resta 56px senza handle di resize
(`resize: none`), o con `resize: vertical` se lo preferisci e lo dichiari.

**D2 (minore, stesso commit): manca l'hint "JjEL"** accanto alla label quando il widget è
`textarea` da override d'autore (punto 4 del prompt, README §Widgets: mono 10px accanto alla
label). La label row di V6 legge solo `name` + `1..1`.

**D3 (non della form, a registro)**: cliccando con il mouse nella riga dei tab a ridosso del bordo
sinistro del rail, il rail si è allargato a 640px e la selezione è tornata al modello (due volte,
riproducibile). Cliccando il tab via DOM non succede. È lo splitter o l'expander del rail che sta
sotto la riga dei tab: comportamento pre-esistente di `PropertiesWithTreeView`, da guardare a parte.

**D4 (osservazione, non attribuita)**: due blocchi del renderer (CDP timeout 45 s) nella sessione,
il primo dopo scritture da console fuori `TRANSACTION`, il secondo aprendo "dd" con doppio click
dalla pagina progetti con "State Machine v1" ancora in store, senza form montata. Non riproducibili
a comando; da tenere d'occhio.

Nota utile per le prove future: `transactionStatus.transactionDepthLevel` vale **1** a riposo
dopo il caricamento (transazione di buffer aperta dall'app), e le scritture dal pannello si vedono
nello store con un ritardo che dipende dal flush; leggere a 2 s, non a 200 ms.

## Cosa fare

1. **Commit C**, `fix(rail): form controls keep the 28px scale under the global form-system rules;
   JjEL hint on authored textarea`: `irFormStyle.scss` (re-puntamento), `IRFormField.tsx` o
   `TextWidget.tsx` (hint), più eventuale test. Gate: tsc baseline, vitest, build. Riporta le misure
   dei quattro widget dopo la correzione (altezza, font, padding) e le regole globali trovate.
2. **Hard stop** dopo C: la chat ripete V4 e V6 a schermo.
3. Dopo la conferma: entry in `docs/claude-code-log.md` cumulativa A+B+C con le decisioni A1-A7, i
   token aggiunti, le due scelte sui widget, il `formSpec` al posto di `form` su `CompiledView`, il
   quarto sistema di token, D3 e D4 a registro, l'esito V1-V7 con V3 dichiarato non esercitato.
   Attore della verifica: la chat sul Chrome di Alfonso.
