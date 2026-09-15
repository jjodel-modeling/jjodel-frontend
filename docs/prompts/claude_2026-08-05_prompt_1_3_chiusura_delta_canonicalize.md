# Task 1.3 chiusura: commit del delta canonicalize e push

> **Precondizione di lancio.** Questo prompt si lancia solo dopo la verifica visiva del
> controllo 3 del prompt v2 (`claude/2026-08-05_prompt_1_3_pin_identita_metaclasse_v2.md`):
> progetto migrato, pin scritto su una view di default migrata, resa dei nodi invariata,
> hard refresh e ricontrollo. Il lancio vale come go-ahead di Alfonso: commit e push sono
> autorizzati in un'unica esecuzione, salvo le condizioni di stop elencate sotto.
>
> **Non è un task di implementazione.** L'esclusione del pin è già implementata nel working
> tree e verificata a video. Non modificare una riga dei due file sotto `ir/`: se qualcosa
> sembra richiederlo, fermati e segnala invece di eseguire.

Leggi `CLAUDE.md` prima di iniziare.

## Contesto

`85fc8aa3e` ha committato il task 1.3 (pin di identità della metaclasse) senza l'esclusione
del pin dal confronto di `isMigratedDefaultView`: è il "commit intermedio non sano" che il
prompt delta (`2026-08-05 14:55 prompt_1_3_delta_canonicalize`) dichiarava da evitare, ed è
oggi sul remoto. Finché questo commit non atterra, scrivere un pin su una view di default
migrata la fa uscire dalla delega nativa, con il cambio di resa diffuso descritto da R-F
(`claude/ratifiche_2026-08-05_3_canonicalize_e_risalita_parent.md`). Il delta risulta già
eseguito nel working tree; resta da metterlo agli atti. Questo prompt chiude: entry di log,
commit del perimetro esatto, push.

## Fase 1: ricognizione read-only

Non è una discovery e non produce file in `docs/discovery/`: l'esito va nel report in chat.

1. `git rev-parse --abbrev-ref HEAD` deve dare `alfonso-frontend-jjtl`;
   `git rev-parse --short HEAD` deve dare `3e99044d8`. **Se HEAD è diverso, stop.**
2. `git --no-optional-locks status --porcelain` atteso, esattamente:

   ```
    M CLAUDE.md
   R  docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md -> docs/discovery/discovery_2026-08-05_legacy_view_census_real_projects.md
    M frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts
    M frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts
   ?? .claude/settings.local.json
   ?? docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md
   ?? docs/discovery/discovery_2026-08-05_checkbox_native_visibilita.md
   ```

   Untracked aggiuntivi sono tollerati e vanno segnalati. **Stop** se: l'indice contiene
   altro oltre al rename `R`; uno dei due file sotto `ir/` non risulta modificato; risultano
   modificati pannelli di authoring o altri sorgenti.
3. Diff attesi.
   `git diff frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`: una sola riga
   funzionale nuova, `delete structural.authoringMetaclassPins;`, subito dopo
   `delete structural.migratedFrom;` dentro `isMigratedDefaultView`, più l'aggiornamento del
   commento di documentazione della stessa funzione. Nient'altro nel file.
   `git diff frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts`:
   40 inserzioni, tre nuovi `it` nel describe di `isMigratedDefaultView`: (1) marker più pin,
   ancora delegata; (2) due default migrate che differiscono solo per il pin, entrambe
   delegate; (3) marker più pin più un edit reale (`priority: 7`), interprete: il pin non
   maschera gli edit. **Se i diff non hanno questa forma, stop.**

## Fase 2: censimento consumatori (guardia di R-F)

```
grep -rl "irHash\|canonicalize" frontend/src --include=*.ts --include=*.tsx
```

