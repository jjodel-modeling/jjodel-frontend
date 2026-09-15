# Jjodel Website Redesign — Strategic Brief

> Documento da caricare come knowledge nel progetto Claude dedicato a Jjodel.
> Versione: v1.1 — Aprile 2026

---

## 1. Contesto e Motivazioni

**Jjodel** è una piattaforma open-source di metamodeling web-based, collaborativa, pensata per ricerca e didattica. Il sito attuale (jjodel.io) è realizzato in WordPress + Elementor.

### Problemi identificati

- **Troppo statico**: il sito appare come una brochure, non trasmette un progetto vivo e in evoluzione.
- **Comunicazione debole**: il messaggio "open-source modeling for research and education" è generico — non spiega cosa Jjodel *fa* concretamente né perché è diverso.
- **Manutenzione pesante**: aggiornare contenuti in WordPress/Elementor introduce complessità accidentale — ironica per un progetto che si propone di ridurla.

### Decisione

Redesign completo con migrazione da WordPress a un generatore di siti statici, adottando il principio **GitHub come single source of truth**.

---

## 2. Stack Tecnologico

### Scelta: Astro + Starlight

| Aspetto | Motivazione |
|---------|-------------|
| **Astro** | Framework per siti content-driven, zero JS di default, isole interattive React dove servono |
| **Starlight** | Plugin Astro per documentazione, Markdown-native, search integrata, sidebar automatica |
| **Perché non Docusaurus** | Docusaurus è ottimo per siti "docs-only"; Jjodel.io è un sito progetto completo (landing, team, pubblicazioni, sponsor) con docs integrate — Astro è più flessibile |

### Stato attuale della documentazione

**Repo GitHub**: https://github.com/jjodel-modeling/jjodel-docs — attualmente **vuota**.

Tutta la documentazione vive oggi dentro WordPress, distribuita sulle seguenti pagine:

| Sezione | URL WordPress | Contenuto |
|---------|--------------|-----------|
| Get Started | https://www.jjodel.io/get-started/ | Overview e istruzioni di setup |
| Video Pills | https://www.jjodel.io/video-tutorials/ | Introduzioni concettuali video |
| Tutorials | https://www.jjodel.io/tutorials/ | Esercizi pratici guidati |
| User Guide | https://www.jjodel.io/manual/ | Documentazione funzionale dettagliata |
| Glossary | https://www.jjodel.io/glossary/ | Definizioni dei concetti chiave |
| FAQ | https://www.jjodel.io/faq/ | Risposte rapide |
| Publications | https://www.jjodel.io/publications/ | Fondamenti scientifici |
| Presentations | https://www.jjodel.io/presentations/ | Talk e contributi a conferenze |

Inoltre dal menu laterale visibile nel sito emerge la struttura della documentazione tecnica:

```
User Interface
├── Sign-In
├── Registration
├── Password Recovery
├── Dashboard
├── New Project
├── Metamodel Editor
├── Tree-View (Metamodel)
├── Tree-View (Model)
└── Viewpoint
    ├── Applied To
    ├── Template
    ├── Style
    ├── Events
    └── Options
Node
Console
Basic Notions
Project Structure
```

E ci sono anche le sezioni comparative:
- LSP/GLSP vs Jjodel
- EMF vs Jjodel
- Co-evolution in Jjodel, EMF/Sirius, and MetaCase+

### Lavoro di migrazione necessario

Il materiale va **estratto da WordPress, razionalizzato e riscritto** in Markdown nella repo `jjodel-docs`. I problemi attuali:
- Probabili **ridondanze** tra sezioni (es. Get Started vs User Guide vs Tutorials)
- Contenuti da **aggiornare** in vista della nuova release di Jjodel
- Struttura da **semplificare** — l'utente non dovrebbe dover capire la differenza tra 6 tipi diversi di documentazione
- La documentazione deve essere **la stessa** usata in-app e nel sito (single source of truth)

### Architettura target

```
jjodel-docs (repo GitHub — da popolare)
├── getting-started/           ← quick start unificato
│   ├── index.md
│   ├── sign-in.md
│   └── first-project.md
├── user-guide/                ← documentazione per feature
│   ├── dashboard.md
│   ├── metamodel-editor.md
│   ├── tree-views.md
│   ├── viewpoints.md
│   ├── nodes.md
│   └── console.md
├── tutorials/                 ← esercizi pratici (step-by-step)
│   ├── tutorial-01-basic.md
│   └── tutorial-02-viewpoint.md
├── concepts/                  ← nozioni di base e glossario unificati
│   ├── basic-notions.md
│   ├── project-structure.md
│   └── glossary.md
├── comparisons/               ← confronti tecnici
│   ├── vs-emf.md
│   ├── vs-lsp-glsp.md
│   └── co-evolution.md
├── faq.md
└── video-pills.md             ← indice dei video con link

jjodel-website (nuova repo GitHub)
├── src/
│   ├── pages/                 ← pagine del sito (landing, about, teaching, sponsor)
│   ├── content/               ← content collections Astro
│   │   ├── activity/          ← feed unificato: talk, keynote, release, project news
│   │   └── publications/      ← pubblicazioni scientifiche (paper con DOI, abstract)
│   ├── components/            ← componenti Astro + React (hero, demo, feed)
│   └── layouts/
├── public/                    ← assets statici (logo, immagini)
└── astro.config.mjs           ← configurazione con Starlight per docs
```

