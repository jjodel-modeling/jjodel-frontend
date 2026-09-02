# 2026-08-28 20:10 — Il divider tree/properties: design "grip pill"

Corsia veloce (RC-3): quattro file di sorgente, nessuno nella critical zone.

## Richiesta (verbatim)

> Nel frontend Jjodel c'è un divider orizzontale trascinabile tra la tree view e il pannello
> properties nel rail destro dell'editor. Attualmente è una semplice linea. Ristilalo e migliora
> l'interazione secondo questa spec (design "grip pill", già approvato):
>
> **Struttura**
> - Un elemento divider con hit area di 8–10px di altezza (più grande del visuale), `cursor: row-resize`.
> - Visuale a riposo: hairline 1px `#e2e8f0` (token border) attraversata al centro da una "grip pill"
>   36×4px, `border-radius: 9999px`, colore `#cbd5e1` (slate-300).
>
> **Stati**
> - **Hover**: pill si allarga a 48px e scurisce a `#94a3b8`; hairline diventa `#cbd5e1`; sfondo riga
>   `#f8fafc`. Transizione 150ms ease-out (curva di sistema `cubic-bezier(0,0,0.2,1)`).
> - **Dragging**: hairline diventa 2px ciano `#06b6d4` con glow `box-shadow: 0 0 0 3px rgba(6,182,212,0.14)`;
>   pill `#0891b2`. Mostrare un chip readout con l'altezza corrente del pannello, allineato a destra e
>   centrato verticalmente sulla linea: IBM Plex Mono 10px, bg `#0f172a`, testo bianco, padding 3px 7px,
>   radius 4px, formato `h 296`.
> - Il ciano appare SOLO nello stato attivo di drag, coerente con la selezione canvas (è l'accent
>   riservato al canvas nel design system).
>
> **Comportamento**
> - Drag verticale ridimensiona i due pannelli; clamp a min/max ragionevoli (es. min 120px per pannello).
> - **Double-click** sulla pill = reset all'altezza di default.
> - Persistere l'altezza scelta (localStorage o preferenza utente esistente).
> - Niente tooltip nativo del browser (`title`). Se serve un hint, chip custom dopo ~600ms di hover.
> - Accessibilità: `role="separator"`, `aria-orientation="horizontal"`, `aria-valuenow/min/max`,
>   focusabile con frecce ↑/↓ (step 8px) per resize da tastiera; focus ring di sistema
>   `0 0 0 3px var(--color-accent-subtle)`.
>
> **Vincoli**
> - Usa i token SCSS esistenti in `src/styles/tokens/` (slate scale, transitions, radius) invece degli
>   hex letterali dove esiste il token corrispondente.
> - Riusa il componente/pattern splitter esistente se presente; altrimenti crea un componente riusabile
>   che funzioni anche in orientamento verticale (stessa grafica ruotata) per futuri splitter
>   palette/canvas.
> - Nessuna nuova dipendenza.
>
> Riferimento visivo: artboard 8a (stati default/hover/dragging) in `Jjodel Form Views.dc.html` nel
> pacchetto di handoff.

## Riferimento citato e non trovato (RC-10)

`docs/design/design_handoff_jjodel_form_views/Jjodel Form Views.dc.html` esiste, ma **non contiene
l'artboard 8a**: gli artboard del file sono `1a/1b, 2a, 3a, 4a, 5a, 6a/6b, 7a` e si fermano lì.
Verificato con controllo positivo — `grep -rloE 'id="8a"' docs` è vuoto mentre `id="7a"` restituisce
il file — e su tutti i `*.dc.html` del repo. Dichiarato e proseguito sul resto: la spec sopra è
completa e autosufficiente, quindi nessuna decisione poggiava solo su quel documento.

## Scostamenti dalla spec, dichiarati

1. **Glow del drag**: `rgba(6,182,212,0.14)` non ha token. Usato `--color-canvas-accent-subtle`
   (0.10 chiaro / 0.15 scuro), che è il ruolo semantico "tinta d'accento" e segue il tema — il
   vincolo sui token lo chiede esplicitamente. Differenza non percepibile.
2. **Sfondo riga hover**: `#f8fafc` scritto come `var(--color-slate-50)` e non `--color-bg-primary`.
   Misurato: `--color-bg-primary` è uno dei nomi che il layer primitivo (`tokens.css`) e quello
   semantico dichiarano ancora entrambi (D-UI-13) e qui risolve a `#ffffff`. È lo stesso schema che
   `.rail-focusbar` usa già, con la metà scura riscritta a parte.
3. **Componente**: riusato `components/ResizeHandle/`, che esisteva ed era montato solo dal proprio
   file di esempio. Esteso con props opzionali (valore, bounds, resize da tastiera, readout, hint):
   nessuna prop esistente cambiata, nessun identificatore rinominato. La classe
   `.tree-view-panel-vsplit` resta sull'elemento, così il selettore `:has(+ .tree-view-panel-vsplit)`
   che spegne il bordo del pannello albero continua a valere.

---

## Seguito — 2026-08-28 20:20

Tre istruzioni, nella stessa sessione. Restano in questo documento invece di aprirne uno nuovo
perché il file non era ancora committato e il commit è stato chiesto scoped su sei file: la storia
del divider sta in un documento solo.

> Il riferimento visivo ora esiste: Jjodel Form Views.dc.html nel pacchetto handoff è aggiornato e
> contiene gli artboard 8a–8d — se vuoi, riverifica RC-10.
>
> Focus ring: sostituisci l'anello a 0.06 con la regola di sistema :focus-visible — outline: 2px
> solid #475569; outline-offset: 2px (o --color-border-focus se esiste). Niente ciano: resta
> riservato a drag/selezione canvas.
>
> Procedi con il commit scoped sui 6 file.

