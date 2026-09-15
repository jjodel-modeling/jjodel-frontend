# Post-fase floating — push, cleanup tag, restringimento union `mode`

**Tipo:** due task sequenziali: (1) operazioni git senza modifiche al codice, (2) commit di restringimento tipo.
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** high
**Precondizione:** F5 committato e verificato a vista (fase floating chiusa). Working tree con possibile WIP TextStyle concorrente: **mai `git add .`**.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md`. Contraddizioni: segnala e fermati.
- Nessun file critical-zone coinvolto (`EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`).
- Zero refactoring opportunistico. Il Task 2 tocca **un solo file**.
- **Mai `git push --force`**, mai `git pull`/`rebase` senza istruzione: se qualcosa diverge, fermati e riporta.

## TASK 1 — Push del branch e cleanup dei tag `reconstruct-base-*`

### 1a. Push

1. `git status`: conferma di essere su `alfonso-frontend-jjtl`, annota i file del WIP non committato (restano nel working tree, non li tocchi).
2. `git log --oneline origin/alfonso-frontend-jjtl..HEAD` (dopo `git fetch origin`): elenca i commit che verranno pubblicati. Se il remoto ha commit che il locale non ha (`git log HEAD..origin/alfonso-frontend-jjtl` non vuoto), **fermati e riporta**: nessun pull automatico.
3. `git push origin alfonso-frontend-jjtl`. Niente force. Riporta l'output.

### 1b. Tag

1. `git tag -l 'reconstruct-base-*'`: elenca i tag e, per ciascuno, il commit puntato (`git rev-parse <tag>`).
2. **Guardia di sicurezza per ogni tag**: verifica `git merge-base --is-ancestor <tag> HEAD`. Se il commit puntato è antenato di HEAD, il tag è un residuo della ricostruzione e si elimina. Se NON è raggiungibile da HEAD (o da un altro branch: `git branch --contains <tag>`), **non eliminarlo** e riporta: potrebbe essere l'unico riferimento a lavoro non altrove.
3. Elimina i tag approvati dalla guardia: `git tag -d <tag>`.
4. Controlla se esistono anche sul remoto: `git ls-remote --tags origin 'reconstruct-base-*'`. Se sì, elimina anche lì: `git push origin --delete <tag>`.
5. Riporta: tag eliminati (locale/remoto), tag conservati e perché.

## TASK 2 — Restringimento dell'union `mode` di `PropertiesWithTreeView`

**Decisione ratificata in chat** (vedi ratifiche 2026-07-29, sezione "Chiusura fase"): l'union passa da `'popup' | 'tab' | 'inline' | 'floating'` a `'floating'`. Unico call-site vivo: `Dashboard.tsx:627` con `mode={'floating'}` (già conforme, non si tocca).

### 2a. Modifica

- File: `src/components/editors/PropertiesWithTreeView.tsx`, interfaccia `PropertiesWithTreeViewProps` (righe ~64-66):

```ts
interface PropertiesWithTreeViewProps {
    mode: 'floating';
}
```

### 2b. Fallout guidato dal compilatore

- `npm run typecheck`. Ogni nuovo errore sarà un confronto di `mode` con un valore rimosso (`'tab'`, `'popup'`, `'inline'`): quei rami sono ora **provatamente irraggiungibili**. Rimuovi il ramo morto (l'intero branch del confronto, non solo la condizione), elencando nella risposta file e righe di ciascuno.
- Usi di `mode` che NON producono errori (interpolazioni in className, log, ecc.) **restano invariati**.
- Se un errore non è riconducibile a un confronto con un valore rimosso, **fermati e riporta** prima di toccare altro.
- **Non toccare**: `Info.tsx`, `ElementPropertiesDrawer.tsx`, `ContextMenu.tsx` (i loro `mode` appartengono al componente Info, non correlato). Non toccare `Dashboard.tsx`.

### 2c. Gate e verifica

- `npm run build` verde; `npm run typecheck` alla baseline (21 errori pre-esistenti, Δ0, zero nei file toccati).
- Verifica visiva rapida delegata ad Alfonso all'hard stop: modello e metamodello con overlay funzionante, pill ⇄ overlay, resize e accordion.

### 2d. Chiusura Task 2

- Entry in `docs/claude-code-log.md` (tipo `refactor`): union ristretta, rami rimossi con righe, riferimento alla decisione in chat.
- `git add` dei soli file toccati, per path esplicito. `git status` di controllo: nessun WIP estraneo staged.
- Commit: `refactor(panels): narrow PropertiesWithTreeView mode union to floating`.
- **Hard stop dopo il commit**: verifica visiva di Alfonso. Il commit resta locale; verrà pushato al prossimo giro insieme al lavoro successivo.

## Riferimenti

- `claude/ratifiche_2026-07-29_floating_panels.md`, sezione "Chiusura fase — esiti F5 e finding post-F5": decisione sull'union, finding split/vertical-console, correzione C9.
- Query read-only post-F5 (report in chat): grep dei call-site che prova la morte di `'tab'`/`'popup'`/`'inline'`.
