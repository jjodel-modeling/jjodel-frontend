# Spec parcheggiata — Templates / Featured Projects

**Stato**: discussione architetturale aperta, implementazione **rinviata**.
**Data ultima discussione**: 2026-04-26
**Per riprendere**: aprire una nuova chat con questo file in knowledge e dire "riprendiamo i template".

---

## Obiettivo

Galleria di progetti pubblici curati (template) visibili nella sezione "Templates" della sidebar Dashboard. Gli utenti possono aprirli in read-only e clonarli nel proprio workspace.

---

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
- Metadato passivo `_clonedFrom: <templateId>` per analytics future ("quanti studenti partono da quel template").

### UX
- Click su template → **apertura read-only** + bottone "Clone to my workspace" prominente.
- Banner persistente in alto: "You're viewing a template. Clone it to your workspace to make changes."
- Modale di clone: campo "Project name" precompilato con nome originale, bottoni Cancel / Clone & open.
- Niente pre-modale di preview: l'apertura read-only fa quel ruolo.

---

## API design (bozza)

| Endpoint | Auth | Descrizione |
|---|---|---|
| `PATCH /projects/:id/featured` | role=curator AND project.visibility='public' | Set/unset featured flag |
| `GET /projects?featured=true` | any authenticated | Lista template per la sezione Templates |
| `POST /projects/:id/clone` | any authenticated, target project must be public | Deep copy server-side, ritorna nuovo projectId |

Errori da gestire:
- 400 "Featured projects must be public" (tentativo di featured su private)
- 403 "Curator role required" (utente non curator prova a featurare)
- 403 "Cannot clone private project" (clone su progetto non public)

---

## Decisioni APERTE (da chiudere quando si riprende)

### 1. Esiste già una modalità read-only nell'editor?

Necessaria per l'apertura template. Se non esiste va creata, e tocca: canvas drag, context menu, transformation editor, console. **Da verificare nel codebase prima di stimare.**

Versioni possibili:
- Esiste già un flag → riutilizzarlo
- Non esiste → crearlo (flag `isReadOnly` nel project context, propagato a tutti gli editor)
- Bypass: niente read-only vero, solo modale di preview con metadati e bottone "Clone & open"

### 2. Workflow di marcatura per il curator

Tre opzioni sul tavolo:
- UI integrata: bottone "Mark as template" / "Unmark as template" sulle card dei progetti pubblici, visibile solo se `currentUser.role === 'curator'`. **(Raccomandazione)**
- Comando JjScript da console (es. `featured set <projectId>`)
- Solo endpoint API, no UI (curl/Postman)

### 3. Metadati template (qualità della galleria)

Una galleria con solo nome + autore replica la sezione Public e non comunica perché vale la pena guardare lì. Aggiunte possibili:
- Descrizione didattica (campo `templateDescription` separato dalla description normale del progetto)
- Tag tipo "tutorial / example / starter / case-study"
- Livello di difficoltà
- Screenshot di anteprima (la card mostra una preview del canvas invece del placeholder bianco)
- Ordine di featuring (curator sceglie l'ordine, non solo il flag)

Decisione di design: **una prima versione minima senza metadati va bene per partire?** O serve già almeno descrizione + screenshot per dare senso alla galleria?

### 4. Naming dei cloni
- Default: stesso nome dell'originale, l'utente può modificare nella modale di clone
- Eventuale collision detection nel workspace dell'utente (suffisso `(1)`, `(2)` come da convenzione progetto)

---

## Prossimi passi quando si riprende

1. Verificare nel codebase se esiste già una modalità read-only (decisione aperta #1)
2. Decidere workflow marcatura (decisione aperta #2)
3. Decidere se versione minima senza metadati va bene (decisione aperta #3)
4. Generare 2-3 prompt MD separati: backend (ruolo + endpoint), frontend (sezione Templates + card), read-only + clone modal

---

## Riferimenti
- Convenzione naming duplicati: suffisso `(1)`, `(2)` (CLAUDE.md project root)
- Sidebar Templates oggi: presente ma vuota (vedi screenshot 2026-04-26)
- Bug correlato risolto stesso giorno: dashboard default filter su "All projects" (`2026-04-26_1100_dashboard_default_all_projects.md`)
