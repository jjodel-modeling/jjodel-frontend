# Slice 0 — Checkbox native invisibili: verifica mirata, poi fix

**Data**: 2026-08-05
**Tipo**: two-phase. **Fase 1 read-only con hard stop.** La Fase 2 parte solo dopo go-ahead esplicito di Alfonso.
**Repo**: `jjodel`, branch `alfonso-frontend-jjtl`, working tree locale. Il working tree **non e' pulito**: ogni `git add` e' per file espliciti, mai `git add .`.
**Critical zone**: non toccata.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Il fatto

`frontend/src/styles/tokens/index.scss:106-112` nasconde **globalmente** ogni checkbox nativo:

```scss
input[type="checkbox"] {
  position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
}
```

Il blocco che avrebbe dovuto ridisegnarlo, `::before` con `width`, `height` e `border` alle righe 115-132, **e' commentato**. Restano attive le sole regole di stato (`:checked`, `:hover`, `:focus`, `:disabled`, righe 143-174), che colorano uno pseudo elemento mai dimensionato. `index.scss` e' importato da `src/App.scss:6`, quindi la regola vale su tutta l'applicazione.

Il censimento del 5 agosto (`docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md`, §2.1) conta **30 occorrenze di `<input type="checkbox">` in 21 file**, visibili solo dove il componente ridefinisce il proprio stile: 19 file SCSS lo fanno, gli altri no. Un caso e' gia' accertato: `.viewpoint-checkbox` in `NestedView.tsx:155-162` non renderizza lo `<span className="viewpoint-checkbox__custom">` che il fratello radio invece renderizza, quindi il controllo e' un `<label>` vuoto e circa 130 righe di CSS sono irraggiungibili.

## Perimetro: solo le superfici vive

Il censimento ha stabilito che 17 pagine su 21 sono morte. **Le uniche superfici che contano** sono:

- `#/allProjects`: dashboard, project card, catalog, `LeftBar`, `Navbar`;
- `#/project`: dock, tab Metamodel, Model e Documentation, canvas flow, pannello Properties, pannello Viewpoints, pannelli di authoring IR;
- le **modali**: UnifiedSettings, CreateProject, NewViewpoint, NewTransformation, ExecuteTransformation, Import summary, EdgeMarkerEditor, EnvGenWizard, dialoghi JjTL.

Le occorrenze fuori da queste tre superfici vanno **elencate e non toccate**. Non si migra codice che nessuno raggiunge.

## FASE 1 — Verifica mirata (read-only)

### Discovery report: obbligatorio

Salva il report in `docs/discovery/discovery_2026-08-05_checkbox_native_visibilita.md`. Se il file esiste gia', leggilo per intero e aggiungi in coda solo il delta, con intestazione datata. **La Fase 1 non e' completa finche' il report non e' scritto.**

### Cosa produrre

Una tabella con **una riga per ciascuna delle 30 occorrenze**, con queste colonne:

1. `file:riga` dell'`<input type="checkbox">`;
2. **superficie** fra le tre vive, oppure `FUORI PERIMETRO`;
3. **classe o wrapper** applicato all'input o al suo contenitore;
4. **esiste un override locale** che ne ripristina la visibilita'? Con `file:riga` della regola SCSS che lo fa, oppure `NO`;
5. **verdetto**: `VISIBILE`, `INVISIBILE`, oppure `SOSTITUITO` quando l'input e' volutamente nascosto perche' un elemento fratello lo rappresenta (il pattern legittimo input nascosto piu' `<span>` custom);
6. **cosa fa il controllo**, in cinque parole, e su cosa scrive.

Per il verdetto non fermarti alla presenza di una regola: verifica che l'override **dimensioni davvero** l'elemento visibile, perche' il difetto originale e' proprio una regola di colore su un elemento senza dimensioni.

### Tre domande da chiudere nel report

- **Da quando**: `git log -S` sulla riga di `index.scss:106` per datare l'introduzione della regola globale e, separatamente, il commento del blocco di ridisegno. Servono le due date e i due commit.
- **Chi dipende dal nascondimento**: quali componenti usano volutamente il pattern input nascosto piu' span custom. Sono quelli che si romperebbero se la regola globale venisse rimossa senza altro. Elencali, sono il vincolo della Fase 2.
- **`ui/Checkbox`**: leggi `src/components/ui/Checkbox/Checkbox.tsx` e il suo module CSS e dichiara se, cosi' com'e', e' una destinazione valida per le occorrenze con verdetto `INVISIBILE`, oppure cosa gli manca. Ha zero call site, quindi non e' mai stata provata sul campo.

**HARD STOP.** Chiudi qui, consegna il report, non modificare nulla.

## FASE 2 — Fix (solo dopo go-ahead)

Non eseguire senza conferma esplicita. Contenuto atteso, da confermare alla luce del report:

1. **Rimuovere il nascondimento globale** di `tokens/index.scss:106-112` e le regole di stato orfane delle righe 143-174, oppure restringerlo con un selettore che colpisca solo i componenti che usano davvero il pattern input nascosto piu' span custom. La scelta fra le due dipende da quanti sono: se sono pochi, si restringe; se sono tanti, si rimuove e si adegua ciascuno.
2. **Migrare a `ui/Checkbox`** le sole occorrenze con verdetto `INVISIBILE` dentro il perimetro vivo.
3. **Non toccare** le occorrenze `SOSTITUITO`, quelle fuori perimetro, e nessun altro controllo booleano: i toggle non fanno parte di questa slice.
4. Il blocco commentato alle righe 115-132 va **rimosso**, non ripristinato: e' codice morto che documenta un'intenzione superata.

Un commit per ciascun punto, con verifica visiva di Alfonso fra l'uno e l'altro. Nessun rename di classi esistenti. Prima di introdurre qualunque nome nuovo, ricerca globale di collisione.

## Cosa NON fare

- Nessuna modifica in Fase 1, nemmeno banale.
- Nessun `git add` e nessun commit in Fase 1: il report resta untracked, lo committa Alfonso.
- Nessuna modifica a `CLAUDE.md`: gli emendamenti sono in un task separato.
- Nessun intervento sui toggle, che appartengono a una slice successiva e hanno un canone di colore appena ratificato (cyan `#0ea5e9`).

## RIFERIMENTI

**I documenti che iniziano con `claude/` vivono nel knowledge base di progetto e non esistono nel repo: non cercarli.**

- Nel repo, da leggere davvero: `CLAUDE.md`, `docs/claude-code-log.md`, `docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md` (§2, §2.1, §14).
- Contesto di piano, per Alfonso: `claude/ratifiche_2026-08-05_design_system_piattaforma.md`.
