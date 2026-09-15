# Spec parcheggiata — Dashboard: Templates + Explore

**Stato**: discussione architetturale aperta, implementazione **rinviata a dopo il rilascio della versione 3.0.0**.
**Data ultima discussione**: 2026-04-26
**Per riprendere**: aprire una nuova chat con questo file in knowledge e dire "riprendiamo Templates/Explore".

---

## Contesto

Nella sidebar della Dashboard (sezione **BROWSE**) ci sono due voci che oggi non hanno implementazione:

- **Templates** — galleria curata di progetti esemplari (didattici / starter / case-study)
- **Explore** — discovery feed sociale, organico, della community

Sono complementari per design: **Templates è curato e didattico**, **Explore è organico e sociale**.

---

# Parte 1 — Templates (curato)

## Decisioni chiuse

### Auth e ruoli
- Backend con role-based auth **già esistente** → si aggiunge ruolo `curator` (o `template_curator`).
- Primo curator: `alfonso.pierantonio@univaq.it`. Estendibile a co-docenti/dottorandi.
- La marcatura "is template" è un'operazione amministrativa autorizzata server-side (no flag client-only).

### Modello dati
- **Opzione A scelta**: flag `featured: boolean` su progetti pubblici.
- Un progetto template è un progetto `public` con `featured: true`. Resta visibile anche in "Public".
- Vincolo: solo i progetti `public` possono essere `featured`. Cambiare visibility a `private` deve azzerare `featured`.

### Clone semantics
- Deep copy server-side, nuovi ID, nessun upstream/sync.
- Metadato passivo `_clonedFrom: <templateId>` per analytics future.

### UX
- Click su template → **apertura read-only** + bottone "Clone to my workspace" prominente.
- Banner persistente in alto: "You're viewing a template. Clone it to your workspace to make changes."
- Modale di clone: campo "Project name" precompilato con nome originale, bottoni Cancel / Clone & open.

## API design (bozza)

| Endpoint | Auth | Descrizione |
|---|---|---|
| `PATCH /projects/:id/featured` | role=curator AND project.visibility='public' | Set/unset featured flag |
| `GET /projects?featured=true` | any authenticated | Lista template per la sezione Templates |
| `POST /projects/:id/clone` | any authenticated, target project must be public | Deep copy server-side, ritorna nuovo projectId |

Errori da gestire:
- 400 "Featured projects must be public"
- 403 "Curator role required"
- 403 "Cannot clone private project"

## Decisioni APERTE

1. **Esiste già una modalità read-only nell'editor?** Da verificare nel codebase.
2. **Workflow di marcatura per il curator**: UI integrata sulle card (raccomandato) vs JjScript console vs solo API.
3. **Metadati template**: minimo (nome+autore) replica Public senza dare valore. Da considerare: descrizione didattica, tag (tutorial/example/starter/case-study), difficoltà, screenshot di anteprima, ordine di featuring.
4. **Naming dei cloni**: default = stesso nome dell'originale, modificabile in modale. Suffisso `(1)`, `(2)` se collisione (convenzione progetto).

---

# Parte 2 — Explore (discovery feed sociale)

## Decisioni chiuse

- **Tipologia scelta**: discovery feed orientato al sociale.
- Mostra progetti recenti, trending, e/o di utenti seguiti.
- Complementare a Templates: Templates è curato e statico, Explore è organico e dinamico.

## Decisioni APERTE (da chiudere quando si riprende)

### 1. Cosa entra nel feed (sorgenti)
Sezioni possibili, da scegliere/comporre:

- **Recent**: progetti pubblici creati o aggiornati di recente
- **Trending**: progetti con più clone/like/view in una finestra temporale (es. ultimi 7/30 giorni)
- **From people you follow**: progetti pubblici di utenti seguiti → **richiede sistema di follow** (vedi punto 4)
- **Recommended**: basato su tag/categorie dei progetti che l'utente ha già clonato/aperto
- **New on Jjodel**: progetti recenti dei nuovi utenti (onboarding sociale)

### 2. Layout del feed

- Layout simile a card grid di Templates ma con metadati sociali aggiuntivi (autore, data, conteggi)
- Sezioni orizzontali ("Trending this week", "Recent from your network") con scroll laterale
- Lista cronologica unica con filtri/tab

### 3. Metadati sociali da mostrare

- Author (avatar + nome)
- Created/updated date
- Clone count (quante volte è stato clonato)
- Like/star count (richiede sistema di reaction)
- Tag/category
- Preview/thumbnail del canvas

### 4. Sistema di follow tra utenti

Necessario se la sezione "From people you follow" entra nel feed.
- Modello: `User → follows → User` (relazione many-to-many)
- Endpoint: `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`
- UI: bottone "Follow" sul profilo utente / nelle card progetto
- **Decisione strutturale**: questo è un pezzo di prodotto significativo. Se non si fa il follow, Explore degrada a "Recent + Trending" (più semplice ma meno sociale). Da decidere se è in scope per la prima versione di Explore o no.

### 5. Reactions (like/star)

Necessario per il "Trending" (serve un segnale di popolarità diverso dai clone).
- Modello: `User → likes → Project` (many-to-many)
- Endpoint: `POST /projects/:id/like`, `DELETE /projects/:id/like`
- UI: bottone heart/star sulla card progetto
- Anche questo è un pezzo significativo. Alternativa: usare solo `cloneCount` come segnale di trending (zero infrastruttura social aggiuntiva).

### 6. Privacy e moderazione

Explore espone progetti pubblici di utenti reali a tutti gli utenti reali. Implicazioni:
- Possibile contenuto inappropriato → serve un sistema di flagging/report?
- Utenti devono poter optare-out dal "comparire in Explore" anche se i loro progetti sono pubblici?
- Curator/admin tools per nascondere singoli progetti dal feed senza renderli privati?

### 7. Dimensione MVP

Versione minimissima che ha senso (zero infrastruttura social nuova):
- Tab "Recent" (progetti pubblici recenti) + Tab "Trending" (per cloneCount nelle ultime N settimane)
- Card con autore + data + cloneCount + tag
- Niente follow, niente like, niente notifiche
- Si può sempre arricchire dopo

## Domande strutturali

- Explore è un **destination tab** (utente ci va apposta) o un **discovery push** (sezione sulla home/dashboard che mostra cose anche se non l'hai chiesta)?
- Il feed è personalizzato per utente (richiede tracking di interessi/storia) o è uguale per tutti (più semplice)?

---

# Prossimi passi (quando si riprende, post-3.0.0)

## Templates
1. Verificare nel codebase se esiste già una modalità read-only
2. Decidere workflow marcatura curator
3. Decidere se versione minima senza metadati va bene
4. Generare prompt MD: backend (ruolo + endpoint), frontend (sezione + card), read-only + clone modal

## Explore
1. Decidere dimensione MVP (raccomandazione: Recent + Trending senza social, da espandere dopo)
2. Decidere se follow + like sono in scope per la prima versione o rimandati
3. Decidere policy di privacy/moderazione (opt-out, flagging)
4. Generare prompt dopo che Templates è completato (Explore può riusare card layout, clone flow, viewer read-only di Templates)

---

# Riferimenti
- Convenzione naming duplicati: suffisso `(1)`, `(2)` (CLAUDE.md project root)
- Bug correlato risolto stesso giorno: dashboard default filter su "All projects" (`2026-04-26_1100_dashboard_default_all_projects.md`)
- Sidebar dashboard sezione BROWSE: voci "Templates" + "Explore" oggi presenti ma non implementate (vedi screenshot 2026-04-26)
- **Implementazione: post-3.0.0**
