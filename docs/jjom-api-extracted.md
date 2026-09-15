# JjOM API — Extracted Specification

Read-only documentation extracted from the codebase on 2026-04-15. Covers the Data, Node, and View submodels of the Jjodel Object Model (JjOM).

Every construct has a **D-layer** (raw data class, serializable to Redux) and an **L-layer** (proxy with computed properties and navigation helpers). Methods prefixed with `get_*` / `set_*` are invoked by the proxy machinery when the user reads/writes a property of the same name without the prefix; they are not usually called directly. Where the L-layer just re-exports the D-layer's getters unchanged they are listed once under the class pair.

## Sources

- `frontend/src/joiner/classes.ts`
- `frontend/src/model/logicWrapper/LModelElement.tsx`
- `frontend/src/model/dataStructure/GraphDataElements.tsx`
- `frontend/src/view/viewElement/view.tsx`
- `frontend/src/view/viewPoint/viewpoint.ts`
- `frontend/src/common/Geom.ts`

---

# Data submodel

## DModelElement / LModelElement
_File_: `model/logicWrapper/LModelElement.tsx:107` (D) / `:155` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Array of annotations attached to this element. |
| father | Pointer<DModelElement, 1, 1, LModelElement> | Direct parent element in containment hierarchy. |
| id | Pointer<DModelElement, 1, 1, LModelElement> | Unique identifier. |
| parent | Pointer<DModelElement, 0, 'N', LModelElement> | Bidirectional parent references. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addAnnotation | (source?, details?) => DAnnotation | Factory: create and attach a new annotation. |
| addChild | (type?, ...params) => LModelElement | Factory: add child of specified type with auto-detection. |
| addException | () => void | Factory: register an exception on enclosing operation. |
| annotations | LAnnotation[] | Wrapped DAnnotation pointers as L-objects. |
| autofix_name | (val) => string | Factory: auto-fix name by replacing spaces with underscores. |
| childNames | string[] | Names of all direct children. |
| children | (LPackage \| LClassifier \| LTypedElement \| LAnnotation \| LObject \| LValue)[] | Merged collection of all subelements except annotations. |
| class | LClass \| null | Walks up father chain to enclosing LClass. |
| containers | LModelElement[] | Chain of fathers recursively up to root. |
| crossEcore | GObject | Alias for deepCrossEcore. |
| deepCrossEcore | GObject | Ecore representation with cross-refs as links (nested). |
| deepOwnEcore | GObject | Ecore representation with dependencies merged (nested). |
| duplicate | (deep?) => LModelElement | Factory: deep or shallow copy of the element. |
| ecore | GObject | Alias for deepCrossEcore. |
| eCore | GObject | Fault-tolerance alias for ecore. |
| edge | LEdge | First edge node representing this element. |
| edgePoint | LEdgePoint | First edge-point node representing this element. |
| edgePoints | LEdgePoint[] | All edge-point nodes representing this element. |
| edges | LEdge[] | All edge nodes representing this element. |
| enum | LEnumerator \| null | Walks up father chain to enclosing LEnumerator. |
| father | LModelElement | Direct parent element. |
| fatherList | LModelElement[] | Chain of fathers from this up to root. |
| field | LGraphElement | First graphical field node of this element. |
| fields | LGraphElement[] | All graphical field nodes of this element. |
| fullname | string | Dotted path from root to this element. |
| fullName | string | Alias for fullname. |
| getByFullPath | (path: string \| string[]) => L \| null | Factory: navigate by dotted path. |
| graph | LGraph | First graph node representing this element. |
| graphs | LGraph[] | All graph nodes representing this element. |
| instantiable | boolean | Alias for isInstantiable. |
| isInstantiable | boolean | Whether element type can instantiate model instances. |
| isM1 | () => boolean | Factory: true if element belongs to M1 (model, not metamodel). |
| isM2 | () => boolean | Factory: true if element belongs to M2 (metamodel). |
| model | LModel | Walks up father chain to enclosing LModel. |
| node | LGraphElement \| undefined | Latest updated node representing this element. |
| nodes | LGraphElement[] | All graphic nodes (vertices, edges, graphs) for element. |
| notEdge | LGraphElement | First non-edge node representing this element. |
| notEdges | LGraphElement[] | All non-edge nodes representing this element. |
| operation | LOperation \| null | Walks up father chain to enclosing LOperation. |
| ownEcore | GObject | Alias for deepOwnEcore. |
| package | LPackage \| null | Walks up father chain to enclosing LPackage. |
| property | keyof DModelElement | Redux property name (className lowercased plural). |
| shallowCrossEcore | GObject | Ecore with cross-refs as links, no nested subelements. |
| shallowOwnEcore | GObject | Ecore with dependencies merged, no nested subelements. |
| subNodes | LGraphElement[] | Graph subnodes, optionally including self. |
| t2m | () => this | Factory: DummyDoT2M converts ecore to Jodel model format. |
| td | GObject | Short alias for transientData. |
| transientData | GObject | Runtime cached properties, not persisted or shared. |
| typeToEcoreString | () => string | Factory: format type as ecore-qualified string. |
| typeToShortString | () => string | Factory: format type as simple type name. |
| vertex | LVertex | First vertex node representing this element. |
| vertexes | LVertex[] | All vertex nodes representing this element. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| add_annotation | val, c | boolean | Add annotations to collection under transaction. |
| canOverride | context, other | boolean | Check if this typed element is compatible override. |
| remove_annotation | val, c | boolean | Remove annotations from collection under transaction. |
| set_parent | val, c | boolean | Set parent/father under transaction. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| DFromHtml | target? | DModelElement \| undefined | Resolve DOM element to D-layer object. |
| LFromHtml | target? | LModelElement \| undefined | Resolve DOM element to L-layer proxy. |
| PtrFromHtml | target? | Pointer<DModelElement> \| undefined | Resolve DOM element to pointer ID. |
| new | () | DModelElement | Abstract; logs error and returns null. |
| new3 | ...a | DModelElement | Abstract; logs error and returns null. |

---

## DAnnotation / LAnnotation
_File_: `model/logicWrapper/LModelElement.tsx:980` (D) / `:1003` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Nested annotations. |
| details | DAnnotationDetail[] | Key-value pairs attached to this annotation. |
| father | Pointer<DModelElement, 1, 1, LModelElement> | Element this annotation is attached to. |
| id | Pointer<DAnnotation, 1, 1, LAnnotation> | Unique identifier. |
| parent | Pointer<DModelElement, 0, 'N', LModelElement> | Bidirectional parent references. |
| source | string | Annotation source namespace/identifier. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| details | LAnnotationDetail[] | Wrapped annotation details as L-objects. |
| duplicate | (deep?) => LAnnotation | Factory: deep or shallow copy. |
| source | string | Source namespace of annotation. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_details | val0, c | boolean | Replace details array under transaction. |
| set_source | val, c | boolean | Set annotation source under transaction. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | source?, details?, father?, persist? | DAnnotation | Create annotation attached to parent element. |

---

## DNamedElement / LNamedElement
_File_: `model/logicWrapper/LModelElement.tsx:1113` (D) / `:1139` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations on this named element. |
| father | Pointer<DModelElement, 1, 1, LModelElement> | Parent containing this element. |
| id | Pointer<DNamedElement, 1, 1, LNamedElement> | Unique identifier. |
| name | string | Display name. |
| parent | Pointer<DModelElement, 0, 'N', LModelElement> | Bidirectional parent references. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| containers | LNamedElement[] | Chain of named containers up to root. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_containers | () | boolean | Read-only; always returns false. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name? | DNamedElement | Abstract; logs error and returns null. |

---

## DTypedElement / LTypedElement
_File_: `model/logicWrapper/LModelElement.tsx:1180` (D) / `:1214` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| allowCrossReference | boolean | Whether type can reference another model. |
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations on this typed element. |
| father | Pointer<DModelElement, 1, 1, LModelElement> | Parent containing element. |
| id | Pointer<DTypedElement, 1, 1, LTypedElement> | Unique identifier. |
| instances | Pointer<DValue, 0, 'N', LValue> | Values of this type. |
| lowerBound | number | Minimum cardinality (default 0). |
| many | boolean | True if upperBound allows multiple values. |
| name | string | Element name. |
| ordered | boolean | Whether values maintain order (default true). |
| parent | Pointer<DModelElement, 0, 'N', LModelElement> | Bidirectional parent references. |
| required | boolean | True if lowerBound > 0. |
| type | Pointer<DClassifier, 1, 1, LClassifier> | Type constraint for values. |
| unique | boolean | Whether values must be unique (default true). |
| upperBound | number | Maximum cardinality, -1 = unbounded. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| allowCrossReference | boolean | Whether cross-model references allowed. |
| classType | LClass \| undefined | Type if it's a class, else undefined. |
| crossReference | boolean | Alias for allowCrossReference. |
| crossReferences | [LClass] \| [] | Classes referenced from other models. |
| enumType | LEnumerator \| undefined | Type if it's an enum, else undefined. |
| hasCrossReference | boolean | True if crossReferences non-empty. |
| isCrossReference | boolean | Alias for allowCrossReference. |
| lowerBound | number | Minimum cardinality value. |
| many | boolean | Derived: true if upperBound !== 0. |
| ordered | boolean | Whether ordered collection. |
| primitiveType | LClass \| undefined | Type if it's primitive, else undefined. |
| required | boolean | Derived: true if lowerBound > 0. |
| type | LClassifier | Resolved type object. |
| typeToEcoreString | () => string | Type formatted as ecore-qualified string. |
| typeToShortString | () => string | Type formatted as simple name. |
| unique | boolean | Whether values are unique. |
| upperBound | number | Maximum cardinality value. |
| validTargetOptions | MultiSelectOptGroup[] | UI options for valid targets. |
| validTargets | (LObject \| LEnumLiteral)[] | All valid assignable instances. |
| validTargetsJSX | JSX.Element[] | React UI for valid targets. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| canOverride | context, other | boolean | Check type compatibility with other element. |
| get_validTargets | c, out? | (LObject \| LEnumLiteral)[] | Build list of valid assignable instances. |
| set_allowCrossReference | v, c | boolean | Set cross-model allowance. |
| set_crossReference | v, c | boolean | Alias setter for allowCrossReference. |
| set_crossReferences | v, c | false | Read-only; rejects. |
| set_hasCrossReference | v, c | false | Read-only; rejects. |
| set_isCrossReference | v, c | boolean | Alias setter for allowCrossReference. |
| set_lowerBound | val, c | boolean | Set minimum cardinality with validation. |
| set_many | val, c | boolean | Set multiple-cardinality flag. |
| set_ordered | val, c | boolean | Set ordering flag. |
| set_required | val, c | boolean | Set required flag. |
| set_type | val, c | boolean | Set type with string-to-pointer resolution. |
| set_unique | val, c | boolean | Set uniqueness constraint. |
| set_upperBound | val, c | boolean | Set maximum cardinality with validation. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, type?, father?, persist? | DTypedElement | Abstract; logs error and returns null. |

