# JJODEL UI REDESIGN
## Requirements Document

**Version:** 0.1 (draft)  
**Last Updated:** January 2026  
**Status:** In Progress

---

# 1. VISION & POSITIONING

## 1.1 Target Users

| User Type | Description | Priority |
|-----------|-------------|----------|
| **Accademici / Ricercatori** | Devono poter adottare Jjodel nella didattica, corsi di modellazione e MDE. Il ridotto carico cognitivo rispetto ad altre piattaforme è un fattore decisivo. | 🔴 HIGH |
| **Studenti** | Target primario insieme agli accademici. L'interfaccia deve essere accessibile e non intimidatoria. | 🔴 HIGH |
| **Designer di linguaggi / DSL** | Utenti tecnici che creano metamodelli e sintassi concrete. Necessitano di power features ma con disclosure progressivo. | 🔴 HIGH |
| **Esperti di dominio** | Futuri utenti per notazioni specifiche di dominio. Non ancora target attivo. | 🟡 MEDIUM (futuro) |
| **Software Architects** | Uso occasionale, non target primario. | 🟢 LOW |
| **Sviluppatori Enterprise** | NON target diretto, MA l'aspetto deve essere enterprise-grade per attrarre potenziali investitori. | ⚪ INDIRECT |

### Principi Derivati

| Principio | Descrizione |
|-----------|-------------|
| **Ridotto carico cognitivo** | Priorità assoluta. L'interfaccia non deve intimidire né sovraccaricare. |
| **Incremental disclosure** | Nascondere la complessità, rivelarla progressivamente quando necessario. |
| **Enterprise look, Academic simplicity** | Aspetto professionale e robusto senza aggiungere complessità d'uso. |
| **Configurabilità UI** | Permettere personalizzazione per adattarsi a diversi livelli di competenza. |

## 1.2 Market Positioning

**Categoria:**  
- ✅ Tool accademico/didattico per MDE
- ✅ Piattaforma di metamodellazione professionale
- ✅ IDE per Domain-Specific Languages

**Positioning Statement:**  
> "Jjodel è un tool di modellazione per studenti, istruttori, ricercatori e anche developers che vogliono realizzare ambienti di modellazione complessi con simulazione e per apprendere facilmente l'uso di tecniche model-driven oppure vogliono progettare piattaforme lowcode."

### Differenziatori Chiave

| Differenziatore | Descrizione |
|-----------------|-------------|
| **SaaS-native** | Unico tool di metamodellazione veramente SaaS. Altri stanno emergendo ma Jjodel è first-mover. |
| **Open Architecture** | Architettura e codice completamente aperti. Trasparenza e possibilità di contribuzione. |
| **Sperimentazione** | Piattaforma orientata all'esplorazione e alla sperimentazione di nuovi approcci. |
| **Academic + Commercial Grade** | Tool accademico con qualità e robustezza di grado commerciale. |
| **Ambiente Integrato e Riflessivo** | Sistema riflessivo che permette meta-livelli integrati. (Vedi documentazione dedicata) |

### Competitor Landscape

| Competitor | Type | Jjodel Advantage |
|------------|------|------------------|
| Eclipse EMF | Desktop, Open-source | SaaS, minore complessità |
| MetaEdit+ | Desktop, Commercial | SaaS, open, più accessibile |
| JetBrains MPS | Desktop, Commercial | SaaS, curva apprendimento ridotta |
| Emerging SaaS tools | SaaS | First-mover, architettura aperta, ambiente riflessivo |

## 1.3 Design References

| Tool/Product | What We Like | Relevance |
|--------------|--------------|-----------|
| **Framer** | Layout molto simile a Jjodel (sidebar sx, canvas, panel dx). Dark mode con colori desaturati. Tipografia curata. Bordi sottili. Spacing generoso. Micro-animazioni. | 🔴 HIGH — Riferimento principale |
| **Figma** | Considerato nella progettazione originale di Jjodel. Standard de facto per design tools. | 🔴 HIGH |
| **Piattaforme Low-code** | Influenza sulla progettazione originale. Semplicità d'uso, target non-developer. | 🟡 MEDIUM |

