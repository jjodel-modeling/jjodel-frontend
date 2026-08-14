# Prompt Claude Code: attributo booleano obbligatorio inizializzato a `false`

**Data**: 2026-08-13 01:18
**Tipo**: fix
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`
**Scope deciso**: solo `EBoolean` con `lowerBound >= 1`, solo livello M1 (slot dell'oggetto istanziato). Nessuna modifica a `defaultValueLiteral` in M2, nessuna estensione agli altri tipi primitivi.

---

## COSA

Un attributo di tipo `EBoolean` con molteplicità `[1]` (cioè `lowerBound >= 1`) deve avere `false` nello slot dell'oggetto istanziato, non lo slot vuoto che ha oggi.

Un obbligatorio a tre stati (true, false, non impostato) non esiste nel dominio: se la molteplicità dice che il valore c'è sempre, il modello deve contenerlo.

Due commit separati, il secondo solo dopo conferma visiva del primo.

- **Commit A**: lo slot nasce già valorizzato quando l'oggetto viene reso conforme alla sua metaclasse.
- **Commit B**: gli slot già esistenti e vuoti vengono valorizzati quando l'attributo diventa booleano o diventa obbligatorio.

---

## DOVE

Due file, nessun altro.

| File | Punto |
|---|---|
| `frontend/src/model/logicWrapper/LModelElement.tsx` | `LObject._forceConformity` (~riga 6313), `class LAttribute` (~riga 4197) |
| `frontend/src/common/U.tsx` | sola lettura: `U.initializeValue` (riga 798), da riusare, non da modificare |

**Non toccare**: `Constructors.DStructuralFeature` in `joiner/classes.ts`, `ObjectNode.tsx`, `Info.tsx`, `useJjomSync.ts`, `canvasToJjom.ts`, `DAttribute.defaultValueLiteral`. Il motivo per ciascuno è nei RIFERIMENTI.

---

## COME

### Commit A: lo slot nasce valorizzato

In `LObject._forceConformity` il ciclo finale crea uno slot vuoto per ogni feature della metaclasse non ancora istanziata:

```ts
for (let id in idmap) {
    let v = context.proxyObject.addValue(undefined, id, [], true);
    if (out) out.featureCreated.push(v);
}
```

`idmap[id]` è la `LAttribute` o `LReference` corrispondente, quindi tipo e `lowerBound` sono entrambi noti e definitivi in questo punto. Sostituire l'array vuoto con il valore iniziale quando, e solo quando, la feature è un attributo booleano obbligatorio:

```ts
for (let id in idmap) {
    const feature = idmap[id];
    const initialValues = LAttribute.requiredBooleanInitialValues(feature);
    let v = context.proxyObject.addValue(undefined, id, initialValues, true);
    if (out) out.featureCreated.push(v);
}
```

Aggiungere in `class LAttribute` il predicato statico, unico posto dove la regola è scritta:

```ts
/** Required boolean attributes carry `false`, never an empty slot: a mandatory
 *  feature has no "unset" state. Returns the initial slot values for a feature,
 *  or an empty array for every other case (optional, non-boolean, reference).
 *  Value shape follows U.initializeValue, the existing canon: a string, later
 *  normalised by U.fromBoolString on read. */