---

## DClassifier / LClassifier
_File_: `model/logicWrapper/LModelElement.tsx:1601` (D) / `:1630` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations applied to classifier. |
| defaultValue | Pointer<DObject, 1, 1, LObject>[] \| string[] | Default instance or literal values. |
| father | Pointer<DPackage, 1, 1, LPackage> | Package containing this classifier. |
| id | Pointer<DClassifier, 1, 1, LClassifier> | Unique identifier. |
| instanceClassName | string | Java/runtime class name mapping. |
| name | string | Classifier name. |
| parent | Pointer<DPackage, 0, 'N', LPackage> | Bidirectional package references. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| instanceClassName | string | Java/runtime class name. |
| isClass | boolean | True if a class classifier. |
| isEnum | boolean | True if an enum classifier. |
| isPrimitive | boolean | True if a primitive type. |
| typeEcoreString | string | Ecore-qualified type string. |
| typeString | string | Simple type name. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_defaultValue | val, c | boolean | Set default value(s) under transaction. |
| set_instanceClassName | val, c | boolean | Set runtime class name under transaction. |
| set_isClass | val, c | boolean | Read-only; rejects. |
| set_isEnum | val, c | boolean | Read-only; rejects. |
| set_isPrimitive | val, c | boolean | Read-only; rejects. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, father?, persist? | DClassifier | Abstract; logs error and returns null. |

---

## DDataType / LDataType
_File_: `model/logicWrapper/LModelElement.tsx:3646` (D) / `:3679` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations on datatype. |
| defaultValue | Pointer<DObject, 1, 1, LObject>[] \| string[] | Default instances or literals. |
| father | Pointer<DPackage, 1, 1, LPackage> | Package containing datatype. |
| id | Pointer<DDataType, 1, 1, LDataType> | Unique identifier. |
| instanceClassName | string | Java/runtime class name. |
| name | string | Datatype name. |
| parent | Pointer<DPackage, 0, 'N', LPackage> | Bidirectional package references. |
| serializable | boolean | Whether datatype can be serialized (default true). |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| serializable | boolean | Whether datatype is serializable. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_serializable | val, c | boolean | Set serializability under transaction. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, father?, persist? | DDataType | Abstract; logs error and returns null. |

---

## DPackage / LPackage
_File_: `model/logicWrapper/LModelElement.tsx:1721` (D) / `:1776` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | References to annotation elements. |
| classes | Pointer<DClass>[] | Classes in this package. |
| enumerators | Pointer<DEnumerator>[] | Enumerators in this package. |
| father | Pointer<DPackage \| DModel, 1, 1, LPackage \| LModel> | Parent package or model. |
| id | Pointer<DPackage, 1, 1, LPackage> | Unique identifier. |
| name | string | Package name. |
| parent | Pointer<DPackage \| DModel, 0, 'N', LPackage \| LModel> | Bidirectional parent references. |
| prefix | string | XML namespace prefix. |
| subpackages | Pointer<DPackage, 0, 'N', LPackage> | Child package references. |
| uri | string | Unique resource identifier. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addClass | (name?, isInterface?, isAbstract?, isPrimitive?, isPartial?, partialDefaultName?) => LClass | Factory: create class in package. |
| addEnum | (name?) => LEnumerator | Factory: alias for addEnumerator. |
| addEnumerator | (name?) => LEnumerator | Factory: create enumeration in package. |
| addPackage | (name?, uri?, prefix?) => LPackage | Factory: create subpackage. |
| allSubClasses | LClass[] & Dictionary | All classes in package tree with $name indexing. |
| allSubEnums | LEnumerator[] & Dictionary | All enums in subtree with $name indexing. |
| allSubEnumerators | LEnumerator[] & Dictionary | All enumerators in subtree with $name indexing. |
| allSubPackages | LPackage[] | Package and all subpackages flattened. |
| children_idlist | Pointer<DAnnotation \| DPackage \| DClassifier> | Child element IDs. |
| classes | LClass[] & Dictionary | Classes as array with $name keys. |
| classifiers | LClassifier[] | Combined classes and enumerators. |
| duplicate | (deep?) => LPackage | Factory: duplicate package. |
| enumerators | LEnumerator[] & Dictionary | Enumerators as array with $name keys. |
| enums | LEnumerator[] & Dictionary | Alias for enumerators. |
| name | string | Package name from data or proxy. |
| packages | LPackage[] | Alias for subpackages. |
| prefix | string | XML namespace prefix. |
| subPackages | LPackage[] | Alias for subpackages. |
| subpackages | LPackage[] | Direct child packages. |
| uri | string | Resource URI computed from model. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| addClass | name?, isInterface?, isAbstract?, isPrimitive?, isPartial?, partialDefaultName? | LClass | Creates new class in package. |
| addEnum | ...p | LEnumerator | Creates enumeration in package. |
| addEnumerator | name? | LEnumerator | Creates enumeration in package. |
| addPackage | name?, uri?, prefix? | LPackage | Creates subpackage. |
| duplicate | deep? | this | Duplicates package and optionally children. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Serializes to Ecore XMI. |
| set_classes | val, c | boolean | Set classes with auto father/parent updates. |
| set_classifiers | val, c | boolean | Rejects; derived. |
| set_enumerators | val, c | boolean | Set enumerators with auto father/parent updates. |
| set_packages | val, c | boolean | Alias for set_subpackages. |
| set_prefix | val, c | boolean | Set XML namespace prefix under transaction. |
| set_subPackages | val, c | boolean | Alias for set_subpackages. |
| set_subpackages | val, c | boolean | Set subpackages with auto father/parent updates. |
| set_uri | val, c | boolean | Set URI (strips final name). |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, uri?, prefix?, father?, persist?, fatherType? | DPackage | Create package with builder pattern. |
| new3 | a, callback?, fatherType?, persist? | DPackage | Create package from pointer object. |

---

## DStructuralFeature / LStructuralFeature
_File_: `model/logicWrapper/LModelElement.tsx:2057` (D) / `:2102` (L)

Abstract base for `DAttribute` and `DReference`.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| allowCrossReference | boolean | Whether cross-reference pointers permitted. |
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations attached. |
| changeable | boolean | Whether value can change after initial setup. |
| defaultValue | (Pointer<DObject, 1, 1, LObject> \| PrimitiveType)[] | Default value(s) for uninitialized features. |
| derived | boolean | Values are computed from other features. |
| father | Pointer<DClass, 1, 1, LClass> | Containing class. |
| id | Pointer<DStructuralFeature, 1, 1, LStructuralFeature> | Unique identifier. |
| instances | Pointer<DValue, 0, 'N', LValue> | All value instances of this feature. |
| lowerBound | number | Minimum cardinality (default 0). |
| many | boolean | Derived flag for upperBound > 0. |
| name | string | Feature name within containing class. |
| ordered | boolean | Whether values maintain order (default true). |
| parent | Pointer<DClass, 0, 'N', LClass> | Containment path. |
| required | boolean | Derived flag for lowerBound > 0. |
| transient | boolean | Feature not persistently stored. |
| type | Pointer<DClassifier, 1, 1, LClassifier> | Required type for values. |
| unique | boolean | Whether duplicate values allowed (default true). |
| unsettable | boolean | Feature can be unset to undefined. |
| volatile | boolean | Not cached in memory; recomputed on access. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| changeable | boolean | Returns data.changeable. |
| derived | boolean | Returns data.derived. |
| instances | LValue[] | Maps data.instances to LValue pointers. |
| isChangeable | boolean | Alias for changeable. |
| isDerived | boolean | Alias for derived. |
| isMany | boolean | Alias for many. |
| isOrdered | boolean | Alias for ordered. |
| isRequired | boolean | Alias for required. |
| isTransient | boolean | Alias for transient. |
| isUnique | boolean | Alias for unique. |
| isUnsettable | boolean | Alias for unsettable. |
| isVolatile | boolean | Alias for volatile. |
| transient | boolean | Returns data.transient. |
| unsettable | boolean | Returns data.unsettable. |
| volatile | boolean | Returns data.volatile. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_changeable | val, c | boolean | Update changeable under transaction. |
| set_derived | val, c | boolean | Update derived flag under transaction. |
| set_instances | val, c | boolean | Rejects; instances managed elsewhere. |
| set_isChangeable | v, c | boolean | Delegates to set_changeable. |
| set_isDerived | v, c | boolean | Delegates to set_derived. |
| set_isMany | v, c | boolean | Delegates to set_many. |
| set_isOrdered | v, c | boolean | Delegates to set_ordered. |
| set_isRequired | v, c | boolean | Delegates to set_required. |
| set_isTransient | v, c | boolean | Delegates to set_transient. |
| set_isUnique | v, c | boolean | Delegates to set_unique. |
| set_isUnsettable | v, c | boolean | Delegates to set_unsettable. |
| set_isVolatile | v, c | boolean | Delegates to set_volatile. |
| set_transient | val, c | boolean | Update transient under transaction. |
| set_unsettable | val, c | boolean | Update unsettable under transaction. |
| set_volatile | val, c | boolean | Update volatile under transaction. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, type?, father?, persist? | DStructuralFeature | Abstract; throws. |

---

