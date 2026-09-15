# Commit B4 — Allineamento estetico al mockup: SPEC ESTESA

**Sostituisce integralmente la sezione 5 del prompt "Fase 2B v2".** Tutto il resto del prompt (vincoli §0, semantica §1, "Cosa NON fare" §6, chiusura §7) resta valido.
**Tipo:** solo CSS + markup locale. Un commit.
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Precondizione:** B1, B2, B3 committati e verificati.

> B4 ha un bersaglio misurabile: il mockup ratificato. Questa spec elenca i delta elemento per elemento. Regola generale: ogni override è **scoped alla card Properties** (sotto la classe radice della card/pannello), mai su stili globali di form, bottoni o checkbox. Prima di ogni classe nuova: grep di collisione. Nessun cambio di logica, props o gerarchia dati. Le funzioni esistenti si conservano tutte.

## D1. Header della card

- Breadcrumb: contesto in case normale ("State Machine", non "STATE MACHINE"), separatore `›` leggero, nome corrente ("View for State") più scuro e semibold. Font coerente coi token (11-12px).
- Chip VIEW: pillola azzurra tenue (sfondo azzurro chiarissimo, testo accent, maiuscolo 10-11px, radius pieno), non grigia.
- Freccia indietro, occhio, aiuto: SI CONSERVANO (ratifica header ibrido), eventualmente alleggeriti (icona slate-500, niente bordi pesanti).
- Titolo PROPERTIES e toggle Basic/Advanced: già a posto da B2, non toccare la logica; solo rifiniture di spaziatura se necessarie.

## D2. Checkbox (scoped alla card)

- Riferimento mockup: quadrato ~18px, angoli arrotondati (radius 4-5px), bordo sottile slate chiaro da spento; da acceso riempimento **blu accent** con spunta bianca (come la checkbox "Visible" del mockup), NON slate scuro.
- Vale per tutte le checkbox dentro la card (Resizable, Editable inline, Visible, ecc.), via selettore scoped. Nessun cambio agli stili checkbox globali fuori dalla card.

## D3. Hint / testo di aiuto sotto i campi (es. sotto Resizable)

- Rimuovere l'icona `(i)` nel contesto della card.
- Indentazione: il testo si allinea all'inizio della label del campo (hanging indent = larghezza checkbox + gap), non al bordo sezione.
- Colore più tenue (slate-400/500), 11-12px, misura più stretta con wrapping naturale (max-width, non riga unica a tutta larghezza).

## D4. Bottoni secondari (es. "Propagate size")

- Stile ghost: bordo sottile chiaro, testo slate-500, radius ~8px, padding compatto; **senza icona** (via l'icona expand).
- Indentato con la colonna del contenuto del campo (stesso allineamento dell'hint), non al bordo sezione.
- Stato disabled visivamente muto (testo e bordo più chiari), se il bottone ha uno stato disabled.

## D5. Sezione LABELS

- Ogni label entry come **sub-card**: sfondo grigio chiarissimo, bordo sottile, radius ~8px, padding interno coerente con la griglia 8px.
- Header della sub-card: dot colorato + "Label #1" semibold. I controlli esistenti (su/giù/cestino) SI CONSERVANO ma alleggeriti: icon button ghost piccoli, allineati a destra nell'header della sub-card.
- Separatore interno leggero (tratteggiato come nel mockup) tra il blocco campi e il blocco visibilità.
- Bottone "Add label": full-width, bordo tratteggiato, testo accent, in fondo alla sezione.

## D6. Chip del valore conditional (B3)

- Allinearlo al chip "Fixed" del mockup: pillola compatta, sfondo chiaro, testo semibold piccolo. Se B3 l'ha già reso così, nessun ritocco.

## D7. Ritmo verticale

- Spaziatura tra sezioni e dentro le sezioni sulla griglia 8px, con l'aria del mockup (respiro tra titolo sezione e primo campo, tra campo e campo). Nessun layout shift al cambio di modalità o di tab: dimensioni stabili.

## Vincoli ribaditi

- Solo stile e markup locale alla card. Se un delta richiede più che stile (componenti nuovi, cambi di logica), NON farlo: elencalo nella risposta come differenza residua.
- Classi esistenti mai rinominate; classi rc-dock e stili globali intoccati; ogni override scoped alla radice della card.
- La coerenza visiva si estende naturalmente a Edge e Row dove condividono i componenti dentro la card (checkbox, hint, bottoni): è voluto, purché sia SOLO stile.
- Mai `git add .` (WIP TextStyle nel working tree).

## Verifica

- Build verde, typecheck Δ0.
- Side-by-side con gli screenshot del mockup su un vertex con almeno 2 label, in Basic e in Advanced: header (breadcrumb + chip), checkbox spente e accese, hint di Resizable, Propagate size, sub-card label, Add label.
- Tutte le funzioni ancora operative: back, occhio, aiuto, pin, collapse, toggle, su/giù/cestino delle label.
- Edge e Row: funzionanti e visivamente coerenti.

## Chiusura

- Entry in `docs/claude-code-log.md` (tipo `style`), con l'elenco dei delta applicati e delle differenze residue.
- `git add` per path espliciti. Commit: `style(panels): align properties card with mockup (header, checkboxes, hints, label cards)`.
- **Hard stop**: verifica visiva di Alfonso col mockup alla mano.
