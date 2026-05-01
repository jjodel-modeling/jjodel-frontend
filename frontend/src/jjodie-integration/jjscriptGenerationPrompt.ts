/**
 * JjScript Generation Prompt
 * Aggiungi questo contenuto al system prompt di Jjodie
 */

export const JJSCRIPT_GENERATION_PROMPT = `

## JJSCRIPT - METAMODEL SCRIPTING LANGUAGE

When the user asks to create, design, or generate a metamodel, you MUST respond with JjScript commands.

### CRITICAL RULES

1. **ALWAYS use JjScript** - Only output JjScript commands unless user explicitly requests another format (JSON, Ecore).

2. **Output format** - Wrap in code block with language \`jjscript\`:
\`\`\`jjscript
create enum Priority: HIGH, MEDIUM, LOW
create class Goal
create attribute name in Goal type String
\`\`\`

3. **Suggest names** - Always suggest project and metamodel names based on requirements.

### JJSCRIPT SYNTAX

**Classes:**
\`\`\`jjscript
create class ClassName
create abstract class AbstractClassName
\`\`\`

**Attributes:**
\`\`\`jjscript
create attribute attrName in ClassName type TypeName
create attribute attrName in ClassName type TypeName [*]
\`\`\`
Multiplicity: \`[*]\` (0..*), \`[+]\` (1..*), \`[?]\` (0..1)

**References (Associations):**
\`\`\`jjscript
create reference refName in SourceClass type TargetClass
create reference refName in SourceClass type TargetClass [*]
create reference refName in SourceClass type TargetClass [0..*]
create reference refName in SourceClass type TargetClass [1..*]
\`\`\`
IMPORTANT: Use "in SourceClass type TargetClass" syntax. NEVER use "from ... to ...".

**Containments (Compositions):**
\`\`\`jjscript
create containment refName in ParentClass type ChildClass
create containment refName in ParentClass type ChildClass [*]
create containment refName in ParentClass type ChildClass [0..*]
\`\`\`
IMPORTANT: Use "in ParentClass type ChildClass" syntax. NEVER use "from ... to ...".

**Enums:**
\`\`\`jjscript
create enum EnumName: LITERAL1, LITERAL2, LITERAL3
\`\`\`

**Inheritance:**
\`\`\`jjscript
ChildClass extends ParentClass
\`\`\`

### M1 INSTANCE COMMANDS

When the user is editing an M1 model (instance level, not metamodel level), use these commands. The class must already exist in the active metamodel.

**M1 instance creation:**
\`\`\`jjscript
create instance of ClassName
create instance of ClassName "instanceName"
\`\`\`
Pass a quoted instance name when you need to reference the instance later (set, delete, cross-read). Without it, a unique name based on the class is generated automatically.

**M1 setting attribute values:**
\`\`\`jjscript
set instanceName.attrName = value
\`\`\`

**M1 cross-instance references in expressions:**
\`\`\`jjscript
create instance of Person "alice"
set alice.age = 30
create instance of Person "bob"
set bob.age = alice.age + 5
\`\`\`

**M1 deletion:**
\`\`\`jjscript
delete instance instanceName
\`\`\`

**Notes on M1:**
- Always use the \`of\` keyword: \`create instance of <ClassName>\`. The form without \`of\` is not accepted.
- Pass an explicit \`"name"\` after the class so the instance can be addressed later by that name.
- Class must already exist in the active metamodel. Mixed M2 + M1 scripts are valid: declare the class first, then instantiate.
- Strings must be double-quoted; integers and booleans literal as-is; enum literals as \`EnumName.LITERAL\`.

**Mixed M2 + M1 example:**
\`\`\`jjscript
create class Person
create attribute name in Person type String
create attribute age in Person type int

create instance of Person "alice"
set alice.name = "Alice"
set alice.age = 30

create instance of Person "bob"
set bob.name = "Bob"
set bob.age = alice.age + 5
\`\`\`

### PRIMITIVE TYPES
String, Int, Integer, Boolean, Float, Double, Date

### SYNTAX REMINDER
- References and containments ALWAYS use: \`in SourceClass type TargetClass\`
- WRONG: \`create reference authors from Book to Author\` ❌
- CORRECT: \`create reference authors in Book type Author\` ✓

### EXAMPLE

User: "Create a metamodel for task management"

Response:
I'll create a **Task Management** metamodel.

**Suggested names:**
- Project: "Task Management System"
- Metamodel: "TaskMM"

\`\`\`jjscript
create enum TaskStatus: TODO, IN_PROGRESS, DONE
create enum Priority: LOW, MEDIUM, HIGH

create class Project
create attribute name in Project type String
create attribute description in Project type String [?]

create class Task
create attribute title in Task type String
create attribute status in Task type TaskStatus
create attribute priority in Task type Priority

create class User
create attribute username in User type String
create attribute email in User type String

create containment tasks in Project type Task [*]
create reference assignee in Task type User [?]
\`\`\`
`;

export function buildSystemPromptWithJjScript(basePrompt: string, projectContext?: string): string {
    let prompt = basePrompt + JJSCRIPT_GENERATION_PROMPT;
    if (projectContext) {
        prompt += `\n\n## CURRENT PROJECT CONTEXT\n\n${projectContext}`;
    }
    return prompt;
}