## DClass / LClass
_File_: `model/logicWrapper/LModelElement.tsx:2609` (D) / `:2687` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| abstract | boolean | Class cannot be instantiated directly. |
| allowCrossReference | boolean | Enables cross-reference extends relationships. |
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations on this class. |
| attributes | Pointer<DAttribute, 0, 'N', LAttribute> | Value features of this class. |
| extends | Pointer<DClass, 0, 'N', LClass> | Direct parent classes in inheritance chain. |
| features | Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> | All structural features. |
| father | Pointer<DPackage, 1, 1, LPackage> | Containing package. |
| final | boolean | Class cannot be extended. |
| id | Pointer<DClass, 1, 1, LClass> | Unique identifier. |
| implementedBy | Pointer<DClass, 0, 'N', LClass> | Classes implementing this interface. |
| implements | Pointer<DClass, 0, 'N', LClass> | Interfaces implemented. |
| instanceClassName | string | Java/language class name for code generation. |
| instances | Pointer<DObject, 0, 'N', LObject> | M1 objects conforming to this class. |
| interface | boolean | Class is interface rather than concrete. |
| isPrimitive | boolean | Class represents a primitive type. |
| isSingleton | boolean | Exactly one instance per model allowed. |
| name | string | Class name within package. |
| operations | Pointer<DOperation, 0, 'N', LOperation> | Methods defined on this class. |
| parent | Pointer<DPackage, 0, 'N', LPackage> | Containment path. |
| partial | boolean | Allows unlisted shapeless features. |
| partialdefaultname | string | Shapeless-feature default name. |
| references | Pointer<DReference, 0, 'N', LReference> | Reference-type features. |
| referencedBy | Pointer<DReference, 0, 'N', LReference> | References pointing to this class. |
| rootable | boolean | Can become root in M1 models. |
| sealed | Pointer<DClass>[] | Allowed subclasses when sealed. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| abstract | boolean | Returns data.abstract. |
| addAttribute | factory | Factory: create attribute on class. |
| addOperation | factory | Factory: create operation on class. |
| addReference | factory | Factory: create reference on class. |
| aggregated | boolean | True if aggregation reference targets this. |
| allAttributes | LAttribute[] | Merged own and inherited attributes. |
| allChildren | (LStructuralFeature \| LOperation)[] | Own + inherited features and operations. |
| allInstances | LObject[] | Instances of this class and subclasses. |
| allOperations | LOperation[] | Merged own and inherited operations. |
| allReferences | LReference[] | Merged own and inherited references. |
| allSubClasses | LClass[] | All direct and indirect subclasses. |
| allSubclasses | LClass[] | Lowercase alias for allSubClasses. |
| allSuperClasses | LClass[] | All direct and indirect superclasses. |
| allSuperclasses | LClass[] | Lowercase alias for allSuperClasses. |
| attributes | LAttribute[] | Maps data.attributes to LAttribute. |
| canExtend | (superclass, output) => boolean | Factory: validate inheritance constraints. |
| childNames | string[] | Names of all children flattened. |
| composed | boolean | True if composition reference targets this. |
| contained | boolean | True if composition/aggregation targets this. |
| duplicate | (deep?) => LClass | Factory: clone class structure. |
| extendedBy | LClass[] | Direct subclasses via pointedBy analysis. |
| extends | LClass[] | Maps data.extends to LClass. |
| extendsChain | LClass[] | All superclasses in inheritance chain. |
| features | LStructuralFeature[] | Maps data.features to LStructuralFeature. |
| final | boolean | Returns data.final. |
| implementedBy | LClass[] | Returns data.implementedBy. |
| implements | LClass[] | Returns data.implements. |
| inheritedAttributes | LAttribute[] | Attributes from superclass chain. |
| inheritedChildren | (LStructuralFeature \| LOperation)[] | Inherited features and operations. |
| inheritedOperations | LOperation[] | Operations from superclass chain. |
| inheritedReferences | LReference[] | References from superclass chain. |
| instanceClassName | string | Runtime class name. |
| instances | LObject[] | Maps data.instances to LObject. |
| instantiable | boolean | True if not abstract, interface, or singleton. |
| interface | boolean | Returns data.interface. |
| isAggregated | boolean | Alias for aggregated. |
| isComposed | boolean | Alias for composed. |
| isComposedBy | LReference[] | References that compose this class. |
| isContained | boolean | Alias for contained. |
| isFinal | boolean | Alias for final. |
| isInstantiable | boolean | Alias for instantiable. |
| isPrimitive | boolean | Returns data.isPrimitive. |
| isRootable | boolean | Alias for rootable. |
| isSingleton | boolean | Returns data.isSingleton. |
| isSubClassOf | (superClass?, returnIfSame?) => boolean | Factory: test extends-chain membership. |
| isSuperClassOf | (subClass?, returnIfSame?) => boolean | Factory: test descendant relationship. |
| operations | LOperation[] | Maps data.operations to LOperation. |
| ownAttributes | LAttribute[] | Attributes defined directly on class. |
| ownChildren | (LStructuralFeature \| LOperation)[] | Features/operations defined directly. |
| ownOperations | LOperation[] | Operations defined directly. |
| ownReferences | LReference[] | References defined directly. |
| partial | boolean | Returns data.partial. |
| partialdefaultname | string | Returns data.partialdefaultname. |
| referencedBy | LReference[] | References whose type points at this (via pointedBy). |
| references | LReference[] | Maps data.references to LReference. |
| rootable | boolean | Computed or explicit rootability. |
| sealed | LClass[] | Wraps data.sealed as LClass pointers. |
| singleton | boolean | Returns data.isSingleton. |
| validTargetOptions | MultiSelectOptGroup[] | UI options for valid extend targets. |
| validTargets | LClass[] | Classes valid as extend targets. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| addAttribute | name?, type? | LAttribute | Creates new attribute on this class. |
| addExtend | val | void | Adds a single extends relationship with validation. |
| addOperation | name?, type? | LOperation | Creates new operation on this class. |
| addReference | name?, type? | LReference | Creates new reference on this class. |
| canExtend | superclass, output | boolean | Validates inheritance rules without updating. |
| impl_addExtend | c, val | void | Implementation of multi-extend addition. |
| isExtending | superclass, directly? | boolean | Tests inheritance via extends chain. |
| isSubclassOf | superclass, directly? | boolean | Alias for isExtending. |
| isSuperClassOf | subClass?, returnIfSame? | boolean | Tests if subClass is descendant. |
| removeExtend | superclass | void | Alias for unsetExtends. |
| removeExtends | superclass | void | Removes direct extends relationship. |
| set_abstract | val, c | boolean | Update abstract flag if no instances exist. |
| set_attributes | val, c | boolean | Replace attributes and update parent links. |
| set_extendedBy | val, c | boolean | Rejects; derived from pointedBy. |
| set_extends | val, c | boolean | Update extends, validate, adapt instances. |
| set_features | val, c | boolean | Replace features and update parent links. |
| set_final | val, c | boolean | Update final; checks no subclasses exist. |
| set_implementedBy | val, c | boolean | Update implementedBy under transaction. |
| set_implements | val, c | boolean | Update implements under transaction. |
| set_instances | val, c | boolean | Replace instances array. |
| set_interface | val, c | boolean | Update interface flag if no instances exist. |
| set_isPrimitive | val, c | boolean | Update isPrimitive flag. |
| set_name | val, c | boolean | Update name; fires ClassNameChanged event. |
| set_operations | val, c | boolean | Replace operations and update parent links. |
| set_partial | val, c | boolean | Update partial flag under transaction. |
| set_partialdefaultname | val, c | boolean | Update shapeless feature default name. |
| set_references | val, c | boolean | Replace references and update parent links. |
| set_referencedBy | val, c | boolean | Rejects; auto-updated via pointedBy. |
| set_rootable | val, c | boolean | Update rootable under transaction. |
| set_sealed | val, c | boolean | Update sealed classes; clears final/singleton. |
| set_singleton | val, c | boolean | Update singleton; creates M1 instance. |
| unsetExtends | superclass | void | Removes extend and updates M1 instances. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, isInterface?, isAbstract?, isPrimitive?, partial?, partialDefaultName?, father?, persist?, id? | DClass | Creates class with constructor chain. |
| new2 | setter, father, name? | DClass | Creates class and applies setter. |
| new3 | a, callback?, persist? | DClass | Creates class and invokes callback. |

---

## DReference / LReference
_File_: `model/logicWrapper/LModelElement.tsx:3725` (D) / `:3794` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| aggregation | boolean | Part-of relationship; target survives source. |
| allowCrossReference | boolean | Enables cross-reference pointers. |
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations. |
| changeable | boolean | Value changeable after setup (default true). |
| composition | boolean | Part-of relationship; target depends on source. |
| container | boolean | Reference is a container for target. |
| defaultValue | Pointer<DObject, 1, 1, LObject>[] | Default value(s). |
| defaultValueLiteral | string | String representation of default. |
| derived | boolean | Value computed from other features. |
| edges | Pointer<DEdge, 0, 'N', LEdge> | Graph edges originating from this. |
| father | Pointer<DClass, 1, 1, LClass> | Containing class. |
| id | Pointer<DReference, 1, 1, LReference> | Unique identifier. |
| instances | Pointer<DValue, 0, 'N', LValue> | All value instances. |
| lowerBound | number | Minimum cardinality (default 0). |
| many | boolean | Derived: upperBound > 0. |
| name | string | Feature name. |
| opposite | Pointer<DReference> | Bidirectional reference pointer. |
| ordered | boolean | Values maintain order (default true). |
| parent | Pointer<DClass, 0, 'N', LClass> | Containment path. |
| required | boolean | Derived: lowerBound > 0. |
| rootable | boolean | Targets can be model roots. |
| target | Pointer<DClass, 0, 'N', LClass> | Target classes (deprecated; use type). |
| transient | boolean | Not persistently stored. |
| type | Pointer<DClass, 1, 1, LClass> | Type of referenced objects. |
| unique | boolean | No duplicate references (default true). |
| unsettable | boolean | Can be unset to undefined. |
| volatile | boolean | Recomputed on access. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addClass | factory | Factory: create new class as reference type. |
| aggregation | boolean | Returns data.aggregation. |
| composition | boolean | Returns data.composition. |
| containment | boolean | Returns composition \|\| aggregation. |
| defaultValue | LObject[] | Maps data.defaultValue to LObject pointer. |
| duplicate | (deep?) => LReference | Factory: clone reference. |
| edges | LEdge[] | Maps data.edges to LEdge. |
| isAggregation | boolean | Tests if aggregation flag set. |
| isComposition | boolean | Alias for composition. |
| isContainment | boolean | Alias for containment. |
| isOpposite | boolean | Tests if opposite reference exists. |
| many | boolean | Returns upperBound !== 0. |
| opposite | LReference | Wrapped opposite reference. |
| required | boolean | Returns lowerBound > 0. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| addClass | name?, isInterface?, isAbstract?, isPrimitive?, isPartial?, partialDefaultName? | LClass | Creates new target class inline. |
| set_aggregation | val, c | boolean | Delegates to set_containment with aggregation key. |
| set_composition | val, c | boolean | Delegates to set_containment with composition key. |
| set_containment | val, c, mainkey?, altkey? | boolean | Updates composition/aggregation; adjusts instances. |
| set_defaultValue | val, c | boolean | Update defaultValue under transaction. |
| set_edges | val, c | boolean | Update edges array. |
| set_isAggregation | v, c | boolean | Delegates to set_aggregation. |
| set_isComposition | v, c | boolean | Delegates to set_composition. |
| set_isContainment | v, c | boolean | Delegates to set_composition. |
| set_isOpposite | v, c | boolean | Rejects; opposite is bidirectional. |
| set_opposite | val, c | boolean | Update opposite reference under transaction. |
| set_type | val, c | boolean | Delegates to parent set_type. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, type?, father?, persist? | DReference | Creates reference; default type = self. |
| new2 | setter, father, type?, name? | DReference | Creates reference and applies setter. |
| new3 | a, callback?, persist? | DReference | Creates reference and invokes callback. |