### Elementi da "Prendere in Prestito"

| Da | Elemento |
|----|----------|
| Framer | Dark mode desaturato, tipografia, spacing generoso, micro-animazioni |
| Figma | Patterns di interazione canvas, gestione layers, property panel |
| Low-code | Semplicità, riduzione carico cognitivo, progressive disclosure |

## 1.4 Brand Personality

### Keywords

| Attribute | Priority | Notes |
|-----------|----------|-------|
| **Friendly** | 🔴 CRITICAL | Le cose devono apparire semplici. L'utente non deve avere paura né faticare cognitivamente. |
| **Moderno** | 🔴 HIGH | Estetica contemporanea, non datata. |
| **Serio & Autorevole** | 🔴 HIGH | Ispira fiducia e credibilità. |
| **Professionale** | 🔴 HIGH | Aspetto enterprise-grade. |
| **Minimal** | 🔴 HIGH | Ridurre il rumore visivo. |
| **Elegante** | 🟡 MEDIUM | Raffinatezza nei dettagli. |
| **Robusto & Maturo** | 🟡 MEDIUM | Sensazione di stabilità e affidabilità. |
| **Slick** | 🟡 MEDIUM | Fluido, levigato, piacevole. |
| **Ispirante & Creativo** | 🟡 MEDIUM | Invoglia a esplorare e sperimentare. |
| **Potente (sotto la superficie)** | 🟡 MEDIUM | Deve trasparire che c'è uno strato tecnico avanzato, senza esibirlo in faccia. |

### Tone Strategy: Layered Disclosure

L'interfaccia deve comunicare personalità diverse a livelli diversi di profondità:

| Layer | Cosa Vede l'Utente | Sensazione Target |
|-------|-------------------|-------------------|
| **Surface** | UI pulita, minimal, friendly. Azioni chiare. Niente di intimidatorio. | "Posso farcela, è semplice" |
| **Middle** | Hint di profondità: icone pro, menu avanzati accessibili ma non invadenti | "C'è potenza sotto, quando sarò pronto" |
| **Deep** | Power features: Console, OCL editor, Template JSX, Viewpoint customization | "Questo tool è serio e professionale" |

### Reference: Chi Fa Bene Questo

| Product | Come lo fa |
|---------|------------|
| **Notion** | Sembra un documento bianco → sotto c'è un database engine completo |
| **Figma** | Parti con un rettangolo → arrivi a design systems complessi |
| **Linear** | Issue tracker semplice → workflow automation potente sotto |

### Anti-Patterns da Evitare

| ❌ Da Evitare | Perché |
|--------------|--------|
| Mostrare tutto subito | Sovraccarico cognitivo |
| UI troppo "enterprise" con mille opzioni | Intimidisce studenti e nuovi utenti |
| Aspetto troppo "giocattolo" | Non ispira fiducia per uso professionale |
| Inconsistenza visiva | Sembra immaturo |

---

# 2. FUNCTIONAL REQUIREMENTS

## 2.1 Priority Areas

| Area | Priority | Notes |
|------|----------|-------|
| Onboarding (auth, first project) | 🔴 HIGH | Prima impressione critica |
| Dashboard / Workspace | 🔴 HIGH | Hub centrale navigazione |
| Metamodel Editor | 🔴 HIGH | Core del prodotto |
| Right Panel (Properties, Tree, Viewpoints, Node, Console) | 🔴 HIGH | Inspector principale |
| Viewpoint Customization (Template, Style, Events) | 🔴 HIGH | Power feature distintiva |
| Simulation (Object Diagrams) | 🔴 HIGH | Feature differenziante |
| Dialogs & Menus | 🔴 HIGH | Consistenza UI |
| **🆕 AI Assistant (RAG/LLM)** | 🔴 HIGH | Nuova funzionalità da progettare |

