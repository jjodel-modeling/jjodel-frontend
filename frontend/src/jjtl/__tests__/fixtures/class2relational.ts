/**
 * Class2Relational, a non-hardware acceptance case for JjTL (P-2026-11-03-1434).
 *
 * Source metamodel `ClassDiagram`:
 *   Package    name; classes: Class[*] (containment); types: DataType[*] (containment)
 *   Classifier name (abstract); DataType and Class extend it
 *   Class      isAbstract; super: Class[0..1]; attributes: Attribute[*] (containment)
 *   Attribute  name; multiValued; type: Classifier[1]
 *
 * Target metamodel `Relational`:
 *   Schema     name; tables: Table[*] (containment); types: Type[*] (containment)
 *   Table      name; columns: Column[*] (containment); key: Column[*];
 *              foreignKeys: ForeignKey[*] (containment)
 *   Column     name; type: Type[1]
 *   ForeignKey name; column: Column[1]; refersTo: Table[1]
 *   Type       name
 *
 * Mapping: joined inheritance (one table per class, abstract ones included, a subclass
 * table keyed by its own `id` and pointing at its superclass's table); a single-valued
 * attribute of a data type is a column; of a class, a `<name>Id` column with a foreign
 * key; a multi-valued attribute is a join table `<Owner>_<name>` of an owner column and a
 * value column.
 *
 * `NATURAL` is the transformation as one would write it first. `WORKAROUND` is the one
 * that runs; every difference is listed in the discovery report
 * (docs/discovery/discovery_2026-11-03_jjtl_class2relational.md).
 */

export const NATURAL = `transformation Class2Relational
from ClassDiagram
to Relational

-- A package is a schema: its data types, its classes and its multi-valued attributes.
Package p -> Schema {
    name := p.name
    types := p.types
    tables := p.classes + p.classes.flatMap(c => c.attributes.filter(a => a.multiValued))
}

DataType -> Type {
    name := name
}

-- One table per class, keyed by its own id column; a subclass points at its superclass.
Class c -> Table {
    name := c.name
    let $id = idColumn(c) in {
        columns := [$id] + c.attributes.filter(a => not a.multiValued)
        key := [$id]
        foreignKeys := c.attributes.filter(a => not a.multiValued and a.type is Class).map(a => refFk(a))
            + (if c.super == null then [] else [superFk(c, $id)])
    }
}

Attribute a -> Column where not a.multiValued and a.type is DataType {
    name := a.name
    type := a.type
}

Attribute a -> Column where not a.multiValued and a.type is Class {
    name := a.name + "Id"
    type := integerType(a)
}

Attribute a -> Table where a.multiValued {
    name := a.parent.name + "_" + a.name
    let $owner = ownerColumn(a) in {
        columns := [$owner, valueColumn(a)]
        key := [$owner]
    }
}

rule idColumn(c) -> Column {
    name := "id"
    type := integerType(c)
}

rule ownerColumn(a) -> Column {
    name := a.parent.name.toLowerCase() + "Id"
    type := integerType(a)
}

rule valueColumn(a) -> Column {
    name := if a.type is Class then a.name + "Id" else a.name
    type := if a.type is Class then integerType(a) else a.type
}

rule refFk(a) -> ForeignKey {
    name := "fk_" + a.parent.name + "_" + a.name
    column := a
    refersTo := a.type
}

rule superFk(c, id) -> ForeignKey {
    name := "fk_" + c.name + "_super"
    column := id
    refersTo := c.super
}

helper integerType(e: Element) -> DataType {
    e.parent.types.filter(t => t.name == "Integer").first()
}
`;

/**
 * Each workaround replaces one passage of NATURAL, with the reason it was needed. WORKAROUND
 * is NATURAL with all of them applied, in order; a passage that does not occur is an error.
 */
