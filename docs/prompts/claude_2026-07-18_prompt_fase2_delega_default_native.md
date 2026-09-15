# Prompt Claude Code — Fase 2: delega delle view default migrate al rendering nativo abstract

**Data**: 2026-07-18
**Branch di lavoro**: `cloud/ir-editorv2` (punta corrente = `3f46884b0` o successiva). NON lavorare su `alfonso-frontend-jjtl`.
**Tipo**: fix scoped. Fase 1 già completata: `docs/discovery/discovery_2026-07-18_css_default_vs_native.md` (strada B raccomandata e ratificata da Alfonso). Nessuna nuova discovery necessaria; rileggere il report prima di iniziare.

## Contesto

Contratto deciso: con viewpoint Default attivo il rendering deve essere identico a "nessun viewpoint" (parità totale). La discovery ha stabilito che i due path hanno markup e CSS disgiunti e che la parità per convergenza (riuso classi o estrazione) istituirebbe una seconda implementazione da mantenere. Decisione: **strada B, delega**. Le view default migrate rendono col componente nativo; l'interprete rende solo le view IR non-default.

Decisioni sulle domande aperte del report (ratificate da Alfonso, 2026-07-18):
- OQ-1: trigger = marker `migratedFrom: 'classic-default'` **e** uguaglianza strutturale con `defaultObjectViewIR()`; il confronto normalizza escludendo `migratedFrom` e ogni campo di identità, altrimenti non scatta mai. Una view editata diverge → torna all'interprete come custom.
- OQ-2: la delega copre anche `viewId === IR_DEFAULT_OBJECT_VIEW_ID` (futura default wildcard built-in).
- OQ-3: emendare la spec sez. 11 (verbatim sotto).
- OQ-4: la tokenizzazione di `BASE_CSS` (theming delle view IR custom) è fuori scope, ticket separato. NON toccare `irStyle.ts` né `IRNodeContent.tsx`.
- OQ-5: il ritorno di placeholder lazy co-evolution e popover enum sotto Default è parte della parità voluta.

## COSA

1. **Helper puro** in `irDefaults.ts`: `isMigratedDefaultView(compiled)` (o firma equivalente sui dati già disponibili nel punto di gate) che restituisce true quando:
   - la view risolta porta `migratedFrom: 'classic-default'` E la sua struttura, normalizzata (senza `migratedFrom` e senza campi di identità), è uguale a `defaultObjectViewIR()` (riusare `irHash` di `irCompile.ts` per il confronto), OPPURE
   - il viewId è `IR_DEFAULT_OBJECT_VIEW_ID`.
2. **Gate in `ObjectNode.tsx`**: nel ramo IR, se `isMigratedDefaultView(...)` → eseguire il ramo nativo esistente (stesso codice del caso `useIRView` null), ignorando la view risolta. Diff minimale: una condizione, nessuna duplicazione del ramo nativo.
3. **Unit test** in `ir.test.ts`, describe dedicato, almeno 4 casi: marker + struttura uguale → delega; marker + struttura editata (es. label position cambiata) → no delega; nessun marker → no delega; `IR_DEFAULT_OBJECT_VIEW_ID` → delega. Test esistenti (30) intatti.
4. **Emendamento spec**: in `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, sez. 11, aggiungere questo paragrafo verbatim in coda alla sezione:

   > **Delega delle default migrate (normativo, emendamento 2026-07-18)**: le view con `migratedFrom: 'classic-default'` che restano strutturalmente identiche alla factory `defaultObjectViewIR()` rendono col rendering astratto nativo di EditorV2 (delega: parità con "nessun viewpoint" garantita per costruzione). Un edit successivo le fa divergere dalla factory e tornano all'interprete come view custom, con stile proprio. Lo stesso vale per la default wildcard built-in (`IR_DEFAULT_OBJECT_VIEW_ID`). L'interprete rende solo le view IR non-default.

## COME

- Zero refactoring opportunistico; nessun rename; non toccare `IRNodeContent.tsx`, `irStyle.ts`, SCSS, né la risoluzione (`irResolve*`): la view resta nell'indice con specificità 0, cambia solo chi la rende.
- Prima di introdurre nuovi identificatori, `grep -r` di collisione (es. `isMigratedDefaultView`).
- Attenzione alla normalizzazione dell'hash: verificare cosa include oggi `irHash` e derivare il confronto in modo che il marker `migratedFrom` non rompa l'uguaglianza (è il punto delicato dell'intero fix).
- Verifica: `npm run build` verde; `npx tsc --noEmit` = 14 errori baseline (0 nei file toccati); `npx vitest run` sul modulo IR tutto verde.
- Un solo commit (codice + test + spec): `fix: delegate migrated classic-default views to native abstract rendering`. `git add` dei soli file toccati, mai `git add .`.
- Aggiornare `docs/claude-code-log.md` a fine task.

## RIFERIMENTI

- Discovery: `docs/discovery/discovery_2026-07-18_css_default_vs_native.md` (in particolare §4.1 catena di risoluzione, §6.B rischi/subtleties, §8 OQ).
- Spec IR v1.2 sez. 10 e 11.
- Migration: `VersionFixer.tsx` righe ~1007-1040 (dove nasce `migratedFrom`).
- CLAUDE.md resta la fonte di verità: in caso di conflitto, segnalare e fermarsi.

## Criterio di accettazione (a carico di Alfonso, dopo il task)

Sul progetto state machine: viewpoint Default attivo vs nessun viewpoint, screenshot a parità di zoom → visivamente identici (banda header, underline, corsivo blu dei valori, `=` grigio, placeholder degli attributi non valorizzati, popover enum). Nota metodologica: il tag `#ir-views-css` può restare presente con Default attivo (CSS base iniettato alla costruzione dell'indice); non è più un criterio di verifica per le default.