### Nuova Feature: AI Assistant

| Aspetto | Dettagli |
|---------|----------|
| **Descrizione** | Chatbot AI integrato (RAG + LLM) customizzato per Jjodel |
| **Sostituisce** | "AI Suggest" (recommender system obsoleto — da rimuovere) |
| **Riferimento UX** | Claude for VS Code, GitHub Copilot Chat |

#### Posizione UI

| Decisione | Scelta |
|-----------|--------|
| Posizione | ✅ **Nuovo tab nel Right Panel** |
| Nome tab | "AI" o "Assistant" (_TBD_) |
| Icona | ✨ o simile (distintiva) |
| Shortcut | _TBD_ (es. ⌘I o ⌘/) |
| Organizzazione tab | ⏸️ **DECISIONE POSTICIPATA** — Right Panel avrà 6 tab (Properties, Tree View, Viewpoints, Node, Console, AI). Valutare raggruppamento dopo redesign visivo. |

❌ Escluso: Inline canvas, Floating window, Modal/drawer, Bottom panel, Sidebar dedicata

#### Capabilities

| Capability | Supportato | Esempi |
|------------|------------|--------|
| **Vede il modello corrente** | ✅ SÌ | "Spiegami questa classe", "Cosa fa questo metamodello", "Ci sono errori?" |
| **Modifica il modello** | ✅ SÌ | "Aggiungi attributo name", "Crea relazione tra X e Y", "Rinomina questa classe" |
| **Knowledge base (RAG)** | ✅ SÌ | Documentazione Jjodel, Concetti MDE/metamodeling, Tutorial/esempi |

#### Interazione

| Aspetto | Dettagli |
|---------|----------|
| Input | Campo testo + invio |
| Output | Risposte conversazionali + azioni sul modello |
| Contesto | Modello corrente, elemento selezionato, cronologia chat |
| Conferma azioni | _TBD_ (chiedere conferma prima di modificare?) |

## 2.2 User Flows Critici

| Flow | Descrizione | Priority |
|------|-------------|----------|
| **Primo accesso** | Registrazione → primo progetto → primo modello | 🔴 HIGH |
| **Aprire e lavorare** | Login → trova progetto → apri editor → modifica | 🔴 HIGH |
| **Creare metamodello** | Nuovo metamodel → aggiungi classi → definisci relazioni | 🔴 HIGH |
| **Definire viewpoint** | Crea view → template → style → test | 🔴 HIGH |
| **Simulare modello** | Da class diagram → object diagram → edit valori live | 🟡 MEDIUM |
| **Collaborare** | Condividi progetto → link pubblico | 🟡 MEDIUM |
| **Imparare** | Tutorial → help → documentazione | 🟡 MEDIUM |

## 2.3 Feature Parity

### ⚠️ VINCOLO CRITICO: Approccio Conservativo

> **Il redesign deve essere principalmente VISIVO. L'engine interno non deve essere modificato per evitare instabilità o regressioni.**

| Layer | Approccio | Rischio |
|-------|-----------|---------|
| **Engine / Logic** | ❌ NON TOCCARE | — |
| **State Management** | ❌ NON TOCCARE | — |
| **Data Flow** | ❌ NON TOCCARE | — |
| **Struttura componenti** | ⚠️ Minime modifiche, solo se necessario | Basso |
| **Layout / Posizionamento** | ⚠️ Solo se non impatta logica | Basso |
| **Styling / CSS** | ✅ Focus principale del redesign | Minimo |
| **Nuove features (AI)** | ✅ Additive — mai modificare esistente | Basso se isolato |

### Funzionalità da Preservare (Comportamento Invariato)

Tutte le funzionalità esistenti devono mantenere lo stesso comportamento:

