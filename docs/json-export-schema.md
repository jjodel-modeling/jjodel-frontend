# Jjodel JSON Export Formats

This document describes the JSON documents that Jjodel produces from the Project
Editor. It is meant as an integration reference for external tools that consume
these files.

There are **four** export documents, distinguished by their top-level `format`
field:

| `format`            | Produced from                               | Contents |
|---------------------|---------------------------------------------|----------|
| `jjodel-metamodel`  | Metamodel context menu → *Export JSON*      | One metamodel (M2), with any referenced foreign metamodels embedded. |
| `jjodel-model`      | Model context menu → *Export JSON*          | One model (M1), with its metamodel(s) embedded. |
| `jjodel-megamodel`  | Megamodel view → *Export JSON*              | The project megamodel graph: artifact inventory + relationships. |
| `jjodel-megamodel` + `definitions` | Megamodel view → *Export Full JSON* | The megamodel graph **plus** the full JSON document of every artifact. |

All documents share these top-level fields:

- `format` — string discriminator (see table above).
- `formatVersion` — currently `"1.0"`.
- `metadata` — provenance (names, ids, timestamp, engine version).

Timestamps are ISO-8601 strings (`new Date().toISOString()`).

---

## Shared conventions

### Type references

A **type** (an attribute/reference/parameter type, a super-type) is serialized
one of two ways:

- **Primitive datatypes** → a plain **string** with the Ecore name:
  `"EString"`, `"EInt"`, `"EBoolean"`, `"EFloat"`, `"EDouble"`, `"EDate"`,
  `"ELong"`, `"EShort"`, `"EByte"`, `"EChar"`.
- **Classifiers** (a class, an enum, a user datatype) → a **`ClassifierRef`**
  object:

```jsonc
{
  "name": "Person",
  "package": "people",              // optional — the owning package name
  "metamodel": {                    // present ONLY for cross-metamodel elements
    "id": "Pointer9_...",
    "name": "PeopleMM",
    "nsURI": "http://example.org/people"
  }
}
```

The presence of the `metamodel` field is the signal that the referenced element
lives in **another metamodel**. When it is absent, the classifier belongs to the
current document.

### Cross-metamodel elements (embedded / self-contained)

Metamodels may extend or reference classes defined in other metamodels. Every
such referenced foreign metamodel is embedded **in full** under
`externalMetamodels` (a flat array; transitive references are followed, cycles
are guarded). A consumer therefore never needs a second file to resolve a
`ClassifierRef.metamodel`: look it up by `id` in `externalMetamodels`.

### Omitted defaults

To keep files small, fields equal to their default are omitted:

- Booleans that default to `false` (`abstract`, `interface`, `containment`,
  `derived`, …) appear **only when `true`**.
- `ordered` / `unique` default to `true`; they appear **only when `false`**.
- `lowerBound` is omitted when `0`; `upperBound` is omitted when `1`.
- `upperBound: -1` means **unbounded** (`*`).

---

## 1. Metamodel — `jjodel-metamodel`

```jsonc
{
  "format": "jjodel-metamodel",
  "formatVersion": "1.0",
  "metadata": {
    "name": "LibraryMM",
    "id": "Pointer3_...",
    "exportedAt": "2026-07-23T10:00:00.000Z",
    "jjodelVersion": "v3.0"
  },
  "packages": [ /* Package[] */ ],
  "externalMetamodels": [ /* ExternalMetamodel[] — optional */ ]
}
```

### `Package`

```jsonc
{
  "name": "library",
  "nsURI": "http://example.org/library",   // optional
  "nsPrefix": "lib",                        // optional
  "classes":     [ /* Class[] */ ],         // optional
  "enums":       [ /* Enum[] */ ],          // optional
  "dataTypes":   [ /* DataType[] */ ],      // optional
  "subpackages": [ /* Package[] */ ]        // optional, recursive
}
```

### `Class`

```jsonc
{
  "name": "Book",
  "abstract": false,                 // present only when true
  "interface": false,                // present only when true
  "instanceClassName": "…",          // optional
  "superTypes": [ /* ClassifierRef[] */ ],
  "attributes": [ /* Attribute[] */ ],
  "references": [ /* Reference[] */ ]
}
```

### `Attribute`

```jsonc
{
  "name": "title",
  "type": "EString",                 // string (primitive) OR ClassifierRef (enum/datatype)
  "lowerBound": 1,                   // omitted when 0
  "upperBound": -1,                  // omitted when 1; -1 = unbounded
  "ordered": false,                  // present only when false
  "unique": false,                   // present only when false
  "derived": true                    // present only when true
}
```

