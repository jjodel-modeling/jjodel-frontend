# JJODEL DIALOGS & MODALS - SPECIFICATION

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation

---

## 1. OVERVIEW

### Obiettivo
Ridisegnare i dialogs/modals con uno stile **minimal, slick e professionale** — rimuovendo le icone grandi con alone e adottando un approccio più pulito.

### Tipi di Dialog
1. **Alert** — Messaggi informativi (success, error, warning, info)
2. **Confirm** — Richiesta di conferma con azioni
3. **Form** — Dialog con form input (New Project, Edit, etc.)
4. **About** — Informazioni sull'app

### Principi di Design
- **Minimal** — Niente icone giganti o decorazioni superflue
- **Slick** — Animazioni smooth, ombre sottili
- **Professionale** — Tipografia chiara, gerarchia visiva
- **Coerente** — Segue le Color Guidelines (cyan solo per CTA)

---

## 2. STRUTTURA BASE

### Layout

```
┌─────────────────────────────────────────────────────┐
│                                               [✕]  │  ← Header (opzionale)
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Icon]  Title                                      │  ← Icona piccola inline
│                                                     │
│  Description text goes here explaining what         │
│  happened or what action is needed.                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                          [Cancel]  [Primary Action] │  ← Footer con azioni
└─────────────────────────────────────────────────────┘
```

### Specifiche Container

```scss
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 20, 24, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 150ms ease;
}

.modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  max-width: 440px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 200ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

## 3. COMPONENTI

### Header (opzionale)

Usato solo per dialog complessi (form, about). Alert semplici non hanno header.

```scss
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e4e8;
}

.modal-title {
  font-family: 'Inter Variable', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #111418;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6B7280;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #f1f5f9;
    color: #374151;
  }
  
  // Icona: bi-x-lg, 18px
}
```

### Body

```scss
.modal-body {
  padding: 24px 20px;
}

.modal-icon-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.modal-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  
  // Colore dipende dal tipo (vedi sezione 4)
}

.modal-title-text {
  font-family: 'Inter Variable', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #111418;
  margin: 0;
}

.modal-description {
  font-family: 'Inter Variable', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6B7280;
  line-height: 1.5;
  margin: 0;
}
```

### Footer

```scss
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e4e8;
  background: #fafbfc;
}
```

---

## 4. TIPI DI ALERT

### Success

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✓  Project Saved                                   │
│                                                     │
│  Your project has been saved successfully.          │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                           [Done]    │
└─────────────────────────────────────────────────────┘
```

```scss
.modal-icon.success {
  color: #10B981; // Verde
}

.modal-title-text.success {
  color: #111418; // Titolo sempre nero
}
```

**Icona:** `bi-check-circle` (24px)
**Colore icona:** `#10B981` (verde)
**Bottone:** "Done" — stile secondary (grigio)

---

### Error

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✕  Something went wrong                            │
│                                                     │
│  We couldn't save your project. Please try again.   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                      [Try Again]    │
└─────────────────────────────────────────────────────┘
```

```scss
.modal-icon.error {
  color: #EF4444; // Rosso
}
```

**Icona:** `bi-x-circle` (24px)
**Colore icona:** `#EF4444` (rosso)
**Bottone:** "Try Again" o "Close" — stile secondary

---

### Warning

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ⚠  Unsaved changes                                 │
│                                                     │
│  You have unsaved changes. Do you want to save      │
│  before leaving?                                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Discard]  [Cancel]  [Save]      │
└─────────────────────────────────────────────────────┘
```

```scss
.modal-icon.warning {
  color: #F59E0B; // Ambra
}
```

**Icona:** `bi-exclamation-triangle` (24px)
**Colore icona:** `#F59E0B` (ambra)
**Bottoni:** 
- "Discard" — stile destructive (rosso outline)
- "Cancel" — stile secondary (grigio)
- "Save" — stile primary (cyan) — è il CTA

---

### Info

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ℹ  Quick tip                                       │
│                                                     │
│  Press Ctrl+S to save your project quickly.         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                        [Got it]     │
└─────────────────────────────────────────────────────┘
```

```scss
.modal-icon.info {
  color: #6B7280; // Grigio
}
```

**Icona:** `bi-info-circle` (24px)
**Colore icona:** `#6B7280` (grigio)
**Bottone:** "Got it" — stile secondary

---

## 5. CONFIRM DIALOG

Per azioni che richiedono conferma (delete, logout, etc.)

### Layout Standard

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Log out?                                           │
│                                                     │
│  You're about to log out without saving your        │
│  project. Any unsaved changes will be lost.         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                            [Cancel]  [Log out]      │
└─────────────────────────────────────────────────────┘
```

**Nota:** Niente icona per i confirm semplici — il titolo è sufficiente.

### Confirm Destructive (Delete)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Delete project?                                    │
│                                                     │
│  This will permanently delete "Project 1" and all   │
│  its contents. This action cannot be undone.        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                            [Cancel]  [Delete]       │
└─────────────────────────────────────────────────────┘
```

**Bottone "Delete":** stile destructive (rosso)

