# JjTL — Transformation Language

JjTL is Jjodel's declarative model-to-model transformation language.

## Basic Syntax

```jjtl
transformation MyTransformation

from SourceMetamodel
to   TargetMetamodel

SourceClass -> TargetClass {
    sourceAttr -> targetAttr
}
```

## Features

- Class mappings with attribute mappings
- ForAll mappings for collection iteration
- Guard conditions (`when` clause)
- Helper functions
- JjEL expressions for value conversion

> See the full specification for details.