---

## DAttribute / LAttribute
_File_: `model/logicWrapper/LModelElement.tsx:4083` (D) / `:4151` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| allowCrossReference | boolean | Enables cross-reference pointers. |
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations. |
| changeable | boolean | Value changeable after setup (default true). |
| defaultValue | PrimitiveType[] | Default values. |
| defaultValueLiteral | string | String representation of default. |
| derived | boolean | Value computed from other features. |
| father | Pointer<DClass, 1, 1, LClass> | Containing class. |
| id | Pointer<DAttribute, 1, 1, LAttribute> | Unique identifier. |
| instances | Pointer<DValue, 0, 'N', LValue> | All value instances. |
| isID | boolean | Attribute acts as unique identifier. |
| isIoT | boolean | Attribute is an IoT/topic field. |
| lowerBound | number | Minimum cardinality (default 0). |
| many | boolean | Derived flag. |
| name | string | Feature name. |
| ordered | boolean | Values maintain order (default true). |
| parent | Pointer<DClass, 0, 'N', LClass> | Containment path. |
| required | boolean | Derived flag. |
| transient | boolean | Not persistently stored. |
| type | Pointer<DClassifier, 1, 1, LClassifier> | Type for values. |
| unique | boolean | No duplicates (default true). |
| unsettable | boolean | Can be unset to undefined. |
| volatile | boolean | Recomputed on access. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addEnumerator | factory | Factory: create enumerator on attribute. |
| defaultValue | PrimitiveType[] | Returns data.defaultValue. |
| duplicate | (deep?) => LAttribute | Factory: clone attribute. |
| isID | boolean | Returns data.isID. |
| isIoT | boolean | Returns data.isIoT. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| addEnum | ...p | LEnumerator | Alias for addEnumerator. |
| addEnumerator | name?, father? | LEnumerator | Creates enumerator on this attribute. |
| set_defaultValue | val, c | boolean | Update defaultValue under transaction. |
| set_isID | val, c | boolean | Update isID flag under transaction. |
| set_isIoT | val, c | boolean | Update isIoT; sets topic on instances. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, type?, father?, persist? | DAttribute | Creates attribute; default type = string. |
| new2 | setter, father, type?, name? | DAttribute | Creates attribute and applies setter. |
| new3 | a, callback?, persist? | DAttribute | Creates attribute and invokes callback. |

---

## DOperation / LOperation
_File_: `model/logicWrapper/LModelElement.tsx:2247` (D) / `:2311` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| allowCrossReference | boolean | Flag to permit cross-reference associations. |
| changeable | boolean | Feature can be modified. |
| defaultValue | (Pointer<DObject, 1, 1, LObject> \| PrimitiveType)[] | Default return value. |
| derived | boolean | Feature is computed from other features. |
| exceptions | Pointer<DClassifier, 0, 'N', LClassifier> | Exception types thrown. |
| implementation | string | Function body implementation code. |
| lowerBound | number | Minimum cardinality of return value. |
| many | boolean | Return has multiple values. |
| name | string | Operation name. |
| ordered | boolean | Return elements maintain insertion order. |
| parameters | Pointer<DParameter, 0, 'N', LParameter> | Parameter definitions. |
| required | boolean | Return value is mandatory. |
| transient | boolean | Feature excluded from serialization. |
| type | Pointer<DClassifier, 1, 1, LClassifier> | Return type. |
| unique | boolean | Return elements deduplicated. |
| unsettable | boolean | Feature can be undefined. |
| visibility | AccessModifier | Access modifier (private/public/protected). |
| volatile | boolean | Feature recomputed on each access. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addParameter | (name?, type?) => LParameter | Factory: create new operation parameter. |
| children_idlist | Pointer<DAnnotation \| DClassifier \| DParameter, 1, 'N'> | All child element pointers. |
| duplicate | (deep?) => LOperation | Factory: clone operation. |
| exceptions | LClassifier[] | Resolves exception pointer list. |
| execute | (thiss: LObject, ...params: any[]) => any | Factory: compile and execute operation body. |
| implementation | string | Returns function body text. |
| parameters | LParameter[] | Resolves parameter pointer list. |
| signature | string | Returns parameter signature without types. |
| signatureImplementation | string | Returns typed signature string. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| _canOverride | superchildren | undefined | Internal: checks overridability. |
| _canPolymorph | superchildren | undefined | Internal: checks polymorphism capability. |
| _mark | b, superchildren, override | void | Internal: marks operation for override tracking. |
| duplicate | deep? | this | Clones operation with optional deep copy. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Serializes to Ecore JSON. |
| set_exceptions | val, c | boolean | Update exception list under transaction. |
| set_implementation | val, c | boolean | Set implementation under transaction. |
| set_parameters | val, c | boolean | Update parameters and hierarchy. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, type?, exceptions?, father?, persist? | DOperation | Creates operation with name/type/exceptions. |
| new2 | setter, father, type?, name? | DOperation | Creates operation and applies setter. |
| new3 | a, callback?, persist? | DOperation | Creates operation with pointer map and callback. |

---

## DParameter / LParameter
_File_: `model/logicWrapper/LModelElement.tsx:2482` (D) / `:2529` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| allowCrossReference | boolean | Flag to permit cross-reference associations. |
| defaultValue | any | Default value when parameter omitted. |
| lowerBound | number | Minimum cardinality. |
| many | boolean | Parameter accepts multiple values. |
| name | string | Parameter name. |
| ordered | boolean | Parameter elements maintain insertion order. |
| required | boolean | Parameter is mandatory. |
| type | Pointer<DClassifier, 1, 1, LClassifier> | Parameter type. |
| unique | boolean | Parameter elements deduplicated. |
| upperBound | number | Maximum cardinality. |

### L-layer getters
(none)

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| duplicate | deep? | this | Clones parameter with optional deep copy. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Serializes to Ecore JSON. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, type?, father?, persist? | DParameter | Creates parameter with name/type. |
| new2 | setter, father, type?, name? | DParameter | Creates parameter and applies setter. |
| new3 | a, callback?, persist? | DParameter | Creates parameter with pointer map/callback. |

---

## DEnumerator / LEnumerator
_File_: `model/logicWrapper/LModelElement.tsx:4418` (D) / `:4463` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| defaultValue | string[] | Default values. |
| instanceClassName | string | Java instance class name. |
| literals | Pointer<DEnumLiteral, 0, 'N', LEnumLiteral> | Enumeration literal definitions. |
| name | string | Enumeration name. |
| serializable | boolean | Enumeration can be serialized. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addLiteral | (name?, value?) => LEnumLiteral | Factory: create new enumeration literal. |
| literals | LEnumLiteral[] | Resolves literal pointer list. |
| ordinals | LEnumLiteral[] | Literals sorted by ordinal value. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| duplicate | deep? | this | Clones enumeration with optional deep copy. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Serializes to Ecore JSON. |
| set_literals | val, c | boolean | Update literals and hierarchy. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, father?, persist? | DEnumerator | Creates enumeration with name. |
| new2 | setter, father, name? | DEnumerator | Creates enumeration and applies setter. |
| new3 | a, callback?, persist? | DEnumerator | Creates enumeration with pointer map/callback. |

---

## DEnumLiteral / LEnumLiteral
_File_: `model/logicWrapper/LModelElement.tsx:4273` (D) / `:4313` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| literal | string | Display string. |
| name | string | Literal name identifier. |
| value | number | Ordinal numeric value. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| literal | string | Display literal; computed from name with underscores. |
| ordinal | number | Alias for value. |
| value | number | Ordinal numeric value. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| duplicate | deep? | this | Clones literal with optional deep copy. |
| generateEcoreJsonM1 | () | number | Returns ordinal as M1 representation. |
| impl_generateEcoreJsonM1 | context | () => number | Implementation of M1 generator. |
| set_literal | val, c | boolean | Set literal under transaction. |
| set_ordinal | val, c | boolean | Delegates to set_value. |
| set_value | val, c | boolean | Set ordinal with conflict checking. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, value?, father?, persist? | DEnumLiteral | Creates literal with name/value. |
| new2 | setter, father, name? | DEnumLiteral | Creates literal and applies setter. |
| new3 | a, callback?, persist? | DEnumLiteral | Creates literal with pointer map/callback. |

---

