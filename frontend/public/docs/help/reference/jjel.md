# JjEL — Expression Language

JjEL (Jjodel Expression Language) lets you write expressions to query and transform model data.

## Quick Examples

```
source.name.toUpper()
forall a in attributes such that a.isPublic : a.name
if active then "yes" else "no"
```

## Operators

`+`, `-`, `*`, `/`, `==`, `!=`, `and`, `or`, `not`, `implies`, `is`, `??`

## Built-in Methods

Over 130 built-in methods for strings, collections, numbers, and dates.

> See the full specification for details.
