/**
 * JjScript HELP Command Handler
 * Shows help information for commands and syntax
 */

import {
    HelpArgs,
    ExecutionResult,
    CommandType,
    ElementType
} from '../../types';

// ============================================
// HELP COMMAND EXECUTOR
// ============================================

export function executeHelp(args: HelpArgs): ExecutionResult {
    const { topic } = args;

    if (!topic) {
        return showGeneralHelp();
    }

    // Check if it's a command
    const commandHelp = getCommandHelp(topic as CommandType);
    if (commandHelp) {
        return {
            success: true,
            command: 'help',
            message: commandHelp,
            data: { topic, type: 'command' }
        };
    }

    // Check if it's an element type
    const elementHelp = getElementTypeHelp(topic as ElementType);
    if (elementHelp) {
        return {
            success: true,
            command: 'help',
            message: elementHelp,
            data: { topic, type: 'element' }
        };
    }

    // Check for special topics
    if (topic === 'syntax') {
        return showSyntaxHelp();
    }
    if (topic === 'examples') {
        return showExamplesHelp();
    }

    // Unknown topic
    return {
        success: false,
        command: 'help',
        message: `Unknown help topic: '${topic}'`,
        errors: [{
            code: 'UNKNOWN_TOPIC',
            message: `No help available for '${topic}'`,
            suggestion: "Try 'help' for general help, or 'help <command>' for command-specific help"
        }]
    };
}

// ============================================
// HELP CONTENT
// ============================================

function showGeneralHelp(): ExecutionResult {
    const help = `
JjScript - Jjodel Scripting Language
====================================

JjScript allows you to manipulate metamodels using simple text commands.

COMMANDS:
  create <type> <name> [options]  - Create a new element
  delete <target> [cascade|force] - Delete an element
  rename <target> to <newname>    - Rename an element
  set <target>.<prop> = <value>   - Set a property value
  add <type> <name> to <target>   - Add element to container
  remove <target> from <parent>   - Remove from container
  move <target> to <destination>  - Move element
  copy <target> to <dest> [as <name>] - Copy element
  list [type] [in <scope>]        - List elements
  show <target> [brief|full|tree] - Show element details
  help [topic]                    - Show help
  undo [n]                        - Undo last n actions
  redo [n]                        - Redo last n actions
  validate [target|all]           - Validate model
  clear [history|console]         - Clear state

ELEMENT TYPES:
  class, abstract class, interface, attribute, reference,
  operation, parameter, package, enum, literal

EXAMPLES:
  create class Person
  create attribute name in Person type String
  create reference friends in Person type Person [0..*]
  set Person.abstract = true
  rename Person to Human
  delete Human cascade

Type 'help <command>' for detailed help on a specific command.
Type 'help syntax' for syntax details.
Type 'help examples' for more examples.
`;

    return {
        success: true,
        command: 'help',
        message: help.trim(),
        data: { topic: 'general' }
    };
}

