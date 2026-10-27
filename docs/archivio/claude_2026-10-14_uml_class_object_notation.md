# UML class and object diagrams as a Jjodel notation

Date: 2026-10-14. Chat: C-2026-10-14-1644. Working material for the fixture lane P-2026-10-14-1955, not a spec of the product.

## 1. Scope and the choice behind it

One metamodel, `UML`, at M2, covering a subset of UML 2.5.1: classes, data types, enumerations, primitive types, properties, operations, parameters, generalizations, binary associations, and the instance model of UML (InstanceSpecification, Slot, ValueSpecification). A UML model is one M1 model of this metamodel; the class diagram and the object diagram are two viewpoints on that one model.

Object diagrams are UML instance specifications, not M1 instances of the user's classes (Alfonso, 2026-10-14). Consequence: the engine gives no conformance between an object and its class. Instantiation is a relation the model states (the `classifier` reference) and the rules of section 5 check.

## 2. Metamodel

Enumerations: `VisibilityKind` {public, private, protected, package}; `AggregationKind` {none, shared, composite}.

Classes, as `Name (abstract) : supertypes; features`. Multiplicity 1..1 unless written. A reference marked `contains` is a containment.

- `NamedElement` (abstract); `name: EString`.
- `PackageableElement` (abstract) : NamedElement.
- `Package` : PackageableElement; `packagedElements: PackageableElement [0..*] contains`.
- `Type` (abstract) : PackageableElement.
- `Classifier` (abstract) : Type; `isAbstract: EBoolean`; `generalizations: Generalization [0..*] contains`.
- `Class` : Classifier; `ownedAttributes: Property [0..*] contains`; `ownedOperations: Operation [0..*] contains`.
- `DataType` : Classifier.
- `PrimitiveType` : DataType.
- `Enumeration` : DataType; `ownedLiterals: EnumerationLiteral [0..*] contains`.
- `Association` : Classifier; `memberEnds: Property [2..2]`; `ownedEnds: Property [0..*] contains`.
- `Generalization` (no supertype, unnamed); `specific: Classifier`; `general: Classifier`.
- `TypedElement` (abstract) : NamedElement; `type: Type [0..1]`.
- `MultiplicityElement` (abstract); `lower: EInt` (default 1); `upper: EInt` (default 1, -1 stands for *).
- `Property` : TypedElement, MultiplicityElement; `visibility: VisibilityKind`; `aggregation: AggregationKind`; `isDerived: EBoolean`; `defaultValue: EString`; `association: Association [0..1]`.
- `Operation` : NamedElement; `visibility: VisibilityKind`; `ownedParameters: Parameter [0..*] contains`; `type: Type [0..1]` (the return type).
- `Parameter` : TypedElement, MultiplicityElement.
- `InstanceSpecification` : PackageableElement; `classifier: Classifier`; `slots: Slot [0..*] contains`.
- `EnumerationLiteral` : InstanceSpecification. Its `classifier` is its enumeration.
- `Slot`; `definingFeature: Property`; `values: ValueSpecification [0..*] contains`.
- `ValueSpecification` (abstract) : TypedElement.
- `LiteralInteger` : ValueSpecification; `value: EInt`.
- `LiteralString` : ValueSpecification; `value: EString`.
- `LiteralBoolean` : ValueSpecification; `value: EBoolean`.
- `LiteralNull` : ValueSpecification.
- `InstanceValue` : ValueSpecification; `instance: InstanceSpecification`.

Association ends. `memberEnds[0]` is the end typed by the source class of the drawn line, `memberEnds[1]` the end typed by the target class. An end with `aggregation` shared or composite is the part side: the diamond is drawn at the opposite end, the whole. In the example every end is owned by its association (`ownedEnds`), so no class lists an association end among its attributes.

Links. A link is an InstanceSpecification whose classifier is an Association, with one slot per member end; the value of each slot is an InstanceValue pointing to the object at that end. Slot order follows `memberEnds`.

## 3. How an object is an instance of a class

The reference `InstanceSpecification.classifier` says which class an object claims to instantiate. The claim holds when the rules O1..O8 hold: the class is concrete, every slot fills an attribute of the class or of an ancestor, at most once, with values that conform to the attribute type and respect its multiplicity, and the links around the object respect the association ends. The relation is therefore checked, not built in, which is the point of choosing the UML instance model over M1 instances.

## 4. Concrete syntax: two viewpoints

Viewpoint `UML class diagram`.

- Class: rectangle, white, border 1. Header: the name, centred, bold; italic when `isAbstract` (or a `{abstract}` line if italic is not available as a conditional style). Compartment attributes: the contained Properties with no `association`, one row each, `<vis> name : Type [l..u]`, where `<vis>` is +, -, # or ~ for public, private, protected, package and the multiplicity is omitted when it is 1..1. Compartment operations: `<vis> name(p : T, ...) : R`. Separators between header and compartments.
- Enumeration: rectangle, a first header line with the keyword in guillemets, enumeration, then the name; a compartment with one row per literal name.
- PrimitiveType: rectangle, keyword primitive in guillemets above the name. DataType: keyword dataType.
- Generalization: object-as-edge from `specific` to `general`, solid, hollow triangle at the general end.
- Association: object-as-edge from `memberEnds[0].type` to `memberEnds[1].type`, solid. A filled diamond at the source end when `memberEnds[1].aggregation` is composite, hollow when shared; symmetrically at the target end from `memberEnds[0]`. End labels: the name and multiplicity of `memberEnds[0]` at the source end and of `memberEnds[1]` at the target end. Centre label: the association name. Navigability is not drawn in this subset.
- Not drawn (visible false): Package, Property, Operation, Parameter, EnumerationLiteral, InstanceSpecification, Slot, every ValueSpecification.

