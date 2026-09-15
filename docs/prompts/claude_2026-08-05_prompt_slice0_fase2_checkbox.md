# Slice 0 — Fase 2: rimozione del nascondimento globale e riparazione dei controlli invisibili

**Data**: 2026-08-05
**Tipo**: implementazione scoped. **Go-ahead concesso** sulla base di `docs/discovery/discovery_2026-08-05_checkbox_native_visibilita.md`.
**Repo**: `jjodel`, branch `alfonso-frontend-jjtl`. Il working tree **non e' pulito**: ogni `git add` e' per file espliciti, mai `git add .`.
**Critical zone**: non toccata.
**Tre commit, con hard stop e verifica visiva di Alfonso fra l'uno e l'altro.**

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Rileggi il report di Fase 1: questo prompt lo presuppone e non lo ripete.

## Decisioni prese sulle due domande aperte

**OQ-1, i tre controlli in markup da toggle: si riparano in questa slice, ma verso `ui/Toggle`, non verso `ui/Checkbox`.** La regola semantica gia' ratificata dice che una proprieta' booleana che si applica nell'istante in cui la cambi e' un toggle, e le preferenze di notifica e l'opzione legacy del provider selector lo sono. Migrarli a checkbox metterebbe un quadrato in una riga disegnata per un interruttore, e andrebbero rifatti alla prima slice sui toggle. Rimandarli invece li lascerebbe invisibili per settimane, che e' il difetto che questa slice esiste per chiudere.

Non e' un allargamento di scope: l'obiettivo della slice e' che nessun controllo del perimetro vivo resti invisibile, e la destinazione la decide la semantica del controllo, non la primitiva da cui parte. Si toccano **solo i tre call site rotti**, nessuno dei trentuno gia' funzionanti.

**OQ-2, `NestedView.tsx:157`: fuori da questa slice, e non si ripristina.** Il pattern e' corretto ma manca lo `<span>` e l'`onChange` e' un TODO vuoto: ripristinare lo span renderebbe visibile un controllo che non fa nulla. Il progetto ha gia' deciso come si tratta questo caso quando ha marcato inerte il tab Events invece di ripararlo, e ha gia' classificato come bug ad alta priorita' il tab Template proprio perche' accetta edit senza effetto. Una checkbox invisibile e inerte e' innocua; una checkbox visibile e inerte e' una superficie di authoring che mente. Resta com'e', e diventa un item di backlog con due sole uscite: implementare la selezione overlay, oppure rimuovere il controllo dal JSX. Verifica soltanto che dopo il commit 1 resti nascosta, cosa che il report da' per assodata perche' `nestedView.scss:1243` la nasconde con regole proprie.

## Perche' la Fase 2 cambia ordine

Il report segnala che cinque override **dimensionano senza smascherare**: danno `width`, `height` e `accent-color` senza toccare `opacity`, `position` e `pointer-events`. Sono controlli che il nascondimento globale rende invisibili e che, tolto quello, **tornano visibili da soli**, con lo stile che il loro autore aveva scritto.

Non sappiamo quanti degli otto siano in questo caso finche' la riga 106 non e' rimossa. Migrare tutti e otto prima di saperlo significa riscrivere call site che si sarebbero riparati da soli, e sostituire uno stile locale voluto con una primitiva che nessuno aveva scelto li'.

Quindi la rimozione viene **prima e da sola**, e il conteggio di cosa resta rotto si fa dopo, guardando.

## Commit 1 — Rimozione della regola globale

**File**: `frontend/src/styles/tokens/index.scss`, solo questo.

- Rimuovi il blocco di nascondimento, righe 106-112.
- Rimuovi nella **stessa commit** le regole di stato orfane, righe 143-174. Il report e' esplicito: oggi colorano uno pseudo elemento senza `content`, ma tolto il nascondimento comincerebbero a mordere su ogni `label:has(input[type=checkbox])` dell'applicazione. Le due rimozioni sono una cosa sola e non vanno separate.
- Rimuovi il blocco commentato alle righe 115-132. Non ripristinarlo: e' codice morto che documenta un'intenzione che il commit `3979b5e1a` ha superato deliberatamente.
- Non toccare altro nel file.

**Verifica visiva di Alfonso** sulle tre superfici vive, con attenzione a due cose: che nessun controllo prima corretto sia peggiorato, e **quali degli otto siano tornati visibili da soli**.

