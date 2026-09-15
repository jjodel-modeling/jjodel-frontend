# Commit B4 (one-shot) — Skin del mockup sulla card Properties, valori esatti

**Sostituisce integralmente la sezione 5 del prompt "Fase 2B v2" E la "spec estesa D1-D7".** Questo è l'unico riferimento per B4.
**Tipo:** solo stile + markup locale (aggiunta di classi hook e rimozione di icone inline dove indicato). UN commit.
**Data prompt:** 2026-07-30
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** high
**Precondizione:** B1, B2, B3 committati. Working tree con possibile WIP TextStyle: **mai `git add .`**.

> I valori qui sotto NON sono indicativi: sono esatti, estratti da una replica HTML del mockup approvata da Alfonso. Il tuo lavoro è mappatura, non interpretazione: individua l'elemento reale nel DOM della card, applica la regola corrispondente con questi valori, scoped alla card. Dove il DOM non ha un hook, aggiungi una classe (grep di collisione prima). Nessun cambio di logica, props, stato o gerarchia dati.

## 0. Vincoli

- Leggi `CLAUDE.md`. Niente critical-zone (`EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`).
- Tutto **scoped sotto la classe radice della card Properties** (individuala nel DOM reale: è la card dentro l'overlay floating). MAI toccare stili globali di form/checkbox/bottoni, MAI classi rc-dock, MAI rinominare classi esistenti.
- La coerenza si estende a Edge/Row dove condividono componenti dentro la card: voluto, purché sia solo stile.
- Le affordance esistenti restano TUTTE: freccia indietro, occhio, aiuto, pin, collapse, toggle B2, frecce su/giù e cestino delle label.
- Se un punto richiede più che stile+markup locale: NON farlo, elencalo come differenza residua.

## 1. Token (da portare in SCSS come variabili o valori diretti, scoped)

```scss
// palette
$pc-card-border:   #dbeafe;   $pc-card-radius: 16px;
$pc-card-shadow:   0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.05);
$pc-slate-800:#1e293b; $pc-slate-700:#334155; $pc-slate-600:#475569;
$pc-slate-500:#64748b; $pc-slate-400:#94a3b8; $pc-slate-300:#cbd5e1;
$pc-slate-200:#e2e8f0; $pc-slate-100:#f1f5f9; $pc-slate-50:#f8fafc;
$pc-accent:#0ea5e9;          // underline tab attivo, Add label
$pc-accent-strong:#0284c7;   // testo chip VIEW, testo tab attivo
$pc-accent-soft:#e0f2fe;     // sfondo chip VIEW
$pc-check:#3b82f6;           // checkbox checked, dot sub-card
// raggi
$pc-radius-input:12px; $pc-radius-chip:8px; $pc-radius-ghost:10px;
$pc-radius-check:6px;  $pc-radius-subcard:12px;
// tipografia (px)
$pc-fs-title:13; $pc-fs-section:12; $pc-fs-field:14; $pc-fs-input:15;
$pc-fs-hint:13;  $pc-fs-chip:11;    $pc-fs-tab:14;
// spaziatura
$pc-gap-section:24px; $pc-gap-in-section:12px; $pc-hint-indent:32px; // 20px checkbox + 12px gap
```

## 2. Regole per elemento (CSS di riferimento, da adattare ai selettori reali)

**Header riga 1** (titolo + segmented B2): titolo `PROPERTIES` 13px, weight 600, letter-spacing .08em, uppercase, colore `#475569`. Segmented: track `#f1f5f9`, radius 10px, padding 3px; bottone 13px weight 600, inattivo `#94a3b8`, attivo su pillola bianca radius 8px con `box-shadow: 0 1px 2px rgba(15,23,42,.10)` e testo `#1e293b`. Riga chiusa da `border-bottom: 1px solid #f1f5f9`.

**Breadcrumb**: contesto ("State Machine") 15px `#64748b` **case normale** (se oggi è maiuscolo via `text-transform`, portalo a `none`; se è maiuscolo nel dato, trasformalo solo visivamente); separatore `›` `#cbd5e1`; corrente ("View for State") 15px weight 700 `#1e293b`. Chip VIEW: sfondo `#e0f2fe`, testo `#0284c7`, 11px weight 700, letter-spacing .06em, uppercase, padding 4px 10px, radius 8px, spinta a destra. Freccia/occhio/aiuto restano, alleggeriti se serve (icona `#64748b`, niente bordi pesanti). Riga chiusa da `border-bottom: 1px solid #f1f5f9`.

**Tab bar**: tab 14px `#64748b`, padding 12px 10px, `border-bottom: 2px solid transparent`; attiva: `#0284c7`, weight 600, `border-bottom-color: #0ea5e9`. Barra chiusa da `border-bottom: 1px solid #f1f5f9`.

**Corpo**: gap 24px tra sezioni, 12px dentro la sezione, padding orizzontale 20px.

**Titoli sezione** (FormSection): 12px, weight 700, letter-spacing .07em, uppercase, `#64748b`. Se FormSection oggi disegna una hairline sotto il titolo, rimuovila SOLO dentro la card (nel mockup le sezioni sono separate dal solo spazio).

**Label dei campi**: 14px `#64748b`. **Input/select**: 15px `#1e293b`, bordo `1px solid #e2e8f0`, radius 12px, padding 11px 14px, sfondo bianco. **Stepper** (− 1 +): contenitore bordo `#e2e8f0` radius 12px; bottoni 38px larghi, testo `#94a3b8`; valore 15px weight 600 `#1e293b`, min-width 42px centrato.

**Checkbox** (tutte, dentro la card): 20×20px, radius 6px, bordo `2px solid #cbd5e1`, sfondo bianco; checked: sfondo `#3b82f6`, bordo idem, spunta bianca. NIENTE slate scuro.

**Hint** (es. sotto Resizable): **rimuovere l'icona (i)** dal markup nel contesto card; testo 13px, line-height 1.5, `#94a3b8`, `margin-left: 32px` (allineato alla label, non al bordo sezione), `max-width: 290px` (va a capo, niente riga unica).

**Bottone secondario** ("Propagate size"): **rimuovere l'icona expand** dal markup nel contesto card; ghost: 14px `#94a3b8`, bordo `1px solid #e2e8f0`, radius 10px, padding 8px 16px, sfondo bianco, `margin-left: 32px` (colonna del contenuto); hover: testo `#475569`, bordo `#cbd5e1`.

**Label sub-card** (ogni entry della lista label): contenitore sfondo `#f8fafc`, bordo `1px solid #e2e8f0`, radius 12px. Header: padding 13px 16px, `border-bottom: 1px solid #e2e8f0`; dot 8px tondo `#3b82f6`; titolo 15px weight 700 `#334155`; controlli su/giù/cestino a destra come icon button ghost 26×26, bordo `#e2e8f0`, radius 7px, icona `#94a3b8`. Body: padding 16px, gap 12px. **Divider tratteggiato** tra blocco campi e blocco visibilità: `border-top: 1.5px dashed #cbd5e1`.

**Chip Fixed** (B3 e Visibility in Basic): sfondo bianco, bordo `1px solid #e2e8f0`, `box-shadow: 0 1px 2px rgba(15,23,42,.05)`, testo 13px weight 700 `#1e293b`, padding 7px 16px, radius 10px, self-start.

**Add label**: full-width, `border: 1.5px dashed #cbd5e1`, radius 12px, padding 13px, testo 15px weight 500 `#0ea5e9`, sfondo trasparente; hover: bordo `#0ea5e9`, sfondo `#e0f2fe`.

## 3. Dove mettere il codice

- SCSS nel file già proprietario degli stili della card/pannello (rispetta la struttura esistente); un blocco unico commentato `// B4: mockup skin (valori dalla replica approvata)`, scoped alla radice della card.
- Classi hook nuove: nomi coerenti con le convenzioni del file, `grep -r` di collisione prima di ognuna.
- Rimozioni icone (hint, Propagate size): edit puntuali nel JSX del componente, condizionate al contesto card SOLO se quei componenti sono usati anche fuori dalla card (verificalo con grep; se sono esclusivi della card, rimozione secca).

## 4. Verifica

- `npm run build` verde; `npm run typecheck` a baseline (Δ0).
- Side-by-side con la replica approvata (`properties-card-mockup-replica.html`, Alfonso ce l'ha aperta) su un vertex con almeno 2 label, in Basic e Advanced.
- Funzioni tutte vive: back, occhio, aiuto, pin, collapse, toggle, resize/accordion overlay, su/giù/cestino, Add label.
- Edge e Row: funzionanti, nessuna regressione.

## 5. Chiusura

- Entry in `docs/claude-code-log.md` (tipo `style`): delta applicati, differenze residue (se un punto richiedeva più che stile), classi hook aggiunte.
- `git add` per path espliciti. Commit: `style(panels): apply mockup skin to properties card`.
- **Hard stop**: verifica visiva di Alfonso contro la replica.