Atteso: soli file sotto `viewpoint/ir/` (`irCompile.ts`, `irValidate.ts`, `irDefaults.ts`,
`__tests__/ir.test.ts`). L'esclusione vive dentro `isMigratedDefaultView` e `canonicalize`
resta un puro key-sort privato, quindi per gli altri consumatori il pin resta nell'hash; la
guardia serve a escludere memoizzazioni di livello authoring keyate su `irHash`. **Se compare
un consumatore fuori da `viewpoint/ir/`, stop e segnala prima di committare.** L'esito va
nell'entry di log.

## Fase 3: gate automatici

1. `npx tsc --noEmit`: baseline **33**, zero nei file toccati.
2. `npx vitest run`: verdi, inclusi i tre test nuovi, salvo i 9 file che falliscono in import
   per `window is not defined` (baseline nota).
3. `npm run build`: exit 0 (warning chunk-size noto).
4. `npm run check:docs`: rosso da prima per due entry del 2026-08-03. Verifica solo che la
   tua entry passi e che non si aggiungano fallimenti nuovi.

## Fase 4: entry di log

In `docs/claude-code-log.md`, in testa (il file è newest-first). Prima di scrivere, leggi le
entry recenti in testa per la forma, e le due entry già presenti sul task 1.3 (due sessioni
diverse) per la continuità. `Corregge` e `Causa` nella forma prescritta da §21.3, prendendo a
modello le entry che passano `check:docs`, non le due del 2026-08-03 che lo fanno fallire.

Contenuto minimo: tipo `fix`; l'esclusione chiude la finestra aperta da `85fc8aa3e` (pin
committato senza esclusione); i tre file del commit; l'esito del censimento di Fase 2; la
verifica visiva del controllo 3 eseguita da Alfonso prima del lancio, con esito positivo; la
nota che l'esclusione vive in `isMigratedDefaultView` e non in `canonicalize` (forma locale,
più stretta della conseguenza generale di R-F); la rotazione del log oltre le 20 entry,
dovuta ma **non in questo commit**.

## Fase 5: commit per pathspec (il punto delicato)

L'indice contiene un rename staged di un altro task (census doc, da 04 a 05) che **non deve
entrare** in questo commit. Quindi: niente `git add`, niente `git commit -a`. Si usa il
commit per pathspec, che fotografa il worktree dei soli path elencati e lascia intatto
l'indice:

```
git commit -m "fix(ir): exclude the authoring metaclass pin from the delegation comparison" -- \
  frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts \
  frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts \
  docs/claude-code-log.md
```

Verifica post-commit, prima del push:

- `git show --stat HEAD`: esattamente 3 file;
- `git --no-optional-locks status --porcelain`: ancora presenti ` M CLAUDE.md`, il rename
  `R` in staging, i tre untracked; spariti i due file sotto `ir/` dai modificati.

**Se una delle due verifiche non torna, stop: niente push.**

## Fase 6: push

```
git push origin alfonso-frontend-jjtl
```

Nota esplicita: il push porta sul remoto anche `3e99044d8` (slice 0, commit 1), oggi solo
locale. È voluto.

Post-push: `git --no-optional-locks log --oneline origin/alfonso-frontend-jjtl..HEAD` deve
essere vuoto.

## Report di chiusura in chat

Esito delle fasi 1-3, esito del censimento, hash del commit, conferma del push, stato residuo
del tree (atteso: `CLAUDE.md` modificato, rename staged, tre untracked).

## Vincoli

- Zero modifiche ai due file sotto `ir/` oltre a quelle già presenti; zero refactoring; mai
  rinominare identificatori esistenti.
- Non toccare `CLAUDE.md` (diff pendente di un altro task, decisione `.gitignore` non presa).
- Non committare il rename staged né i due discovery report untracked; non toccare
  `.claude/settings.local.json`.
- Nessuna rotazione del log in questo commit.
- Nessun bump di `irVersion`, nessuna migration.
- Critical zone (`useJjomSync.ts`, `portDistribution.ts`, `VersionFixer.tsx`): non entrarci.

---
**Nome del documento prompt**: 2026-08-05 19:40 prompt_1_3_chiusura_delta_canonicalize