## DModel / LModel
_File_: `model/logicWrapper/LModelElement.tsx:4620` (D) / `:4744` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotations. |
| dependencies | Pointer<DModel>[] | Models referenced by this model. |
| father | Pointer<DModelElement, 1, 1, LModelElement> | Parent element. |
| id | Pointer<DModel, 1, 1, LModel> | Unique identifier. |
| instanceof | Pointer<DModel> | Metamodel reference (optional). |
| instances | Pointer<DModelElement>[] | Instance elements collection. |
| isMetamodel | boolean | Metamodel vs instance flag. |
| models | Pointer<DModel, 0, 'N', LModel> | Child model references. |
| name | string | Model name. |
| objects | Pointer<DObject, 0, 'N', LObject> | Instance objects. |
| packages | Pointer<DPackage, 0, 'N', LPackage> | Package references. |
| parent | Pointer<DModelElement, 0, 'N', LModelElement> | Multiple parents. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addClass | LPackage['addClass'] | Delegates to first package. |
| addEnum | LPackage['addEnum'] | Delegates to first package. |
| addObject | factory | Factory: create instance object. |
| addPackage | factory | Factory: create package in model. |
| allCrossSubAnnotations | LAnnotation[] | Annotations with cross-references. |
| allCrossSubObjects | LObject[] | Objects with cross-references. |
| allCrossSubPackages | LPackage[] | Packages with cross-references. |
| allCrossSubValues | LValue[] | Values with cross-references. |
| allDependencies | LModel[] | Transitive dependency closure. |
| allSubAnnotations | LAnnotation[] | All annotations in tree. |
| allSubObjects | LObject[] | All objects in tree. |
| allSubPackages | LPackage[] | All packages in tree. |
| allSubValues | LValue[] | All values in tree. |
| attributes | LAttribute[] | All attributes in classes. |
| children_idlist | Pointer | Child element IDs. |
| classes | LClass[] & Dictionary | Classes (own or inherited from metamodel). |
| crossClasses | LClass[] & Dictionary | Classes with cross-references. |
| crossEnumerators | LEnumerator[] & Dictionary | Enumerators with cross-references. |
| crossEnums | LEnumerator[] & Dictionary | Alias for crossEnumerators. |
| crossObjects | LObject[] | Objects with cross-references. |
| crossPackages | LPackage[] | Packages with cross-references. |
| crossReferences | LReference[] | References with cross-references. |
| dependencies | LModel[] | Direct dependencies. |
| enumerators | LEnumerator[] & Dictionary | Enumerators (own or inherited). |
| enums | LEnumerator[] & Dictionary | Alias for enumerators. |
| getClassByName | factory | Factory: find class by name. |
| getClassByNameSpace | factory | Factory: find class by namespace. |
| getEnumByName | factory | Factory: find enum by name. |
| getPackageByUri | factory | Factory: find package by URI. |
| instanceof | LModel \| undefined | Metamodel or undefined. |
| instancesOf | factory | Factory: retrieve objects of type. |
| instantiableClasses | factory | Factory: filter instantiable classes. |
| isMetamodel | boolean | Metamodel flag. |
| literals | LEnumLiteral[] | All enum literals. |
| models | LModel[] | Child models. |
| name | string | Model name. |
| objects | LObject[] | Instance objects. |
| otherInstances | factory | Factory: objects not yet accessed. |
| otherObjects | factory | Alias for otherInstances. |
| package | LPackage | First package (convenience). |
| packages | LPackage[] | Packages in model. |
| references | LReference[] | All references in classes. |
| roots | LObject[] | Root objects. |
| suggestedEdges | {extend, reference, packageDependencies} | Edge starters for rendering. |
| values | LValue[] | All values in objects. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| addObject | json?, instanceof?, forceCreation? | LObject | Creates and adds instance object. |
| duplicate | deep? | never | Throws; use export/import. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Serializes to Ecore XMI. |
| getClassByName | name | LClass \| null | Finds class by exact name. |
| getClassByNameSpace | namespacedclass | LClass \| undefined | Finds class by qualified name. |
| getEnumByName | name | LEnumerator \| null | Finds enum by name. |
| getPackageByUri | uri | LPackage \| undefined | Finds package by URI. |
| instancesOf | instancetypes, includeSubclasses? | LObject[] | Gets objects by type. |
| instantiableClasses | o?, loose?, eligibleClasses?, favoriteMatch?, allowNotInstantiables? | LClass[] | Gets valid instantiation types. |
| namesORDObjectsToID | targets, namedCandidates? | Pointer[] | Resolves names/objects to pointers. |
| otherInstances | excludeInstances?, excludeSubclasses? | LObject[] | Gets uncached objects. |
| otherObjects | excludeInstances?, excludeSubclasses? | LObject[] | Alias for otherInstances. |
| set_instanceof | val, c | boolean | Changes metamodel reference. |
| set_isMetamodel | val, c | boolean | Toggle metamodel flag. |
| set_models | val, c | boolean | Set child models under transaction. |
| set_name | val, c | boolean | Change name with duplicate check. |
| set_packages | val, c | boolean | Set packages under transaction. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, instanceoff?, isMetamodel?, persist? | DModel | Creates model with builder. |
| new2 | setter, name?, instanceoff? | DModel | Creates model with setter callback. |
| new3 | a, callback?, persist? | DModel | Creates model from pointer object. |

---

## DObject / LObject
_File_: `model/logicWrapper/LModelElement.tsx:5636` (D) / `:5672` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| annotations | never[] | Objects cannot have annotations. |
| father | Pointer<DModel, 1, 1, LModel> \| Pointer<DValue, 1, 1, LValue> | Parent model or value. |
| features | Pointer<DValue>[] | Value/property references. |
| id | Pointer<DObject, 1, 1, LObject> | Unique identifier. |
| instanceof | Pointer<DClass> \| undefined | Metamodel class reference. |
| name | string | Object name. |
| parent | Pointer<DModel \| DValue, 0, 'N', LModel \| LValue> | Multiple parents. |
| partial | boolean \| undefined | Allows extra features. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| addValue | factory | Factory: create feature value. |
| allChildren | LValue[] | All features including mirages. |
| apply | factory | Factory: alias for t2m. |
| attributeFeatures | LValue[] | Attribute-typed features. |
| children | LValue[] | Features sorted by metamodel order. |
| composed | boolean | Is composed (from class metadata). |
| contained | boolean | Is contained (from class metadata). |
| deepSubObjects | LObject[] | All nested objects recursively. |
| defaultValue | LClass["defaultValue"] | Class default value. |
| delete | () => void | Factory: deletion with checks. |
| ecorePointer | () => string | Factory: Ecore reference path. |
| ecoreRootName | string | Root element XMI name. |
| feature | (name) => LValue["value"] \| LValue["values"] | Factory: get feature by name. |
| features | LValue[] | All child values. |
| instanceof | LClass \| undefined | Metamodel class or undefined. |
| isKindOf | factory | Factory: type-compatibility checker. |
| isRoot | boolean | Is root object. |
| model | LModel | Parent model. |
| name | string | Object name or class name. |
| namespace | string | Class namespace prefix. |
| partial | boolean | Allows extra features. |
| partialdefaultname | string | Default name for partial objects. |
| referenceFeatures | LValue[] | Reference-typed features. |
| referencedBy | LValue[] | Values pointing to this object. |
| shapelessFeatures | LValue[] | Features without metadata. |
| subObjects | LObject[] | Direct contained objects. |
| t2m | factory | Factory: JSON update. |
| truechildren | LValue[] | Features excluding mirages. |
| typeStr | string | Stringified type name. |
| typeString | string | Alias for typeStr. |
| uri | string | Namespace URI from class. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| addValue | name?, instanceof?, value?, isMirage? | LValue | Creates feature in object. |
| apply | json | this | Updates from JSON. |
| delete | () | void | Removes object unless singleton. |
| duplicate | deep? | never | Not supported for instances. |
| ecorePointer | () | string | Generates Ecore XPath. |
| feature | name | PrimitiveType \| LObject | Gets feature by name. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Serializes to Ecore XMI. |
| isKindOf | c | boolean | Checks type hierarchy. |
| set_instanceof | val, c, out? | boolean | Changes type with conformity checks. |
| set_isRoot | val, c | boolean | Rejects; use father instead. |
| set_name | val, c | boolean | Changes object name. |
| set_namespace | val, c | boolean | Rejects; derived. |
| set_partial | val, c | boolean | Allows extra features. |
| t2m | json, out? | this | Updates from JSON. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | instanceof?, father?, fatherType?, name?, persist?, isMirage? | DObject | Creates object with builder. |
| new3 | ptrs, then?, fatherType?, persist? | DObject | Creates from pointer object. |

---

