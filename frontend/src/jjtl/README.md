# JjTL - Jjodel Transformation Language

Linguaggio dichiarativo per trasformazioni Model-to-Model in Jjodel.

## Quick Start

```typescript
import { tokenize, parse, JjtlEditor } from './jjtl';

// Parse JjTL code
const source = `
transformation StateMachine-2-PetriNet

from StateMachineMM
to   PetriNetMM

State -> Place {
    isInitial -> tokens : true=1, false=0
}
`;

const tokens = tokenize(source);
const { ast, errors } = parse(tokens.tokens);

console.log('AST:', ast);
console.log('Errors:', errors);
```

## Sintassi

```jjtl
transformation <Nome>

from <SourceMetamodel>
to   <TargetMetamodel>

# Mapping classe
SourceClass -> TargetClass {
    # Mapping attributi
    sourceAttr -> targetAttr
    sourceAttr -> targetAttr : true=1, false=0

    # Creazione oggetti
    -> newAttr {
        -> NewClass {
            attr -> value
        }
    }
}

# Helper function
helper nomeFunzione(param: Tipo) -> TipoRitorno {
    espressione
}
```

## Struttura

```
jjtl/
├── types/          # Tipi TypeScript (Token, AST)
├── lexer/          # Tokenizer
├── parser/         # Parser -> AST
├── executor/       # Esecuzione trasformazioni
└── editor/         # Monaco Editor component
```

## Esempio Completo

```jjtl
transformation StateMachine-2-PetriNet

from StateMachineMM
to   PetriNetMM

# Ogni State diventa un Place
State -> Place {
    name -> label
    isInitial -> tokens : true=1, false=0
}

# Ogni Transition diventa un Transition + Arcs
Transition -> Transition [*] {
    name -> label

    # Crea arco da Place sorgente
    -> inputArcs {
        -> Arc {
            place -> source.map()
            weight -> 1
        }
    }

    # Crea arco verso Place destinazione
    -> outputArcs {
        -> Arc {
            place -> target.map()
            weight -> 1
        }
    }
}

# Helper per formattare nomi
helper formatLabel(s: String) -> String {
    s.toUpper()
}
```

## API

### Lexer

```typescript
import { tokenize, JjtlLexer } from './jjtl';

const result = tokenize(source);
// result.tokens: Token[]
// result.errors: LexerError[]
```

### Parser

```typescript
import { parse, JjtlParser } from './jjtl';

const result = parse(tokens);
// result.ast: TransformationAST | null
// result.errors: ParserError[]
```

### Editor

```typescript
import { JjtlEditor } from './jjtl';

<JjtlEditor
    value={code}
    onChange={(newCode) => setCode(newCode)}
    onParse={({ errors }) => setErrors(errors)}
    height="400px"
    readOnly={false}
/>
```

## Token Types

| Token | Esempio |
|-------|---------|
| TRANSFORMATION | `transformation` |
| FROM | `from` |
| TO | `to` |
| WHEN | `when` |
| HELPER | `helper` |
| ARROW | `->` |
| IDENTIFIER | `name`, `State` |
| STRING | `"hello"` |
| NUMBER | `42`, `3.14` |
| BOOLEAN | `true`, `false` |

## AST Node Types

- `Transformation` - Root node
- `ClassMapping` - Mapping tra classi
- `AttributeMapping` - Mapping tra attributi
- `Conversion` - Conversione valori
- `ValueMapping` - Mapping valore singolo
- `ObjectCreation` - Creazione nuovo oggetto
- `Helper` - Funzione helper
- `Literal`, `Identifier`, `MemberAccess`, `FunctionCall` - Espressioni
