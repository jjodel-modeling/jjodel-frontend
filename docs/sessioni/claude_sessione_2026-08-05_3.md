# Sessione 2026-08-05 (3) — Property card della sintassi astratta, design system di piattaforma, slice 0

## Stato a fine sessione

Sessione di design e governance, con una sola slice di codice atterrata. Tre archi aperti, in ordine di maturita':

**Property card della sintassi astratta.** Mockup before/after prodotto sui quattro casi di selezione (metaclasse, attributo, reference, metamodello) sulla base degli screenshot del 5 agosto e della lettura di `Info.tsx`. Un solo controllo ratificato, il **segmented in rilievo**. La struttura a quattro sezioni fisse (`DEFINITION`, `CONTENTS`/`FEATURES`, `MODIFIERS`, `RUNTIME STATE`) resta proposta, non ratificata.

**Design system di piattaforma.** Deciso di estendere il design system a tutta la piattaforma con migrazione **per componente e trasversale**, fonte di verita' in una **pagina viva nel repo**. Censimento eseguito e consegnato. Perimetro fissato a tre superfici.

**Slice 0, checkbox native.** Chiusa con un commit. Il difetto era in piedi da 141 giorni.

## Decisioni prese

### Property card (2026-08-05)

- **Controllo di scelta: segmented in rilievo.** Track `slate-100`, radius 8, padding 2, gap 2; segmento radius 6, padding 4/12, font 12; scelto con fondo bianco, ombra `0 1px 2px rgba(15,23,42,.14)`, testo `slate-900` peso 600; glifo cyan solo sullo scelto; hover che alza il solo testo; focus con anello `rgba(51,65,85,.18)`. Scartate: chip outline (raccomandata dall'architetto), underline (segnale gia' preso dai tab), pillola con spunta (sposta il layout al click), solid slate (usa il colore del focus).
- **Due vincoli che nascono col segmented**: track con `flex-wrap: wrap`, `width: fit-content`, `max-width: 100%`, perche' il pannello e' ridimensionabile e senza quella regola il fondo si spezza; ultimo segmento della cardinalita' `Custom…` con i puntini, perche' apre gli stepper e non esaurisce la scelta.
- **Due pattern distinti**: segmented per la scelta esclusiva, chip token azzurre per gli insiemi multipli (oggi solo `Extends`).
- **`MODIFIERS`, non `Behavior`**: quel nome e' prenotato da R-1..R-9 per il tab State piu' Actions delle view.

### Design system (2026-08-05)

- **DS-1 Perimetro: tre superfici.** `#/allProjects`, `#/project`, le modali. Su 21 pagine del ramo autenticato **17 sono morte**. Zona congelata su cio' che l'arco tab IR sta toccando.
- **DS-2 Colore acceso: cyan `#0ea5e9`**, `CLAUDE.md` §7.1 da emendare. Zero call site da toccare contro trentuno, e sul track di un toggle il colore porta informazione.
- **DS-3 Codice morto: si rimuove**, separando le feature mai cablate (`ExportImageMenu`, `ExportImportMenu`, `ProviderSelector` ×2) che restano in attesa di una decisione di prodotto.
- **DS-5 Toggle o checkbox: decide la semantica.** Toggle per proprieta' booleane che si applicano subito; checkbox per selezione in un insieme o form con submit. `ui/Checkbox` si tiene nonostante zero call site: non e' inutile, e' mai adottata.
- **DS-6 Token: `tokens/` e' il canone**, `tokens.css` assorbito. Spacing = rename sicuro (valori coincidono, con l'avvertenza rem contro px). **Tipografia = non e' un rename**: `--text-sm` 13px contro `--font-size-sm` 12px, `--text-base` 15 contro 13. Slice separata con verifica a vista.
- **DS-7 Segmented: base `.appbar-mode-switch`**, ma semantica ARIA corretta in `role="radiogroup"` piu' `radio` e `aria-checked`. Ne' `aria-pressed` (pulsante a due stati) ne' `tablist` (navigazione fra pannelli).
- **DS-8 Vetrina: si estende `TokenPreview`** (`#/test-tokens`) montandoci `FormExample`, oggi orfano. Route `#/design-system`, nessuna voce di menu, riferimento in `CLAUDE.md`.
- **DS-9 `forEndUser/` esce dal perimetro**: la OQ-1 del censimento e' chiusa da una misura del 4 agosto, nessuna pipeline viva legge il `jsxString`.
- **DS-10 I conteggi si riproiettano prima di dimensionare**: i numeri del censimento sono su `src/` intero, che include 17 pagine morte.