- [ ] Authentication flow
- [ ] Project CRUD
- [ ] Metamodel editing
- [ ] Canvas interactions (pan, zoom, select, drag)
- [ ] Node creation/editing
- [ ] Connections/relations
- [ ] Viewpoint system
- [ ] Template/Style/Events editors
- [ ] Console
- [ ] Tree View
- [ ] Simulation/Object diagrams
- [ ] Import/Export
- [ ] Sharing/Public links

## 2.4 Feature Gaps

### Approccio a Fasi

| Fase | Scope | Status |
|------|-------|--------|
| **Fase 1** | Restyling visivo (CSS, theming, componenti) | 🎯 FOCUS ATTUALE |
| **Fase 2** | AI Assistant (nuovo tab, RAG/LLM) | ⏳ Dopo Fase 1 |
| **Fase 3+** | Estensioni future | 📋 Da definire |

> Ogni fase viene completata e validata prima di passare alla successiva. Scope estendibile dopo Fase 2.

### Fase 1 — Restyling Visivo

Focus:
- Design tokens (colori, typography, spacing)
- Componenti UI (buttons, inputs, panels)
- Consistenza visiva
- Dark/Light theme
- Nessuna modifica funzionale

### Fase 2 — AI Assistant

Focus:
- Nuovo tab nel Right Panel
- Integrazione LLM/RAG
- Contesto modello corrente
- Capacità di modifica modello
- Knowledge base Jjodel/MDE

### Fase 3+ — Future (Backlog)

_Da definire dopo completamento Fase 1 e 2. Possibili candidate:_
- _TBD_

---

# 3. NON-FUNCTIONAL REQUIREMENTS

## 3.1 Look & Feel

| Attributo | Target |
|-----------|--------|
| Overall Style | Minimal, moderno, professionale |
| Perceived Quality | Enterprise-grade ma accessibile |
| Emotional Response | Fiducia, semplicità, "posso farcela" |
| Differenziazione | **Innovativo** — deve comunicare che è un tool all'avanguardia |

### ✨ Experience Goal

> **L'utente deve avere l'impressione di lavorare con qualcosa di davvero nuovo, anche sorprendente, fatto bene, che dà qualcosa in più.**

Questo si traduce in:

| Elemento | Come raggiungerlo |
|----------|-------------------|
| **Novità** | Design contemporaneo che non assomiglia ai tool MDE tradizionali (Eclipse-like) |
| **Sorpresa** | Dettagli inaspettati, micro-interazioni, polish nei piccoli elementi |
| **Qualità percepita** | Niente sembra "cheap" o approssimativo. Ogni pixel è intenzionale. |
| **Valore aggiunto** | L'interfaccia stessa aiuta a lavorare meglio, non è solo un contenitore |

## 3.2 Accessibility

| Requisito | Target | Note |
|-----------|--------|------|
| WCAG Level | 🟡 Best-effort verso AA | Nessun obbligo formale attuale |
| Contrasto colori | ✅ Verificato | Importante per disabilità visive |
| Navigazione tastiera | 🟡 Parziale | Focus sulle azioni principali |
| Screen reader | ⚪ Non prioritario | Futura considerazione |

### Principi Guida

> Nessun obbligo formale, ma **pensare alle persone con disabilità visive è importante**.

Approccio pratico:
- Contrasto colori sufficiente (verificare con tool)
- Evitare informazioni veicolate solo dal colore
- Testi leggibili (dimensioni adeguate)
- Focus states visibili
- Non sacrificare accessibilità per estetica

## 3.3 Performance

| Metric | Target | Note |
|--------|--------|------|
| Canvas nodes | **500 nodi** fluidi | Benchmark di riferimento |
| Caricamento iniziale | Importante ma non critico | App client-side, carica una volta |
| Edge rendering | ✅ Migliorato | Versione ottimizzata già implementata |