### `Reference`

```jsonc
{
  "name": "author",
  "type": { "name": "Person", "metamodel": { "id": "…", "name": "PeopleMM", "nsURI": "…" } },
  "containment": true,               // present only when true (composition)
  "lowerBound": 1,                   // omitted when 0
  "upperBound": -1,                  // omitted when 1; -1 = unbounded
  "ordered": false,                  // present only when false
  "unique": false,                   // present only when false
  "opposite": "books"                // optional — name of the opposite reference
}
```

### `Enum`

```jsonc
{
  "name": "Genre",
  "instanceClassName": "…",          // optional
  "serializable": false,             // present only when false
  "literals": [
    { "name": "FICTION", "value": 0 },
    { "name": "NON_FICTION", "value": 1, "literal": "Non Fiction" }  // literal only if it differs from name
  ]
}
```

### `DataType`

```jsonc
{ "name": "ISBN", "instanceClassName": "…", "serializable": false }
```

### `ExternalMetamodel`

A full metamodel definition embedded because it is referenced from another one.

```jsonc
{
  "id": "Pointer9_...",
  "name": "PeopleMM",
  "nsURI": "http://example.org/people",
  "packages": [ /* Package[] — same shape as above */ ]
}
```

### Full example (cross-metamodel)

`LibraryMM.Book.author : Person`, where `Person` lives in `PeopleMM`:

```jsonc
{
  "format": "jjodel-metamodel",
  "formatVersion": "1.0",
  "metadata": { "name": "LibraryMM", "id": "Pointer3_a", "exportedAt": "2026-07-23T10:00:00.000Z", "jjodelVersion": "v3.0" },
  "packages": [
    {
      "name": "library",
      "nsURI": "http://example.org/library",
      "nsPrefix": "lib",
      "classes": [
        {
          "name": "Book",
          "attributes": [ { "name": "title", "type": "EString", "lowerBound": 1 } ],
          "references": [
            {
              "name": "author",
              "type": { "name": "Person", "package": "people",
                        "metamodel": { "id": "Pointer9_b", "name": "PeopleMM", "nsURI": "http://example.org/people" } },
              "lowerBound": 1
            }
          ]
        }
      ]
    }
  ],
  "externalMetamodels": [
    {
      "id": "Pointer9_b",
      "name": "PeopleMM",
      "nsURI": "http://example.org/people",
      "packages": [
        { "name": "people", "classes": [ { "name": "Person", "attributes": [ { "name": "fullName", "type": "EString" } ] } ] }
      ]
    }
  ]
}
```

---

## 2. Model — `jjodel-model`

```jsonc
{
  "format": "jjodel-model",
  "formatVersion": "1.0",
  "metadata": { "name": "myLibrary", "id": "Pointer50_...", "exportedAt": "…", "jjodelVersion": "v3.0" },
  "metamodel": {                     // the model's metamodel, embedded in full
    "id": "Pointer3_a",
    "name": "LibraryMM",
    "nsURI": "http://example.org/library",
    "packages": [ /* Package[] */ ]
  },
  "objects": [ /* Object[] */ ],
  "externalMetamodels": [ /* ExternalMetamodel[] — optional */ ]
}
```

### `Object`

```jsonc
{
  "id": "Pointer60_x",              // internal object id; targets of $ref resolve against these
  "name": "The Hobbit",             // optional
  "class": { "name": "Book" },      // ClassifierRef (metamodel present if the class is cross-metamodel)
  "attributes": {                   // optional
    "title": "The Hobbit",          // single value unwrapped; multi-valued → array
    "genre": "FICTION"              // enum values are emitted as the literal name
  },
  "references": {                   // optional — non-containment references
    "author": [ { "$ref": "Pointer60_y" } ]
  },
  "children": {                     // optional — containment references, nested inline
    "chapters": [ { "id": "Pointer60_z", "class": { "name": "Chapter" }, "attributes": { "n": 1 } } ]
  }
}
```

**`$ref` resolution.** A `{ "$ref": "<id>" }` points to another object's `id`
**within the same document** (top-level `objects` or any nested `children`).

> **Limitation.** A reference to an object living in a *different* model produces
> a `$ref` that is not resolvable inside a single-model file. (Same limitation as
> the XMI single-model exporter.)

---

## 3. Megamodel — `jjodel-megamodel`