export const WORKAROUNDS: { why: string; from: string; to: string }[] = [
    {
        why: 'W1: a binding ends at the end of its line; a continuation line starting with `+` is a parse error, "Expected source attribute name"',
        from: '.map(a => refFk(a))\n            + (if',
        to: '.map(a => refFk(a)) + (if',
    },
    {
        why: 'W2: `x.parent` is null for any element but the rule\'s own; only the bare `parent` of the matched element is bound, so the owner travels as an argument',
        from: '    name := a.parent.name + "_" + a.name\n    let $owner = ownerColumn(a) in {',
        to: '    name := parent.name + "_" + a.name\n    let $owner = ownerColumn(parent) in {',
    },
    {
        why: 'W2',
        from: 'rule ownerColumn(a) -> Column {\n    name := a.parent.name.toLowerCase() + "Id"\n    type := integerType(a)',
        to: 'rule ownerColumn(o) -> Column {\n    name := o.name.toLowerCase() + "Id"\n    type := integerType()',
    },
    {
        why: 'W2',
        from: '.map(a => refFk(a))',
        to: '.map(a => refFk(c, a))',
    },
    {
        why: 'W2',
        from: 'rule refFk(a) -> ForeignKey {\n    name := "fk_" + a.parent.name + "_" + a.name',
        to: 'rule refFk(c, a) -> ForeignKey {\n    name := "fk_" + c.name + "_" + a.name',
    },
    {
        why: 'W3: there is no allInstances; the Integer type is found in `data`, the whole source model, bound in every context (SPEC 7.3), so the helper needs no element',
        from: 'helper integerType(e: Element) -> DataType {\n    e.parent.types.filter(t => t.name == "Integer").first()',
        to: 'helper integerType() -> DataType {\n    data.filter(t => t.className == "DataType" and t.name == "Integer").first()',
    },
    { why: 'W3', from: '    type := integerType(c)', to: '    type := integerType()' },
    { why: 'W3', from: '    name := a.name + "Id"\n    type := integerType(a)', to: '    name := a.name + "Id"\n    type := integerType()' },
    { why: 'W3', from: 'then integerType(a) else', to: 'then integerType() else' },
    {
        why: 'W4: the string method is `toLower`, not `toLowerCase`; a slip of the writer, reported at run time with "Did you mean \'toLower\'?"',
        from: 'o.name.toLowerCase()',
        to: 'o.name.toLower()',
    },
    {
        why: 'W5: a `let` bound to a call holds the call, not its target: each use applies the rule afresh (R-JTG-6), so `key` and the foreign key got columns of their own, left at the root, with no warning. One target referenced twice needs a matched rule, so the key column is a second matched rule on Class, and every resolution of a Class names its rule with `resolve()` (R-JTG-3)',
        from: '    let $id = idColumn(c) in {\n        columns := [$id] + c.attributes.filter(a => not a.multiValued)\n        key := [$id]\n',
        to: '    columns := [resolve(c, Column)] + c.attributes.filter(a => not a.multiValued)\n    key := [resolve(c, Column)]\n',
    },
    {
        why: 'W5',
        from: '[superFk(c, $id)])\n    }\n}',
        to: '[superFk(c)])\n}',
    },
    {
        why: 'W5',
        from: '        foreignKeys := c.attributes',
        to: '    foreignKeys := c.attributes',
    },
    {
        why: 'W5',
        from: 'rule idColumn(c) -> Column {',
        to: '-- The key column of a class\'s table.\nClass c -> Column {',
    },
    {
        why: 'W5',
        from: 'rule superFk(c, id) -> ForeignKey {\n    name := "fk_" + c.name + "_super"\n    column := id\n    refersTo := c.super',
        to: 'rule superFk(c) -> ForeignKey {\n    name := "fk_" + c.name + "_super"\n    column := resolve(c, Column)\n    refersTo := resolve(c.super, Table)',
    },
    { why: 'W5', from: '    tables := p.classes + p.classes', to: '    tables := p.classes.map(c => resolve(c, Table)) + p.classes' },
    { why: 'W5', from: '    column := a\n    refersTo := a.type', to: '    column := a\n    refersTo := resolve(a.type, Table)' },
    {
        why: 'W5, for the join table: its owner column is the second matched rule on a multi-valued Attribute',
        from: '    let $owner = ownerColumn(parent) in {\n        columns := [$owner, valueColumn(a)]\n        key := [$owner]\n    }\n',
        to: '    columns := [resolve(a, Column), valueColumn(a)]\n    key := [resolve(a, Column)]\n',
    },
    {
        why: 'W5',
        from: 'rule ownerColumn(o) -> Column {\n    name := o.name.toLower() + "Id"',
        to: '-- The owner column of a join table.\nAttribute a -> Column where a.multiValued {\n    name := parent.name.toLower() + "Id"',
    },
    { why: 'W5', from: 'c.attributes.filter(a => a.multiValued))', to: 'c.attributes.filter(a => a.multiValued).map(a => resolve(a, Table)))' },    {
        why: 'W6: the bare type name of `resolve(x, T)` is read as a name only when the call is the whole right-hand side; inside a list or a lambda it is evaluated as a variable, null, and the call reports the ambiguity it was written to settle. Quoted, it is a string and works everywhere',
        from: '__ALL__',
        to: '',
    },
];

export const WORKAROUND = WORKAROUNDS.reduce((text, w) => {
    // W6 rewrites every `resolve(x, T)` to `resolve(x, "T")`.
    if (w.from === '__ALL__') return text.replace(/resolve\(([^,()]+(?:\([^()]*\))?), (\w+)\)/g, 'resolve($1, "$2")');
    if (!text.includes(w.from)) throw new Error(`workaround passage not found: ${w.why}`);
    return text.replace(w.from, w.to);
}, NATURAL);

// ---------------------------------------------------------------------------
// Metamodels, in the shape the executor reads (`classes` with attributes and
// references, a reference carrying `composition` and its type's name).

function cls(name: string, attributes: string[], references: any[] = [], superTypes: string[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references, allReferences: references,
        superTypes,
    };
}
const contains = (name: string, type: string) => ({ name, composition: true, type: { name: type } });
const refers = (name: string, type: string) => ({ name, composition: false, type: { name: type } });

