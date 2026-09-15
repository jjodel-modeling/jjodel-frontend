# Prompt (auto-eseguito) — fix null-check `get_allPossibleParentViews`

**Data**: 2026-08-10 02:25
**Esecutore**: sessione Cowork notturna (stessa sessione che ha generato il prompt), su
mandato esplicito di Alfonso: «implementare in autonomia le voci semplici del cruscotto».
Registrato qui per la catena P del cruscotto; la entry di log sul repo lo cita come
«2026-08-10 02:25».

## COSA

Voce di backlog «Bug `allPossibleParentViews`» (alta priorità): verificare su HEAD se la
voce 4 lo avesse già chiuso; in caso negativo, fix minimo del null-check con root cause
analysis e report di discovery.

## COME È ANDATA

- Fase 0 su HEAD `12ad6de83`: bug vivo, voce 4 non l'aveva toccato. Root cause:
  `get_viewpoint` (`view.tsx:1436`) ritorna `undefined as any` su catena `father`
  ciclica o dangling; `get_allPossibleParentViews` faceva `vp.id` senza guardia (:447).
- Fix: `if (vp) allviews[vp.id] = vp;` più commento di due righe. Nessun altro ramo.
- Report: `docs/discovery/discovery_2026-08-10_allpossibleparentviews_nullcheck.md`.
- Gate nel clone cloud: `typecheck` Δ0 (14 errori = baseline sparsa; i 19 di casing non
  si manifestano su FS case-sensitive), `vitest` 1125 passed + 9 collection failures
  note, `build` ok, `check:docs` 2/2.
- Commit sul working tree del Mac via bridge: `ab90ed06c` (fix + report + entry di log)
  e `5c6c2f3de` (rotazione log, settimo lotto). NESSUN push.

## HARD STOP residuo (per Alfonso)

Smoke visivo: aprire il pannello Properties su una view qualunque e verificare che il
Select «Parent view» sia popolato come prima (il caso rotto non è riproducibile dalla
UI: il fix è una guardia su dati sporchi persistiti, lo smoke è di non regressione).
Poi push dei due commit.
