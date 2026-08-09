# Fase 2B — Progressive disclosure del pannello authoring vertex (4 commit) — v2

**Tipo:** feature scoped, 4 commit sequenziali con hard stop di verifica visiva tra l'uno e l'altro.
**Data prompt:** 2026-07-29 (v2: sostituisce la v1; aggiunge lo spostamento del toggle nell'header della card in B2 e il commit estetico B4)
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Precondizione:** fase floating chiusa e pushata. Working tree con possibile WIP TextStyle concorrente: **mai `git add .`**.

> Scope **vertex-only** per il comportamento: si toccano il pannello authoring dei vertex, le sue dipendenze dirette e (solo per il toggle in B2 e l'estetica in B4) l'header della card Properties. Edge e Row restano invariati nel comportamento. Le decisioni di design sono ratificate (sessione 2026-07-28_3 punto 6, più le ratifiche 2026-07-29 in coda a questo prompt): questo prompt le implementa, non le ridiscute.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: segnala e fermati.
- **Rileggi il report** `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md`, Parte B, prima di toccare qualsiasi file. Se lo stato del codice diverge dal report (righe spostate, componenti cambiati), fidati del codice e annota la divergenza.
- **Critical-zone:** nessun file coinvolto. Non toccare `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`.
- `PropertiesWithTreeView.tsx` si può toccare SOLO per: header della card (toggle in B2, restyle in B4). Non toccare overlay, resize, accordion, inset, gating della pill.
- `git add` scoped per path espliciti. Mai `git add .`.
- Zero refactoring opportunistico, mai rinominare identificatori esistenti.
- **Prima di ogni nuovo identificatore** (prop, classe CSS, chiave, evento): `grep -r` globale per collisioni.
- Hard stop dopo OGNI commit: verifica visiva di Alfonso su `localhost:3000` prima del commit successivo.

## 1. Semantica ratificata (da implementare, non ridiscutere)

- **Basic** = Shape, Fill, Border, Sizing, Labels; ogni campo conditional-capable è forzato a Fixed per i NUOVI edit; niente Compartments, niente Badges, niente Matching. **Ratifica 2026-07-29**: il mockup che in Basic mostra solo Line/Sizing/Labels vale come riferimento VISIVO (stile header, sezioni, chip, sub-card label), NON come inventario delle sezioni; Shape e Fill restano in Basic e "Border" resta "Border" (nessun rename in "Line").
- **Advanced** = tutto, più Matching.
- **UN solo toggle, nell'header della card** (ratifica 2026-07-29): segmented control Basic|Advanced accanto al titolo PROPERTIES, cablato su `useInterfaceMode`. Il `tab` locale `basic|advanced` di `VertexAuthoringPanel` (`:55`, semantica storica "visuale vs matching") viene ricablato/assorbito: il blocco "IR View authoring" col toggle interno al tab IR sparisce. Nessun secondo toggle, nessuno stato locale parallelo.
- **Header ibrido** (ratifica 2026-07-29): il toggle entra nell'header e breadcrumb/chip si allineano al mockup (B4), ma le affordance funzionali esistenti (freccia indietro, occhio, aiuto) si CONSERVANO. Nessuna perdita di funzione.
- **Non distruttivo**: Basic non modifica MAI un valore già conditional. Lo mostra come chip read-only (B3); il dato resta intatto e torna editabile in Advanced.
- `ConditionalEditor` riceve una prop additiva con default che preserva il comportamento attuale ovunque tranne che nel percorso vertex/Basic.

## 2. Commit B1 — Sezioni con FormSection (strutturale, zero cambi di comportamento)

**COSA**: sostituire gli pseudo-header piatti (`.jj-field-label`) del render vertex con sezioni `FormSection`.

**DOVE**: `VertexAuthoringPanel`, struttura render `:216-314` (riferimento report: Label, Shape, Fill, Border, Resizable, Labels `:285`, Compartments `:295`, Badges `:305`).

**COME**:
- Riusa `ui/FormSection` esistente ed esportato (titolo auto-maiuscolo): **zero CSS nuovo**, zero componenti nuovi.
- Sezioni statiche (niente collapse per-sezione). "Border" resta "Border".
- Nessun cambio di logica, visibilità o ordine dei campi: B1 è solo struttura. Il toggle locale resta com'è (viene assorbito in B2).
- Verifica che `FormSection` non introduca wrapper che rompono selettori SCSS scoped sulla struttura attuale: se un selettore dipende dalla gerarchia DOM che cambia, riporta prima di procedere.

**Gate B1**: build verde, typecheck Δ0. Visiva: pannello vertex con sezioni intitolate, tutti i campi presenti e funzionanti in entrambe le posizioni del toggle attuale; Edge e Row identici a prima.

**Commit**: `refactor(panels): wrap vertex authoring groups in FormSection`. **Hard stop.**

## 3. Commit B2 — Toggle unico nell'header della card, cablato sul globale + gating sezioni

**COSA**: il toggle Basic/Advanced diventa un segmented control nell'header della card Properties (accanto al titolo), cablato su `useInterfaceMode`; il blocco "IR View authoring" col toggle locale sparisce dal contenuto del tab IR; Compartments, Badges e Matching compaiono solo in Advanced.

**DOVE**: header della card in `PropertiesWithTreeView.tsx` (solo header); `VertexAuthoringPanel` (`tab` locale `:55` e relativi usi); `hooks/useInterfaceMode.ts` in sola lettura/sottoscrizione.

**COME**:
- **Toggle nell'header**: segmented control a due opzioni (Basic | Advanced), stile mockup (pillola attiva chiara su track grigio), classi CSS nuove con grep di collisione, dimensioni compatte coerenti coi token (label 11px, griglia 8px). Legge e scrive SOLO attraverso `useInterfaceMode` (localStorage `jjodel.interfaceMode`, evento `INTERFACE_MODE_CHANGE`, statico `U.interfaceMode`, riconciliazione Redux in Navbar). **Riusa il meccanismo esistente, non crearne uno parallelo.**
- Le affordance esistenti dell'header (pin, collapse, ecc.) restano dove sono; il toggle si inserisce senza rimuovere nulla.
- **Rimozione del toggle locale**: il blocco "IR View authoring" con Basic/Advanced dentro il tab IR viene rimosso; lo stato `tab` locale viene ricablato alla modalità globale. Censisci con grep TUTTI i lettori del `tab` locale ed elencali: nessuno deve restare cablato a uno stato che non esiste più. Semantica post-ricablaggio: Advanced dà accesso a visuale completa + matching; Basic solo alla visuale ridotta.
- Gating: in Basic le sezioni Compartments e Badges non vengono rese e la vista Matching non è raggiungibile; in Advanced tutto torna. Se l'utente è sulla vista matching e passa a Basic, il pannello ripiega sulla vista visuale senza errori.
- Sincronizzazione bidirezionale da verificare: cambiare modalità dal Navbar aggiorna il toggle nell'header e il pannello; viceversa idem. Persistenza al reload.
- Nessun cambio a `ConditionalEditor` in questo commit: in B2 i campi conditional-capable restano come oggi anche in Basic.

**Gate B2**: build verde, typecheck Δ0. Visiva: toggle nell'header, nessun toggle residuo nel tab IR; Basic senza Compartments/Badges/Matching; Advanced completo; sync bidirezionale col Navbar; reload conserva la modalità; overlay (resize, accordion, pill) intatto; Edge e Row invariati.

**Commit**: `feat(panels): move disclosure toggle to card header wired to global interface mode`. **Hard stop.**

## 4. Commit B3 — `allowConditional` + chip read-only

**COSA**: in Basic i campi conditional-capable del vertex sono forzati a Fixed per i nuovi edit; i valori già conditional si mostrano come chip read-only (come la Visibility "Fixed" del mockup).

**DOVE**: `ConditionalEditor` (condiviso vertex/edge/row); `VertexAuthoringPanel`; threading della modalità verso `LabelListEditor` → `LabelEntryEditor` (oggi nessuno dei due ha una prop mode: additiva).

**COME**:
- Aggiungi a `ConditionalEditor` la prop **additiva** `allowConditional?: boolean` con **default `true`**: Edge, Row e ogni call-site non aggiornato mantengono il comportamento identico a oggi. Grep di collisione sul nome prima di introdurlo.
- Con `allowConditional=false`:
  - valore Fixed → editor Fixed normale, senza affordance per passare a conditional (niente selettore Fixed|Conditional);
  - valore già conditional → **chip read-only** che riusa il pattern multi-rule esistente (`ConditionalEditor.tsx:47-49`), NESSUNA coercizione del valore. Caveat esplicito del report: il force-fixed naive su un valore conditional produce il bug di render dell'oggetto Conditional grezzo (`ConditionalEditor.tsx:70`). Il dato non si tocca; il chip comunica che il valore è conditional e si edita in Advanced.
- `VertexAuthoringPanel` passa `allowConditional={advanced}` (o equivalente derivato dalla modalità globale) ai campi della sua catena, incluso il threading verso `LabelListEditor` → `LabelEntryEditor` per i campi label.
- Non modificare le interfacce esistenti oltre all'aggiunta opzionale; non toccare i call-site Edge/Row.

**Gate B3**: build verde, typecheck Δ0. Visiva:
1. Basic: campi conditional-capable senza affordance conditional; un valore reso conditional in Advanced e rivisitato in Basic appare come chip, senza crash e senza perdita del dato; tornando in Advanced è di nuovo editabile.
2. Advanced: editing conditional pieno, identico a oggi.
3. Edge e Row: comportamento conditional invariato in entrambe le modalità.

**Commit**: `feat(panels): gate conditional editing behind advanced mode for vertex`. **Hard stop.**

## 5. Commit B4 — Allineamento estetico al mockup (solo CSS + markup locale)

**COSA**: header e contenuti della card allineati al mockup ratificato, senza perdita di funzioni.

**DOVE**: header della card (`PropertiesWithTreeView.tsx` solo markup dell'header e relativo SCSS); componenti label (`LabelListEditor` / `LabelEntryEditor` e relativo SCSS).

**COME**:
- **Header**: breadcrumb "Contesto › Nome" con separatore leggero e chip VIEW in stile mockup (pillola azzurra tenue, testo maiuscolo piccolo); freccia indietro, occhio e aiuto SI CONSERVANO (ratifica header ibrido). Titolo PROPERTIES e toggle come da B2.
- **Label entries**: ogni label come sub-card con header proprio ("• Label #1": dot colorato + titolo), corpo con i campi esistenti, separatori interni leggeri; bottone "Add label" full-width con bordo tratteggiato in fondo alla sezione Labels.
- Design tokens del progetto: slate `#334155`, accent cyan, label 11px, griglia 8px, nessun layout shift al cambio stato.
- SOLO stile e markup locale: nessun cambio di logica, di props, di gerarchia dati. Classi nuove con grep di collisione; classi esistenti mai rinominate; nessuna classe rc-dock o globale toccata.
- Se una voce del mockup richiede più di stile (es. componenti nuovi), NON farla: elenca la differenza residua nella risposta e fermati lì.

**Gate B4**: build verde, typecheck Δ0. Visiva: confronto side-by-side col mockup su un vertex con almeno 2 label; tutte le funzioni dell'header ancora operative; Edge e Row visivamente coerenti e funzionanti.

**Commit**: `style(panels): align properties card header and label entries with mockup`. **Hard stop.**

## 6. Cosa NON fare

- Non toccare Edge/Row authoring, né i loro call-site di `ConditionalEditor`.
- Non toccare overlay floating (resize, accordion, inset, pill), `Dock.tsx`, gli SCSS del dock.
- Non introdurre un secondo toggle o stato di disclosure locale.
- Non coartare valori conditional a Fixed: il dato è intoccabile in Basic.
- Non rimuovere freccia indietro, occhio, aiuto dall'header.
- Non rinominare "Border" in "Line"; non rimuovere Shape/Fill da Basic.
- Non `git add .`.

## 7. Chiusura (dopo B4)

- Entry in `docs/claude-code-log.md` per ciascun commit, con file toccati ed esito.
- Riporta in chat: divergenze dal report di discovery, lettori residui del vecchio `tab` locale e come sono stati trattati, differenze residue col mockup non realizzabili a solo stile, punti aperti.

## 8. Riferimenti

- `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md`, Parte B: `useInterfaceMode` e riconciliazione Redux/Navbar; trappola del `tab` locale (visuale vs matching); struttura render `:216-314`; `FormSection`; caveat `ConditionalEditor.tsx:70` e pattern multi-rule `:47-49`; threading `LabelListEditor` → `LabelEntryEditor`; compartments/badges vertex-only; tre pannelli authoring per `ir.kind` (`ViewData.tsx:89-94`).
- Decisioni ratificate: `claude/sessione_2026-07-28_3.md` punto 6 (le 7 risposte) + ratifiche 2026-07-29 in chat: (a) Basic mantiene Shape/Fill/Border, mockup = riferimento visivo; (b) header ibrido, toggle nell'header, affordance conservate.
- Mockup di riferimento: screenshot "AFTER" fornito da Alfonso (card PROPERTIES con toggle in header, sezioni LINE/SIZING/LABELS, label sub-card, chip Fixed, Add label tratteggiato) + `jjodel-card-panels-mockup.html`.