export const RELATIONAL = {
    classes: [
        cls('Schema', ['name'], [contains('tables', 'Table'), contains('types', 'Type')]),
        cls('Table', ['name'], [contains('columns', 'Column'), refers('key', 'Column'), contains('foreignKeys', 'ForeignKey')]),
        cls('Column', ['name'], [refers('type', 'Type')]),
        cls('ForeignKey', ['name'], [refers('column', 'Column'), refers('refersTo', 'Table')]),
        cls('Type', ['name']),
    ],
};

export const CLASS_DIAGRAM = {
    classes: [
        cls('Package', ['name'], [contains('classes', 'Class'), contains('types', 'DataType')]),
        cls('Classifier', ['name']),
        cls('DataType', ['name'], [], ['Classifier']),
        cls('Class', ['name', 'isAbstract'], [refers('super', 'Class'), contains('attributes', 'Attribute')], ['Classifier']),
        cls('Attribute', ['name', 'multiValued'], [refers('type', 'Classifier')]),
    ],
};

// ---------------------------------------------------------------------------
// The source model, flat: every object, roots and contained, a reference as
// `{ __ref: id }` and a contained object's container as `_containerId` (the shape
// ProjectEditor hands the executor, §4.2).

const ref = (id: string) => ({ __ref: id });
const el = (id: string, className: string, extra: Record<string, any> = {}) =>
    ({ id, className, __type: className, ...extra });
const attr = (id: string, owner: string, name: string, type: string, multiValued = false) =>
    el(id, 'Attribute', { name, multiValued, type: ref(type), _containerId: owner });

/**
 * shop
 *   types    Integer, String, Boolean
 *   Named    (abstract)        name: String
 *   Customer extends Named     email: String, vip: Boolean, phones: String[*]
 *   Product  extends Named     price: Integer
 *   Order                      number: Integer, buyer: Customer, items: Product[*]
 *
 * Every case: single-valued data-type attribute (email, vip, price, number, name),
 * single-valued class-typed attribute (buyer), multi-valued data-type attribute
 * (phones), multi-valued class-typed attribute (items), inheritance (Customer and
 * Product under Named), an abstract class (Named), a class with no superclass (Order).
 */
export const SHOP = [
    el('p', 'Package', {
        name: 'shop',
        types: [ref('tInt'), ref('tStr'), ref('tBool')],
        classes: [ref('cNamed'), ref('cCustomer'), ref('cProduct'), ref('cOrder')],
    }),
    el('tInt', 'DataType', { name: 'Integer', _containerId: 'p' }),
    el('tStr', 'DataType', { name: 'String', _containerId: 'p' }),
    el('tBool', 'DataType', { name: 'Boolean', _containerId: 'p' }),
    el('cNamed', 'Class', { name: 'Named', isAbstract: true, super: null, attributes: [ref('aName')], _containerId: 'p' }),
    el('cCustomer', 'Class', {
        name: 'Customer', isAbstract: false, super: ref('cNamed'),
        attributes: [ref('aEmail'), ref('aVip'), ref('aPhones')], _containerId: 'p',
    }),
    el('cProduct', 'Class', { name: 'Product', isAbstract: false, super: ref('cNamed'), attributes: [ref('aPrice')], _containerId: 'p' }),
    el('cOrder', 'Class', {
        name: 'Order', isAbstract: false, super: null,
        attributes: [ref('aNumber'), ref('aBuyer'), ref('aItems')], _containerId: 'p',
    }),
    attr('aName', 'cNamed', 'name', 'tStr'),
    attr('aEmail', 'cCustomer', 'email', 'tStr'),
    attr('aVip', 'cCustomer', 'vip', 'tBool'),
    attr('aPhones', 'cCustomer', 'phones', 'tStr', true),
    attr('aPrice', 'cProduct', 'price', 'tInt'),
    attr('aNumber', 'cOrder', 'number', 'tInt'),
    attr('aBuyer', 'cOrder', 'buyer', 'cCustomer'),
    attr('aItems', 'cOrder', 'items', 'cProduct', true),
];

/**
 * The expected relational schema, as text: per table its columns `name:type`, its key,
 * and its foreign keys `name(column -> table)`. Tables and types in source order.
 */
export const EXPECTED_SCHEMA = [
    'schema shop',
    'types Integer, String, Boolean',
    'table Named: id:Integer, name:String | key id',
    'table Customer: id:Integer, email:String, vip:Boolean | key id | fk_Customer_super(id -> Named)',
    'table Product: id:Integer, price:Integer | key id | fk_Product_super(id -> Named)',
    'table Order: id:Integer, number:Integer, buyerId:Integer | key id | fk_Order_buyer(buyerId -> Customer)',
    'table Customer_phones: customerId:Integer, phones:String | key customerId',
    'table Order_items: orderId:Integer, itemsId:Integer | key orderId',
];
