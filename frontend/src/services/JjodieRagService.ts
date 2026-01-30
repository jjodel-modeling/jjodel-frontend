/**
 * Jjodie RAG Integration Service
 *
 * Bridges the RAG system with Jjodie chat to provide context-aware responses.
 * Handles:
 * - Project indexing on load
 * - Context augmentation for queries
 * - Re-indexing on project changes
 */

import type { LProject, LClass, LAttribute, LReference, LEnumerator } from '../joiner';
import {
    initializeRagSystem,
    getIndexer,
    getRetriever,
    getVectorStore,
} from '../jjodie/rag';
import type {
    KnowledgeDocument,
    DocumentSource,
    IndexStats,
} from '../jjodie/rag';

// ============================================
// TYPES
// ============================================

interface IndexedProjectInfo {
    projectId: string;
    projectHash: string;
    indexedAt: number;
    documentCount: number;
}

interface RagContext {
    relevantChunks: string[];
    searchScore: number;
    source: string;
}

// ============================================
// SERVICE
// ============================================

class JjodieRagServiceClass {
    private initialized = false;
    private jjscriptIndexed = false;
    private indexedProjects: Map<string, IndexedProjectInfo> = new Map();
    private currentProjectId: string | null = null;

    /**
     * Initialize the RAG system
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await initializeRagSystem();
            this.initialized = true;
            console.log('[JjodieRagService] RAG system initialized');

            // Index JjScript documentation on first init
            if (!this.jjscriptIndexed) {
                await this.indexJjScriptDocumentation();
            }
        } catch (error) {
            console.error('[JjodieRagService] Failed to initialize RAG:', error);
        }
    }

    /**
     * Check if initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Calculate a simple hash of project content for change detection
     */
    private calculateProjectHash(project: LProject): string {
        try {
            const parts: string[] = [];

            // Include project name
            parts.push(project.name || '');

            // Include classes
            if (project.classes) {
                project.classes.forEach((cls: LClass) => {
                    parts.push(`class:${cls.name || ''}`);

                    if (cls.attributes) {
                        cls.attributes.forEach((attr: LAttribute) => {
                            parts.push(`attr:${attr.name || ''}`);
                        });
                    }

                    if (cls.references) {
                        cls.references.forEach((ref: LReference) => {
                            parts.push(`ref:${ref.name || ''}`);
                        });
                    }
                });
            }

            // Include enumerations
            if (project.enumerators) {
                project.enumerators.forEach((en: LEnumerator) => {
                    parts.push(`enum:${en.name || ''}`);
                });
            }

            // Simple hash
            const str = parts.join('|');
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(16);
        } catch {
            return Date.now().toString(16);
        }
    }