public static requiredBooleanInitialValues(feature: LAttribute | LReference | undefined): PrimitiveType[] {
    if (!feature || feature.className !== DAttribute.cname) return [];
    const raw = (feature as LAttribute).__raw;
    if (!raw || raw.lowerBound < 1) return [];
    if (feature.type?.name !== 'EBoolean') return [];
    return [U.initializeValue(raw.type)];
}
```

Vincoli su questo blocco:

- Non hardcodare la stringa `'false'`. Passare da `U.initializeValue`, che è già la tabella canonica tipo per valore iniziale (`U.tsx:798`) e che per `EBoolean` restituisce `'false'`. Se un giorno la tabella cambia, il fix la segue.
- La guardia sul tipo va fatta per **nome** (`feature.type?.name !== 'EBoolean'`), non per pointer letterale: è la forma già usata in `Info.tsx:604-618` e in `ObjectNode.tsx:179`.
- Il controllo `className !== DAttribute.cname` è quello che tiene le reference fuori: `idmap` contiene sia `allAttributes` sia `allReferences`.

### Commit B: gli slot già esistenti

Solo dopo che il commit A è verificato a schermo.

`_forceConformity` salta le feature già istanziate (`for (let v of values) { ... delete idmap[...] }`), quindi non sana uno slot creato prima che l'attributo diventasse booleano obbligatorio. Il flusso reale passa sempre di lì: un attributo nasce `EString [0..1]` (`DAttribute.new`, riga 4172 e `DAttribute.lowerBound = 0`, riga 4143), diventa booleano per cambio tipo o per inferenza dal nome, e diventa obbligatorio solo quando qualcuno alza `lowerBound`.

Aggiungere in `class LAttribute` due override, entrambi col pattern super-then-extra già usato da `LAttribute.set_name` (~riga 4246), che documenta il vincolo: `TRANSACTION` committa in modo asincrono, quindi la condizione va decisa sul pre-stato più il valore in arrivo, mai rileggendo `c.data` dopo il `super`. E mai avvolgere il `super` in una `TRANSACTION` esterna (CLAUDE.md §3.3).

```ts
protected set_lowerBound(val: this["lowerBound"], c: Context): boolean {
    // The type does not change here, so the pre-state type is the final one.
    const becomesRequired = Math.max(0, +val || 0) >= 1 && c.data.lowerBound < 1;
    const isBoolean = this.get_type(c)?.name === 'EBoolean';
    const ret = super.set_lowerBound(val, c);
    if (becomesRequired && isBoolean) this.fillEmptyBooleanSlots(c);
    return ret;
}

protected set_type(val: Pack1<this["type"]>, c: Context): boolean {
    // lowerBound does not change here, so the pre-state bound is the final one.
    const isRequired = c.data.lowerBound >= 1;
    const becomesBoolean = Pointers.from(val as any) === (windoww.Defaults as typeof TDefaults).Pointer_EBOOLEAN;
    const ret = super.set_type(val, c);
    if (isRequired && becomesBoolean) this.fillEmptyBooleanSlots(c);
    return ret;
}

/** Writes `false` into every instance slot of this attribute that is still empty.
 *  Slots that already hold a value are left untouched: this initialises, it does
 *  not overwrite. */