function getCommandHelp(command: CommandType): string | null {
    const helps: Record<string, string> = {
        create: `
CREATE Command
==============
Creates a new model element.

SYNTAX:
  create <type> <name> [in <parent>] [options]

TYPES:
  class, abstract class, interface, attribute, reference,
  containment, operation, parameter, package, enum, literal

OPTIONS FOR CLASSES:
  abstract          - Make class abstract
  extends <class>   - Set superclass

OPTIONS FOR ATTRIBUTES:
  type <type>       - Set attribute type (String, Integer, Boolean, etc.)
  [lower..upper]    - Set multiplicity (e.g., [0..*], [1])
  default <value>   - Set default value
  derived           - Mark as derived
  readonly          - Mark as read-only

OPTIONS FOR REFERENCES:
  type <class>      - Set target type
  [multiplicity]    - Set multiplicity
  containment       - Mark as containment reference
  opposite <ref>    - Set opposite reference

CONTAINMENT (composition):
  "create containment" is shorthand for "create reference ... containment"
  Both syntaxes are equivalent:
    create containment items in Order type Item [0..*]
    create reference items in Order type Item [0..*] containment

EXAMPLES:
  create class Person
  create abstract class Entity
  create attribute name in Person type String
  create attribute age in Person type Integer default 0
  create reference manager in Person type Person [0..1]
  create containment children in Person type Person [0..*]
  create enum Status in MyPackage
  create literal ACTIVE in Status value 1
`,
        delete: `
DELETE Command
==============
Deletes a model element.

SYNTAX:
  delete <target> [cascade] [force]

OPTIONS:
  cascade   - Also delete all contained elements
  force     - Delete even if element is referenced

EXAMPLES:
  delete Person
  delete Person cascade
  delete MyPackage::OldClass force
`,
        rename: `
RENAME Command
==============
Renames a model element.

SYNTAX:
  rename <target> to <newname>
  rename <target> as <newname>

EXAMPLES:
  rename Person to Human
  rename MyClass.oldAttr to newAttr
`,
        set: `
SET Command
===========
Sets a property value on a model element.

SYNTAX:
  set <target>.<property> = <value>
  set <target>.<property> to <value>
  set <target> <property> += <value>  (append to collection)
  set <target> <property> -= <value>  (remove from collection)

COMMON PROPERTIES:
  Classes: abstract, interface, superTypes
  Attributes: type, lowerBound, upperBound, derived, changeable, defaultValueLiteral
  References: type, containment, opposite, lowerBound, upperBound
  Packages: uri, prefix

EXAMPLES:
  set Person.abstract = true
  set Person.name type = String
  set Person.superTypes += Animal
`,
        add: `
ADD Command
===========
Adds a new element to a container (similar to create with explicit parent).

SYNTAX:
  add <type> <name> to <parent> [options]

EXAMPLES:
  add attribute email to Person type String
  add reference manager to Employee type Employee [0..1]
`,
        remove: `
REMOVE Command
==============
Removes an element from a collection.

SYNTAX:
  remove <element> from <container>

EXAMPLES:
  remove name from Person
  remove Employee from MyPackage
`,
        move: `
MOVE Command
============
Moves an element to a different container.

SYNTAX:
  move <element> to <destination>

EXAMPLES:
  move Person to NewPackage
  move myAttr to OtherClass
`,
        copy: `
COPY Command
============
Creates a copy of an element.

SYNTAX:
  copy <element> to <destination> [as <newname>] [deep]

OPTIONS:
  as <name>  - Specify name for the copy
  deep       - Also copy all contained elements

EXAMPLES:
  copy Person to MyPackage as PersonCopy
  copy MyPackage to OtherModel deep
`,
        list: `
LIST Command
============
Lists model elements with optional filtering.

SYNTAX:
  list [type] [in <scope>]

TYPES:
  all, class, attribute, reference, operation, package, enum, literal

EXAMPLES:
  list                    - List all elements
  list class              - List all classes
  list attribute in Person - List attributes in Person
`,
        show: `
SHOW Command
============
Shows detailed information about an element.

SYNTAX:
  show <target> [brief|full|tree]
  show project
  show model

DETAIL LEVELS:
  brief  - Show minimal info
  full   - Show all properties (default)
  tree   - Show hierarchical structure

EXAMPLES:
  show Person
  show Person tree
  show project
  show model full
`,
        undo: `
UNDO Command
============
Undoes the last command(s).

SYNTAX:
  undo [n]

EXAMPLES:
  undo      - Undo last command
  undo 3    - Undo last 3 commands
`,
        redo: `
REDO Command
============
Redoes previously undone command(s).

SYNTAX:
  redo [n]

EXAMPLES:
  redo      - Redo last undone command
  redo 2    - Redo last 2 undone commands
`,
        validate: `
VALIDATE Command
================
Validates the model or specific elements.

SYNTAX:
  validate [target|all]

EXAMPLES:
  validate         - Validate current model
  validate all     - Validate everything
  validate Person  - Validate specific class
`,
        clear: `
CLEAR Command
=============
Clears state information.

SYNTAX:
  clear [history|console]

EXAMPLES:
  clear history   - Clear command history
  clear console   - Clear console output
`,
    };

    return helps[command] || null;
}

