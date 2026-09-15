# Jjodel Design System — Cheat Sheet per Claude Code

> Documento di riferimento unico per tutte le decisioni di stile.
> Leggere PRIMA di modificare qualsiasi componente UI.
> Ultima revisione: 2026-04-01

---

## 1. Typography

### Font Families

```scss
--font-sans: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'IBM Plex Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
```

### Scala Tipografica

| Token | Size | Weight | Line-height | Uso |
|-------|------|--------|-------------|-----|
| `text-3xl` | 24px | 700 | 1.2 | Titoli pagina (dashboard, settings) |
| `text-2xl` | 20px | 600 | 1.3 | Titoli sezione principali |
| `text-xl` | 18px | 600 | 1.4 | Headings pannello |
| `text-lg` | 16px | 600 | 1.5 | Subheadings, nome nel header del pannello |
| `text-md` | 14px | 400-500 | 1.5 | Testo UI default, valori input |
| `text-base` | 13px | 400-500 | 1.5 | Body text, label di campo, testo input |
| `text-sm` | 12px | 400-500 | 1.4 | Section headers, captions, helper text |
| `text-xs` | 11px | 400-600 | 1.4 | Badges, timestamps, etichette secondarie |
| `text-2xs` | 10px | 500-600 | 1.3 | Badge uppercase, stat pills, type indicators |

### Font Weights

| Token | Weight | Uso |
|-------|--------|-----|
| `font-normal` | 400 | Body text, valori, descrizioni |
| `font-medium` | 500 | Label di campo, bottoni, tab, nomi tree |
| `font-semibold` | 600 | Headings, section headers, nome pannello |
| `font-bold` | 700 | Strong emphasis, titoli pagina |

### Regole Tipografiche

- **Label di campo** (Name, Type, etc.): 13px / weight 500 / color `text-secondary`
- **Valori input**: 13-14px / weight 400 / color `text-primary`
- **Section header** (VIEWPOINT PROPERTIES, ACTIONS): 11-12px / weight 600 / uppercase / letter-spacing 0.03em / color `text-tertiary`
- **Tab attivo**: 13px / weight 500-600 / color `text-primary` / border-bottom 2px accent
- **Tab inattivo**: 13px / weight 400 / color `text-tertiary`
- **Breadcrumb path**: 12-13px / weight 400 / color `text-secondary`
- **Breadcrumb ultimo elemento**: weight 500 / color `text-primary`
- **Placeholder text**: stessa size dell'input / weight 400 / color `text-muted`
- **Helper/hint text**: 12px / weight 400 / color `text-tertiary`
- **Error text**: 12px / weight 400 / color `color-error`

---

## 2. Colori

### Testo

| Token | Hex | Uso |
|-------|-----|-----|
| `text-primary` | `#111418` o `#1e293b` | Testo principale, valori, headings |
| `text-secondary` | `#334155` | Testo secondario, label di campo |
| `text-tertiary` | `#6B7280` o `#64748b` | Testo terziario, placeholder, caption |
| `text-muted` | `#9CA3AF` o `#94a3b8` | Testo disabilitato, hint |
| `text-inverse` | `#ffffff` | Testo su sfondo scuro |

### Sfondi

| Token | Hex | Uso |
|-------|-----|-----|
| `bg-primary` | `#ffffff` | Sfondo principale, card, pannelli |
| `bg-secondary` | `#f8fafc` | Sfondo alternato, toolbar, header leggeri |
| `bg-tertiary` | `#f1f5f9` | Sfondo hover, sfondo sezioni collassate |
| `bg-input` | `#ffffff` | Sfondo input field |

### Bordi

| Token | Hex | Uso |
|-------|-----|-----|
| `border-default` | `#e2e8f0` | Bordo standard (input, card, divider) |
| `border-hover` | `#cbd5e1` | Bordo su hover |
| `border-focus` | `#334155` | Bordo su focus |
| `border-light` | `#f0f1f2` | Bordo sottile (0.5px), separatori leggeri |

### Accent

| Token | Hex | Uso |
|-------|-----|-----|
| `accent-cyan` | `#0ea5e9` | Toggle ON, focus ring, link, highlight |
| `accent-cyan-light` | `#e0f2fe` | Badge background tipo |
| `accent-cyan-hover` | `#0284c7` | Hover su elementi accent |
| `accent-slate` | `#475569` | Bottoni primary gradient start |
| `accent-slate-dark` | `#334155` | Bottoni primary gradient end, focus |

### Semantici

| Token | Hex | Uso |
|-------|-----|-----|
| `color-success` | `#10b981` | Conferma, versione, online |
| `color-warning` | `#f59e0b` | Warning, attenzione |
| `color-error` | `#ef4444` / `#dc2626` | Errore, danger, required asterisk |
| `color-info` | `#3b82f6` | Info, suggerimento |

---

## 3. Spacing

### Griglia base: 8px (con eccezioni a 4px e 12px)

