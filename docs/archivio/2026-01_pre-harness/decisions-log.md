# JJODEL REDESIGN - DECISIONS LOG

**Date:** January 2026  
**Session:** UI/UX Redesign Planning

---

## DOCUMENTI SPEC CREATI

| File | Descrizione | Versione |
|------|-------------|----------|
| `menu-redesign-spec.md` | Menu principale dropdown | v2.0 |
| `menu-matrix-v3.txt` | Matrice stati enable/disable | v3 |
| `right-panel-tabs-spec.md` | Tab del Right Panel (Segmented Control) | v1.0 |
| `color-usage-guidelines.md` | Regole uso colori (anti-caramelloso) | v1.0 |
| `dialogs-modals-spec.md` | Dialogs e modals minimal | v1.0 |

---

## DECISIONI ARCHITETTURALI

### Menu Principale
- [x] Sostituire tab navigazione con menu dropdown classico
- [x] Struttura: `[Jjodel] [File] [Edit] [View] [Tools] [Analyze]` + `[Help] [Avatar]`
- [x] **Menu Tools** — Nuovo, dinamico, comandi metamodel-specific (S4+)
- [x] **Sign out** — Rimosso da menu Jjodel, resta solo in Avatar menu
- [x] Stile dropdown: light theme (sfondo bianco, ombre subtle)

### Bottom Toolbar
- [x] Posizione: sopra il footer
- [x] Visibile solo in S6, S7 (editor aperto)
- [x] 3 sezioni: Tools commands | Grid/Snap toggles | Zoom controls

### Right Panel Tabs
- [x] **Stile scelto: B (Segmented Control)** — iOS/macOS style
- [x] Main tabs: container grigio `#f1f5f9`, tab attivo bianco con shadow
- [x] Sub-tabs: stesso stile ma più piccolo (font 12px)
- [x] Breadcrumb per navigazione Viewpoints

### Dialogs/Modals
- [x] **Stile minimal** — Niente icone grandi con alone
- [x] Icona 24px inline col titolo
- [x] Titolo sempre nero, solo icona colorata
- [x] Footer con sfondo `#fafbfc`

---

## DECISIONI COLORI

### Cambio Accent Color
> **Da Cyan (#06B6D4) a Slate (#475569)**
> Motivo: Cyan troppo "caramelloso" e infantile per un tool accademico/research.

### Nuova Palette

| Token | Valore | Uso |
|-------|--------|-----|
| `$color-accent` | `#475569` | CTA primari, focus ring |
| `$color-accent-hover` | `#334155` | Hover su accent |
| `$color-accent-light` | `#f1f5f9` | Background leggero |

### Palette Bottoni

| Stile | Colore | Hover | Uso |
|-------|--------|-------|-----|
| Primary | `#475569` | `#334155` | Save, Create, Submit, New Project |
| Secondary | bianco + bordo `#d0d3d8` | `#f1f5f9` | Cancel, Close, Done |
| Slate | `#475569` | `#334155` | Logout, Proceed (stesso di Primary) |
| Destructive | `#EF4444` | `#DC2626` | Delete, Discard |

### Icone Alert (Bootstrap Icons)

| Tipo | Icona | Colore |
|------|-------|--------|
| Success | `bi-check-circle` | `#10B981` (verde) |
| Error | `bi-x-circle` | `#EF4444` (rosso) |
| Warning | `bi-exclamation-triangle` | `#F59E0B` (ambra) |
| Info | `bi-info-circle` | `#6B7280` (grigio) |

### Look Generale
- Monocromatico, grigi + slate
- Niente colori "caramellosi"
- Professionale, enterprise, maturo
- Adatto a tool accademico/research

---

## STATI DEL SISTEMA (S0-S7)

| Stato | Descrizione |
|-------|-------------|
| S0 | Logged out (nessun menu) |
| S1 | Dashboard vuota (0 progetti) |
| S2 | Dashboard con progetti (≥1) |
| S3 | Progetto aperto, vuoto (0 metamodels) |
| S4 | Progetto aperto, con metamodel(s), 0 models |
| S5 | Progetto aperto, con metamodel(s) e model(s) |
| S6 | Progetto aperto, metamodel Editor aperto |
| S7 | Progetto aperto, model aperto |

---

## ICONE BOOTSTRAP SPECIFICHE

| Elemento | Icona |
|----------|-------|
| Show/hide toolbar | `bi-window-dock` |
| Show/hide sidebar | `bi-layout-sidebar` |
| Zoom in | `bi-zoom-in` |
| Zoom out | `bi-zoom-out` |
| Fullscreen | `bi-fullscreen` |
| Grid | `bi-grid-3x3-gap` |
| Snap | `bi-magnet` |

---

## PROSSIMI PASSI (TODO)

- [ ] **Project Card redesign** — Mockup creato, scegliere stile
- [ ] Form controls (input, select, toggle switch)
- [ ] About dialog
- [ ] Applicare Color Guidelines a tutti i componenti

---

## NOTE TECNICHE

- **Font:** Inter Variable + IBM Plex Mono
- **Icons:** Bootstrap Icons only
- **Stack:** React + Redux + SCSS
- **Approccio:** Solo UI, engine invariato

---

## MOCKUP CREATI

| File | Descrizione |
|------|-------------|
| `tab-redesign-mockup.jsx` | 5 stili tab (scelto B) |
| `project-card-mockup.jsx` | 6 stili card (da scegliere) |
| `dialog-buttons-mockup.jsx` | Varianti bottoni + icone Bootstrap |

---

**END OF LOG**