```scss
.btn-destructive {
  background: #EF4444;
  color: #ffffff;
  
  &:hover {
    background: #DC2626;
  }
}
```

---

## 6. FORM DIALOG

Per creare/editare entità (New Project, Edit Metamodel, etc.)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  New Project                                   [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Name                                               │
│  ┌───────────────────────────────────────────────┐  │
│  │ My Project                                    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Description (optional)                             │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                            [Cancel]  [Create]       │
└─────────────────────────────────────────────────────┘
```

### Dimensioni Form Dialog
- **Width:** 480px (più largo degli alert)
- **Max-height:** 90vh con scroll interno se necessario

---

## 7. ABOUT DIALOG

```
┌─────────────────────────────────────────────────────┐
│  About Jjodel                                  [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Jjodel.                                            │
│  Version 2.0.0                                      │
│                                                     │
│  An open-source metamodeling tool for research      │
│  and education.                                     │
│                                                     │
│  © 2026 Jjodel Team                                 │
│  Licensed under MIT                                 │
│                                                     │
│  [Website]  [GitHub]  [Documentation]               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 8. STILI BOTTONI

### Primary (CTA)

```scss
.btn-primary {
  padding: 10px 20px;
  font-family: 'Inter Variable', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: #06B6D4;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #0891B2;
  }
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: 2px;
  }
  
  &:disabled {
    background: #9CA3AF;
    cursor: not-allowed;
  }
}
```

**Uso:** Azione principale che l'utente DOVREBBE fare (Save, Create, Submit)

### Secondary

```scss
.btn-secondary {
  padding: 10px 20px;
  font-family: 'Inter Variable', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: #ffffff;
  border: 1px solid #d0d3d8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #f1f5f9;
    border-color: #b8bcc4;
  }
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: 2px;
  }
}
```

**Uso:** Azioni neutrali (Cancel, Close, Done, Got it)

### Destructive

```scss
.btn-destructive {
  padding: 10px 20px;
  font-family: 'Inter Variable', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: #EF4444;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #DC2626;
  }
  
  &:focus-visible {
    outline: 2px solid #EF4444;
    outline-offset: 2px;
  }
}
```

**Uso:** Azioni pericolose (Delete, Remove, Discard)

### Ghost (per link in dialog)

```scss
.btn-ghost {
  padding: 8px 12px;
  font-family: 'Inter Variable', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    color: #374151;
    background: #f1f5f9;
  }
}
```

**Uso:** Link secondari in About dialog (Website, GitHub)

---

## 9. COLORI SEMANTICI

| Tipo | Icona | Colore | Uso |
|------|-------|--------|-----|
| Success | `bi-check-circle` | `#10B981` | Operazione completata |
| Error | `bi-x-circle` | `#EF4444` | Errore, fallimento |
| Warning | `bi-exclamation-triangle` | `#F59E0B` | Attenzione, conferma |
| Info | `bi-info-circle` | `#6B7280` | Informazione, tip |

**Nota:** I colori si applicano SOLO all'icona, non al titolo o al testo.

---

## 10. ACCESSIBILITY

### Focus Management
- Focus va sul primo elemento interattivo quando il modal si apre
- Focus trap: Tab non esce dal modal
- ESC chiude il modal
- Click su overlay chiude il modal (se non è un confirm critico)

### ARIA

```tsx
<div 
  role="dialog" 
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">...</h2>
  <p id="modal-description">...</p>
</div>
```

### Keyboard

- `Tab` / `Shift+Tab` — naviga tra elementi
- `Enter` — attiva bottone focused
- `Escape` — chiude modal
- `Space` — attiva bottone focused

---

## 11. COMPONENT STRUCTURE (React)

### File Structure

```
/frontend/src/components/
├── modal/
│   ├── Modal.tsx              ← Container base
│   ├── ModalHeader.tsx        ← Header con titolo e close
│   ├── ModalBody.tsx          ← Body content
│   ├── ModalFooter.tsx        ← Footer con azioni
│   ├── AlertModal.tsx         ← Preset per alert (success, error, etc.)
│   ├── ConfirmModal.tsx       ← Preset per confirm
│   ├── FormModal.tsx          ← Preset per form
│   ├── modal.scss             ← Stili
│   └── index.ts
```

### Usage Examples

```tsx
// Alert Success
<AlertModal
  type="success"
  title="Project Saved"
  description="Your project has been saved successfully."
  onClose={handleClose}
/>

// Confirm Delete
<ConfirmModal
  title="Delete project?"
  description="This will permanently delete 'Project 1'. This action cannot be undone."
  cancelLabel="Cancel"
  confirmLabel="Delete"
  confirmVariant="destructive"
  onCancel={handleCancel}
  onConfirm={handleDelete}
/>

// Form Modal
<FormModal
  title="New Project"
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  submitLabel="Create"
>
  <Input label="Name" value={name} onChange={setName} />
  <Textarea label="Description" value={desc} onChange={setDesc} />
</FormModal>
```

---

## 12. COMPLETE SCSS

```scss
// components/modal/modal.scss

// ============================================
// VARIABLES
// ============================================
$modal-bg: #ffffff;
$modal-radius: 12px;
$modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
$overlay-bg: rgba(17, 20, 24, 0.5);

$color-success: #10B981;
$color-error: #EF4444;
$color-warning: #F59E0B;
$color-info: #6B7280;

$color-text-primary: #111418;
$color-text-secondary: #6B7280;
$color-border: #e2e4e8;
$color-bg-subtle: #fafbfc;

$transition: 150ms ease;

// ============================================
// OVERLAY
// ============================================
.modal-overlay {
  position: fixed;
  inset: 0;
  background: $overlay-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalFadeIn 150ms ease;
}

// ============================================
// MODAL CONTAINER
// ============================================
.modal {
  background: $modal-bg;
  border-radius: $modal-radius;
  box-shadow: $modal-shadow;
  max-width: 440px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideUp 200ms ease;
  
  &.modal-wide {
    max-width: 480px;
  }
  
  &.modal-narrow {
    max-width: 360px;
  }
}

// ============================================
// HEADER
// ============================================
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $color-border;
}

.modal-header-title {
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all $transition;
  
  &:hover {
    background: #f1f5f9;
    color: $color-text-primary;
  }
  
  i {
    font-size: 18px;
  }
}

// ============================================
// BODY
// ============================================
.modal-body {
  padding: 24px 20px;
}

.modal-icon-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.modal-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 24px;
  }
  
  &.success { color: $color-success; }
  &.error { color: $color-error; }
  &.warning { color: $color-warning; }
  &.info { color: $color-info; }
}

.modal-title {
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0;
  line-height: 1.3;
}

.modal-description {
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: $color-text-secondary;
  line-height: 1.5;
  margin: 0;
  padding-left: 36px; // Allineato con titolo (24px icon + 12px gap)
  
  .modal-body:not(:has(.modal-icon)) & {
    padding-left: 0;
  }
}

// ============================================
// FOOTER
// ============================================
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid $color-border;
  background: $color-bg-subtle;
}

// ============================================
// BUTTONS
// ============================================
.btn {
  padding: 10px 20px;
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all $transition;
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  color: #ffffff;
  background: #06B6D4;
  border: none;
  
  &:hover:not(:disabled) {
    background: #0891B2;
  }
}

.btn-secondary {
  color: #374151;
  background: #ffffff;
  border: 1px solid #d0d3d8;
  
  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #b8bcc4;
  }
}

.btn-destructive {
  color: #ffffff;
  background: #EF4444;
  border: none;
  
  &:hover:not(:disabled) {
    background: #DC2626;
  }
  
  &:focus-visible {
    outline-color: #EF4444;
  }
}

.btn-ghost {
  padding: 8px 12px;
  font-size: 13px;
  color: $color-text-secondary;
  background: transparent;
  border: none;
  
  &:hover:not(:disabled) {
    color: $color-text-primary;
    background: #f1f5f9;
  }
}

// ============================================
// ANIMATIONS
// ============================================
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideUp {
  from { 
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// Closing animation (apply via JS before removing)
.modal-overlay.closing {
  animation: modalFadeOut 150ms ease forwards;
}

.modal-overlay.closing .modal {
  animation: modalSlideDown 150ms ease forwards;
}

@keyframes modalFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modalSlideDown {
  from { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to { 
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}
```

---

## 13. IMPLEMENTATION CHECKLIST

### Phase 1: Base Components
- [ ] Creare `Modal.tsx` container
- [ ] Creare `ModalHeader.tsx`
- [ ] Creare `ModalBody.tsx`
- [ ] Creare `ModalFooter.tsx`
- [ ] Creare `modal.scss`

### Phase 2: Preset Components
- [ ] Creare `AlertModal.tsx` (success, error, warning, info)
- [ ] Creare `ConfirmModal.tsx`
- [ ] Creare `FormModal.tsx`

### Phase 3: Integration
- [ ] Sostituire modal esistenti con nuovi componenti
- [ ] Testare tutti i tipi di dialog
- [ ] Verificare animazioni apertura/chiusura

### Phase 4: Polish
- [ ] Focus trap implementation
- [ ] Keyboard navigation (ESC, Tab)
- [ ] ARIA attributes
- [ ] Click outside to close

---

## 14. VISUAL COMPARISON

### Prima (Current)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌─────────────┐                        │
│              │     ✓      │  ← Icona grande        │
│              │   (alone)   │    con alone          │
│              └─────────────┘                        │
│                                                     │
│           Project Saved!                            │  ← Titolo colorato
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [close]                          │  ← Bottone cyan
└─────────────────────────────────────────────────────┘
```

### Dopo (New)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✓  Project saved                                   │  ← Icona piccola inline
│                                                     │
│  Your project has been saved successfully.          │  ← Descrizione
│                                                     │
├─────────────────────────────────────────────────────┤
│                                          [Done]     │  ← Bottone grigio
└─────────────────────────────────────────────────────┘
```

**Differenze chiave:**
- Icona 24px inline invece di 80px+ con alone
- Titolo nero, solo icona colorata
- Bottone neutro per azioni non-critiche
- Più compatto e professionale

---

**END OF SPECIFICATION**