La repo `jjodel-docs` viene collegata al sito (via git submodule o copia in CI) e resa come sezione `/docs/` tramite Starlight. La stessa sorgente Markdown viene usata in-app e nel sito.

#### Principio anti-duplicazione per i contenuti del sito

Ogni informazione vive in un solo posto. Le regole:

- **Pubblicazioni scientifiche** (paper con autori, DOI, abstract): vivono in `content/publications/`. Compaiono nella pagina Research con dettaglio completo. Compaiono anche nel feed "Latest activity" della home come riga minima (tipo + titolo + venue), generata automaticamente dalla stessa sorgente.
- **Talk, keynote, conference talk**: vivono in `content/activity/` come entry del feed. Non hanno una pagina propria. Compaiono solo nel feed "Latest activity" della home.
- **Release notes, project news, aggiornamenti**: vivono in `content/activity/`. Compaiono solo nel feed.
- **La pagina Research non contiene talk o keynote.** Solo pubblicazioni scientifiche.
- **Non esiste una pagina News separata.** Il feed "Latest activity" nella home è il feed delle novità. Se serve un archivio completo, un link "View all" in fondo porta a `/activity/` (pagina di servizio, non nella nav principale).

---

## 3. Target e Priorità

### Gerarchia degli utenti (dalla priorità più alta)

| # | Target | Cosa cercano | Cosa devono trovare subito |
|---|--------|-------------|---------------------------|
| 1 | **Ricercatori/accademici** | Perché Jjodel è diverso, fondamenti scientifici | Paper, confronti (vs EMF, vs GLSP), architettura |
| 2 | **Studenti universitari** | Come partire, tutorial pratici | Get started in 2 min, tutorial step-by-step |
| 3 | **Reviewer EU/bandi** | Impact, partner, numeri, sostenibilità | Team, partner, progetto AIM-PRO, pubblicazioni |
| 4 | **Contributor open-source** | Come contribuire, issue aperte | Link al repo, contributing guide, roadmap |

---

## 4. Struttura del Sito (Sitemap)

### Navigazione principale

```
Home
├── Why Jjodel          → posizionamento, value proposition, differenziatori
├── Get Started         → zero-to-hero in 2 minuti (link a app.jjodel.io)
├── Docs ↗              → documentazione Starlight (dalla repo docs)
├── Research            → solo pubblicazioni scientifiche
└── Community           → team, partner, contributing
```

### Pagine chiave

**Home (Landing)**
- Hero con messaggio forte + demo visiva interattiva o animazione
- 3 pilastri (Cloud, Visual, Multi-View) con micro-demo, non solo testo
- **Latest activity**: feed cronologico misto (talk, keynote, paper, release, project news). Mostra le ultime N entry. Link "View all" porta a `/activity/` (archivio completo, non nella nav). Titolo sezione: "Latest activity" in H2 22px con sottotitolo "Talks, publications, and project updates".
- Social proof: loghi partner, progetto EU
- CTA primaria: "Try Jjodel" → app.jjodel.io
- CTA secondaria: "Read the docs"

**Why Jjodel**
- Il problema (complessità accidentale negli strumenti MDE)
- L'approccio Jjodel (reactive, cloud, JSX-based)
- Confronti diretti: vs EMF/Sirius, vs LSP/GLSP, vs MetaEdit+
- Il concetto di "tool transparency" (dal keynote MODELSWARD 2025)

**Research**
- Solo pubblicazioni scientifiche: paper con autori, DOI, abstract, link al fulltext
- Sezione "Foundations" che spiega il background scientifico
- Niente talk, keynote o conference presentation (quelli stanno nel feed della home)

**Community**
- Team con foto e ruoli
- Partner (UnivAQ, MDU, FBK)
- Come contribuire (link a GitHub, issue etichettate "good first issue")
- Prossimi eventi

---

## 5. Messaggi Chiave per Audience