function getElementTypeHelp(type: ElementType): string | null {
    const helps: Record<string, string> = {
        class: `
CLASS Element
=============
A class represents a concept in your metamodel.

PROPERTIES:
  name         - Class name (PascalCase recommended)
  abstract     - Whether the class is abstract
  interface    - Whether this is an interface
  superTypes   - Parent classes/interfaces
  attributes   - Owned attributes
  references   - Owned references
  operations   - Owned operations

CREATE EXAMPLES:
  create class Person
  create abstract class Entity
  create interface Named
  create class Employee extends Person
`,
        attribute: `
ATTRIBUTE Element
=================
An attribute represents a property of a class.

PROPERTIES:
  name              - Attribute name (camelCase recommended)
  type              - Data type (String, Integer, Boolean, etc.)
  lowerBound        - Minimum cardinality (default: 0)
  upperBound        - Maximum cardinality (-1 for unlimited)
  derived           - Whether value is computed
  changeable        - Whether value can be modified
  defaultValueLiteral - Default value

CREATE EXAMPLES:
  create attribute name in Person type String
  create attribute age in Person type Integer [0..1]
  create attribute id in Entity type String derived
`,
        reference: `
REFERENCE Element
=================
A reference represents a relationship between classes.

PROPERTIES:
  name          - Reference name (camelCase recommended)
  type          - Target class type
  lowerBound    - Minimum cardinality
  upperBound    - Maximum cardinality
  containment   - Whether this is a composition (ownership)
  opposite      - Bidirectional reference partner

CREATE EXAMPLES:
  create reference parent in Person type Person [0..1]
  create reference children in Person type Person [0..*] containment
  create reference spouse in Person type Person [0..1] opposite spouse
`,
        operation: `
OPERATION Element
=================
An operation represents a method on a class.

PROPERTIES:
  name        - Operation name (camelCase recommended)
  type        - Return type (void if none)
  parameters  - Input parameters

CREATE EXAMPLES:
  create operation greet in Person returns String
  create parameter name in greet type String
`,
        package: `
PACKAGE Element
===============
A package organizes model elements.

PROPERTIES:
  name         - Package name
  uri          - Namespace URI
  prefix       - Namespace prefix
  classifiers  - Contained classes and enums
  subPackages  - Nested packages

CREATE EXAMPLES:
  create package domain
  create package entities in domain nsUri "http://example.org/entities"
`,
        enum: `
ENUM Element
============
An enumeration defines a set of named constants.

PROPERTIES:
  name     - Enum name (PascalCase recommended)
  literals - Enum values

CREATE EXAMPLES:
  create enum Status
  create literal ACTIVE in Status value 0
  create literal INACTIVE in Status value 1
`,
    };

    return helps[type] || null;
}

function showSyntaxHelp(): ExecutionResult {
    const help = `
JjScript Syntax Reference
=========================

QUALIFIED NAMES:
  Simple:     ClassName, attributeName
  Qualified:  Package::ClassName
  Member:     ClassName.attributeName
  Full:       Package::Class.attribute

TYPES:
  Primitive:  String, Integer, Boolean, Float, Date
  Class:      MyClass, Package::MyClass
  Collection: List<String>, Set<MyClass>

MULTIPLICITY:
  [1]      - Exactly one
  [0..1]   - Optional (zero or one)
  [1..*]   - One or more
  [0..*]   - Zero or more (same as [*])
  [*]      - Many

VALUES:
  String:   "hello", 'world'
  Number:   42, 3.14, -5
  Boolean:  true, false
  Null:     null
  Enum:     Status::ACTIVE, Status.ACTIVE

OPERATORS:
  =    - Assignment
  +=   - Add to collection
  -=   - Remove from collection

COMMENTS:
  // Single line comment
  /* Multi-line
     comment */
`;

    return {
        success: true,
        command: 'help',
        message: help.trim(),
        data: { topic: 'syntax' }
    };
}

function showExamplesHelp(): ExecutionResult {
    const help = `
JjScript Examples
=================

CREATING A SIMPLE METAMODEL:
  create package library
  create class Book in library
  create attribute title in Book type String
  create attribute isbn in Book type String
  create attribute year in Book type Integer

  create class Author in library
  create attribute name in Author type String

  create reference authors in Book type Author [1..*]
  create reference books in Author type Book [0..*] opposite authors

CREATING AN ENUM:
  create enum BookStatus
  create literal AVAILABLE in BookStatus value 0
  create literal BORROWED in BookStatus value 1
  create literal RESERVED in BookStatus value 2

  create attribute status in Book type BookStatus default AVAILABLE

INHERITANCE:
  create abstract class NamedElement
  create attribute name in NamedElement type String

  create class Person extends NamedElement
  create class Organization extends NamedElement

MODIFYING ELEMENTS:
  set Book.abstract = true
  rename Author to Writer
  move Book to newPackage
  delete isbn

EXPLORING THE MODEL:
  list class
  list attribute in Book
  show Book full
  show library tree
  show project

BATCH OPERATIONS:
  // Create multiple attributes at once
  create attribute firstName in Person type String
  create attribute lastName in Person type String
  create attribute email in Person type String
  create attribute age in Person type Integer [0..1]
`;

    return {
        success: true,
        command: 'help',
        message: help.trim(),
        data: { topic: 'examples' }
    };
}