## DValue / LValue
_File_: `model/logicWrapper/LModelElement.tsx:6201` (D) / `:6256` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| allowCrossReference | boolean | Allow cross-model references. |
| annotations | Pointer<DAnnotation, 0, 'N', LAnnotation> | Annotation references. |
| edges | Pointer<DEdge, 0, 'N', LEdge> | Edge references for visualization. |
| father | Pointer<DObject, 1, 1, LObject> | Parent object. |
| id | Pointer<DValue, 1, 1, LValue> | Unique identifier. |
| instanceof | Pointer<DAttribute \| DReference> \| undefined | Metamodel feature. |
| isMirage | boolean | Synthetic (auto-created) flag. |
| name | string | Feature name (optional). |
| parent | Pointer<DObject, 0, 'N', LObject> | Multiple parents. |
| topic | string | IoT topic path. |
| values | PrimitiveType[] \| Pointer<DObject \| DEnumLiteral, 1, 'N'> | Stored values. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| add | (...val) => void | Factory: append values. |
| addObject | factory | Factory: nested object creation. |
| aggregation | boolean | From reference metadata. |
| allowCrossReference | boolean | Cross-model flag. |
| apply | factory | Alias for t2m factory. |
| changeable | boolean | From structural feature. |
| classType | LClass | Reference target type. |
| composition | boolean | From reference metadata. |
| container | boolean | From reference metadata. |
| containment | boolean | From reference metadata. |
| crossReference | boolean | Alias for allowCrossReference. |
| crossReferences | LObject[] | Objects from other models. |
| defaultValue | LStructuralFeature["defaultValue"] | From metamodel. |
| derived | boolean | Is computed from metamodel. |
| edges | LEdge[] | Visualization edges. |
| enumType | LEnumerator | Enum type (if attribute). |
| getValue | factory | Factory: single value with options. |
| getValues | factory | Factory: all values with options. |
| hasCrossReference | boolean | Has cross-model values. |
| instantiableClasses | factory | Factory: type options for reference. |
| isContainment | boolean | Alias for containment. |
| isCrossReference | boolean | Alias for allowCrossReference. |
| isMany | boolean | Multiple values allowed. |
| isMirage | boolean | Auto-created flag. |
| isRequired | boolean | Alias for required. |
| isUnique | boolean | Alias for unique. |
| isVolatile | boolean | Alias for volatile. |
| length | number | Value count. |
| lowerBound | number | Minimum cardinality. |
| lowerbound | number | Alias for lowerBound. |
| many | boolean | Multiple values flag. |
| model | LModel | Containing model. |
| name | string | Feature name or empty. |
| namespace | string | Namespace from metadata. |
| opposite | LReference["opposite"] | Mirror reference if exists. |
| ordered | boolean | Order preserved flag. |
| primitiveType | LClass | Primitive type descriptor. |
| rawValues | this["values"] | Raw unconverted values. |
| remove | (...val) => void | Factory: value removal. |
| removeByIndex | (...indices) => void | Factory: remove by index. |
| required | boolean | Lower bound >= 1. |
| setValueAtPosition | factory | Factory: value setter at index with validation. |
| topic | string | IoT topic path. |
| toPrimitive | () => string \| number | Primitive conversion. |
| transient | boolean | From feature metadata. |
| type | LClassifier | Type descriptor. |
| typeStr | string | Type name string. |
| typeString | string | Alias for typeStr. |
| unique | boolean | Uniqueness constraint. |
| unsettable | boolean | Can be unset flag. |
| upperBound | number | Maximum cardinality. |
| upperbound | number | Alias for upperBound. |
| validTargetOptions | MultiSelectOptGroup[] | UI select options. |
| validTargets | (LObject \| LEnumLiteral)[] | Valid assignment targets. |
| validTargetsJSX | JSX.Element[] | React option components. |
| value | (…) => LValue["value"] | First value with options. |
| values | (…) => LValue["values"] | Multi-value getter. |
| volatile | boolean | Derived-at-runtime flag. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| add | ...val | void | Appends values. |
| addObject | json?, metaclass?, forceCreation? | LObject | Creates nested object. |
| apply | json | this | Updates from JSON. |
| generateEcoreJson_impl | c, loopDetectionObj?, deep?, crossRef? | Json | Exports to Ecore format. |
| getValue | namedPointers?, ecorePointers?, shapeless?, keepempties?, withmetainfo? | LValue["value"] | Gets first value. |
| getValues | fitSize?, namedPointers?, ecorePointers?, shapeless?, keepempties?, withmetainfo?, maxlimit?, solveLiterals? | LValue["values"] | Gets values with options. |
| instantiableClasses | o?, loose?, ... | LClass[] | Gets valid types. |
| remove | ...val | void | Removes values. |
| removeByIndex | ...indices | void | Removes by position. |
| set_allowCrossReference | val, c | boolean | Rejects; derived. |
| set_crossReference | val, c | boolean | Rejects; derived. |
| set_derived | val, c | boolean | Rejects; derived. |
| set_hasCrossReference | val, c | boolean | Rejects. |
| set_instanceof | val, c | boolean | Rejects; set via addValue. |
| set_isCrossReference | val, c | boolean | Rejects; derived. |
| set_isMirage | val, c | boolean | Sets mirage flag. |
| set_topic | val, c | boolean | Sets IoT topic. |
| set_value | val, c | boolean | Sets first value only. |
| set_values | val, c | boolean | Sets all values under transaction. |
| setValueAtPosition | index, val, info? | {success, reason?} | Atomically sets value at index. |
| t2m | json, out? | this | Updates from JSON. |
| valuesString | keepemptyquotes? | string | String representation. |
| valuestring | keepemptyquotes? | string | Alias for valuesString. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | name?, instanceof?, val?, father?, persist?, isMirage? | DValue | Creates value with builder. |
| new3 | a, then?, persist? | DValue | Creates from pointer object. |

---

# Node submodel

## DGraphElement / LGraphElement
_File_: `model/dataStructure/GraphDataElements.tsx:73` (D) / `:130` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| anchors | Dictionary<string, GraphPoint> | Named anchor points where edges land/depart. |
| contextMenu | any | Context-menu data structure. |
| edgesIn | Pointer<DEdge>[] | Incoming edges to this element. |
| edgesOut | Pointer<DEdge>[] | Outgoing edges from this element. |
| father | Pointer<DGraphElement, 1, 1, LGraphElement> | Parent graph element. |
| favoriteNode | boolean | Primary node for multi-representation elements. |
| graph | Pointer<DGraph, 1, 1, LGraph> | Containing graph. |
| h | number | Height dimension. |
| id | Pointer<DGraphElement, 1, 1, LGraphElement> | Unique pointer identifier. |
| isSelected | Dictionary<DocString<Pointer<DUser>>, boolean> | Selection state by user. |
| model | Pointer<DModelElement, 0, 1, LModelElement> | Associated model element. |
| state | GObject | Custom state properties. |
| subElements | Pointer<DGraphElement, 0, 'N', LGraphElement> | Child graph elements. |
| view | Pointer<DViewElement, 1, 1, LViewElement> | Rendering view element. |
| w | number | Width dimension. |
| x | number | Horizontal position. |
| y | number | Vertical position. |
| zIndex | number | Z-axis stacking order. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| anchors | Dictionary<string, GraphPoint> | Anchor point mapping. |
| cumulativeZoom | GraphPoint | Product of all ancestor zooms. |
| firstRenderedNode | LGraphElement | First rendered ancestor node. |
| getByFullPath | (path) => L \| null | Factory: retrieves element by path. |
| graph | LGraph \| LGraphVertex | Innermost containing graph. |
| graphAncestors | LGraph[] | Stack of ancestor graphs. |
| html | Element | DOM element representation. |
| innerGraph | LGraph \| LGraphVertex | Nearest-level container graph. |
| model | LModelElement | Associated model element. |
| name | string | Name from model or className. |
| outerGraph | LGraph | Root-level graph. |
| ownZoom | GraphPoint | Individual zoom factor for this element. |
| rendered | boolean | Currently displayed on screen. |
| root | LGraph | Root-level graph alias. |
| size | GraphSize | Bounding size. |
| text | string | Extracted text content. |
| tn | NodeTransientProperties | Transient shorthand. |
| tnv | ViewScore | Transient properties for view. |
| transient | NodeTransientProperties | Cached non-persistent properties. |
| view | LViewElement | Rendering view. |
| visible | boolean | Visible on screen. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_anchors | v, c | boolean | Update anchor point set. |
| set_tn | val, c | never | Rejects; transient is read-only. |
| set_tnv | val, c | never | Rejects; view-transient is read-only. |
| set_transient | val, c | never | Rejects; transient is read-only. |
| set_zoom | val, c | boolean | Set zoom scale factor. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| getNodeId | o? | Pointer<D> | Extracts node ID from object. |
| graphDFromHtml | target? | DGraph \| undefined | Extracts graph D-object from DOM. |
| graphLFromHtml | target? | LGraph \| undefined | Extracts graph L-object from DOM. |
| graphPtrFromHtml | target? | Pointer<DGraph> \| undefined | Extracts graph pointer from DOM. |
| new | htmlindex, model?, parentNodeID, graphID, nodeID?, a?, b?, ...c | DGraphElement | Creates new graph element. |
| nodeDFromHtml | target? | DGraphElement \| undefined | Extracts node D-object from DOM. |
| nodeLFromHtml | target? | LGraphElement \| undefined | Extracts node L-object from DOM. |
| nodePtrFromHtml | target? | Pointer<DGraphElement> \| undefined | Extracts node pointer from DOM. |

---

## DGraph / LGraph
_File_: `model/dataStructure/GraphDataElements.tsx:1027` (D) / `:1085` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| graphStyle | 'v2-flow' \| '' | Graph rendering style variant. |
| grid | {x?, y?, type?, center?, visible?} | Grid configuration. |
| offset | GraphSize | In-graph scrolling position. |
| zoom | GraphPoint | Graph zoom scaling factor. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| coord | (htmlSize) => GraphSize | Factory: convert HTML to graph coordinates. |
| grid | GraphPoint & {type, center, visible} | Grid configuration. |
| offset | Readonly<GraphSize> | Scrolling position with defaults. |
| screenOffset | GraphPoint | Distance to graph container origin in pixels. |
| translateHtmlSize | (size) => G | Factory: viewport → graph coords translator. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_grid | val, c | boolean | Update grid configuration. |
| set_offset | val, c | boolean | Set scroll offset position. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| getNodes | dmp, out | JQuery<HTMLElement> | Filter HTML elements by data ID. |
| new | htmlindex, model, parentNodeID?, parentgraphID?, nodeID? | DGraph | Creates new graph. |

---

## DVoidVertex / LVoidVertex
_File_: `model/dataStructure/GraphDataElements.tsx:1312` (D) / `:1349` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| h | number | Height. |
| isResized | boolean | Whether vertex has custom size. |
| snap | GraphPoint | Snap-to-grid offset. |
| w | number | Width. |
| x | number | X position. |
| y | number | Y position. |
| zoom | GraphPoint | Zoom scaling factor. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| h | number | Height value. |
| isResized | boolean | Custom-size flag. |
| snap | GraphPoint | Snap offset, or view default. |
| w | number | Width value. |
| x | number | X position. |
| y | number | Y position. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_h | val, c | boolean | Set height under transaction. |
| set_isResized | val, c | boolean | Update resize flag. |
| set_snap | val, c | boolean | Set snap configuration. |
| set_w | val, c | boolean | Set width under transaction. |
| set_x | val, c | boolean | Set X position under transaction. |
| set_y | val, c | boolean | Set Y position under transaction. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | htmlindex, model, parentNodeID, graphID, nodeID?, size? | DVoidVertex | Creates new void vertex. |

---

## DVertex / LVertex
_File_: `model/dataStructure/GraphDataElements.tsx:1655` (D) / `:1691` (L)

Concrete vertex: inherits from DGraphElement/DVoidVertex and adds `__isDVertex` marker. No additional body members beyond the factory.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDVertex | true | Type marker. |
| h, isResized, snap, w, x, y, zoom | (inherited) | See DVoidVertex. |

### L-layer getters
(none)

### L-layer methods
(none)

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | htmlindex, model, parentNodeID, graphID, nodeID?, size? | DVertex | Creates new vertex. |

---

## DGraphVertex / LGraphVertex
_File_: `model/dataStructure/GraphDataElements.tsx:1723` (D) / `:1780` (L)

