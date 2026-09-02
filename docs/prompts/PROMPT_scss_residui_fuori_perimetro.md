# PROMPT — Micro-slice: residui orfani fuori perimetro del 30-08

Chiude i reperti dichiarati e non toccati dalla pulizia di `nestedView.scss` (`061859313`, report in `docs/discovery/`). Stesso metodo, stessi gate: la pulizia del 30-08 è il precedente autoritativo — riusane estrattore e gate visivo (determinismo + segnale provati prima dell'uso).

## Perimetro

1. **`.viewpoint-tab` senza emettitori** (misurato il 30-08): rimuovi le regole che lo stilano in `info.scss:24,112` e `styles/components/_form-system.scss:657,665,715,722`. Prima ri-verifica con la forma corretta (vita per classe emessa, non per sottostringa) che l'emettitore non sia ricomparso.
2. **Regole `tree-*` in `tree.scss`** che nessuno emette: stesso metodo — espansione dei nesting `&`, verdetto per selettore con evidenza, i dubbi restano.
3. **`nestedView.scss`, coda**: intestazione `NESTED VIEW - VIEWPOINTS PANEL` ormai imprecisa (rinomina in modo onesto rispetto a ciò che resta: la UI del pannello di `ViewData`), e le 33 variabili SCSS inutilizzate — rimuovi quelle provatamente senza consumatori in TUTTI i fogli (una variabile può essere usata da altri file: il grep è repo-wide sugli `.scss`).
4. I sei «dubbio» del 30-08 restano dubbi: fuori perimetro, non riaprirli.

## Gate

- Verifica meccanica sul CSS ricompilato (terna at-rule/selettore/dichiarazioni): 0 istanze nuove, 0 rimozioni senza evidenza, 0 dichiarazioni cambiate.
- Gate visivo: ritagli md5-identici sulle superfici che i tre file stilano (il pannello ViewData, l'info panel, il tree) — before/after, due run per il determinismo.
- Typecheck a baseline, vitest verde, build exit 0, smoke 12/0/3.
- Report in `docs/discovery/` (formato 30-08).

## Fuori scope

Ogni `.tsx`, il fronte manager, il canvas (una sessione parallela lavora su `valueRenderer`/`IRNodeContent`/`ObjectNode` — zero file condivisi).

## Coordinamento

Pathspec, entry di log in commit separato. Se la rotazione del log (P9, 71 > 40) non è ancora avvenuta, falla tu in commit a parte prima di iniziare.
