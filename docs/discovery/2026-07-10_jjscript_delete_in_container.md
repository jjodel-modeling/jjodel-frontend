# Discovery — `delete attribute name in A` senza effetto (JjScript parser + executor)

**Data**: 2026-07-10
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: Fase 1 discovery (READ-ONLY, hard stop) — verifica dello stato del working tree prima del fix
**Prompt document name**: 2026-07-10 — fix delete attribute `in <container>` + proxy delete cascade

---

## 0. Sintesi

Il comando JjScript `delete attribute name in A` non ha effetto su nessun layer. Due difetti concorrenti (parser + executor). Questo documento registra **solo l'esito della verifica** dello stato reale del codice rispetto all'analisi del prompt: **tutto combacia, nessuna divergenza**. Nessun sorgente è stato modificato in questa fase.

---

## 1. Contesto di sessione

Letti `CLAUDE.md` (regole non negoziabili) e le ultime ~10 entry di `docs/claude-code-log.md`. Il lavoro recente è tutto editor-v2 layout + jjscript executor M1 (handle registry, waiter). Nessuna sovrapposizione con i 5 file in scope: il working tree è pulito per tutti.

---

## 2. Verifica dello stato reale vs. analisi del prompt

### (a) `parseDeleteCommand` non gestisce la clausola `in` — CONFERMATO
`frontend/src/jjscript/parser/parser.ts:441-473`. Dopo `const target = this.parseQualifiedNameToken();` (riga **461**) si passa direttamente al loop cascade/force (466-470). Nessun `matchKeyword('in')`. `target` è dichiarato `const`.

Conseguenza: per `delete attribute name in A` i token `in A` restano non consumati e `parse()` non verifica i token residui ⇒ il comando è accettato con `target = {segments:['name']}` (bare), il container `A` è perso silenziosamente. Combacia con l'analisi.

### (b) `executeDelete` usa `DeleteElementAction.new(element)` dentro `TRANSACTION` — CONFERMATO
`frontend/src/jjscript/executor/commands/delete.ts:83-105`.
```
TRANSACTION('JjScript: Delete element', () => { … DeleteElementAction.new(element); … })
```
Questa è l'API sbagliata: rimuove solo l'entry da `idlookup` (reducer `DELETE_ELEMENT`, `val === undefined` → `delete current[key]`) senza la cascade di `Dummy.get_delete`. Il puntatore all'attributo resta nell'array `attributes` della classe, i DValue M1 diventano zombie, i `pointedBy` non vengono puliti. Il D-object della classe non cambia ⇒ nessun re-render ⇒ "zero effetto visibile" con messaggio di successo. Combacia.

### (c) Blocco `in` di `parseRenameCommand` — CONFERMATO al pattern descritto
`frontend/src/jjscript/parser/parser.ts:504-513`, esatto:
```typescript
if (this.matchKeyword('in')) {
    const parent = this.parseQualifiedNameToken();
    const elementName = target.segments[target.segments.length - 1];
    target = {
        segments: parent.segments,
        member: elementName,
        raw: `${parent.raw}.${elementName}`
    };
}
```
È il template da replicare in `parseDeleteCommand`.

---

## 3. Riferimenti di riga vs. prompt (working tree)

| File | Prompt | Reale | Match |
|------|--------|-------|-------|
| `parser.ts` `parseDeleteCommand` | ~441-472 | 441-473 | ✓ |
| `parser.ts` rename blocco `in` | 504-513 | 504-513 | ✓ esatto |
| `delete.ts` `executeDelete` | — | 26-125 | ✓ |
| `parser.test.ts` `describe('Parser: delete')` | ~177+ | 179-206 | ✓ |
| `help.ts` testo delete | ~172-193 | 172-194 | ✓ |
| `keyword.ts` liste delete | ~172-175 / ~217-219 | 172-175 / 217-219 | ✓ esatto |

---

## 4. Conferme che de-riscano la Fase 2

- **`resolveElement` gestisce `target.member`**: tutte e 3 le strategie chiamano `resolveMember` (`resolvers.ts:229/239/249`). Dopo il fix del parser, `{segments:['A'], member:'name'}` risolve l'attributo `name` di `A`. `resolveMember` (419-445) ritorna il proxy reale dalla collezione `attributes`.
- **`element.delete()` è valido**: l'elemento risolto è un L-proxy; il canonico `syncRemoveAttribute` (`canvasToJjom.ts:590-594`) usa già `lAttr.delete()` con il commento esplicito "no outer TRANSACTION". `element` è tipato `any` ⇒ nessun attrito TS.
- **Type guard corretta contro il D-name**: per CLAUDE.md §3.13 il `.className` di un L-proxy ritorna il nome D-layer (`DAttribute`, `DClass`…). La `matchesType` privata (`resolvers.ts:519-533`) fa già substring match (`.includes('Attribute')`) su quel nome. La mappa locale della guardia userà la stessa semantica "contains", non l'uguaglianza.
- **Nessuna modifica ai tipi**: `DeleteArgs.target` è `QualifiedName`, che ha già `member?` opzionale (`types.ts:174-181, 325-329`). Helper di test `args<T>()` presente (`parser.test.ts:36`).

---

## 5. Ricaduta sugli import di `delete.ts`

- Nessun `noUnusedLocals`/`noUnusedParameters` in `frontend/tsconfig*.json` ⇒ **gli import inutilizzati non generano errori di typecheck**.
- `deleteChildren` viene mantenuta (marcata `// TODO: cleanup`) e continua a referenziare `DeleteElementAction` ⇒ quell'import resta *usato*.
- `TRANSACTION` diventa inutilizzato dopo l'edit. Senza `noUnusedLocals` non genera errori. Decisione presa con Alfonso in chat.

---

## 6. Scope / processo

- **Solo 5 file** in scope (parser, executor/commands/delete, parser.test, help, keyword). Task jjscript parser/executor ⇒ **nessun file §3.1 sync/D-L/JjOM/VersionFixer toccato** ⇒ Layer Impact Report **not-required**. Il fix instrada la cancellazione attraverso la cascade esistente `Dummy.get_delete` a *runtime*, ma via un metodo L-proxy già usato dal path UI; nessun codice della cascade viene toccato.
- Follow-up da **annotare nel log** (non implementare in questo task): (1) `executeDeleteInstance` usa ancora `DeleteElementAction` raw; (2) `parse()` non segnala token residui non consumati (vale per tutti i comandi); (3) il path JjScript delete non fa orphan-capture dei valori M1 a differenza del path UI.

---

## 7. Esito

**Tutto combacia con l'analisi. Nessuna divergenza.** Gate superato → autorizzata la Fase 2 (edit dei 5 file).
