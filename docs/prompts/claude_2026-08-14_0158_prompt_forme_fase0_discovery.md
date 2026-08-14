# Prompt Claude Code: sistema forme, Fase 0 (discovery read-only)

**Nome del documento prompt**: 2026-08-14 01:58
**Tipo**: discovery
**Effort atteso**: xhigh
**Critical zone**: sì in lettura (`portDistribution.ts`, `handlePosition.ts`,
`DynamicHandles.tsx`, `DV.tsx`, `defaultViewTemplate.ts`). Nessuna scrittura.

---

## COSA

Mappare lo stato attuale del sistema delle forme dei nodi nel view layer, in
preparazione di un refactoring che introdurrà un registry di `ShapeDescriptor`.

Questa fase è **read-only sul codice**. Gli unici file che puoi creare o
modificare sono il discovery report e l'entry di log (vedi sezione COMMIT).
Nessuna modifica a file sorgente, nessun fix opportunistico, nessuna
riorganizzazione. Se trovi un bug, lo scrivi nel report e non lo tocchi.

---

## DOVE

I path seguenti sono **candidati da verificare**, non asserzioni. Applica
CLAUDE.md regola 15: greppa prima, e se un path citato qui non esiste, fermati e
segnalalo invece di cercare il "file più simile".

- `frontend/src/common/DV.tsx`
- `frontend/src/utils/defaultViewTemplate.ts`
- `frontend/src/components/editor-v2/EditorV2.tsx`
- `frontend/src/components/editor-v2/utils/portDistribution.ts`
- `frontend/src/components/editor-v2/utils/handlePosition.ts`
- `frontend/src/components/editor-v2/**/DynamicHandles.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/` (VertexAuthoringPanel, irStyle)
- `frontend/src/components/editor-v2/viewpoint/ir/`
- `frontend/src/styles/` (border-radius e forme codificate in SCSS)

---

## COME

Il report deve rispondere a queste domande, ognuna con riferimenti `path:linea`.
Una domanda senza riferimenti puntuali vale come non risposta.

**D1. Dove nasce la forma di un nodo?** Elenca ogni sito in cui la forma è
decisa: enum TypeScript, stringa libera, classe CSS, `border-radius` in SCSS,
path SVG inline, prop React. Per ciascuno: chi lo scrive e chi lo legge.

**D2. Quali forme sono supportate end-to-end?** Distingui le forme *dichiarate*
da qualche parte da quelle che arrivano effettivamente al pixel. Se un valore è
accettato dal DSL ma ignorato dal render, va scritto esplicitamente.

**D3. Come si calcola oggi il punto di attacco di un arco su un nodo?** Traccia
il percorso completo da `handlePosition.ts` (o da dove effettivamente parte) fino
all'elemento renderizzato, con numeri concreti presi da uno scenario reale, non
dalla lettura del codice. Applica CLAUDE.md §5: un comparatore che "sembra
giusto" non è una verifica.

**D4. Quante e quali righe assumono che il nodo sia un rettangolo?** Cerca
assunzioni di bounding box: `width/2`, `height/2`, `x + w`, calcoli di lato
basati su rettangolo. Questo è il numero che dimensiona la Fase 2.

**D5. Esiste già un concetto di contenitore o compartimento?** Chi decide se un
nodo può avere figli, e dove viene applicato il clipping.

**D6. Come viene posizionata e dimensionata l'etichetta di un nodo?** Esiste
qualcosa di assimilabile a un `labelBox`, o il testo è centrato sul bounding box?

**D7. Il view DSL espone la forma?** Con quale sintassi dentro `jsxString`.
Rispondi esplicitamente: **cambiare il vocabolario delle forme richiederebbe una
migrazione `VersionFixer`?** (CLAUDE.md §3.9 e regola 14).

**D8. Esistono già modificatori?** Bordo tratteggiato, ombra, badge, stack,
stereotipi. Dove sono implementati e se passano dalla stessa strada delle forme.

**D9. Che copertura di test esiste sull'area?** File di test, cosa coprono,
cosa no.

**D10. Punti di innesto candidati per un registry.** Proponi da 1 a 3 opzioni,
ordinate per **numero di file che la Fase 2 dovrebbe toccare**, con il conteggio
esplicito per ciascuna. Non scegliere: la decisione è in chat.

### Vincolo metodologico sulle ricerche

CLAUDE.md §5, sotto-regola sul `grep` interattivo: in questa shell `grep` è un
wrapper su `ugrep --ignore-files`, quindi `--include` non filtra e
`--exclude-dir` è inerte. Usa `command grep` quando quei flag portano il
significato della ricerca.

Per ogni asserzione di assenza nel report ("X non esiste", "X non è consumato"),
riporta il comando eseguito, il suo exit status, e un controllo positivo sullo
stesso comando. Un'assenza senza controllo positivo non entra nel report.

Le conte vanno prese su output completo, mai su `| tail -N`, e dichiarate come
tali.

---

## DISCOVERY REPORT (obbligatorio)

- **Path**: `docs/discovery/discovery_2026-08-14_shape_system.md`
- Se la cartella non esiste, creala.
- **Contenuto minimo**: obiettivo, file letti con path completi, risposte D1..D10,
  inventario dei consumatori della geometria dei nodi in forma di tabella
  (`file:linea` → cosa legge → cosa produce → chi lo consuma → è consumato sì/no),
  dipendenze e rischi individuati, domande aperte per Alfonso.
- L'hard stop non è raggiunto finché il report non è scritto su file. L'analisi in
  chat parte dal report, non dalla memoria di sessione.

---

## HARD STOP

Al termine del report: **fermati**. Non proporre diff, non iniziare la Fase 1,
non creare il modulo `shapes/`. Riporta in chat solo:

1. Le tre scoperte che cambiano di più il piano.
2. Il numero della D4 (righe che assumono il rettangolo).
3. Le opzioni di innesto della D10 con il conteggio dei file.

---

## COMMIT

- `git add docs/discovery/discovery_2026-08-14_shape_system.md`
- `git add docs/claude-code-log.md`
- Mai `git add .` o `git add -A` (CLAUDE.md regola 17).
- Messaggio: `docs(discovery): map current node shape system`

Entry in `docs/claude-code-log.md` nel formato §21.2, con:
- **Layer Impact Report**: `not-required` (fase read-only, nessuna scrittura sui layer)
- **Out-of-scope changes**: `no`
- **Regressions**: `no`
- **Corregge**: `—`
- **Causa**: `—`

---

## RIFERIMENTI

- `CLAUDE.md` §3.1 (file in critical zone), §3.9 (jsxString e VersionFixer),
  §3.10 (nota sul `nodeHandles` scartato da `EditorV2.tsx`), §5 (metodologia
  bug visivi, controlli positivi, wrapper `grep`), §17 (gate di verifica),
  §21.2 (formato entry di log)
- `docs/PROTOCOL.md` P1..P9
- `docs/discovery/2026-05-27_anchor_ordering_inversion.md`: discovery aperta
  sull'ordinamento delle ancore. **Non intrecciare i due lavori.** Se il tuo
  tracciamento di D3 tocca quel bug, annotalo nel report e prosegui senza
  proporre fix.
- Documento di piano associato: `2026-08-14_piano_sistema_forme.md` (chat di
  progetto), modello a quattro livelli Contour / ShapePrimitive / Modifier /
  Composite.
