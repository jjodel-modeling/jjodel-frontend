# PROMPT — Livello 2: gruppi Structure del rettangolo nel rail

Implementa la slice "Livello 2 — Structure tab" del View Designer, specificata dal Turno 7 di `Instance Node Proposal.dc.html` (sezioni 7a, 7b, 7c) e dalla sezione "Level 2 — Structure (shape-dependent)" del README dello stesso bundle. Il design HTML è la referenza autoritativa per copy, spaziature e stati.

## Dove

- Tab **Structure** del rail (`VertexAuthoringPanel.tsx`, body `ir-structure`). Nessun tab nuovo. I tre gruppi nuovi — **Name**, **Accent**, **Compartment** — si inseriscono SOPRA la sezione "Field compartments" esistente (`FieldCompartmentListEditor`), che resta in coda invariata.
- Il Form tab ci arriva già via `Edit compartments` (`JjodelEvents.IR_AUTHORING_TAB`, `tab: 'ir-structure'`): non toccare quel wiring.
- Pattern del pannello: `FormSection`, `jj-field`, `HelpText icon={false}`, Select/Toggle condivisi, draft immutabile + `patch()` con debounce — esattamente come i campi esistenti del pannello.

## Campi (IR, defaults neutri)

Tutti opzionali nell'IR: il default NON viene persistito (stesso idioma di `padding`/`marker` — chiave assente, mai valore vuoto).

| Campo IR | Valori | Default | Vincolo di Symbol |
|---|---|---|---|
| `name.position` | `header-band` \| `center` \| `below` \| `external` | `header-band` (rect) / `center` (stadium…) | `header-band` solo per forme con lato superiore piatto |
| `name.typeDisplay` | `inline` \| `chip` \| `badge` \| `hidden` | `inline` | nessuno |
| `accentPlacement` | `none` \| `top` \| `left` \| `ring` | `none` | `top`/`left` solo bordi dritti; `ring` le sostituisce sulle forme tonde |
| `accent` | color | `#cbd5e1` | nessuno; nota "Inherited from the metaclass · override per instance" |
| `compartment.mode` | `inline` \| `popover` \| `none` | `inline` (rect) / `none` (stadium, diamond) | `inline` solo dove c'è spazio per le righe |
| `compartment.columns` | `2` \| `3` | `2` | mostrato solo se `mode ≠ none` |
| `emptyBehavior` | `dash` \| `collapse` \| `hide` | `dash` | mostrato solo se `mode ≠ none` |
| `edgeMarker` | boolean | `true` | mostrato solo se `mode ≠ none` |

I valori ammessi per Symbol vengono da una tabella dati per `ShapeForm` (stile `MARKER_REGISTRY`), non da if sparsi nel componente.

## Regola 1 — contestualità (7a/7b)

- Un campo o un'opzione che il Symbol corrente non supporta è **assente, non disabilitato**.
- Ogni assenza è dichiarata: riga `HelpText` sotto il campo quando l'opzione manca ("Header band not offered: Stadium has no flat top edge"), e una riga riassuntiva unica a fondo tab (icona `bi-eye-slash`) che elenca i campi non mostrati con la causa, in due famiglie: dal Symbol ("no compartment on this Symbol") e dalla scelta corrente ("Mode is None").
- La riga di motivo compare SOLO sui campi symbol-dipendenti (Position sì, Empty slots no).
- Se il Symbol cambia e il valore persistito non è più ammesso: il render usa il fallback ammesso, l'IR non viene riscritto in silenzio (stesso principio della width del border double).
- Stringhe UI in inglese (R-4), come il resto del pannello.

## Regola 2 — precedenza FormSpec.widgets vs `@renderer` (7c)

La view vince ma deve dichiararlo, su entrambe le superfici:

- **Form tab** (`FormAuthoringBody`): quando `FormSpec.widgets[f]` copre un renderer dichiarato nel metamodello (`@renderer=…` / tipo `Color`), la riga del widget guadagna una riga di provenienza: `metamodel declares Swatch (@renderer=color) — overridden by this view · Reset`. Reset rimuove la chiave da `widgets` (pruning `pruneForm` esistente).
- **Inspector ladder** (renderer inspector del Turno 5): l'override della view diventa il gradino **0** ("Dichiarata dalla view — regola vincente", con link che dispatcha `IR_AUTHORING_TAB` verso `ir-form`); il gradino 1 resta visibile con la sua evidenza e badge `overridden by current view`; il chip di stato passa da `auto` a `view`. Footer: "Torna al renderer del metamodello" = stesso Reset.
- Le due superfici leggono/scrivono la stessa chiave (`FormSpec.widgets`): niente stato duplicato di provenienza.

**Stato misurato (2026-08-29, R-STR-7).** Delle due superfici solo il **Form tab** e' viva.
`ObjectNode` monta il renderer inspector unicamente nel ramo nativo, e un ir che porta `form`
— o `structure` — non supera l'hash di `isMigratedDefaultView`, quindi non e' mai delegato:
il gradino 0, il badge `overridden by current view`, il chip `view` e il reset del footer sono
implementati e oggi irraggiungibili. Il gradino 1 invece **e'** alimentabile in sessione
(`DAnnotation.new('jjodel/renderer=…')`); lo stub di `parseDAnnotation` costa solo il
round-trip `.ecore`. Il gradino 0 va o rimosso, o abilitato montando l'inspector anche sul
ramo IR: debito registrato, non aperto.

## Test attesi

- Tabella capability per Symbol: rect offre header-band/top/left/inline; stadium li nega e offre ring; i campi dipendenti spariscono con `mode: none`.
- Round-trip IR: default non persistiti; chiave rimossa (non svuotata) al reset; valore non più ammesso dopo cambio Symbol conservato nell'IR ma non renderizzato.
- Precedenza, **sul Form tab**: con una dichiarazione `jjodel/renderer` in sessione piu' un
  override di view che mappa su un renderer diverso, la riga di provenienza compare, nomina il
  renderer coperto, cita il formato reale e offre il Reset; con un override che **coincide**
  (accordo) la riga non compare; il Reset rimuove la chiave e pota il `form` vuoto. La meta'
  inspector (gradino 0, chip `view`) non e' verificabile a schermo finche' vale R-STR-7.

## Fuori scope

Rendering runtime dei campi sul nodo (già coperto dalle slice di livello 3), `property.render = edge-label`, dark mode.