The project megamodel is a directed graph of **artifacts** (nodes) and
**relationships** (edges). Two variants exist; both use `format:
"jjodel-megamodel"`. The **full** variant additionally carries a `definitions`
object. Its presence is the discriminator between light and full.

### 3a. Light export

```jsonc
{
  "format": "jjodel-megamodel",
  "formatVersion": "1.0",
  "megamodelVersion": "1.0",
  "metadata": {
    "project": { "id": "Pointer1_...", "name": "My Project" },
    "exportedAt": "…",
    "jjodelVersion": "v3.0"
  },
  "artifacts": {
    "metamodels": [
      { "id": "Pointer3_a", "name": "LibraryMM", "usesMetamodelIds": ["Pointer9_b"] }
    ],
    "models": [
      { "id": "Pointer50_m", "name": "myLibrary", "instanceofMetamodelId": "Pointer3_a",
        "generatedBy": null }
    ],
    "transformations": [
      { "id": "t1", "name": "Lib2Cat", "sourceMetamodelId": "Pointer3_a", "targetMetamodelId": "Pointer4_c" }
    ],
    "viewpoints": [ { "id": "vp1", "name": "Overview" } ]
  },
  "edges": [ /* Edge[] */ ]
}
```

`artifacts` is the complete inventory of the project (it includes artifacts even
when they have no edges). `usesMetamodelIds` lists the ids of the metamodels a
metamodel depends on (cross-metamodel reference or extension). `generatedBy`, if
set, is `{ "transformationId", "sourceModelId", "timestamp" }`.

### `Edge`

```jsonc
{
  "id": "derived_Pointer50_m_conformsTo_Pointer3_a",
  "source": { "id": "Pointer50_m", "type": "model", "name": "myLibrary" },
  "target": { "id": "Pointer3_a", "type": "metamodel", "name": "LibraryMM" },
  "type": "conformsTo",
  "origin": "derived",              // "derived" (inferred) | "user-defined"
  "trigger": { /* … */ },           // optional — only on transformation-connected edges
  "label": "…",                     // optional
  "metadata": { /* … */ }           // optional (e.g. { "timestamp": 123 } on generatedBy)
}
```

`source.type` / `target.type` are one of: `metamodel`, `model`,
`transformation`, `script`.

**Edge `type` values**

| Type              | Direction                          | Meaning |
|-------------------|------------------------------------|---------|
| `conformsTo`      | model → metamodel                  | The model is an instance of the metamodel. |
| `uses`            | metamodel → metamodel              | A class references/extends a class in the target metamodel. |
| `inputOf`         | metamodel → transformation         | The transformation consumes models of this type. |
| `outputOf`        | transformation → metamodel         | The transformation produces models of this type. |
| `generatedBy`     | generated model → transformation   | This model was produced by this transformation. |
| `sourceOf`        | generated model → source model     | This model was produced from that source model. |
| `instanceInputOf` | source model → transformation      | This model was used as input for a transformation run. |
| `tracedBy`        | transformation → trace             | Execution record. |
| `user-defined`    | any                                | Explicit relationship added by the user. |

### 3b. Full export

Identical to the light export, plus a `definitions` object holding the complete
JSON document of every artifact. Metamodels and models use the exact structures
from sections **1** and **2**; transformations are emitted as their own object.

```jsonc
{
  "format": "jjodel-megamodel",
  "formatVersion": "1.0",
  "megamodelVersion": "1.0",
  "metadata": { /* … */ },
  "artifacts": { /* … as above … */ },
  "edges": [ /* … as above … */ ],

  "definitions": {
    "metamodels": [ /* jjodel-metamodel document per metamodel (see §1) */ ],
    "models":     [ /* jjodel-model document per model (see §2) */ ],
    "transformations": [
      {
        "id": "t1",
        "name": "Lib2Cat",
        "sourceMetamodelId": "Pointer3_a",
        "targetMetamodelId": "Pointer4_c",
        "code": "…",
        "ast": { /* … */ }
        /* plus any other transformation fields */
      }
    ]
  }
}
```

Correlate a definition with its inventory entry / graph node by matching `id`:
`definitions.metamodels[i].metadata.id` ↔ `artifacts.metamodels[j].id` ↔
`edges[].source|target.id`.

> **Robustness.** In a full export, a single failing artifact does not abort the
> file: its entry under `definitions` is replaced by
> `{ "id", "name", "error": "<message>" }`.

---

## Versioning

`formatVersion` (and `megamodelVersion` for megamodel documents) is `"1.0"`.
Consumers should treat unknown optional fields leniently and branch on `format`.
