## Template Recovery — Area IR / Authoring / Viewpoint

## Template Recovery — Area IR / Authoring / Viewpoint

Usa questo template quando il task tocca `editor-v2/viewpoint/authoring/`, `editor-v2/viewpoint/ir/`, o `editor-v2/problems/`.

### Esplora prima (obbligatorio)
1. `editor-v2/problems/` — registry, conformance, uniqueness. Tocca il canvas?
2. `useJjomSync.ts` Step 3/4 — chiavi M1 vs M2, dipendenze, TRANSACTION rules (§3.3-3.5)
3. `useM1ReferenceEdges.ts` — popolamento post-mount, guard pair-based
4. `syncState.ts` — `hasCanvasEdgePair`, stato canvas attuale
5. `portDistribution.ts` + `handlePosition.ts` — se tocca handle/anchor

### Chiediti prima di scrivere il prompt
- Gli edge coinvolti sono M1 (istanza) o M2 (metamodello)? La strategia di guard è diversa (§3.4).
- Il task crea/elimina elementi nel canvas? Se sì, §3.3 (TRANSACTION) e §3.9 (VersionFixer) si applicano?
- C'è un sottosistema di validazione (`problems/`) che potrebbe entrare in gioco?
- Il task è visivo/posizionamento? Se sì, vedi sotto.

### Se il task è visivo o di posizionamento
Prima del prompt di implementazione, definisci con il Direttore:
1. **Cosa si vede adesso** (numeri: coordinate, dimensioni, indici)
2. **Cosa deve diventare** (stesso livello di precisione)
3. **Criterio di accettazione verificabile** (una sola frase, meccanica)

Senza questi tre punti, NON generare il prompt di implementazione. Il rischio è convergenza per approssimazioni successive (pattern A — 5 fix sullo stesso file).