| Token | Valore | Uso |
|-------|--------|-----|
| `space-1` | 4px | Gap minimo, padding badge, spacing inline |
| `space-2` | 8px | Gap label→input, padding interno piccolo |
| `space-3` | 12px | Padding medio, gap tra sotto-elementi |
| `space-4` | 16px | Padding container, gap tra campi form |
| `space-5` | 20px | Gap tra campi form (alternativo) |
| `space-6` | 24px | Gap tra sezioni |
| `space-8` | 32px | Gap tra macro-sezioni |

### Regole di Spacing

| Relazione | Valore |
|-----------|--------|
| Label → input (sotto) | 6-8px |
| Tra campi nello stesso gruppo | 16-20px |
| Tra sezioni/gruppi | 24-32px |
| Padding contenitore pannello | 16px |
| Padding interno card/box | 12-16px |
| Padding bottoni | 8px 12px (sm), 8px 16px (md) |
| Padding badge | 2px 8px |
| Padding tab | 8px 16px |

---

## 4. Border Radius

| Elemento | Radius |
|----------|--------|
| Input, select, textarea | 6px |
| Bottoni | 6px |
| Badge | 4-7px (piccoli), 6px (medi) |
| Card / panel | 8px |
| Modal | 12px |
| Toggle switch | height/2 (pill) |
| Stat pills | 4px |
| Avatar / icone circolari | 50% |

---

## 5. Shadows

| Tipo | Valore | Uso |
|------|--------|-----|
| Nessuna | — | Default per la maggior parte degli elementi |
| Hover card | `0 4px 12px rgba(0,0,0,0.06)` | Card hover |
| Dropdown | `0 4px 16px rgba(0,0,0,0.12)` | Menu aperti, popover |
| Modal | `0 8px 32px rgba(0,0,0,0.15)` | Modal overlay |
| Focus | `0 0 0 2px #334155, 0 0 0 4px rgba(51,65,85,0.3)` | Focus ring |

No ombre decorative. Solo funzionali (elevazione, focus).

---

## 6. Pattern Componenti

### 6.1 Form Field (layout verticale — STANDARD)

```
LABEL ·                         ← 13px, weight 500, text-secondary
┌─────────────────────────────┐
│ Valore                      │  ← 13-14px, weight 400, height 36-40px
└─────────────────────────────┘
ⓘ Testo di aiuto               ← 12px, weight 400, text-tertiary, gap-top 4px
```

- Label sopra, input sotto (MAI affiancati nei pannelli)
- Gap label→input: 6px
- Gap tra campi: 16-20px
- Required: asterisco rosso `*` dopo il label
- Error: testo rosso sotto l'input, sostituisce l'helper

### 6.2 Toggle Row

```
┌───────────────────────────────────────────────────┐
│ Label toggle                              [○━━━]  │  ← 14px / 500
│ Descrizione opzionale                             │  ← 12px / 400 / text-tertiary
└───────────────────────────────────────────────────┘
```

- Flex row, justify-content: space-between
- Toggle a destra, testo a sinistra
- Toggle: 36×20px, thumb 16px, bg OFF `#cbd5e1`, bg ON `#0ea5e9`
- MAI checkbox nativi — sempre toggle switch personalizzato

### 6.3 Section Header

```
NOME SEZIONE                    ← 11-12px, weight 600, uppercase
                                  letter-spacing 0.03em, color text-tertiary
─────────────────────────────── ← border-bottom opzionale, 0.5px, border-light
```

- Uppercase sempre
- Nessun sfondo
- Margine sopra: 24px (eccetto primo)
- Margine sotto: 12px

### 6.4 Tab Bar

```
[Tab attivo]  Tab inattivo  Tab inattivo
━━━━━━━━━━━
```

- Tab attivo: weight 500-600, color text-primary, border-bottom 2px accent (cyan o slate)
- Tab inattivo: weight 400, color text-tertiary
- Font size: 13px
- Padding tab: 8px 16px
- Gap tra tab: 0 (contigui)
- Nessun background sui tab
- Border-bottom 1px border-default sulla tab bar intera

### 6.5 Breadcrumb

```
← Parent  >  Child  >  Current  [BADGE]
```

- Freccia back: icona `bi-arrow-left`, cliccabile
- Separatore: `>` o `bi-chevron-right`, color text-muted
- Segmenti: 12-13px, weight 400, color text-secondary, cliccabili (hover underline)
- Ultimo segmento: weight 500, color text-primary, non cliccabile
- Badge tipo: inline dopo l'ultimo segmento (vedi 6.7)

### 6.6 Bottoni

**Primary** (azioni principali):
```scss
background: linear-gradient(135deg, #64748b, #475569);
color: white;
border: none;
border-radius: 6px;
padding: 8px 16px;
font-size: 13px;
font-weight: 500;
```

**Secondary** (azioni secondarie):
```scss
background: transparent;
border: 1px solid #e2e8f0;
color: #334155;
// hover: background #f8fafc
```

**Ghost** (azioni terziarie, toolbar):
```scss
background: transparent;
border: none;
color: #64748b;
padding: 6px 8px;
// hover: background rgba(71, 85, 105, 0.08)
```

**Danger** (azioni distruttive):
```scss
background: transparent;
border: 1px solid #fecaca;
color: #dc2626;
```

