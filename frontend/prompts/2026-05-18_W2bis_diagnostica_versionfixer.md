# Diagnostica VersionFixer — W2 D-layer extension

**Data**: 2026-05-18
**Tipo**: discovery (read-only)
**Branch**: `alfonso-frontend-jjtl`
**Esito atteso**: report 1-pager + verdict (bump needed / no bump needed / point-fix needed)

---

## Contesto

W2 ha esteso il D-layer in modo non previsto:

- `DPackage` ha un nuovo array `datatypes: Pointer<DDataType>[]` (`LModelElement.tsx`).
- `LPackage` ha un nuovo getter `datatypes`.
- `_set_classifiers` accetta ora un terzo valore `'datatypes'`.
- `get_classifiers` ha un merge guard nuovo.
- `Constructors.DDataType()` è stato wirato (`joiner/classes.ts`).

I progetti salvati pre-W2 in Redux NON hanno `datatypes` nel JSON serializzato di `DPackage`. Aprendoli post-W2 si avrà `pkg.datatypes === undefined`.

Vanno verificate due cose:

1. Se il codice nuovo o esistente accede a `pkg.datatypes` senza guard → crash al load.
2. Se serve bump `VersionFixer` per migrare progetti vecchi.

**Working tree dirty di W2 va lasciato intatto. Zero modifiche al codice in questa fase.**

---

## Task

### 1. Grep mirato sugli accessi a `datatypes`

```bash
grep -rn '\.datatypes' frontend/src --include='*.ts' --include='*.tsx' | grep -v '__tests__' | grep -v 'node_modules'
```

Per ogni occorrenza, classificare:

- **L-layer getter access** (es. `lpkg.datatypes`, dove `LPackage.get_datatypes` ritorna `this.d.datatypes || []`): ✅ safe.
- **D-layer direct access** (es. `dpkg.datatypes.forEach(...)`, `dpkg.datatypes.length`): ⚠️ verificare guard.
- **Setter** (es. `pkg.datatypes = [...]`): ✅ safe (write).
- **Destructuring** (es. `const { datatypes } = pkg`): dipende da uso downstream.

### 2. Ispezione getter `LPackage.datatypes`

Aprire `frontend/src/model/logicWrapper/LModelElement.tsx` alla riga ~3700 (mirror layer di `DPackage`). Verificare che il getter `get_datatypes` ritorni:

```typescript
get_datatypes(context: Context): LDataType[] {
  return Datatype.fromPointer(context.proxyObject.datatypes || []);  // ← OR fallback critico
}
```

oppure equivalente che gestisca `undefined`. Se ritorna direttamente `context.proxyObject.datatypes` senza fallback, è il punto di crash.

### 3. Ispezione `_set_classifiers` e `get_classifiers` merge guard

`LModelElement.tsx` — il report W2 dice che entrambi sono stati modificati per accettare il terzo valore `datatypes`. Verificare nel merge guard di `get_classifiers`:

```typescript
get_classifiers(context: Context): LClassifier[] {
  // ipotesi: ritorna [...classes, ...enumerators, ...datatypes]
  return [...this.classes, ...this.enumerators, ...this.datatypes];  // ← crash se this.datatypes undefined
}
```

Se la concat fa `...this.datatypes` su un `undefined`, **crash garantito** al primo accesso a `pkg.classifiers` (es. classic editor che renderizza il package).

### 4. Verifica path di load progetto

Cercare:

```bash
grep -rn 'VersionFixer' frontend/src --include='*.ts' --include='*.tsx' | head -20
```

Identificare:

- File principale `VersionFixer.tsx` (path canonico).
- Versione corrente del modello dichiarata.
- Pattern di migration: ci sono entry tipo `if (oldV < N) { ... }`?

### 5. Test empirico (read-only, niente edit)

Se possibile, **non eseguire** un load real-time. Limitarsi a ispezione statica. La verifica empirica con un progetto vecchio salvato la farà Alfonso nello smoke manuale.

---

## Verdict atteso

Riportare in chat **uno di tre**:

### Verdict A — No bump needed

> Tutti gli accessi a `datatypes` passano per L-layer getter con fallback `|| []`. Il `get_classifiers` merge guard usa `(this.datatypes || [])`. Progetti pre-W2 si caricano senza crash perché il getter produce array vuoto. Zero migrazione necessaria.

### Verdict B — Point-fix needed (no bump)

> Trovato N punto/i di accesso D-layer diretto senza guard:
> - `<file:linea>`: `<code-snippet>`
> 
> Fix proposto: aggiungere `|| []` (o `?? []`) in quei N punti. Costo ~N righe. Non serve VersionFixer perché la fix è retrocompatibile (legge `undefined` come array vuoto, comportamento equivalente a un progetto senza datatype).

### Verdict C — Bump VersionFixer needed

> Trovato uno o più dei seguenti pattern che richiedono migration:
> - `_set_classifiers` o `get_classifiers` assume `datatypes` esistente in modo non-fallback-able.
> - Codice esistente (pre-W2) accede a feature che presuppongono `datatypes !== undefined`.
> - Logica di consistency check (es. validazione, indexer) fallirebbe senza la key esplicita.
>
> Migrazione proposta:
> ```typescript
> if (oldV < <newV>) {
>   for (const pkgId of Object.keys(state.idlookup)) {
>     const pkg = state.idlookup[pkgId];
>     if (pkg?.className === 'DPackage' && !pkg.datatypes) {
>       pkg.datatypes = [];
>     }
>   }
> }
> ```
>
> Costo: ~10-15 righe `VersionFixer.tsx`. Bump `oldV → newV`.

---

## Hard constraints

- **Zero edit a codice source.** Solo grep, view file, e raccomandazione.
- **Zero touch a working tree W2 esistente.**
- Non eseguire `npm run dev` o load progetti reali — diagnostica statica only.
- Tempo target: 5-10 minuti.

---

## Output al ritorno in chat

1. Output del grep `\.datatypes` con classificazione per ogni hit.
2. Snippet di `get_datatypes` (riga esatta).
3. Snippet di `get_classifiers` merge guard (riga esatta).
4. Verdict A/B/C con motivazione.
5. Path canonico di `VersionFixer.tsx` + versione corrente.