### Slice 0 (2026-08-05)

- **S0-6 La slice si chiude al commit 1**, premessa caduta e non rinvio. Dettaglio in `claude/ratifiche_2026-08-05_2_slice0_checkbox.md`.
- **S0-5 Toggle acceso cyan, checkbox spuntata slate**, perche' il cyan sta dove il colore porta informazione.
- **S0-2 `NestedView.tsx:157` non si ripristina**: un controllo visibile e inerte e' peggio di uno nascosto.

## Bug risolti

- **[2026-08-05] Checkbox native non cliccabili in tutta l'app** (`3e99044d8`). `tokens/index.scss:106-112` piu' le regole di stato orfane 143-174 e il blocco commentato 115-132: 62 righe rimosse, zero aggiunte. Difetto introdotto in due tempi (`b8b00eaec` lo crea funzionante, `3979b5e1a` ne rimuove meta'), **141 giorni** in piedi.

## Bug nuovi e todo

- **[MEDIA] `style.scss:221`, seconda regola globale sugli input nativi.** Oggi lavora a favore, ed e' il motivo per cui i commit 2 e 3 non sono serviti. Stessa classe di rischio appena rimossa: va nella slice sui booleani.
- **[MEDIA, da confermare] `INHERITANCE` senza ereditarieta'.** `Extends` e' gatato su `advanced && hasDependencies`: in un metamodello che non dipende da altri modelli il campo non compare mai. Da confermare che lo screenshot fosse in modalita' Advanced.
- **[MEDIA] Stati illegali rappresentabili**: `Composition` e `Aggregation` come booleani indipendenti; idem `Abstract` e `Interface`.
- **[BASSA] Tre chiavi di localStorage sul tree view** scritte da tre file diversi: non verificato se convergano.
- **[BASSA] Diciannove override difensivi** ora ridondanti dopo `3e99044d8`.
- **[igiene] Typecheck a 33 errori in baseline.** Nessun test copre le primitive UI: zero storie, nessuna suite di rendering sotto `ui/`.
- **Da decidere (prodotto)**: cablare o ritirare export immagine, export e import, provider selector.

## Documenti prodotti

Nel knowledge base: `claude/2026-08-05_design_property_card_sintassi_astratta.md`, `claude/2026-08-05_piano_design_system_piattaforma.md`, `claude/ratifiche_2026-08-05_design_system_piattaforma.md`, `claude/ratifiche_2026-08-05_2_slice0_checkbox.md`, piu' i tre prompt.

Consegnati in chat come HTML: `mockup_property_card_v2.html` (i quattro casi piu' la spec del controllo, sostituisce la v1), `varianti_elemento_scelta.html` (otto varianti con tabella dei criteri), `chip_scelta_finale.html` (variante poi scartata).

Nel repo: `docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md`, `docs/discovery/discovery_2026-08-05_checkbox_native_visibilita.md`.

## Prompt generati per Claude Code

| Prompt | Esito |
|---|---|
| `claude/2026-08-05_prompt_discovery_censimento_primitive_ui.md` | ✅ eseguito, report consegnato |
| `claude/2026-08-05_prompt_slice0_checkbox_invisibili.md` (Fase 1) | ✅ eseguito, report consegnato. **Diagnosi poi corretta dalla verifica a video** |
| `claude/2026-08-05_prompt_slice0_fase2_checkbox.md` | ⚠️ parziale: commit 1 eseguito, commit 2 e 3 **non eseguiti per premessa caduta** |

## Prossimi passi

1. **Committare** la entry di log e i due discovery report, oggi untracked.
2. **`chore` di rimozione del codice morto** (DS-3), che riduce di un terzo tutto cio' che viene dopo.
3. **Emendamenti a `CLAUDE.md`**: §7.1 colore acceso e scala spacing, §7.2 conteggio dei residui `--accent` (dichiara uno, ne esistono trentuno in sette file), regola anti drift, riferimento alla vetrina.
4. **Segmented piu' vetrina**, insieme.
5. **Slice sui controlli booleani**, che assorbe `style.scss:221`, i diciannove override e le righe rimaste dedotte.
6. In parallelo, sul filone property card: chiudere le domande fattuali (cos'e' la barra `NODE`, se esistono `opposite` e default value, se lo screenshot era in Advanced) e ratificare o emendare la struttura a quattro sezioni.

## Info strutturali scoperte

- **Il perimetro vivo e' tre superfici.** 17 pagine su 21 morte: vuote (Templates, Explore, Archive, Community), inerti da admin (UsersInfo, ProjectsInfo, News), o senza alcun link (Settings, Updates, Profile, Notes, Recent, i banchi di prova, gli harness). Morti anche il GlobalDrawer intero, sette modali, le modalita' editor classic e split.
- **Numeri del debito**: 14 implementazioni di controllo booleano, 9 select piu' 8 combo a mano, 11 meccanismi di disclosure, 12 controlli a scelta esclusiva costruiti a mano, ~12 famiglie di header. Bottoni: 39 `ui/Button` contro 228 `.btn*` contro **631 `<button>` nudi**, 192 famiglie di classi. Quattro scale di spacing, tre vocabolari tipografici, 2 698 dichiarazioni di `font-size` su 128 valori distinti, ~5% via token. 8 633 esadecimali negli stylesheet.
- **`ui/Checkbox` ha zero call site** ed e' immune al difetto perche' rende un `<button role="checkbox">`.
- **Due sistemi di token caricati insieme**: `App.tsx:8` importa `tokens.css`, `App.scss:6` importa `tokens/index.scss`. I CSS Module di `ui/` usano il primo, la documentazione dichiara canonico il secondo.
- **Tre precedenti di vetrina**: `TokenPreview` su `#/test-tokens` (funzionante), `FormExample` (orfano), `TestLayout`. Storybook assente.
- **`Info.tsx`** e' costruito su un `builder` per tipo (`model`, `package`, `class`, `enum`, `feature`, `attribute`, `reference`, `operation`, `literal`, `object`, `value`) piu' `CollapsibleSection`, `PropertiesHeader`, `PropertiesOverview` e conformance bar sulle istanze.

## Lezione di metodo: la resa non si deduce dal CSS

Una discovery da 343 righe, accurata su tutto il resto, ha classificato otto controlli come invisibili. Erano **visibili e non cliccabili**: una seconda regola globale ne governava la resa, e di quella rimossa mordeva il `pointer-events`. L'errore e' strutturale, non di disattenzione: con la cascata, leggere le regole non basta a prevedere cosa si vede.

E' la stessa forma dell'errore del 4 agosto, quando da "registrato" si era dedotto "raggiungibile". La regola: **cio' che l'utente vede si misura guardando**, e ogni verdetto sulla resa dedotto da un file di stile e' un'ipotesi. Nei prompt futuri i verdetti sulla resa vanno marcati come da confermare a video, e il gate visivo va posto prima di ogni migrazione che ne dipenda.

Corollario sull'harness a tre attori: in due turni consecutivi l'architetto ha previsto prima che il lavoro si sarebbe ridotto, poi che l'aspetto sarebbe peggiorato, e la verifica a video ha smentito entrambe. Il gate visivo e' l'unico punto della catena in cui entra un dato che nessuno dei due agenti puo' produrre.

## Cronologia

Partenza dalla richiesta di rivedere la property card della sintassi astratta. Letto `Info.tsx` sul branch per non ragionare a memoria, poi quattro screenshot (metaclasse, attributo, reference di composizione, metamodello). Prodotto il mockup before/after con la critica punto per punto; il finding piu' serio e' `INHERITANCE` senza ereditarieta'.

Il segmented proposto per Kind e' stato bocciato a vista: il segmento scelto era bianco su bianco con un anello azzurro, cioe' il linguaggio del focus. Prodotte quattro varianti, poi otto, provate ciascuna su tre e su cinque opzioni. L'architetto ha raccomandato le chip outline; Alfonso ha scelto il segmented in rilievo. Consegnato il mockup v2 con la spec del controllo e il caso del pannello stretto.

Da li' la richiesta di estendere il design system a tutta la piattaforma. Fissata la strategia per componente, la vetrina viva come fonte di verita', e il perimetro su delega. Scritto il prompt di censimento, che ha restituito numeri molto peggiori delle attese e ha scoperto un difetto di prodotto: le checkbox native bloccate da una regola globale.

Slice 0 in due fasi. La Fase 1 ha datato il difetto (141 giorni, due commit, una rimozione parziale) e ha escluso che qualcuno dipendesse dalla regola. La Fase 2 e' stata ristrutturata in tre commit con verifica in mezzo. Il commit 1 ha rimosso 62 righe; la verifica a video ha mostrato che la diagnosi di partenza era sbagliata, e la slice si e' chiusa li'.
