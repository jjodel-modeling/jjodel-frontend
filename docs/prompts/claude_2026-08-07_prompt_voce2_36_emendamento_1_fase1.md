# Emendamento 1 al prompt "2026-08-07 16:49": Fase 1 della 3.6 (rilevamento più toast)

**Documento prompt**: 2026-08-07 17:32
**Tipo**: feat piccolo, corsia veloce (RC-3), fuori critical zone (nessun file di §3.1). Emendamento di Fase 1 al prompt della voce 2; la Fase 0 è chiusa e committata (`785da04ef`, report `docs/discovery/discovery_2026-08-07_style_window_channel.md`).
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`

## Prima di iniziare

1. Rileggere il proprio report di Fase 0: la Fase 1 si ancora ai `file:riga` misurati lì, non a questo testo.
2. HEAD atteso: `785da04ef` (eventualmente già pushato). Qualsiasi altro delta sopra: fermarsi e riportare. `.claude/settings.local.json` untracked: ignorarlo.
3. `git add` per file espliciti, mai `git add .`. Nessuno stash, checkout o reset. Niente push.
4. Leggere `docs/decisions.md` prima di scrivere: questo emendamento vi aggiunge una riga in chiusura.

## DECISIONI RATIFICATE (2026-08-07, vincolanti per questa fase)

1. **Solo css modificati dall'autore.** Il predicato confronta il css della view col blocco di fabbrica del costruttore (`classes.ts:1125-1172`), a whitespace normalizzato: se coincide, non suona. Residuo accettato e registrato: un css di fabbrica che mordesse i nodi IR resta invisibile.
2. **Predicato a due congiunti**: `cssIsGlobal === true` E il testo contiene `!important`. Il congiunto dell'annidamento cade (un `!important` globale di primo livello è altrettanto dannoso; niente conteggio di graffe).
3. **Insieme scansionato: tutte le view e i viewpoint del progetto**, col gate di `view.tsx:778-782` replicato: i viewpoint esclusivi non di default contano solo se attivi in quel momento; view normali, viewpoint di default e overlay contano sempre.
4. **Superficie: toast**, registro warning, UN toast per attivazione che aggrega gli N colpevoli (mai N toast), con dedup di sessione: chiave stabile derivata dall'insieme dei colpevoli più un hash dei loro css; un'attivazione che produce la stessa chiave già mostrata non risuona. La memoria vive nel modulo (module-level), non in Redux. La sede persistente in Source (R-2) è rinviata, non appartiene a questa fase.
5. **La 3.6 informa e non scrive**: nessun write path verso il modello. Il messaggio è azionabile: nomina i colpevoli (nome della view o del viewpoint), cita `cssIsGlobal`, e ricorda che per le view classic il tab Style esiste ancora. Il "minimo per spegnere il flag" è una micro-voce futura, fuori da qui.

## COSA

1. **Modulo puro di rilevamento** (file nuovo; nome secondo le convenzioni reali e il grep di collisione (g) del report). Funzione pura: input un elenco di descrittori `{id, name, css, cssIsGlobal, natura view/viewpoint, più i campi che servono a replicare il gate (isExclusiveView, default, attivo)}`; output l'elenco dei colpevoli `{id, name, natura}`. Dentro: la costante di fabbrica (importata o derivata dal costruttore, senza duplicarne il testo a mano se esiste un modo pulito di riferirla), la normalizzazione whitespace, il predicato dei punti 1-2, il gate del punto 3. Zero dipendenze nuove, zero side effect.
2. **Aggancio al choke point**: `activateViewpoint` (`utils/lastViewpoint.ts:46-57`), dopo le due scritture esistenti. Lì si costruisce l'input dal Redux state corrente e, se ci sono colpevoli e la chiave di dedup è nuova, si emette il toast (`toastDispatch.ts:116`, registro warning). Poche righe: la logica sta nel modulo. Se l'apertura del progetto non passa da `activateViewpoint`, NON estendere ad altri punti: dichiararlo nella sintesi come limite noto.
3. **Stringa del toast**: una sola, in inglese come le stringhe interne esistenti (la pass R-4 tradurrà), asciutta. Forma indicativa: `Global CSS with !important is repainting the canvas — from: <n>, <n> (cssIsGlobal on). Classic views can edit it in the Style tab.` Adattare il fraseggio; niente em dash se la stringa finisce in UI, niente nuove classi CSS, niente SCSS.
4. **Unit test del modulo** (file di test accanto al modulo o nel pattern reale del progetto): fabbrica intatta non suona; fabbrica modificata con `!important` suona; `!important` di primo livello suona (due congiunti); `cssIsGlobal false` non suona; esclusivo non-default non attivo non suona, attivo suona; dedup: stessa chiave non ripete, chiave diversa ripete.
5. **Riga in `docs/decisions.md`**: le cinque decisioni sopra, compresse (etichetta suggerita: serie R-2/3.6), con la deviazione dichiarata dalla lettera della ratifica originaria (predicato a due congiunti invece che tre, motivata dalla misura di Fase 0).
6. **Niente altro.** In particolare: non toccare `view.tsx`, `Dashboard.tsx`, `VersionFixer.tsx`, nessun file di §3.1, nessun campo nuovo su D-classi.

## DOVE

Modulo nuovo più il suo test; `utils/lastViewpoint.ts` (solo l'aggancio); `docs/decisions.md`; `docs/claude-code-log.md`. Cinque file attesi: oltre il quinto (per esempio se l'export del blocco di fabbrica richiedesse un touch a `classes.ts`) fermarsi, elencare e motivare prima (regola 19 e regola 5: quel file è core).

## COME

- Diff minimale, TypeScript tipizzato, zero refactoring, zero rinomine.
- Gate: `npm run typecheck` 33 Δ0 (composizione in `CLAUDE.md` §17); `npm run build` exit 0 col solo warning noto; `npm run test` verde sui file nuovi e non peggiorato altrove; `npm run check:docs` verde col residuo noto `2026-07-18 00:00`.
- **Un commit unico**: `feat: warn on author-modified global !important css at viewpoint activation` (adattare al fraseggio del log). `git add` dei soli file elencati.
- **HARD STOP dopo il commit**: la verifica visiva è di Alfonso, su http://localhost:3000/. Fornire nella sintesi i passi esatti per costruire il caso di prova (da una view classic: tab Style, accendere `cssIsGlobal`, aggiungere una regola con `!important`) e la checklist in quattro punti: (1) progetto pulito, attivazione senza toast; (2) progetto col css di prova, un solo toast alla prima attivazione coi nomi giusti; (3) riattivazione identica, silenzio; (4) canvas per il resto invariato.

## Chiusura

1. Sintesi in chat: esito dei gate con evidenza, hash del commit, i passi del caso di prova, limiti dichiarati (apertura progetto, residuo di fabbrica).
2. Entry in `docs/claude-code-log.md` (formato §21.2, campi §21.3 onesti; `Corregge`: —, è la prosecuzione pianificata del prompt "2026-08-07 16:49").
3. La riga in `docs/decisions.md` del punto 5 del COSA.

## RIFERIMENTI

- Nel repo: `docs/discovery/discovery_2026-08-07_style_window_channel.md` (la fonte dei `file:riga`: canale (a), gate `:778-782`, corpus (c), superfici (e)); `utils/lastViewpoint.ts`; `components/Toast/toastDispatch.ts`; `joiner/classes.ts:1125-1172` (blocco di fabbrica, sola lettura); `CLAUDE.md` §17.
- Nel KB (tracciabilità): prompt base "2026-08-07 16:49" (`claude/2026-08-07_prompt_voce2_36_finestra_style_fase0.md`), checkpoint `claude/sessione_2026-08-07.md` (ratifiche di questa fase).
