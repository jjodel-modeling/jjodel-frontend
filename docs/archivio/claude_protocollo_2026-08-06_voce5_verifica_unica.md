# Protocollo: voce 5, verifica visiva unica e chiusura della coda arco A

**Data**: 2026-08-06 18:16
**Cosa copre**: l'hard stop unico delle voci 1-4. E-route ha già la sua checklist verde su `423f19f01` e non si ripete: della slice resta il solo punto di regressione dentro il blocco A.
**Come si usa**: preflight da terminale, poi i due blocchi a video su http://localhost:3001/ con hard refresh. Esiti in chat, per blocco (punto per punto solo dove qualcosa è rosso); al GO scatta la chiusura in fondo. Un NO-GO su un punto non ferma il giro: segna l'esito, completa il resto, poi si decide in chat cosa blocca il push e cosa diventa fix.

## Preflight (terminale, due minuti)

- **P-1**: `git log --oneline -12`. Devono esserci `e15eb5081`, `648de9a72`, `fd92b3d1c` e i commit di voce 2 e `chore: regenerate AGENTS.md`. Se voce 2 o il regen mancano, farli atterrare prima: sono prerequisiti dichiarati della voce 5.
- **P-2**: `git status --short` pulito, a parte `CLAUDE-BAK-NOT-TO-USE.md` untracked (resta finché non lo elimini a mano, a coda chiusa).
- **P-3**, effetto della voce 2: `git check-ignore -v frontend/src/jjtl/CLAUDE.md` non restituisce nulla (non più ignorato) e `git ls-files frontend/src/jjtl/CLAUDE.md` lo elenca (le 156 righe sono tracciate). `.gitignore:61` dice `/CLAUDE.md`.
- **P-4**: `docs/decisions.md` ha la riga R-H in coda alla sezione Arco A; `AGENTS.md` rigenerato e coerente con gli edit di `CLAUDE.md`.
- **P-5**: `npm run check:docs` 2/2 PASS (i 4 warning noti del resolver non contano).

Setup video: un progetto con vertex view IR, row view IR, edge view IR di natura object (es. Transition2), edge view IR di natura reference, una default view, una view classic senza `ir`. Advanced attivo; passaggio in Basic dove indicato.

## Blocco A: la barra (voce 4, i 12 punti come percorso)

- **A-1** (punto 1): vertex view IR. Cinque tab (Applies to · Structure · Appearance · Text · Source) coi contenuti della mappa; un edit non salvato (testo della label) sopravvive al giro completo dei tab; nessuno spostamento di layout al cambio tab.
- **A-2** (punto 6): stessa vertex. In Basic il matching è raggiungibile in Applies to e Source è assente; tornato in Advanced, Source presente e read-only.
- **A-3** (punto 7): stessa vertex, tab Text. Popover di TextStyleField aperto, click su un header di tab: si chiude.
- **A-4** (punto 8): tabulando con la tastiera dai campi visibili, il focus non entra mai in controlli di tab nascosti.
- **A-5** (punto 3): row view IR. Solo Applies to e Text; nessuna traccia di Structure e Appearance.
- **A-6** (punto 2): edge view IR, entrambe le nature. Structure mostra natura e capi per la object (la reference vive col matching in Applies to, esito Q2); il Select Routing sta in Appearance e cambia il routing a caldo (regressione E-route); un edit non salvato dei capi sopravvive al cambio tab, con gli avvisi di divergenza identici a prima.
- **A-7** (punto 11): su una view IR, Name editabile da Applies to col rename riflesso su card e tree; cambio Viewpoint funzionante (comportamento di oggi, limite noto del father compreso). Su una **default view**: Name, Viewpoint e Parent view in sola lettura.
- **A-8** (punto 4): view senza `ir`. Barra identica a prima, Template read-only di S2 compreso.
- **A-9** (punto 5): striscia d'errore visibile da ogni tab (rendi una view momentaneamente invalida); i tre messaggi cross-tab nominano il tab nel testo.
- **A-10** (punto 10): padding orizzontale dei pannelli invariato su entrambi gli host (pannello singolo e con tree view): nessun collasso.
- **A-11** (punto 12): nessuna breadcrumb visibile.
- **A-12** (punto 9): il resto invariato: canvas, edge M2 del class diagram, view classic.

## Blocco B: i capi (voce 1, mai passata a video)

Su una edge view IR di natura object:

- **B-1**, caso A (C-1): coppia valida committata, poi svuota un capo. La linea sul canvas resta; il messaggio dichiara le due cose: la coppia precedente resta attiva finché entrambi i capi non tornano validi, e uscendo la modifica incompleta si perde.
- **B-2**, caso B (C-2): edge view fresca, natura object, un solo capo digitato. Compare l'avviso di lavoro non salvato; esci e rientra: il testo è perso (comportamento noto), ma era stato avvisato.
- **B-3**: entrambi i capi validi. La coppia committa e ogni avviso sparisce.
- **B-4** (C-3): nessun messaggio usa "salvati" riferito al draft (la finestra dei 300 ms rende quella parola falsa).
- **B-5**: warning di ambiguità (metaclasse dichiarata in più metamodelli; es. "View for Event" nel progetto "Class Diagram"). Il testo nuovo descrive la risoluzione reale: la metaclasse fissata alla scelta (il pin). È triplicato in tre pannelli: verificarlo in almeno due.

## Falsi positivi noti (non sono regressioni: non fermano il GO)

Lingua mista tab inglesi/label italiane (rinvio deliberato R-4, pass dedicata). Viewpoint e Parent view identici e adiacenti in Applies to (ricollocazione verbatim R-H, bug del father registrato). `"routing": ""` nel Source e placeholder "Select..." sul Routing (bug registrato, micro-slice post coda). Intro "IR Edge view authoring" ripetuta su tutti i tab, stepper difformi, metaclasse in lista più grande dei titoli (review agli atti, aggiustamenti post coda). Structure quasi vuoto sulla natura reference (esito accettato di Q2). Text magro (cresce con E-lab, congelata).

## Chiusura (dopo il GO)

1. **Push** di `alfonso-frontend-jjtl` (terminale o Claude Code). È il primo push da inizio agosto: porta tutto, dai commit del 4-5 agosto fino a `e15eb5081`, più voce 2 e AGENTS.
2. **Esiti in chat**: scrivo il verbale (`verifica_2026-08-06_voce5_chiusura_coda.md`), consolido `contesto_progetto.md` e mappa, dichiaro la coda chiusa.
3. **Coda nuova**, prima voce già decisa: igiene dei gate (RC-7). Candidate raccolte oggi, da ordinare in chat alla chiusura: micro-slice 3.6 (finestra Style), micro-slice `routing:""` più placeholder, pass di lingua R-4, slice di design del father (sblocca anche la breadcrumb), grappolo igiene (InfoTooltip ×3, stringa B-5 triplicata, test duplicato).