**Poi fermati e riporta l'elenco aggiornato**: per ciascuno degli otto, se dopo questa commit e' visibile e usabile, oppure ancora rotto. E' l'input che dimensiona i due commit successivi. Nessuna migrazione prima di questo elenco.

**Commit**: `fix(styles): stop hiding native checkboxes globally`. **Hard stop.**

## Commit 2 — I rimasti con semantica da checkbox

Solo i call site **ancora rotti dopo il commit 1** e con semantica da checkbox, cioe' selezione dentro un insieme o opzione di un form: attesi fra `NodeEditor.tsx:522`, `NodeEditor.tsx:562-567`, `PromptsSettingsSection.tsx:74`, `AdvancedSettings.tsx:70`, `JjtlPromptDialog.tsx:103`, salvo quelli che il commit 1 ha gia' sistemato.

Migra a `ui/Checkbox`, che il report dichiara immune per costruzione perche' rende un `<button role="checkbox">` e non un `<input>`. Nessuna delle tre lacune note (indeterminate, evento perso nell'`onChange`, spread di `aria-label`) tocca questi call site.

Attenzione a `NodeEditor.tsx`: il report ha accertato che il ripristino di `info.scss:881` e' agganciato alla classe esatta `.properties-panel`, mentre `NodeEditor` e' montato sotto `.properties-panel-container`, quindi il selettore non lo raggiunge. **Non allargare quel selettore**: e' un ripristino difensivo che dopo il commit 1 non serve piu' a nessuno, e ritoccarlo significherebbe curare il sintomo di un difetto appena rimosso.

Non rinominare classi esistenti. Prima di introdurre qualunque nome nuovo, ricerca globale di collisione.

**Commit**: `fix(ui): migrate broken native checkboxes to ui/Checkbox`. **Hard stop.**

## Commit 3 — I tre con semantica da toggle

Solo se ancora rotti dopo il commit 1: `NotificationsSection.tsx:145`, `NotificationsSection.tsx:177`, `ProviderModelSelector.tsx:192`.

Migra a `ui/Toggle`, che e' la primitiva canonica, **non** a `.settings-toggle-switch`: quella e' una delle quattordici implementazioni censite e destinata a sparire, quindi replicarla aumenterebbe il debito che stiamo riducendo. Il canone del colore acceso e' cyan `#0ea5e9`, ratificato il 5 agosto, e `ui/Toggle` lo rispetta gia'.

**Se il CSS della riga esistente confligge** con la struttura di `ui/Toggle`, cioe' se il layout della riga si rompe, **fermati e segnala** invece di riscrivere il layout: rifare la riga di Settings non appartiene a questa slice.

**Commit**: `fix(ui): migrate broken toggle-shaped checkboxes to ui/Toggle`. **Hard stop.**

## Cosa NON fare

- Non toccare `NestedView.tsx`, per la decisione su OQ-2.
- Non toccare le occorrenze fuori perimetro, quelle con verdetto `VISIBILE`, quelle `SOSTITUITO` e le sette morte o commentate.
- Non toccare nessuno dei trentuno call site di `ui/Toggle` gia' funzionanti.
- Non rimuovere i diciannove override difensivi che dopo il commit 1 diventano ridondanti: sono debito noto, si chiudono nella slice sui controlli booleani. **Elencali nel report di chiusura**, non nel diff.
- Non modificare `CLAUDE.md`: gli emendamenti sono un task separato.
- Nessun `git add .`.

## Chiusura

Aggiorna `docs/claude-code-log.md` a fine slice, dopo la conferma visiva di Alfonso, con una entry sola per i tre commit. Nel report di chiusura riporta: l'elenco degli otto con l'esito finale, i diciannove override ora ridondanti, e se il commit 1 ha prodotto effetti su superfici che nessuno si aspettava.

## RIFERIMENTI

**I documenti che iniziano con `claude/` vivono nel knowledge base e non esistono nel repo: non cercarli.**

- Nel repo: `CLAUDE.md`, `docs/claude-code-log.md`, `docs/discovery/discovery_2026-08-05_checkbox_native_visibilita.md`, `docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md`.
- Per Alfonso: `claude/ratifiche_2026-08-05_design_system_piattaforma.md`, `claude/ratifiche_2026-08-05_2_slice0_checkbox.md`.