private fillEmptyBooleanSlots(c: Context): void {
    const initial = U.initializeValue(c.data.type);
    const empty = (this.get_instances(c) as LValue[]).filter(lval => lval?.__raw?.values?.length === 0);
    if (empty.length === 0) return;
    TRANSACTION(this.get_name(c) + '.initialiseRequiredBooleanSlots', () => {
        for (const lval of empty) SetFieldAction.new(lval.__raw, 'values', [initial], '', false);
    });
}
```

Vincoli su questo blocco:

- `fillEmptyBooleanSlots` scrive **solo** dove `values.length === 0`. Non toccare slot già valorizzati: un fix di inizializzazione che sovrascrive dati esistenti è una regressione, non un fix.
- La `TRANSACTION` di `fillEmptyBooleanSlots` è sorella di quella del `super`, mai annidata dentro.
- Il pattern di iterazione sulle istanze dentro un setter ha già un precedente nello stesso file: la propagazione di `composition`/`aggregation` a ~riga 4022 itera `this.get_instances(c) as LValue[]` esattamente così.

**Limite noto da lasciare scritto in un commento**, non da risolvere: `set_type` riconosce il passaggio a booleano solo quando l'UI passa un pointer. Il flusso principale lo fa (`canvasToJjom.ts:602` passa `pointerId || value`), ma `set_type` accetta anche nomi in chiaro e li risolve al suo interno; se arriva un nome, l'aggancio non scatta e lo slot resta vuoto finché non si tocca la molteplicità. Documentarlo, non duplicare la tabella di alias di `set_type` per coprirlo.

---

## VERIFICA

Prima del commit:

1. `npm run build` a exit 0.
2. `npx vitest run src/components` senza regressioni sul conteggio corrente.
3. `npm run typecheck`: riportare il numero di errori e confrontarlo con la baseline del branch. Δ atteso 0.

Poi, sull'app, entrambi i commit:

- **Commit A**: metamodello con una classe che ha già un attributo booleano `[1]`, poi istanziare un oggetto nuovo. Lo slot deve comparire valorizzato `false`, non vuoto e non assente. Nota: prima del fix un booleano `[1]` senza slot non compare affatto nel nodo oggetto, perché `ObjectNode.tsx:161` esclude i required dai placeholder lazy (`if (lb > 0) continue`).
- **Commit B**: classe con oggetti già istanziati, poi aggiungere un attributo, portarlo a `EBoolean`, poi portare `lowerBound` a 1. Gli slot vuoti degli oggetti esistenti devono passare a `false`. Un attributo booleano `[0..1]` deve restare vuoto: è il controllo negativo, e serve a dimostrare che la differenza fra "non impostato" e "false" sopravvive dove è legittima.
- Controllo di non regressione: un attributo booleano `[1]` a cui l'utente ha già messo `true` non deve tornare a `false` toccando la molteplicità.

---

## PROMPT LOG

Aggiornare `docs/claude-code-log.md` a fine task, dopo la conferma visiva, con il formato consueto. Nome del documento prompt: `2026-08-13 01:18 prompt_bool_required_default_false`.

---

## RIFERIMENTI

Punti misurati sul branch `alfonso-frontend-jjtl` (HEAD `93800c7`), da rileggere prima di modificare: i numeri di riga sono indicativi e il working tree locale può differire.

**Dove nasce uno slot M1.** `LObject._forceConformity` (`LModelElement.tsx:6313`), invocato da `LObject.set_instanceof` (riga 6283). Prende `allAttributes` e `allReferences` della metaclasse, toglie quelle già istanziate, e crea il resto con `addValue(undefined, id, [], true)`. È l'unico punto vivo che materializza slot per conformità.

**Perché non `Constructors.DStructuralFeature`** (`joiner/classes.ts:713`). È il punto che aggiunge lo slot agli oggetti esistenti quando una feature nasce in M2, e sembra il candidato naturale. Non lo è: in quel punto `lowerBound` vale sempre 0, perché è il default di campo di `DAttribute` e i setter arrivano dopo nella catena `Constructors`. La condizione "booleano obbligatorio" non è mai vera lì.

**Perché non `ObjectNode.tsx`.** Alla riga 179 c'è già `defaultDisplay = 'false'` per i booleani, ma è display di un placeholder, non un valore nel modello, ed è vivo solo per `lb === 0`. Sistemare lì darebbe l'apparenza senza il dato: l'export XMI, la conformità e JjTL continuerebbero a vedere uno slot vuoto.

**Perché la stringa e non il booleano.** `PrimitiveType` (`joiner/types.ts:69`) ammette entrambi, e il codebase oggi è incoerente: `U.initializeValue` produce stringhe, mentre l'editing da checkbox in `Info.tsx:642` scrive un booleano vero (`target.checked`). Il fix riusa `U.initializeValue` per non introdurre una terza forma, e i lettori normalizzano con `U.fromBoolString` (`U.tsx:1679`), che mappa `'false'` su `false`. **Rischio da tenere presente**: `'false'` è truthy in JavaScript, quindi un consumatore che facesse `if (values[0])` leggerebbe true. Se durante il lavoro emerge un consumatore così, fermarsi e segnalarlo invece di cambiare la forma del valore di iniziativa.

**Precedenti di stile da imitare.** Super-then-extra con pre-stato sincrono: `LAttribute.set_name` (~riga 4246), che porta anche il commento sul perché non si rilegge dopo il `super`. Iterazione sulle istanze dentro un setter: la propagazione di containment a ~riga 4022.

**Inferenza del tipo dal nome.** `src/model/attributeTypeInference.ts` porta un attributo ancora sul default `EString` a `EBoolean` quando lo si rinomina `isActive`, `hasFoo`, `enabled` e simili. È il modo più frequente in cui un attributo diventa booleano, e passa da `set_name`, non da `set_type`: dopo l'inferenza l'attributo è booleano ma `[0..1]`, quindi il commit B scatta al successivo cambio di molteplicità. Comportamento corretto, nessuna azione richiesta.