    /**
     * Convert project to knowledge documents
     */
    private projectToDocuments(project: LProject): KnowledgeDocument[] {
        const documents: KnowledgeDocument[] = [];
        const projectId = project.id || 'unknown';
        const projectName = project.name || 'Unnamed Project';

        // 1. Main metamodel overview document
        const overviewParts: string[] = [];
        overviewParts.push(`# ${projectName} Metamodel`);
        overviewParts.push('');

        const classCount = project.classes?.length || 0;
        const enumCount = project.enumerators?.length || 0;

        overviewParts.push(`This metamodel contains ${classCount} classes and ${enumCount} enumerations.`);
        overviewParts.push('');

        if (project.classes && project.classes.length > 0) {
            overviewParts.push('## Classes');
            project.classes.forEach((cls: LClass) => {
                const abstractStr = cls.abstract ? ' (abstract)' : '';
                overviewParts.push(`- **${cls.name || 'Unnamed'}**${abstractStr}`);
            });
            overviewParts.push('');
        }

        if (project.enumerators && project.enumerators.length > 0) {
            overviewParts.push('## Enumerations');
            project.enumerators.forEach((en: LEnumerator) => {
                overviewParts.push(`- **${en.name || 'Unnamed'}**`);
            });
        }

        documents.push({
            id: `project_${projectId}_overview`,
            title: `${projectName} Overview`,
            content: overviewParts.join('\n'),
            source: 'metamodel' as DocumentSource,
            metadata: {
                projectId,
                elementType: 'overview',
                tags: ['overview', 'metamodel'],
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 2. Individual class documents
        if (project.classes) {
            project.classes.forEach((cls: LClass) => {
                const classParts: string[] = [];
                const className = cls.name || 'Unnamed';

                classParts.push(`# Class: ${className}`);
                classParts.push('');

                if (cls.abstract) {
                    classParts.push('This is an **abstract** class.');
                    classParts.push('');
                }

                // Extends
                if (cls.extends && cls.extends.length > 0) {
                    const superClasses = cls.extends.map((sc: LClass) => sc.name || 'Unknown').join(', ');
                    classParts.push(`**Extends:** ${superClasses}`);
                    classParts.push('');
                }

                // Attributes
                if (cls.attributes && cls.attributes.length > 0) {
                    classParts.push('## Attributes');
                    cls.attributes.forEach((attr: LAttribute) => {
                        const attrName = attr.name || 'unnamed';
                        const attrType = this.getTypeName(attr);
                        classParts.push(`- **${attrName}**: ${attrType}`);
                    });
                    classParts.push('');
                }

                // References
                if (cls.references && cls.references.length > 0) {
                    classParts.push('## References');
                    cls.references.forEach((ref: LReference) => {
                        const refName = ref.name || 'unnamed';
                        const targetName = this.getTargetName(ref);
                        const refType = ref.containment ? 'composition' : 'association';
                        classParts.push(`- **${refName}** → ${targetName} (${refType})`);
                    });
                    classParts.push('');
                }

                // Operations
                if (cls.operations && cls.operations.length > 0) {
                    classParts.push('## Operations');
                    cls.operations.forEach((op: any) => {
                        const opName = op.name || 'unnamed';
                        classParts.push(`- **${opName}()**`);
                    });
                    classParts.push('');
                }

                if (classParts.length > 2) {
                    documents.push({
                        id: `class_${projectId}_${cls.id || className}`,
                        title: `Class: ${className}`,
                        content: classParts.join('\n'),
                        source: 'metamodel' as DocumentSource,
                        metadata: {
                            projectId,
                            elementType: 'class',
                            elementId: cls.id,
                            tags: ['class', className.toLowerCase()],
                        },
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
            });
        }

        // 3. Enumeration documents
        if (project.enumerators) {
            project.enumerators.forEach((en: LEnumerator) => {
                const enumParts: string[] = [];
                const enumName = en.name || 'Unnamed';

                enumParts.push(`# Enumeration: ${enumName}`);
                enumParts.push('');

                if (en.literals && en.literals.length > 0) {
                    enumParts.push('## Literals');
                    en.literals.forEach((lit: any) => {
                        const litName = lit.name || lit;
                        enumParts.push(`- \`${litName}\``);
                    });
                }

                if (enumParts.length > 2) {
                    documents.push({
                        id: `enum_${projectId}_${en.id || enumName}`,
                        title: `Enumeration: ${enumName}`,
                        content: enumParts.join('\n'),
                        source: 'metamodel' as DocumentSource,
                        metadata: {
                            projectId,
                            elementType: 'enumeration',
                            elementId: en.id,
                            tags: ['enumeration', enumName.toLowerCase()],
                        },
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
            });
        }

        return documents;
    }

    /**
     * Helper: Get type name from attribute
     */
    private getTypeName(attr: any): string {
        try {
            if (attr.type?.name) return attr.type.name;
            if (typeof attr.type === 'string') return attr.type;
            if (attr.primitiveType) return attr.primitiveType;
            return 'String';
        } catch {
            return 'String';
        }
    }

    /**
     * Helper: Get target name from reference
     */
    private getTargetName(ref: any): string {
        try {
            if (ref.type?.name) return ref.type.name;
            if (ref.target?.name) return ref.target.name;
            if (typeof ref.type === 'string') return ref.type;
            return 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    /**
     * Index a project's content
     */
    async indexProject(project: LProject): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        const projectId = project.id || 'unknown';
        const projectHash = this.calculateProjectHash(project);

        // Check if already indexed with same hash
        const existingInfo = this.indexedProjects.get(projectId);
        if (existingInfo && existingInfo.projectHash === projectHash) {
            console.log('[JjodieRagService] Project already indexed, skipping');
            return;
        }

        try {
            const indexer = getIndexer();

            // Remove old documents for this project if re-indexing
            if (existingInfo) {
                console.log('[JjodieRagService] Re-indexing project, removing old documents');
                // Note: We'd need to track document IDs to remove them
                // For now, the new documents will have same IDs and overwrite
            }

            // Convert project to documents
            const documents = this.projectToDocuments(project);

            console.log(`[JjodieRagService] Indexing ${documents.length} documents for project ${projectId}`);

            // Index each document
            for (const doc of documents) {
                await indexer.indexDocument(doc);
            }

            // Store indexing info
            this.indexedProjects.set(projectId, {
                projectId,
                projectHash,
                indexedAt: Date.now(),
                documentCount: documents.length,
            });

            this.currentProjectId = projectId;

            console.log(`[JjodieRagService] Project indexed successfully`);
        } catch (error) {
            console.error('[JjodieRagService] Failed to index project:', error);
        }
    }

    /**
     * Get augmented context for a user query
     */
    async getAugmentedContext(query: string, projectId?: string): Promise<string | null> {
        if (!this.initialized) {
            return null;
        }

        try {
            const retriever = getRetriever();

            const result = await retriever.searchForContext(query, 1500);

            if (!result.success || !result.data) {
                return null;
            }

            // Only return if we found relevant content
            if (result.data.trim().length > 0) {
                return result.data;
            }

            return null;
        } catch (error) {
            console.error('[JjodieRagService] Failed to get augmented context:', error);
            return null;
        }
    }

    /**
     * Search for relevant chunks directly
     */
    async search(query: string, topK: number = 5): Promise<RagContext | null> {
        if (!this.initialized) {
            return null;
        }

        try {
            const retriever = getRetriever();

            const result = await retriever.search({
                text: query,
                topK,
                minScore: 0.3,
                projectId: this.currentProjectId || undefined,
            });

            if (!result.success || result.data.results.length === 0) {
                return null;
            }

            const avgScore = result.data.results.reduce((sum, r) => sum + r.score, 0) / result.data.results.length;

            return {
                relevantChunks: result.data.results.map(r => r.chunk.content),
                searchScore: avgScore,
                source: 'rag',
            };
        } catch (error) {
            console.error('[JjodieRagService] Search failed:', error);
            return null;
        }
    }

    /**
     * Get index statistics
     */
    getStats(): IndexStats | null {
        if (!this.initialized) {
            return null;
        }

        try {
            const vectorStore = getVectorStore();
            return vectorStore.getStats();
        } catch {
            return null;
        }
    }

    /**
     * Check if project is indexed
     */
    isProjectIndexed(projectId: string): boolean {
        return this.indexedProjects.has(projectId);
    }

    /**
     * Get indexed project info
     */
    getIndexedProjectInfo(projectId: string): IndexedProjectInfo | null {
        return this.indexedProjects.get(projectId) || null;
    }

    /**
     * Index JjScript command documentation
     */
    async indexJjScriptDocumentation(): Promise<void> {
        if (this.jjscriptIndexed) return;

        try {
            const indexer = getIndexer();
            const documents = this.generateJjScriptDocuments();

            console.log(`[JjodieRagService] Indexing ${documents.length} JjScript documentation documents`);

            for (const doc of documents) {
                await indexer.indexDocument(doc);
            }

            this.jjscriptIndexed = true;
            console.log('[JjodieRagService] JjScript documentation indexed successfully');
        } catch (error) {
            console.error('[JjodieRagService] Failed to index JjScript documentation:', error);
        }
    }

    /**
     * Generate JjScript documentation as knowledge documents
     */
    private generateJjScriptDocuments(): KnowledgeDocument[] {
        const documents: KnowledgeDocument[] = [];
        const timestamp = Date.now();

        // 1. General Overview
        documents.push({
            id: 'jjscript_overview',
            title: 'JjScript Overview',
            content: `# JjScript - Jjodel Scripting Language

JjScript allows you to manipulate metamodels using simple text commands in Jjodie chat.

## Available Commands

- **create** - Create a new element (class, attribute, reference, enum, etc.)
- **delete** - Delete an element
- **rename** - Rename an element
- **set** - Set a property value
- **add** - Add element to a container
- **remove** - Remove element from container
- **move** - Move element to different location
- **copy** - Copy an element
- **list** - List elements
- **show** - Show element details
- **help** - Show help information
- **undo** - Undo last action
- **redo** - Redo undone action
- **validate** - Validate the model
- **clear** - Clear history or console

## Element Types

JjScript supports these element types:
- class, abstract class, interface
- attribute
- reference
- operation, parameter
- package
- enum, literal

## Quick Examples

\`\`\`
create class Person
create attribute name in Person type String
create reference friends in Person type Person [0..*]
set Person.abstract = true
rename Person to Human
delete Human cascade
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'documentation',
                tags: ['jjscript', 'overview', 'commands', 'help'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 2. CREATE Command
        documents.push({
            id: 'jjscript_create',
            title: 'JjScript CREATE Command',
            content: `# CREATE Command

Creates a new model element in JjScript.

## Syntax

\`\`\`
create <type> <name> [in <parent>] [options]
\`\`\`

## Supported Types

- class, abstract class, interface
- attribute
- reference
- operation, parameter
- package
- enum, literal

## Options for Classes

- \`abstract\` - Make class abstract
- \`extends <class>\` - Set superclass

## Options for Attributes

- \`type <type>\` - Set attribute type (String, Integer, Boolean, Float, Date)
- \`[lower..upper]\` - Set multiplicity (e.g., [0..*], [1], [0..1])
- \`default <value>\` - Set default value
- \`derived\` - Mark as derived
- \`readonly\` - Mark as read-only

## Options for References

- \`type <class>\` - Set target class type
- \`[multiplicity]\` - Set multiplicity
- \`containment\` - Mark as containment (composition)
- \`opposite <ref>\` - Set opposite reference for bidirectional

## Examples

\`\`\`
create class Person
create abstract class Entity
create class Employee extends Person
create attribute name in Person type String
create attribute age in Person type Integer default 0
create attribute email in Person type String [0..1]
create reference children in Person type Person [0..*] containment
create reference spouse in Person type Person [0..1] opposite spouse
create enum Status
create literal ACTIVE in Status value 1
create package domain
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'create', 'command', 'class', 'attribute', 'reference'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 3. DELETE Command
        documents.push({
            id: 'jjscript_delete',
            title: 'JjScript DELETE Command',
            content: `# DELETE Command

Deletes a model element in JjScript.

## Syntax

\`\`\`
delete <target> [cascade] [force]
\`\`\`

## Options

- \`cascade\` - Also delete all contained elements
- \`force\` - Delete even if element is referenced elsewhere

## Examples

\`\`\`
delete Person
delete Person cascade
delete MyPackage::OldClass force
delete name
\`\`\`

## Notes

- Without cascade, contained elements are orphaned
- Force option ignores reference constraints
- Use with caution as delete cannot be undone easily`,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'delete', 'command', 'remove'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 4. RENAME Command
        documents.push({
            id: 'jjscript_rename',
            title: 'JjScript RENAME Command',
            content: `# RENAME Command

Renames a model element in JjScript.

## Syntax

\`\`\`
rename <target> to <newname>
rename <target> as <newname>
\`\`\`

## Examples

\`\`\`
rename Person to Human
rename MyClass.oldAttr to newAttr
rename OldPackage to NewPackage
\`\`\`

## Notes

- Both "to" and "as" keywords work the same
- Can rename classes, attributes, references, packages, enums`,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'rename', 'command', 'name'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 5. SET Command
        documents.push({
            id: 'jjscript_set',
            title: 'JjScript SET Command',
            content: `# SET Command

Sets a property value on a model element in JjScript.

## Syntax

\`\`\`
set <target>.<property> = <value>
set <target>.<property> to <value>
set <target> <property> += <value>   (append to collection)
set <target> <property> -= <value>   (remove from collection)
\`\`\`

## Common Properties

### Classes
- abstract (boolean)
- interface (boolean)
- superTypes (collection)

### Attributes
- type (String, Integer, Boolean, etc.)
- lowerBound (number)
- upperBound (number, -1 for unlimited)
- derived (boolean)
- changeable (boolean)
- defaultValueLiteral (string)

### References
- type (target class)
- containment (boolean)
- opposite (reference name)
- lowerBound (number)
- upperBound (number)

### Packages
- uri (string)
- prefix (string)

## Examples

\`\`\`
set Person.abstract = true
set Person.name type = String
set Person.superTypes += Animal
set Person.superTypes -= OldParent
set MyPackage.uri = "http://example.org"
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'set', 'command', 'property', 'modify'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 6. ADD Command
        documents.push({
            id: 'jjscript_add',
            title: 'JjScript ADD Command',
            content: `# ADD Command

Adds a new element to a container (similar to create with explicit parent).

## Syntax

\`\`\`
add <type> <name> to <parent> [options]
\`\`\`

## Examples

\`\`\`
add attribute email to Person type String
add reference manager to Employee type Employee [0..1]
add class Customer to MyPackage
\`\`\`

## Notes

- Equivalent to "create <type> <name> in <parent>"
- More explicit about the parent container`,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'add', 'command', 'container'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 7. LIST Command
        documents.push({
            id: 'jjscript_list',
            title: 'JjScript LIST Command',
            content: `# LIST Command

Lists model elements with optional filtering.

## Syntax

\`\`\`
list [type] [in <scope>]
\`\`\`

## Types

- all (default)
- class
- attribute
- reference
- operation
- package
- enum
- literal

## Examples

\`\`\`
list                     - List all elements
list class               - List all classes
list attribute           - List all attributes
list attribute in Person - List attributes in Person class
list reference in Person - List references in Person class
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'list', 'command', 'query', 'find'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 8. SHOW Command
        documents.push({
            id: 'jjscript_show',
            title: 'JjScript SHOW Command',
            content: `# SHOW Command

Shows detailed information about an element.

## Syntax

\`\`\`
show <target> [brief|full|tree]
show project
show model
\`\`\`

## Detail Levels

- \`brief\` - Show minimal info
- \`full\` - Show all properties (default)
- \`tree\` - Show hierarchical structure

## Examples

\`\`\`
show Person
show Person tree
show Person full
show Person brief
show project
show model
show MyPackage tree
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'command',
                tags: ['jjscript', 'show', 'command', 'display', 'info'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 9. Syntax Reference
        documents.push({
            id: 'jjscript_syntax',
            title: 'JjScript Syntax Reference',
            content: `# JjScript Syntax Reference

## Qualified Names

- Simple: \`ClassName\`, \`attributeName\`
- Qualified: \`Package::ClassName\`
- Member: \`ClassName.attributeName\`
- Full: \`Package::Class.attribute\`

## Data Types

### Primitive Types
- String
- Integer
- Boolean
- Float
- Date

### Class Types
- MyClass
- Package::MyClass
- Collection: List<String>, Set<MyClass>

## Multiplicity

- \`[1]\` - Exactly one (required)
- \`[0..1]\` - Optional (zero or one)
- \`[1..*]\` - One or more
- \`[0..*]\` - Zero or more (same as [*])
- \`[*]\` - Many

## Values

- String: \`"hello"\`, \`'world'\`
- Number: \`42\`, \`3.14\`, \`-5\`
- Boolean: \`true\`, \`false\`
- Null: \`null\`
- Enum: \`Status::ACTIVE\`, \`Status.ACTIVE\`

## Operators

- \`=\` - Assignment
- \`+=\` - Add to collection
- \`-=\` - Remove from collection

## Comments

\`\`\`
// Single line comment
/* Multi-line
   comment */
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'documentation',
                tags: ['jjscript', 'syntax', 'types', 'multiplicity', 'reference'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 10. Examples
        documents.push({
            id: 'jjscript_examples',
            title: 'JjScript Examples',
            content: `# JjScript Examples

## Creating a Library Metamodel

\`\`\`
create package library
create class Book in library
create attribute title in Book type String
create attribute isbn in Book type String
create attribute year in Book type Integer

create class Author in library
create attribute name in Author type String

create reference authors in Book type Author [1..*]
create reference books in Author type Book [0..*] opposite authors
\`\`\`

## Creating an Enumeration

\`\`\`
create enum BookStatus
create literal AVAILABLE in BookStatus value 0
create literal BORROWED in BookStatus value 1
create literal RESERVED in BookStatus value 2

create attribute status in Book type BookStatus default AVAILABLE
\`\`\`

## Using Inheritance

\`\`\`
create abstract class NamedElement
create attribute name in NamedElement type String

create class Person extends NamedElement
create class Organization extends NamedElement
\`\`\`

## Modifying Elements

\`\`\`
set Book.abstract = true
rename Author to Writer
move Book to newPackage
delete isbn
\`\`\`

## Exploring the Model

\`\`\`
list class
list attribute in Book
show Book full
show library tree
show project
\`\`\`

## Creating Multiple Attributes

\`\`\`
create attribute firstName in Person type String
create attribute lastName in Person type String
create attribute email in Person type String
create attribute age in Person type Integer [0..1]
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'documentation',
                tags: ['jjscript', 'examples', 'tutorial', 'library', 'inheritance'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 11. Element Types Reference
        documents.push({
            id: 'jjscript_elements',
            title: 'JjScript Element Types',
            content: `# JjScript Element Types

## Class

A class represents a concept in your metamodel.

**Properties:**
- name - Class name (PascalCase recommended)
- abstract - Whether the class is abstract
- interface - Whether this is an interface
- superTypes - Parent classes/interfaces
- attributes - Owned attributes
- references - Owned references
- operations - Owned operations

**Examples:**
\`\`\`
create class Person
create abstract class Entity
create interface Named
create class Employee extends Person
\`\`\`

## Attribute

An attribute represents a property of a class.

**Properties:**
- name - Attribute name (camelCase recommended)
- type - Data type (String, Integer, Boolean, etc.)
- lowerBound - Minimum cardinality (default: 0)
- upperBound - Maximum cardinality (-1 for unlimited)
- derived - Whether value is computed
- changeable - Whether value can be modified
- defaultValueLiteral - Default value

**Examples:**
\`\`\`
create attribute name in Person type String
create attribute age in Person type Integer [0..1]
create attribute id in Entity type String derived
\`\`\`

## Reference

A reference represents a relationship between classes.

**Properties:**
- name - Reference name (camelCase recommended)
- type - Target class type
- lowerBound - Minimum cardinality
- upperBound - Maximum cardinality
- containment - Whether this is a composition (ownership)
- opposite - Bidirectional reference partner

**Examples:**
\`\`\`
create reference parent in Person type Person [0..1]
create reference children in Person type Person [0..*] containment
create reference spouse in Person type Person [0..1] opposite spouse
\`\`\`

## Enumeration

An enumeration defines a set of named constants.

**Properties:**
- name - Enum name (PascalCase recommended)
- literals - Enum values

**Examples:**
\`\`\`
create enum Status
create literal ACTIVE in Status value 0
create literal INACTIVE in Status value 1
\`\`\`

## Package

A package organizes model elements.

**Properties:**
- name - Package name
- uri - Namespace URI
- prefix - Namespace prefix
- classifiers - Contained classes and enums
- subPackages - Nested packages

**Examples:**
\`\`\`
create package domain
create package entities in domain nsUri "http://example.org/entities"
\`\`\``,
            source: 'jjscript' as DocumentSource,
            metadata: {
                elementType: 'documentation',
                tags: ['jjscript', 'elements', 'class', 'attribute', 'reference', 'enum', 'package'],
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        return documents;
    }

    /**
     * Clear all indexed data
     */
    async clearIndex(): Promise<void> {
        if (!this.initialized) return;

        try {
            const vectorStore = getVectorStore();
            await vectorStore.clear();
            this.indexedProjects.clear();
            this.currentProjectId = null;
            this.jjscriptIndexed = false;
            console.log('[JjodieRagService] Index cleared');
        } catch (error) {
            console.error('[JjodieRagService] Failed to clear index:', error);
        }
    }
}

// Singleton instance
export const JjodieRagService = new JjodieRagServiceClass();

export default JjodieRagService;