### 1. RC-10 riverificato: gli artboard 8a–8d non sono nel repo

`docs/design/design_handoff_jjodel_form_views/Jjodel Form Views.dc.html` è fermo al **26 ago 20:15**,
106838 byte, gli stessi di ieri. Gli artboard restano `1a/1b, 2a, 3a, 4a, 5a, 6a/6b, 7a`.
`grep -rloE 'id="8[a-d]"' docs` trova solo **questo** documento, che quella stringa la cita; controllo
positivo su `id="7a"` che trova il handoff, quindi la ricerca gira. Nessun `.dc.html` del repo è stato
toccato oggi tranne i quattro di `design_handoff_instance_node/` (18:56), e in `~/Downloads` e sul
Desktop non c'è nessun bundle nuovo. L'aggiornamento esiste altrove ma non è atterrato qui: sotto
RC-4/RC-9 non vincola, e il divider resta costruito sulla spec scritta, che era autosufficiente.

### 2. Focus ring: `--color-border-focus` esiste ed è ciano nel tema scuro

Il token esiste, quindi la parentesi del prompt lo eleggerebbe. **Misurato sull'app in esecuzione**,
però, risolve così:

| stato del tema | `--color-border-focus` |
|---|---|
| `data-theme="light"` esplicito | `#64748b` (slate-500) |
| `data-theme="dark"` | `#06b6d4` — **ciano** |

Causa: lo dichiarano in due, entrambi su `:root` — `styles/tokens.css:122` a `#06b6d4` e
`styles/tokens/_colors-light.scss:93` a `$slate-500`. Il secondo sta nel selettore
`:root, :root[data-theme="light"]`, e solo il ramo con l'attributo ha la specificità per vincere: fuori
dal chiaro esplicito resta il ciano di `tokens.css`. È un caso di D-UI-13 con una conseguenza visibile.

Fra i due vincoli del prompt — usa il token, niente ciano — il secondo è assoluto, quindi:
`outline: 2px solid var(--color-slate-600)`, che misura `#475569`, cioè esattamente il grado chiesto,
e non cambia col tema. Nella metà scura l'anello sale a `--color-slate-400`, perché slate-600 su
`#1e293b` sparisce dentro il pannello — è lo stesso trattamento che il foglio applica già alla pill.
`outline-offset: 2px` come chiesto; `box-shadow` sul focus rimosso, misurato a `none`.

**Ricaduta fuori perimetro, non toccata**: gli altri sei usi di `var(--color-border-focus)`
(`Toast/toast.scss`, `properties-with-tree-view.scss:1713`, `TreeViewSidebar/tree-view-sidebar.scss`,
`import/ImportSummaryModal.scss`) disegnano oggi un anello di focus **ciano** in scuro. È un difetto
del layer dei token, non del divider, e va chiuso lì.

### 3. La variante verticale, sullo splitter rail/canvas

> Approvata anche la variante verticale (artboard 8e nel mockup aggiornato). È il ResizeHandle che
> hai già fatto, ruotato, con una differenza: la pill è hover-reveal — a riposo solo la hairline 1px
> (il divider verticale è lungo e sempre visibile, deve pesare zero). Hover: pill 4×48px #94a3b8,
> strip #f8fafc, cursor: col-resize. Drag: linea 2px ciano + glow, pill #0891b2, readout larghezza
> (es. w 312) centrato sul divider vicino al bordo inferiore. Frecce ←/→, aria-orientation="vertical".
> Applicala allo splitter rail/canvas.

Anche l'artboard 8e non è nel repo: il `.dc.html` è sempre quello del 26 ago 20:15, e la ricerca di
`id="8e"` è vuota con lo stesso controllo positivo di sopra. La spec scritta basta e si è proceduto
su quella.

Bersaglio: `.properties-panel-resize-handle`, il bordo sinistro della colonna rail, che governa
`overlayWidth` in floating e `propsWidth` in tab mode — due coppie di bound e due chiavi di storage,
scelte dal `mode`.

Tre scostamenti, tutti dovuti alla geometria del bersaglio e tutti misurati:

1. **La striscia resta 6px, non 10.** Il commento sul blocco esistente dice perché: allargarla verso
   sinistra le farebbe pescare l'`ew-resize` del `.dock-divider` di rc-dock adiacente. La hit-zone
   non cresce; il selettore in `properties-with-tree-view.scss` è doppiato
   (`.properties-panel-resize-handle.resize-handle`, 0,2,0) così vince su `.resize-handle--vertical`
   senza dipendere dall'ordine dei fogli nel bundle.
2. **La hairline è ancorata a `left: 0`, non centrata sulla striscia.** La cucitura è il `border-left`
   della colonna: una linea al centro di una striscia che non può stare a cavallo della cucitura ne
   disegnerebbe due. La pill resta centrata nella striscia, quindi appoggiata alla linea invece che a
   cavallo — a 6px la differenza è 1px.
3. **Il readout non è centrato sul divider ma spostato dentro la colonna.** Misurato: il rail ha
   `overflow: hidden`, quindi un chip centrato su un divider a x=0 perde la metà sinistra. Il
   componente condiviso resta centrato — è giusto per uno splitter verticale senza antenato che
   taglia — e l'override sta nel foglio del rail. Verificato che non venga tagliato.

Nel componente condiviso la variante verticale ora ha la pill a `opacity: 0` a riposo e 4×48 sempre,
rivelata su hover / focus-visible / drag; il chip scende in fondo (`bottom: var(--space-3)`). La
variante orizzontale non cambia di un pixel — la sonda la rimisura tutta a ogni giro.
