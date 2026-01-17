# JJODEL COLOR USAGE GUIDELINES

**Version:** 1.0  
**Date:** January 2026  
**Purpose:** Definire quando usare il colore Accent (cyan) e quando usare colori neutri per evitare un aspetto "caramelloso" e mantenere un look professionale.

---

## PRINCIPIO FONDAMENTALE

> **Il cyan (#06B6D4) è un colore "prezioso" — usarlo con parsimonia per massimizzare il suo impatto.**

Troppo cyan = aspetto giocoso, poco professionale, stancante.
Cyan mirato = azioni chiare, gerarchia visiva, look enterprise.

---

## PALETTE RIASSUNTIVA

| Token | Valore | Uso |
|-------|--------|-----|
| `$color-brand` | `#374151` | Testo primario, logo, elementi di identità |
| `$color-accent` | `#06B6D4` | **SOLO** CTA primari e link |
| `$color-text-primary` | `#111418` | Testo principale, titoli |
| `$color-text-secondary` | `#6B7280` | Testo secondario, label, icone |
| `$color-bg-active` | `#ffffff` | Sfondo elementi attivi (tab, toggle) |
| `$color-bg-hover` | `#f1f5f9` | Sfondo hover |

---

## ✅ DOVE USARE IL CYAN (Accent)

### 1. Bottoni CTA Primari
L'azione principale della pagina/sezione.

```scss
// CORRETTO
.btn-primary {
  background: #06B6D4;
  color: #ffffff;
}
```

**Esempi:**
- "New Project"
- "Create"
- "Save"
- "Edit" (quando è l'azione principale)

### 2. Link Testuali
Link inline nel testo o navigazione secondaria.

```scss
// CORRETTO
a, .link {
  color: #06B6D4;
  
  &:hover {
    text-decoration: underline;
  }
}
```

**Esempi:**
- "New to Jjodel? Check out the Getting Started guide →"
- Link nella documentazione

### 3. Focus Ring (Accessibilità)
Outline quando un elemento ha focus da tastiera.

```scss
// CORRETTO
*:focus-visible {
  outline: 2px solid #06B6D4;
  outline-offset: 2px;
}
```

---

## ❌ DOVE NON USARE IL CYAN

### 1. Tab Attivo
Usare sfondo bianco + testo scuro, NO bordo/sfondo cyan.

```scss
// ❌ SBAGLIATO
.tab.active {
  border-bottom: 2px solid #06B6D4;
  color: #06B6D4;
}

// ✅ CORRETTO
.tab.active {
  background: #ffffff;
  color: #111418;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

### 2. Toggle ON (Grid, Snap, etc.)
Usare brand color (grigio scuro), non cyan.

```scss
// ❌ SBAGLIATO
.toggle.active {
  background: #06B6D4;
}

// ✅ CORRETTO
.toggle.active {
  background: #374151;
  color: #ffffff;
}

// Oppure versione subtle:
.toggle.active {
  background: #f1f5f9;
  color: #111418;
  font-weight: 500;
}
```

### 3. Badge / Tag
Usare colori neutri o semantici per tipo, non cyan generico.

```scss
// ❌ SBAGLIATO
.badge {
  background: rgba(6, 182, 212, 0.1);
  color: #06B6D4;
}

// ✅ CORRETTO - Neutro
.badge {
  background: #f1f5f9;
  color: #374151;
}

// ✅ CORRETTO - Semantico per tipo
.badge-metamodel { background: #dbeafe; color: #1e40af; } // Blu
.badge-model { background: #dcfce7; color: #166534; }     // Verde
.badge-class { background: #fef3c7; color: #92400e; }     // Ambra
```

### 4. Avatar Utente
Usare brand color, non cyan.

```scss
// ❌ SBAGLIATO
.avatar {
  background: #06B6D4;
}

// ✅ CORRETTO
.avatar {
  background: #374151;
  color: #ffffff;
}
```

### 5. Icone Attive / Selezionate
Usare grigio scuro, non cyan.

```scss
// ❌ SBAGLIATO
.icon.active {
  color: #06B6D4;
}

// ✅ CORRETTO
.icon.active {
  color: #111418;
}

// Oppure con sfondo:
.icon-button.active {
  background: #f1f5f9;
  color: #111418;
}
```

### 6. Breadcrumb
Usare grigio scuro per i link, non cyan.

```scss
// ❌ SBAGLIATO
.breadcrumb-link {
  color: #06B6D4;
}

// ✅ CORRETTO
.breadcrumb-link {
  color: #374151;
  
  &:hover {
    text-decoration: underline;
  }
}

.breadcrumb-current {
  color: #111418;
  font-weight: 500;
}
```

### 7. Menu Item Attivo
Usare sfondo grigio chiaro, non cyan.

```scss
// ❌ SBAGLIATO
.menu-item.active {
  background: rgba(6, 182, 212, 0.1);
  color: #06B6D4;
}

// ✅ CORRETTO
.menu-item.active {
  background: #f1f5f9;
  color: #111418;
  font-weight: 500;
}
```

### 8. Bordi e Outline Decorativi
Mai usare cyan per bordi generici.

```scss
// ❌ SBAGLIATO
.card:hover {
  border-color: #06B6D4;
}

// ✅ CORRETTO
.card:hover {
  border-color: #d0d3d8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

---

## ECCEZIONI CONSENTITE

Il cyan può essere usato in questi casi specifici:

### 1. Indicatore di "Novità" o "AI"
Per feature speciali che devono spiccare.

```scss
.badge-new, .badge-ai {
  background: rgba(6, 182, 212, 0.1);
  color: #0891B2;
}
```

### 2. Progress Bar / Loading
Indicatori di progresso possono usare cyan.

```scss
.progress-bar {
  background: #06B6D4;
}
```

### 3. Selezione su Canvas
Quando un nodo/elemento è selezionato sul canvas.

```scss
.node.selected {
  outline: 2px solid #06B6D4;
}
```

---

## GERARCHIA VISIVA

```
Importanza Alta    →    Cyan (#06B6D4)
                        Solo per CTA primari
                        
Importanza Media   →    Brand (#374151)
                        Toggle attivi, avatar, icone attive
                        
Importanza Bassa   →    Grigio (#6B7280)
                        Testo secondario, icone inattive
                        
Sfondo Attivo      →    Bianco (#ffffff)
                        Tab attivo, card selezionata
                        
Sfondo Hover       →    Grigio chiaro (#f1f5f9)
                        Hover states
```

---

## CHECKLIST RAPIDA

Prima di usare cyan, chiediti:

- [ ] È un bottone CTA primario? → ✅ Usa cyan
- [ ] È un link testuale? → ✅ Usa cyan
- [ ] È uno stato attivo/selezionato? → ❌ Usa bianco/grigio
- [ ] È un toggle ON? → ❌ Usa brand (#374151)
- [ ] È un badge/tag? → ❌ Usa grigio o colore semantico
- [ ] È un'icona attiva? → ❌ Usa grigio scuro (#111418)
- [ ] È un bordo decorativo? → ❌ Usa grigio (#d0d3d8)

---

## ESEMPIO VISIVO

### ❌ Troppo Cyan (Prima)
```
┌─────────────────────────────────────────────────────┐
│ [Jjodel] [File] [Edit] [View]         [?Help] [OU] │  ← Avatar cyan
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Properties │ Tree View │ VIEWPOINTS │ Node     │ │  ← Tab cyan
│ └─────────────────────────────────────────────────┘ │
│ ← Default › Model › Class                           │  ← Breadcrumb cyan
│ [METAMODEL]                                         │  ← Badge cyan
│ Grid [✓] Snap [✓]                                  │  ← Toggle cyan
└─────────────────────────────────────────────────────┘
```

### ✅ Cyan Controllato (Dopo)
```
┌─────────────────────────────────────────────────────┐
│ [Jjodel] [File] [Edit] [View]         [?Help] [OU] │  ← Avatar grigio
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Properties │ Tree View │▓VIEWPOINTS▓│ Node     │ │  ← Tab bianco
│ └─────────────────────────────────────────────────┘ │
│ ← Default › Model › Class                           │  ← Breadcrumb grigio
│ [METAMODEL]                                         │  ← Badge grigio
│ Grid [✓] Snap [✓]              [+ New Project]     │  ← Toggle grigio, CTA cyan
└─────────────────────────────────────────────────────┘
```

**Il cyan spicca SOLO sul bottone "New Project" — massimo impatto!**

---

## AGGIORNARE CLAUDE.md

Aggiungere questa sezione a CLAUDE.md sotto "Design Tokens > Colori":

```markdown
### Regola d'Oro sui Colori

> **Cyan (#06B6D4) = SOLO per CTA primari e link.**
> Tutto il resto usa grigi neutri e il brand color (#374151).

Vedi `/docs/redesign/color-usage-guidelines.md` per dettagli.
```

---

**END OF GUIDELINES**
