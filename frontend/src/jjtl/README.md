# JjTL - Jjodel Transformation Language

Linguaggio dichiarativo per trasformazioni Model-to-Model in Jjodel.

## Quick Start

```typescript
import { tokenize, parse, JjtlEditor } from './jjtl';

// Parse JjTL code
const source = `
transformation StateMachine2PetriNet

from StateMachineMM
to   PetriNetMM

State -> Place {
    tokens := isInitial : true=1, false=0
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

-- Mapping classe
SourceClass -> TargetClass {
    -- Mapping attributi (target := source)
    targetAttr := sourceAttr
    tokens := isInitial : true=1, false=0

    -- Creazione oggetti
    -> newAttr {
        -> NewClass {
            targetAttr := value
        }
    }
}

-- Con alias e guard
Person p -> Human where p.age > 18 {
    name := p.fullName
}

-- Multi-source
Class c, Package p -> Table where c.package = p {
    name := p.name + "." + c.name
}

-- Helper function
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
transformation StateMachine2PetriNet

from StateMachineMM
to   PetriNetMM

-- Ogni State diventa un Place
State -> Place {
    label := name
    tokens := isInitial : true=1, false=0
}

-- Ogni Transition diventa un Transition + Arcs
Transition -> Transition [*] {
    label := name

    -- Crea arco da Place sorgente
    -> inputArcs {
        -> Arc {
            source := place.map()
            weight := 1
        }
    }

    -- Crea arco verso Place destinazione
    -> outputArcs {
        -> Arc {
            target := place.map()
            weight := 1
        }
    }
}

-- Helper per formattare nomi
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
| WHERE | `where` |
| HELPER | `helper` |
| ARROW | `->` |
| ASSIGN | `:=` |
| IDENTIFIER | `name`, `State` |
| STRING | `"hello"` |
| NUMBER | `42`, `3.14` |
| BOOLEAN | `true`, `false` |

## AST Node Types

- `Transformation` - Root node
- `ClassMapping` - Mapping tra classi
- `AttributeMapping` - Mapping tra attributi (`target := source`)
- `Conversion` - Conversione valori (lookup table)
- `ValueMapping` - Mapping valore singolo
- `ObjectCreation` - Creazione nuovo oggetto
- `Helper` - Funzione helper
- `Literal`, `Identifier`, `MemberAccess`, `FunctionCall` - Espressioni