### Note Tecniche

- Dopo il caricamento iniziale, tutto resta lato client
- Gestione edge storicamente critica → **già risolta** con nuova implementazione
- Il redesign CSS non deve introdurre regressioni di performance

## 3.4 Responsiveness

| Breakpoint | Support Level | Note |
|------------|---------------|------|
| Desktop 27"+ (4K/5K) | ✅ **Primario** | Target principale, ottimizzato |
| Laptop 13"-15" (1440p/1080p) | ✅ **Primario** | Deve funzionare perfettamente |
| Tablet | ❌ Non supportato | Tool di modellazione non adatto |
| Mobile | ❌ Non supportato | Tool di modellazione non adatto |

### Breakpoints Tecnici

| Nome | Min Width | Target |
|------|-----------|--------|
| `laptop` | 1280px | Laptop 13" |
| `desktop` | 1440px | Laptop 15" / Desktop HD |
| `desktop-lg` | 1920px | Desktop FHD |
| `desktop-4k` | 2560px | Desktop 4K/5K |

---

# 4. TECHNICAL CONSTRAINTS

## 4.1 Stack Tecnologico

| Layer | Technology |
|-------|------------|
| Framework | **React** (con customizzazioni) |
| Styling | **SCSS** |
| State Management | **Redux** |
| Canvas/Rendering | **SVG** |
| Build | _TBD_ |

## 4.2 Librerie UI

| Library | Status |
|---------|--------|
| _TBD_ | In use / To evaluate |

## 4.3 Browser Support

| Browser | Min Version |
|---------|-------------|
| Chrome | _TBD_ |
| Firefox | _TBD_ |
| Safari | _TBD_ |
| Edge | _TBD_ |

## 4.4 Effort / Timeline

| Phase | Effort | Timeline |
|-------|--------|----------|
| Design Tokens | _TBD_ | _TBD_ |
| Core Components | _TBD_ | _TBD_ |
| Layout | _TBD_ | _TBD_ |
| Canvas & Nodes | _TBD_ | _TBD_ |
| Polish & QA | _TBD_ | _TBD_ |

---

# 5. DESIGN DECISIONS

## 5.1 Color Palette

### Primary Palette
| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | _TBD_ | |
| --color-secondary | _TBD_ | |
| --color-accent | _TBD_ | |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| --color-success | _TBD_ | |
| --color-warning | _TBD_ | |
| --color-error | _TBD_ | |
| --color-info | _TBD_ | |

## 5.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | _TBD_ | | |
| Body | _TBD_ | | |
| Code | _TBD_ | | |
| Labels | _TBD_ | | |

## 5.3 Component Library

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | _TBD_ (Custom / Library / Hybrid) | |
| If Library | _TBD_ | |

## 5.4 Theming

| Requirement | Decision |
|-------------|----------|
| Dark Mode | _TBD_ (Required / Nice-to-have / No) |
| Light Mode | _TBD_ |
| Default Theme | _TBD_ |
| Theme Toggle | _TBD_ |

---

# 6. PAIN POINTS & FIXES

## 6.1 Problemi Identificati

| ID | Area | Problem | Severity |
|----|------|---------|----------|
| P01 | _TBD_ | _TBD_ | High/Medium/Low |

## 6.2 Soluzioni Proposte

| Pain Point ID | Proposed Solution | Status |
|---------------|-------------------|--------|
| P01 | _TBD_ | Proposed / Approved / Implemented |

---

# 7. SUCCESS CRITERIA

## 7.1 KPI Qualitativi

| Criteria | Target |
|----------|--------|
| User Perception | _TBD_ (es. "Professional", "Trustworthy") |
| Visual Consistency | _TBD_ |
| Learning Curve | _TBD_ |

## 7.2 Validazione

| Method | Description | When |
|--------|-------------|------|
| _TBD_ | | |

---

# CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Jan 2026 | Initial structure created |