| Audience | Messaggio | Dove nel sito |
|----------|-----------|---------------|
| Ricercatori MDE | "Prototipa e condividi DSL senza setup, direttamente nel browser" | Hero, Why Jjodel |
| Docenti | "Fai fare modellazione agli studenti senza barriere di installazione" | Why Jjodel |
| Studenti | "Impara MDE con uno strumento moderno, collaborativo, gratuito" | Get Started |
| Practitioner | "Low-code modeling: crea DSL custom senza Eclipse/EMF" | Why Jjodel |
| Contributor | "Contribuisci a un tool di ricerca open-source con impatto reale" | Community |
| Reviewer EU | "Cloud-based, collaborative, part of AIM-PRO, published in SoSyM" | Research, Community |

---

## 6. Requisiti di "Dinamicità"

Il sito deve trasmettere che Jjodel è un progetto vivo. Concretamente:

### Contenuti auto-aggiornanti
- **Release badge**: ultima versione da GitHub API
- **Commit activity**: indicatore di attività recente nel repo
- **Prossimo evento**: widget che mostra il prossimo talk/tutorial

### Interattività
- **Hero demo**: componente React embedded che mostra Jjodel in azione (anche solo un'animazione del workflow)
- **Playground link**: CTA diretto a app.jjodel.io con un modello di esempio precaricato
- **Search nella documentazione**: search full-text via Starlight (Pagefind integrato)

### Facilità di aggiornamento
- Aggiungere un'attività (talk, release, news) = creare un file .md in `content/activity/`
- Aggiungere una pubblicazione = aggiungere un entry MD in `content/publications/` (compare sia in Research che nel feed della home)
- Aggiornare docs = push sulla repo docs (riflesso automatico nel sito via CI)

---

## 7. Brand e Visual Identity

### Elementi da preservare
- Logo Jjodel (versione colore e gialla)
- Palette attuale (da estrarre dal sito WordPress)
- Identità "friendly but rigorous" — non enterprise, non giocattolo

### Elementi da ripensare
- Typography: più moderna e leggibile
- Layout: aria, spazio, gerarchia visiva chiara
- Illustrazioni: preferire screenshot reali e diagram puliti a stock imagery
- Tone of voice: diretto, tecnico ma accessibile, con personalità

---

## 8. Piano di Lavoro (Fasi)

| Fase | Attività | Output |
|------|----------|--------|
| **0. Audit contenuti** | Estrarre e catalogare tutti i contenuti dalle pagine WordPress; identificare ridondanze, gap e contenuti obsoleti | Inventario completo con indicazione: tenere / riscrivere / eliminare |
| **1. Docs migration** | Strutturare la repo `jjodel-docs` con l'architettura target; scrivere i contenuti in Markdown | Repo docs popolata e navigabile |
| **2. Setup sito** | Creare repo sito, configurare Astro + Starlight, collegare repo docs | Scheletro navigabile |
| **3. Landing** | Progettare e implementare la home page (incluso feed "Latest activity") | Home funzionante |
| **4. Content pages** | Migrare e riscrivere i contenuti chiave (Why, Research, Community) | Pagine principali |
| **5. Activity feed** | Setup content collection `activity/` + `publications/`, logica di merge per il feed, pagina archivio `/activity/` | Feed attivo e auto-alimentato |
| **6. Polish** | Design system, responsive, SEO, performance | Sito production-ready |
| **7. Deploy** | CI/CD su GitHub Pages o Netlify/Vercel, redirect da WordPress | Lancio |

---

## 9. Domande Aperte (da risolvere nel progetto)

- [x] ~~La repo docs ha una struttura stabile?~~ → **No, la repo è vuota.** La documentazione va estratta da WordPress, razionalizzata e scritta in Markdown.
- [x] ~~Serve una pagina News separata?~~ → **No.** Il feed "Latest activity" nella home è il feed delle novità. L'archivio completo sta in `/activity/` (pagina di servizio).
- [x] ~~Dove vanno talk e keynote?~~ → **Solo nel feed "Latest activity" della home.** Non in Research (che contiene solo pubblicazioni scientifiche).
- [ ] Serve un dominio separato per i docs (docs.jjodel.io) o tutto sotto jjodel.io/docs?
- [ ] Il logo e la palette sono definiti in un design system o vanno estratti dal WordPress?
- [ ] C'è un'istanza di Jjodel "demo" pubblica da linkare/embeddare nella hero?
- [ ] Hosting preferito? (GitHub Pages è gratis e coerente, Netlify/Vercel hanno più feature)
- [ ] Quali contenuti delle pagine WordPress sono ancora attuali e quali vanno riscritti per la nuova release?
- [ ] I video pills hanno un canale YouTube/hosting dedicato o sono embedded da WordPress?
- [ ] Le pagine comparative (vs EMF, vs GLSP, co-evolution) sono aggiornate o vanno riviste?