### 6.7 Badge

Quattro categorie semantiche:

| Categoria | Stile | Esempio |
|-----------|-------|---------|
| **Tipo** (cos'è) | Filled light, uppercase, 10px, weight 600 | `CLASS`, `VIEW`, `VP` |
| **Stato** (in che condizione) | Outline, 10px, weight 500 | `READ-ONLY`, `PRIVATE` |
| **Versione** | Filled accent, 10px, weight 500 | `v2.206`, `Rev 1.0` |
| **Contesto** | Filled muted, 10px, weight 500 | `metamodel_1` |

Colori badge tipo:
- VIEW → slate (`rgba(71,85,105,0.1)` / `#475569`)
- VIEWPOINT → violet (`rgba(139,92,246,0.1)` / `#8b5cf6`)
- CLASS → cyan (`#e0f2fe` / `#0284c7`)

### 6.8 Empty State

```
     [icona 24-32px, color text-muted]

     Messaggio descrittivo
     ← 13px, text-tertiary, text-align center

     [Bottone azione opzionale]
```

### 6.9 List Item (selezionabile)

```
┌───────────────────────────────────────┐
│ [icona]  Nome item                    │  ← 13px, weight 400
│          Descrizione opzionale        │  ← 12px, text-tertiary
└───────────────────────────────────────┘
```

- Hover: background `#f8fafc`
- Selezionato: background `#e0f2fe`, border-left o border 1px `#0ea5e9`
- Padding: 8px 12px
- Border-radius: 6px
- Gap tra icona e testo: 8px

---

## 7. Icone

- **Libreria**: Bootstrap Icons ESCLUSIVAMENTE. Mai Font Awesome, Material, Heroicons.
- **Size standard**: 14-16px nel testo, 16-18px nei bottoni, 20px in toolbar
- **Colore**: eredita dal testo (currentColor) tranne usi semantici

---

## 8. Input e Form Elements

### Dimensioni Input

| Size | Height | Font | Padding | Uso |
|------|--------|------|---------|-----|
| `sm` | 32px | 12px | 6px 10px | Inline, compact |
| `md` | 36-40px | 13px | 8px 12px | Default pannelli |
| `lg` | 44-48px | 14px | 10px 14px | Fullscreen, modale |

### Stati Input

| Stato | Bordo | Sfondo | Altro |
|-------|-------|--------|-------|
| Default | 1px `#e2e8f0` | `#ffffff` | — |
| Hover | 1px `#cbd5e1` | `#ffffff` | — |
| Focus | 1.5-2px `#334155` | `#ffffff` | box-shadow focus ring |
| Error | 1.5px `#ef4444` | `#ffffff` | testo errore sotto |
| Disabled | 1px `#e2e8f0` | `#f1f5f9` | opacity 0.6 |
| Read-only | nessuno | `#f8fafc` | cursor default |

### Select / Dropdown

- Stesso stile dell'input
- Chevron `bi-chevron-down` a destra, 12px, color text-muted
- Menu dropdown: bg white, border `#e2e8f0`, shadow dropdown, border-radius 6px
- Item hover: bg `#f8fafc`
- Item selezionato: bg `#e0f2fe`, color `#0284c7`

---

## 9. Regole Generali

### DO ✅

- Usare i token definiti sopra — non hardcodare valori magic number
- Layout verticale per i form nei pannelli (label sopra, input sotto)
- Toggle switch per booleani (mai checkbox nativi)
- Section header uppercase per raggruppare campi
- Mantenere gerarchia tipografica: heading > label > body > caption
- Usare border-bottom sottili (0.5-1px) come separatori, mai HR pesanti
- Padding consistente 16px nei pannelli
- Gap consistente tra campi (16-20px)

### DON'T ❌

- Mai `font-size` diversi dalla scala definita (no 15px, no 17px, no 22px)
- Mai mixing inline/affiancato e verticale nello stesso pannello
- Mai font-weight maggiori di 700
- Mai ombre decorative
- Mai colori non definiti nel sistema (no arancione random, no verde lime)
- Mai `!important` su proprietà tipografiche (causa conflitti con Monaco)
- Mai uppercase su testo lungo — solo su badge e section header brevi
- Mai più di 2 livelli di heading nello stesso pannello

---

## 10. Checklist Pre-Commit per UI

Prima di considerare completata una modifica UI:

1. ☐ Font sizes usano solo valori dalla scala (11, 12, 13, 14, 16, 18, 20, 24px)
2. ☐ Font weights usano solo 400, 500, 600, 700
3. ☐ Colori testo usano solo i token definiti
4. ☐ Spacing usa multipli di 4px (4, 8, 12, 16, 20, 24, 32)
5. ☐ Input hanno height consistente (32, 36, 40px)
6. ☐ Border-radius consistente (4, 6, 8, 12px)
7. ☐ Nessun font/size/colore hardcodato fuori dal sistema
8. ☐ Gerarchia visiva chiara (un solo livello di heading prominente)
9. ☐ Icone sono Bootstrap Icons
10. ☐ Toggle switch per booleani (no checkbox)