Mixin that behaves both as a graph and a vertex.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDGraph | true | Graph-component marker. |
| __isDGraphVertex | true | Graph-vertex type marker. |
| __isDVertex | true | Vertex-component marker. |
| grid | {x?, y?, type?, center?, visible?} | Grid configuration. |
| h | number | Height. |
| isResized | boolean | Custom-size flag. |
| offset | GraphSize | In-graph scrolling offset. |
| w | number | Width. |
| x | number | X position. |
| y | number | Y position. |
| zoom | GraphPoint | Zoom scaling factor. |

### L-layer getters
(none specific; inherits from LGraph + LVertex)

### L-layer methods
(none specific)

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| new | htmlindex, model, parentNodeID, graphID, nodeID?, size? | DGraphVertex | Creates new graph-vertex. |

---

## DEdgePoint / LEdgePoint
_File_: `model/dataStructure/GraphDataElements.tsx:1425` (D) / `:1460` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDEdgePoint | true | Type marker. |
| currentCoordType | CoordinateMode | Coordinate system mode. |
| father | Pointer<DVoidEdge, 1, 1, LVoidEdge> | Parent edge reference. |
| h | number | Height. |
| size | GraphSize | Size configuration. |
| w | number | Width. |
| x | number | X position. |
| y | number | Y position. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| edge | LVoidEdge | Container edge reference. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| decodePosCoords | c, size, view, sp0?, ep0? | T | Decodes position to absolute coords. |
| set_edge | v, c | boolean | Sets edge reference. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| decodeCoords | size0, sp, ep | T | Converts coords to absolute mode. |
| encodeCoords | size0, edgePointCoordMode, sp, ep | T | Encodes coordinates to mode. |
| new | htmlindex, model?, parentNodeID, graphID?, nodeID?, size? | DEdgePoint | Creates new edge point. |
| testCoords | range = 30 | void | Tests coordinate encoding/decoding. |

---

## DVoidEdge / LVoidEdge
_File_: `model/dataStructure/GraphDataElements.tsx:1822` (D) / `:2103` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDVoidEdge | true | Type marker. |
| anchorEnd | string \| {x, y} | End anchor name or coordinates. |
| anchorStart | string \| {x, y} | Start anchor name or coordinates. |
| end | Pointer<DGraphElement, 1, 1, LGraphElement> | Target node pointer. |
| isDependency | boolean | Dependency edge flag. |
| isExtend | boolean | Inheritance edge flag. |
| isReference | boolean | Reference edge flag. |
| isValue | boolean | Value edge flag. |
| labels | DocString<"function"> | Multiple-segment labels. |
| longestLabel | DocString<"function"> | Longest-segment label. |
| midnodes | Pointer<DEdgePoint, 1, 1, LEdgePoint>[] | Mid-point nodes. |
| midPoints | InitialVertexSize[] | Mid-point size specifications. |
| start | Pointer<DGraphElement, 1, 1, LGraphElement> | Source node pointer. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| allNodes | [LGraphElement, ...LEdgePoint[], LGraphElement] | Path nodes: start, mids, end. |
| edge | LVoidEdge | Self-reference for consistency. |
| edgeEnd | GraphPoint | Edge end in outer coordinates. |
| edgeEnd_inner | GraphPoint | Edge end in inner coordinates. |
| edgeEnd_outer | GraphPoint | Edge end in outer coordinates. |
| edgeStart | GraphPoint | Edge start in outer coordinates. |
| edgeStart_inner | GraphPoint | Edge start in inner coordinates. |
| edgeStart_outer | GraphPoint | Edge start in outer coordinates. |
| endFollow | boolean | Edge end follows cursor. |
| label | labeltype | Alias for longestLabel. |
| labels | labeltype | Multiple-segment labels. |
| longestLabel | labeltype | Longest-segment label. |
| midnodes | LEdgePoint[] | Mid-point nodes array. |
| segments | {all, segments, fillers, head, tail} | Complete edge path segments. |
| startFollow | boolean | Edge start follows cursor. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| headPos | headSize0?, segment0?, zoom0? | GraphSize & {rad} | Head position and rotation. |
| headPos_impl | c, isHead, headSize0?, segment0?, zoom0? | GraphSize & {rad} | Head/tail position implementation. |
| set_end | val, c | boolean | Sets edge target node. |
| set_endFollow | val, c | boolean | Toggle end-anchor following. |
| set_label | val, c | boolean | Sets longestLabel alias. |
| set_labels | val, c | boolean | Sets multiple-segment labels. |
| set_longestLabel | val, c | boolean | Sets longest-segment label. |
| set_midnodes | val, c | boolean | Updates mid-point nodes. |
| set_start | val, c | boolean | Sets edge source node. |
| set_startFollow | val, c | boolean | Toggle start-anchor following. |
| tailPos | headSize0?, segment0?, zoom0? | GraphSize & {rad} | Tail position and rotation. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| getCursorPos | e0 | Point | Cursor position from mouse event. |
| new | htmlindex, model?, parentNodeID, graphID, nodeID?, start, end, longestLabel?, labels? | DEdge | Creates new edge. |
| new2 | model?, parentNodeID, graphID, nodeID?, start, end, setter | DEdge | Creates edge with custom setter. |
| onKeyDown_pendingEdge | e | void | Keyboard handler for edges following cursor. |
| showAnchors | () | void | Shows valid anchor points. |

---

## DEdge / LEdge
_File_: `model/dataStructure/GraphDataElements.tsx:2988` (D) / `:3010` (L)

Concrete edge with mid-point support.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDEdge | true | Type marker. |
| __isDVoidEdge | true | Void-edge marker. |
| midnodes | Pointer<DEdgePoint, 1, 1, LEdgePoint>[] | Mid-point references. |

### L-layer getters
(none specific)

### L-layer methods
(none specific)

### Static factory methods
(none specific; inherits from DVoidEdge)

---

## DExtEdge / LExtEdge
_File_: `model/dataStructure/GraphDataElements.tsx:3032` (D) / `:3059` (L)

External/inheritance edge variant — just markers.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDEdge | true | Edge-component marker. |
| __isDExtEdge | true | External-edge marker. |
| __isDVoidEdge | true | Void-edge marker. |

### L-layer getters
(none)

### L-layer methods
(none)

### Static factory methods
(none)

---

## DRefEdge / LRefEdge
_File_: `model/dataStructure/GraphDataElements.tsx:3082` (D) / `:3097` (L)

Reference edge variant.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| __isDRefEdge | true | Reference-edge marker. |
| isSelected | Dictionary<DocString<Pointer<DUser>>, boolean> | Selection state by user. |

### L-layer getters
(none)

### L-layer methods
(none)

### Static factory methods
(none)

---

## GraphSize
_File_: `common/Geom.ts:677`

Standalone geometry class (no D/L split). Extends `ISize<GraphPoint>`.

### Attributes
| Name | Type | Description |
|---|---|---|
| h | number | Height dimension. |
| w | number | Width dimension. |
| x | number | X position. |
| y | number | Y position. |

### Methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| closestPoint | pt | GraphPoint | Closest point on size boundary. |
| makePoint | x, y | GraphPoint | Creates point instance. |
| new | ...args | this | Creates new GraphSize instance. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| closestIntersection | size, pt, targetPt, gridAlign?, m0?, q0? | GraphPoint \| undefined | Segment-size intersection point. |
| closestIntersection_old | size, prevPt, pt0, gridAlign? | GraphPoint \| null | Legacy intersection calculator. |
| fromPoints | firstPt, secondPt | GraphSize | Bounding size from two points. |

---

# View submodel

## DViewElement / LViewElement
_File_: `view/viewElement/view.tsx:163` (D) / `:379` (L)

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| adaptHeight | boolean | Whether element expands height to fit contents. |
| adaptWidth | boolean | Whether element expands width to fit contents. |
| appliableTo | 'Any' \| 'Graph' \| 'GraphVertex' \| 'Vertex' \| 'Edge' \| 'EdgePoint' \| 'Field' | Element type to match. |
| appliableToClasses | string[] | Class names to match (low priority). |
| bendingMode | EdgeBendingMode | SVG path bending strategy. |
| compiled_css | string | CSS compiled from LESS with palette variables. |
| constants | string | Static values evaluated once when view applied. |
| css | string | Custom CSS with LESS support. |
| css_MUST_RECOMPILE | boolean | Flag triggering CSS recompilation. |
| defaultVSize | GraphSize | Starting size dimensions. |
| draggable | boolean | Whether element is draggable. |
| edgeEndOffset | GraphPoint | End-point offset for edge path location. |
| edgeEndOffset_isPercentage | boolean | End offset uses percentages. |
| edgeEndStopAtBoundaries | boolean | Incoming edges stop at boundaries. |
| edgeGapMode | EdgeGapMode | Edge-segment interruption strategy. |
| edgeHeadSize | GraphPoint | Size of edge head decorator. |
| edgePointCoordMode | CoordinateMode | Coordinate system for edge points. |
| edgeStartOffset | GraphPoint | Start-point offset. |
| edgeStartOffset_isPercentage | boolean | Start offset uses percentages. |
| edgeStartStopAtBoundaries | boolean | Outgoing edges stop at boundaries. |
| edgeTailSize | GraphPoint | Size of edge tail decorator. |
| events | Dictionary | Custom events callable through JSX. |
| explicitApplicationPriority | number | Priority when multiple views apply. |
| father | Pointer<DViewElement> | Parent view pointer. |
| forceNodeType | DocString | Component name to force in default rendering. |
| grid | {x?, y?, type?, center?, visible?} | Grid configuration. |
| id | Pointer<DViewElement, 1, 1, LViewElement> | Unique view identifier. |
| isExclusiveView | boolean | View can render main content alone. |
| isValidation | boolean | Semantic grouping for root views. |
| jsCondition | string | JavaScript selector for element matching. |
| jsxString | string | JSX template for visualization. |
| labels | DocString<"function"> | Multi-segment labels instruction. |
| lazySizeUpdate | boolean | Update position only when drag finishes. |
| longestLabel | DocString<"function"> | Longest-edge-segment label. |
| name | string | View name. |
| OCL_NEEDS_RECALCULATION | boolean | Flag for OCL reapplication. |
| OCL_UPDATE_NEEDS_RECALCULATION | boolean | Flag for OCL update recalculation. |
| oclCondition | string | OCL query selector. |
| oclUpdateCondition | DocString<"function"> | OCL recheck trigger variable. |
| onDataUpdate | string | Custom event on property change. |
| onDragEnd | string | Custom event on drag end. |
| onDragStart | string | Custom event on drag start. |
| onResizeEnd | string | Custom event on resize end. |
| onResizeStart | string | Custom event on resize start. |
| onRotationEnd | string | Custom event on rotation end. |
| onRotationStart | string | Custom event on rotation start. |
| palette | Readonly<PaletteType> | Color/number/text variables for CSS. |
| preRenderFunc | string | Dynamic values evaluated every update. |
| resizable | boolean | Whether element can be resized. |
| size | Dictionary<Pointer, GraphSize> | Stored element sizes keyed by pointer. |
| snap | GraphPoint | Grid snap configuration. |
| storeSize | boolean | Whether size depends on view (else graph). |
| subViews | Dictionary<Pointer<DViewElement>, number> | Child views with priority boosts. |
| usageDeclarations | string | Subset of element data graphically used. |
| viewpoint | Pointer<DViewPoint> | Containing viewpoint reference. |
| viewpointType | ViewpointType | Explicit viewpoint type classification. |
| whileDragging | string | Custom event during drag. |
| whileResizing | string | Custom event during resize. |
| whileRotating | string | Custom event during rotation. |

