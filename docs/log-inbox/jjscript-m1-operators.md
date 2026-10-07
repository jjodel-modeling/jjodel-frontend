# log-inbox — lane «jjscript-m1-operators» (#175)

Entries written by the #175 lane (JjScript at M1: `+=`, `-=`, `remove`, the link type check and
instance names) on branch `fix/175-jjscript-m1-operators`, main worktree. Whoever closes the batch
moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this
file. The active log is not touched by this lane.

---

## 2026-10-07 — fix(#175): JjScript a M1, -= e remove tolgono, += non sostituisce, link tipati, nomi senza virgolette
**Prompt**: chat di Juri: «pianificare la risoluzione della issue 175 e passare alla risoluzione per la chiusura». Fase 1 con sonda e referto, quattro domande; Juri ha adottato le quattro raccomandazioni (eseguire `-=`/`remove` rifiutando l'orfano nato nello slot, `+=` rifiutato su singolo occupato, controllo di tipo nell'esecutore, avanti fino alla chiusura).
**Files touched**: referto `ab830b5fd`: `docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md`. Codice `cb02e6a2b`: `jjscript/executor/referenceWrite.ts`, `executor/commands/instance.ts`, `executor/commands/remove.ts`, `executor/commands/rename.ts`, `parser/parser.ts`, `executor/__tests__/referenceWrite.test.ts`, `__tests__/parser.test.ts`, `executor/__tests__/m1Operators.test.ts` (nuovo). Docs: `docs/decisions.md` (R-JS-12..15), addendum del referto, questa inbox (nuova). Branch da `a279f8104`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output completo **14**, stesso insieme per file e codice; `npm run test` 7938 passati, i 9 file di §17 rossi all'import; `npm run build` exit 0; sonda `_tmp_175_measure.ts` 29/29 con i controlli B3, B4, C4, C5, D0-D2.
**Out-of-scope changes**: no — 8 file di codice e test sopra i cinque della regola 19, tutti elencati nel referto §5.5 e confermati da Juri; `m1Containment.test.ts` non toccato.
**Layer Impact Report**: not-required — nessun file di §3.1; scritture D-layer solo per vie già esistenti (`removeLinked`, `refProxy.values`), nessun creatore in TRANSACTION.
**Smoke visivo**: non applicabile — nessuna interfaccia toccata; sonda via `JjScriptService.execute` sul :3000 di questo albero: prima 1-3 confermati e 4 già risolto da R-JS-10, dopo 29/29, zero errori di pagina.
**Notes**: Banco 18/18 mutazioni uccise, sorgenti ripristinati identici (sha256): rotte di += e -=, orfano, tipo, -= non tipato, i due piani, nome nudo, `end`, avanzo, rename tra virgolette, identificatore a M1, remove a M1, operatore su attributo, `-= null`, nome vuoto, suggerimento di add, classe assente. Misurato in più: un nome senza virgolette perdeva anche il contenitore `in`.
**Prompt document name**: 2026-10-07 09:10 (chat)

**Ticket** (minori, senza voce propria): sotto un profilo `remove` resta rifiutato come cambio del linguaggio (`permissionGuard.ts:92`), con una frase fuorviante; il percorso del fruitore usa `set … -=`, che passa le regole del link. Il messaggio di `add instance Phase to S.ref "p"` nomina la classe, non l'istanza («Added instance 'Phase'», `add.ts:38`).

## 2026-10-07 — ticket: il prompt di chat v5 dice ancora che a M1 += e -= non fanno quello che dicono
**Ticket**: `defaultPrompts.ts:236` vieta `+=`, `-=`, `add` e `remove` a M1 perché «at this level they do not do what they say (`set x.ref -= y` ADDS `y`)». Dopo `cb02e6a2b` la frase è falsa: `-=` e `remove` tolgono, `+=` aggiunge finché c'è posto. Il divieto resta innocuo; aggiornarlo (nuova versione del prompt) permetterebbe a Jodie di togliere un solo elemento da un riferimento multiplo.
**Priority**: low
**Found in**: C-2026-10-07-0910
**Detail**: docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md

## 2026-10-07 — ticket: un nome di istanza con uno spazio non può essere il soggetto di un comando
**Ticket**: `create instance of Phase "Mario Rossi"` riesce, e dopo #175 anche `rename x to "Mario Rossi"`, ma l'istanza non si nomina più: `rename "Mario Rossi" to …` è un errore di parsing («Expected qualified name or identifier, found 'Mario Rossi'», misura C8), e così ogni comando che la prende come soggetto o destinazione.
**Priority**: low
**Found in**: C-2026-10-07-0910
**Detail**: docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md
