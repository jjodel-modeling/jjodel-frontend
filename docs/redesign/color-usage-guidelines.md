# JJODEL COLOR USAGE GUIDELINES

**Version:** 2.0  
**Date:** January 2026  
**Purpose:** Definire la palette colori per un look professionale, enterprise, maturo.

---

## PRINCIPIO FONDAMENTALE

> **Slate (#475569) è il nuovo accent color — sobrio, professionale, enterprise.**

Niente colori "caramellosi" o infantili. Look maturo per tool accademico/research.

---

## PALETTE RIASSUNTIVA

| Token | Valore | Uso |
|-------|--------|-----|
| `$color-brand` | `#374151` | Testo primario, logo, elementi di identità |
| `$color-accent` | `#475569` | **CTA primari, focus ring** |
| `$color-accent-hover` | `#334155` | Hover su accent |
| `$color-accent-light` | `#f1f5f9` | Background leggero accent |
| `$color-text-primary` | `#111418` | Testo principale, titoli |
| `$color-text-secondary` | `#6B7280` | Testo secondario, label, icone |
| `$color-bg-active` | `#ffffff` | Sfondo elementi attivi (tab, toggle) |
| `$color-bg-hover` | `#f1f5f9` | Sfondo hover |

---

## ✅ DOVE USARE SLATE (Accent)

### 1. Bottoni CTA Primari
L'azione principale della pagina/sezione.

```scss
// CORRETTO
.btn-primary {
  background: #475569;
  color: #ffffff;
  
  &:hover {
    background: #334155;
  }
}
```

**Esempi:**
- "New Project"
- "Create"
- "Save"
- "Edit" (quando è l'azione principale)

### 2. Focus Ring (Accessibilità)
Outline quando un elemento ha focus da tastiera.

```scss
// CORRETTO
*:focus-visible {
  outline: 2px solid #475569;
  outline-offset: 2px;
}
```

### 3. Link Testuali (opzionale)
I link possono usare slate o restare grigi con underline.

```scss
// OPZIONE A: Slate
a, .link {
  color: #475569;
  
  &:hover {
    text-decoration: underline;
  }
}

// OPZIONE B: Grigio con underline (più sobrio)
a, .link {
  color: #374151;
  
  &:hover {
    text-decoration: underline;
  }
}
```

---

## COLORI SEMANTICI

Questi colori NON cambiano e restano per i loro usi specifici:

| Tipo | Colore | Uso |
|------|--------|-----|
| Success | `#10B981` | Operazioni completate, conferme |
| Error | `#EF4444` | Errori, azioni distruttive |
| Warning | `#F59E0B` | Attenzione, conferme importanti |
| Info | `#6B7280` | Informazioni, suggerimenti |

---

## STILI BOTTONI AGGIORNATI

| Stile | Background | Hover | Uso |
|-------|------------|-------|-----|
| Primary | `#475569` | `#334155` | Save, Create, Submit, New Project |
| Secondary | `#ffffff` + border | `#f1f5f9` | Cancel, Close, Done |
| Slate | `#475569` | `#334155` | Logout, Proceed (stesso di Primary) |
| Destructive | `#EF4444` | `#DC2626` | Delete, Discard |

**Nota:** Primary e Slate ora sono lo stesso colore. Semplifica la palette.

---

## ICONE EMPTY STATE

Le icone nei messaggi empty state (come il razzo nella dashboard) devono essere **grigie**, non colorate:

```scss
.empty-state-icon {
  color: #6B7280;
  background: #f1f5f9;
}
```

---

## GERARCHIA VISIVA

```
Importanza Alta    →    Slate (#475569)
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

Prima di assegnare un colore, chiediti:

- [ ] È un bottone CTA primario? → ✅ Usa Slate (#475569)
- [ ] È uno stato attivo/selezionato? → Usa bianco/grigio
- [ ] È un toggle ON? → Usa brand (#374151)
- [ ] È un'icona decorativa? → Usa grigio (#6B7280)
- [ ] È un messaggio di successo? → Usa verde (#10B981)
- [ ] È un errore? → Usa rosso (#EF4444)

---

## ESEMPIO VISIVO

### Con Slate (Nuovo)
```
┌─────────────────────────────────────────────────────┐
│ [Jjodel] [File] [Edit] [View]         [?Help] [OU] │  ← Avatar grigio
├─────────────────────────────────────────────────────┤
│  Projects                    [Import] [+ New Project] │
│                                        ↑ Slate button │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 🚀 Welcome to Jjodel!                           │ │  ← Icona grigia
│  │                                                 │ │
│  │      [Create your first project]               │ │  ← Slate button
│  │                                                 │ │
│  │  Getting Started guide →                       │ │  ← Link grigio
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Look pulito, professionale, enterprise!**

---

## AGGIORNARE CLAUDE.md

Aggiungere questa sezione a CLAUDE.md sotto "Design Tokens > Colori":

```markdown
### Regola d'Oro sui Colori

> **Slate (#475569) è l'accent color — per CTA primari.**
> Look monocromatico, professionale, enterprise.
> Niente colori "caramellosi".

Vedi `/docs/redesign/color-usage-guidelines.md` per dettagli.
```

---

## MIGRAZIONE DA CYAN A SLATE

Tutti i riferimenti a `#06B6D4` (cyan) devono essere sostituiti:

| Vecchio | Nuovo | Uso |
|---------|-------|-----|
| `#06B6D4` | `#475569` | CTA primari |
| `#0891B2` | `#334155` | Hover CTA |
| `#ecfeff` | `#f1f5f9` | Background light |

**Files da aggiornare:**
- Variables SCSS
- Componenti Button
- Focus rings
- Qualsiasi hardcoded cyan

---

**END OF GUIDELINES**