### L-layer getters
| Name | Return type | Description |
|---|---|---|
| allPossibleParentViews | LViewElement[] | All views except subviews and self. |
| allSubViews | LViewElement[] | All subviews recursively. |
| appliableToClasses | string[] | Applicable class names. |
| bendingMode | EdgeBendingMode | Edge-path bending strategy. |
| children | LViewElement[] | Alias for subViews. |
| compiled_css | string | CSS compiled with palette variables. |
| constants | GObject | Parsed constant values. |
| css | string | Custom CSS content. |
| cssIsGlobal | boolean | Whether CSS affects global scope. |
| defaultVSize | GraphSize | Default size dimensions. |
| duplicate | (deep?, new_vp?) => LViewElement | Factory: create view copy. |
| edgeHeadSize | GraphPoint | Edge-head decorator size. |
| edgePointCoordMode | CoordinateMode | Coordinate system mode. |
| edgeTailSize | GraphPoint | Edge-tail decorator size. |
| event | Dictionary | Alias for events. |
| events | Dictionary | Custom events callable via JSX. |
| explicitApplicationPriority | number | View priority. |
| father | LViewElement | Parent view element. |
| fatherChain | LViewElement[] | All parent views closest-to-farthest. |
| forceNodeType | DocString | Forced component name. |
| getByFullPath | factory | Factory: retrieves element by path. |
| getSize | factory | Factory: retrieves stored size for element. |
| grid | GraphPoint & {type, center, visible} | Grid configuration. |
| isExclusiveView | boolean | View is exclusive. |
| isOverlay | boolean | View adds functional outline. |
| jsCondition | string | JavaScript selector. |
| jsxString | string | JSX template. |
| label | labeltype | Alias for longestLabel. |
| labels | labeltype | Multi-segment labels. |
| lazySizeUpdate | boolean | Size-update lazy flag. |
| longestLabel | labeltype | Longest-segment label. |
| name | string | View name. |
| nodes | LGraphElement[] | Nodes currently using this view. |
| oclCondition | string | OCL selector. |
| oclUpdateCondition | (view) => boolean | OCL-update condition function. |
| onDataUpdate | string | Data-update event code. |
| onDragEnd | string | Drag-end event code. |
| onDragStart | string | Drag-start event code. |
| onResizeEnd | string | Resize-end event code. |
| onResizeStart | string | Resize-start event code. |
| onRotationEnd | string | Rotation-end event code. |
| onRotationStart | string | Rotation-start event code. |
| palette | PaletteType | Color/number/text variables. |
| preRenderFunc | string | Pre-render function code. |
| setSubViewScore | factory | Factory: set subview score/boost. |
| snap | GraphPoint | Grid snap configuration. |
| subViews | LViewElement[] | Direct child views. |
| SubViews | LViewElement[] | Child-views collection alias. |
| transient | DataTransientProperties | Non-persistent properties. |
| tv | DataTransientProperties | Short alias for transient. |
| updateSize | factory | Factory: update stored element size. |
| usageDeclarations | string | Usage declarations. |
| viewpoint | LViewPoint | Containing viewpoint. |
| whileDragging | string | Drag-motion event code. |
| whileResizing | string | Resize-motion event code. |
| whileRotating | string | Rotation-motion event code. |

### L-layer methods
| Name | Parameters | Return | Description |
|---|---|---|---|
| set_allSubViews | val, c | boolean | Rejects; derived. |
| set_appliableTo | val, c | boolean | Sets applicable element type. |
| set_appliableToClasses | val, c | boolean | Sets applicable class names. |
| set_bendingMode | val, c | boolean | Sets bending strategy. |
| set_compiled_css | val, c | boolean | Rejects direct compiled-CSS assignment. |
| set_constants | value, c | boolean | Sets or updates constants code. |
| set_css | val, c | boolean | Sets custom CSS content. |
| set_cssIsGlobal | val, c | boolean | Sets CSS-global-scope flag. |
| set_defaultVSize | val, c | boolean | Sets default size dimensions. |
| set_edgeHeadSize | v, c | boolean | Sets edge-head decorator size. |
| set_edgePointCoordMode | val, c | boolean | Sets coordinate-system mode. |
| set_edgeTailSize | v, c | boolean | Sets edge-tail decorator size. |
| set_event | val, c | boolean | Sets custom events. |
| set_events | val, c | boolean | Sets custom events with UD sync. |
| set_explicitApplicationPriority | val, c | boolean | Sets view priority. |
| set_father | v, c, manualDview?, preserveOrder? | boolean | Sets parent view element. |
| set_forceNodeType | val, c | boolean | Sets forced component name. |
| set_generic_entry | c, key, val | boolean | Generic field setter. |
| set_grid | val, c | boolean | Sets grid configuration. |
| set_isExclusiveView | val, c | boolean | Sets view exclusivity. |
| set_isOverlay | val, c | boolean | Sets overlay status. |
| set_jsCondition | val, c | boolean | Sets JavaScript selector. |
| set_jsxString | val, c | boolean | Sets JSX template. |
| set_label | val, c | boolean | Sets longest-segment label. |
| set_labels | val, c | boolean | Sets multi-segment labels. |
| set_lazySizeUpdate | val, c | boolean | Sets size-update lazy flag. |
| set_longestLabel | val, c | boolean | Sets longest-segment label. |
| set_nodes | val, c | boolean | Rejects node-collection assignment. |
| set_oclCondition | val, c | boolean | Sets OCL selector. |
| set_oclUpdateCondition | val, c | boolean | Sets OCL-update condition code. |
| set_onDataUpdate | val, c | boolean | Sets data-update event code. |
| set_onDragEnd | val, c | boolean | Sets drag-end event code. |
| set_onDragStart | val, c | boolean | Sets drag-start event code. |
| set_onResizeEnd | val, c | boolean | Sets resize-end event code. |
| set_onResizeStart | val, c | boolean | Sets resize-start event code. |
| set_onRotationEnd | val, c | boolean | Sets rotation-end event code. |
| set_onRotationStart | val, c | boolean | Sets rotation-start event code. |
| set_palette | val, c | boolean | Sets color/number/text variables. |
| set_preRenderFunc | value, c | boolean | Sets pre-render function code. |
| set_snap | val, c | boolean | Sets grid snap configuration. |
| set_subViews | val, c | boolean | Sets direct child views. |
| set_SubViews | val, c | boolean | Sets child-views collection alias. |
| set_transient | val, c | boolean | Rejects transient assignment. |
| set_tv | val, c | boolean | Rejects transient alias assignment. |
| set_usageDeclarations | val, c | boolean | Sets usage-declaration code. |
| set_viewpoint | v, c, manualDview?, preserveOrder? | boolean | Sets containing viewpoint. |

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| DFromHtml | target? | DViewElement \| undefined | Extract D-layer from HTML element. |
| LFromHtml | target? | LViewElement \| undefined | Extract L-layer from HTML element. |
| new | ...a | any | Placeholder stub method. |
| new2 | name, jsxString, father0?, callback?, persist?, id? | DViewElement | Create view with optional parent and callback. |
| newDefault | forData?, forSelf? | DViewElement | Generate default template view for data. |
| PtrFromHtml | target? | Pointer<DViewElement> \| undefined | Extract pointer from HTML element. |

---

## DViewPoint / LViewPoint
_File_: `view/viewPoint/viewpoint.ts:24` (D) / `:49` (L)

Extends `DViewElement`/`LViewElement`. Minimal structure: mostly a named viewpoint container.

### D-layer attributes
| Name | Type | Description |
|---|---|---|
| id | Pointer<DViewPoint, 1, 1, LViewPoint> | Unique viewpoint identifier. |
| name | string | Viewpoint name. |

### L-layer getters
(none)

### L-layer methods
(none)

### Static factory methods
| Name | Parameters | Returns | Description |
|---|---|---|---|
| newVP | name, callback?, persist?, id? | DViewPoint | Create named viewpoint with optional callback. |

---

## Appendix: conventions observed in the code

- **Pointers**: all cross-object references are stored as `Pointer<D-type>` (a string id) in the D-layer; the L-layer resolves them to proxies.
- **TRANSACTION**: every L-layer setter that writes to persisted state wraps the `SetFieldAction.new(...)` in a `TRANSACTION('<name.field>', ...)` call so undo/redo works and all actions in a logical change dispatch as one CompositeAction.
- **get_*/set_* indirection**: the proxy translates `obj.name` into `get_name(context)` on the L-class and `obj.name = x` into `set_name(x, context)`. Factory getters like `get_addClass` return a function so `pkg.addClass('Foo')` reads syntactically as a method call.
- **Derived getters that reject in the setter**: e.g. `many`, `required`, `validTargets`, `referencedBy`, `isClass` — all have setters that return `false` because the value is computed from other state.
- **`new`/`new2`/`new3`**: most D-classes expose three factory shapes — positional arguments (`new`), setter object (`new2`), and a partial pointer map with callback (`new3`).