Viewpoint `UML object diagram`.

- Object (an InstanceSpecification whose classifier has no `memberEnds`, and not an EnumerationLiteral): rectangle, header `name : ClassName` underlined; a compartment with one row per slot, `feature = value`, where the value is the literal or, for an InstanceValue, the name of the instance (an enumeration literal shows its name).
- Link (an InstanceSpecification whose classifier has `memberEnds`): object-as-edge from the instance of `slots[0]` to the instance of `slots[1]`; centre label the association name; end labels the defining feature names.
- Not drawn: everything of the class diagram, EnumerationLiteral, Slot, every ValueSpecification.

Both viewpoints draw on the one graph of the model, so class diagram nodes and object diagram nodes sit in separate regions of the plane.

## 5. Validation rules

Written in OCL-like notation. They cannot run as Jjodel rules until slice 1 of user-defined validation (R-VAL) exists; until then the fixture implements them as checks on the store, and this list is the source for the later JjEL translation. Severity is error unless written.

Class diagram.

- C1 The generalization graph is acyclic: no classifier is among its own ancestors.
- C2 `g.specific` is the classifier that owns `g`, and `g.general <> g.specific`.
- C3 A Class specializes only Classes, a DataType only DataTypes, an Association only Associations.
- C4 Within a class, attribute names are unique and differ from the names of inherited attributes; operation names are unique.
- C5 Multiplicity is well formed: `lower >= 0`, `upper = -1 or upper >= lower`, `upper <> 0`.
- C6 An association has exactly two member ends, each with `association = self` and a type.
- C7 At most one end of an association is shared or composite; when an end is composite, the opposite end has `upper <= 1` and `upper <> -1`.
- C8 Warning: a Property or Parameter without a type.
- C9 Literal names are unique within their enumeration, and every literal has its enumeration as classifier.

Object diagram.

- O1 The classifier of an object is a concrete Class; the classifier of a link is an Association; the classifier of a literal is an Enumeration.
- O2 Every slot of an object has as defining feature an attribute of the classifier or of one of its ancestors; every slot of a link has as defining feature a member end of its association.
- O3 At most one slot per defining feature.
- O4 The number of values of a slot lies within the multiplicity of its defining feature. Warning: an attribute with `lower >= 1` and no `defaultValue` has no slot (UML allows partial instance specifications, so this is not an error).
- O5 Values conform to the type of the defining feature: LiteralInteger for Integer, LiteralString for String, LiteralBoolean for Boolean (primitive types by name), an InstanceValue to a literal of the enumeration for an Enumeration, an InstanceValue to an object whose classifier is the type or a descendant for a Class.
- O6 A link has exactly two slots, one per member end, each with one InstanceValue to an object that conforms to the end type.
- O7 For every object x and member end e, the number of links of e's association that have x at the end opposite to e lies within the multiplicity of e.
- O8 An object is the part of at most one composite link.

## 6. Example model: a library

Primitive types String, Integer, Boolean. Enumeration Genre {fiction, science, history}.

- Publication (abstract): + title : String; # year : Integer; + age() : Integer.
- Book : Publication: - isbn : String; - genre : Genre.
- Magazine : Publication: - issue : Integer.
- Library: - name : String.
- Member: - name : String; - active : Boolean = true; + borrow(b : Book) : Boolean.
- Association Holdings: library : Library [1..1], holdings : Publication [0..*] composite.
- Association Membership: libraries : Library [1..*], members : Member [0..*] shared.
- Association Borrowing: borrower : Member [0..1], loans : Book [0..3].

Objects: cityLib : Library (name = City Library); dune : Book (title = Dune, year = 1965, isbn = 978-0441013593, genre = fiction); history : Book (title = A Brief History of Time, year = 1988, isbn = 978-0553380163, genre = science); nature : Magazine (title = Nature, year = 2026, issue = 8012); alice : Member (name = Alice, active = true). Links: three Holdings links from cityLib to dune, history and nature; one Membership link from cityLib to alice; one Borrowing link from alice to dune.

## 7. Deviations from UML 2.5.1

- `InstanceSpecification.classifier` is 1..1 (UML: 0..*).
- Operation has a direct `type` for the return type instead of a return Parameter.
- Generalization is unnamed and not an Element subclass; there is no common Element root, comments or constraints.
- Association is binary only; navigability, qualifiers, association classes, n-ary associations and redefinition or subsetting of properties are out.
- MultiplicityElement keeps integer bounds, not ValueSpecifications.

The fixture lane appends here any fallback it had to take because the IR cannot express a rendering of section 4.

Fallbacks of the fixture (P-2026-10-20-2330, `frontend/scripts/probe/uml-class-object-fixture.ts`):

- Attributes and operations share one compartment: only the first `children` compartment of a vertex view renders.
- The object header `dune : Book` is two `top` labels, the name and `$classifier.value.$name.value`, each underlined by an inline style on its own `span.ir-label`: a vertex label takes one source, no template.
- An end multiplicity is a literal of the edge view: one Association edge view per multiplicity pair of the model, plus one without multiplicity, since an end label takes one source and `-1` cannot map to `*`.
- An operation shows its first parameter only, `, ...` past it; a slot shows its first value only: the IR has no list join.
- The InstanceValue slot row is chosen by `exists` on `$values.values[0].$instance.value`, because `isKind` on the one-step path `$values.values[0]` never matched; the LiteralNull row, written with `isKind`, is therefore unreachable (no null in the example).
- Every drawn box is given its size, from its top labels and rows: the default height clips the header from two rows on.
