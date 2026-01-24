# Handover: Viewpoints Tab Redesign
**Data**: 24 Gennaio 2026
**Componente**: Tab Viewpoints (NestedView)

## Task Completato
Redesign completo degli stili della tab Viewpoints per allinearla al design system Jjodel.

## Problemi Risolti
1. ✅ Header blu cyan → ora slate con design system
2. ✅ Badge OCL/JS/EX troppo colorati → ora muted/subtle
3. ✅ Priority input troppo largo → compatto (72px)
4. ✅ Colori badge inconsistenti → matching TreeViewSidebar
5. ✅ Nessuna indicazione selezione → background + border
6. ✅ Gerarchia visiva debole → viewpoints con sfondo, separatori

## File Modificati
- `frontend/src/components/editors/views/nestedView.scss` - **SOSTITUITO INTERAMENTE**

## Design Decisions
1. **Colori type icons**: Allineati a TreeViewSidebar (purple per VP, blue per vertex, etc.)
2. **Badge OCL/JS/EX**: Sfondo con 10% opacity, testo colorato ma non saturo
3. **Selected state**: `rgba(71, 85, 105, 0.08)` con border subtle
4. **Viewpoint rows**: Background secondary per distinguerli dalle views
5. **Dark mode**: Supporto completo con colori adattati

## Pattern Stabiliti
- Priority input: `width: 72px`, `height: 26px`, font mono
- Feature badges: `min-width: 24px`, `height: 20px`, `font-size: 9px`
- Tree indent: 20px per livello (32px, 52px, 72px)
- Separatori viewpoint: `margin-top: 8px` + line 1px

## Prossimi Step Suggeriti
1. [ ] Testare con progetti con molti viewpoints
2. [ ] Verificare performance scroll con 50+ views
3. [ ] Considerare virtualizzazione lista se necessario
4. [ ] Redesign ViewData.tsx (editor singola view) - PROSSIMO TASK

## Screenshot
[Aggiungere screenshot before/after]