# Agentic Conversational Development (ACD)

> A software development methodology where humans collaborate with AI agents through continuous, iterative dialogue to design, implement, and refine software systems.

**Document Version:** 1.0
**Last Updated:** January 24, 2026
**Project:** Jjodel Redux

---

## Table of Contents

1. [Definition](#definition)
2. [Core Principles](#core-principles)
3. [How It Differs From Other Approaches](#how-it-differs-from-other-approaches)
4. [The ACD Workflow](#the-acd-workflow)
5. [Roles and Responsibilities](#roles-and-responsibilities)
6. [Communication Patterns](#communication-patterns)
7. [Multi-Session Continuity](#multi-session-continuity)
8. [Artifacts and Documentation](#artifacts-and-documentation)
9. [When ACD Works Best](#when-acd-works-best)
10. [Limitations and Challenges](#limitations-and-challenges)
11. [Tools and Infrastructure](#tools-and-infrastructure)
12. [Case Study: Jjodel UI Redesign](#case-study-jjodel-ui-redesign)
13. [Best Practices](#best-practices)
14. [Glossary](#glossary)

---

## Definition

**Agentic Conversational Development (ACD)** is a software development methodology characterized by:

1. **Agentic**: AI participants are not passive tools but active agents with reasoning capabilities, able to propose solutions, ask clarifying questions, make architectural decisions within constraints, and execute complex multi-step tasks.

2. **Conversational**: Development happens through natural language dialogue—iterative, bidirectional, and context-aware. The conversation is the primary interface for requirements, implementation, review, and refinement.

3. **Development**: The outcome is production-quality software, not just prototypes or suggestions. Code is written, tested, documented, and integrated into the codebase.

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Medium** | Natural language conversation (text, sometimes with images/screenshots) |
| **Participants** | Human developer(s) + one or more AI agents |
| **Artifacts** | Working code, documentation, tests, design systems |
| **Iteration** | Rapid cycles of request → implementation → feedback → refinement |
| **Continuity** | Sessions can span days/weeks with maintained context via documentation |
| **Constraints** | Design systems, coding standards, and architectural guidelines as guardrails |

---

## Core Principles

### 1. Conversation as Interface

The conversation IS the development environment. Requirements, code reviews, debugging, and documentation all happen through dialogue.

```
Human: "The buttons in the Properties Panel should be outline-style, not filled"
Agent: [reads code, understands context, implements fix, explains changes]
Human: [provides screenshot] "This still doesn't look right"
Agent: [analyzes screenshot, identifies issue, proposes solution]
```

### 2. Agent Autonomy Within Constraints

AI agents operate with significant autonomy but within defined boundaries:

- **Design System**: Colors, typography, spacing, component patterns
- **Coding Standards**: TypeScript strict mode, naming conventions, file structure
- **Architectural Rules**: No new dependencies without approval, specific patterns for forms/state/etc.

The agent can make decisions within these constraints without asking for permission on every detail.

### 3. Iterative Refinement

Development proceeds through rapid cycles:

```
Request → Implementation → Review → Feedback → Refinement → ...
```

Each cycle can be as short as a single message exchange or as long as needed for complex features.

### 4. Explicit Context Management

Context is precious and must be managed explicitly:

- **Session summaries** capture decisions and progress
- **Handover documents** enable continuity across sessions
- **Design documents** (like CLAUDE.md) provide persistent context
- **Code comments** explain non-obvious decisions

### 5. Human-in-the-Loop

The human remains the decision-maker for:

- Architectural choices
- UX/UI decisions that require visual judgment
- Prioritization and scope
- Approval of significant changes

The agent proposes, implements, and explains—the human approves, redirects, or refines.

---

## How It Differs From Other Approaches

### vs. Vibe Coding

| Aspect | Vibe Coding | ACD |
|--------|-------------|-----|
| **Structure** | Minimal, "just describe what you want" | Constrained by design systems and standards |
| **Continuity** | Usually single-session | Multi-session with explicit handover |
| **Quality** | Variable, often needs cleanup | Production-ready with review cycles |
| **Documentation** | Often skipped | Integral part of the process |
| **Agent role** | Code generator | Active collaborator with agency |

### vs. Traditional Pair Programming

| Aspect | Pair Programming | ACD |
|--------|------------------|-----|
| **Participants** | Two humans | Human + AI agent(s) |
| **Communication** | Verbal + screen sharing | Text + screenshots + code |
| **Speed** | Limited by typing/thinking | Agent can implement while human reviews |
| **Availability** | Requires scheduling | On-demand, asynchronous possible |
| **Knowledge** | Combined human knowledge | Human knowledge + AI training data |

### vs. Code Generation Tools (Copilot-style)

| Aspect | Code Generation | ACD |
|--------|-----------------|-----|
| **Scope** | Line/function completion | Full features, architecture, documentation |
| **Context** | Current file + nearby files | Entire codebase + design system + conversation history |
| **Interaction** | Tab to accept | Full dialogue with reasoning |
| **Agency** | Reactive (suggests on prompt) | Proactive (asks questions, proposes alternatives) |

### vs. No-Code/Low-Code

| Aspect | No-Code | ACD |
|--------|---------|-----|
| **Flexibility** | Limited to platform capabilities | Full programming language capabilities |
| **Customization** | Within platform constraints | Unlimited |
| **Output** | Platform-specific | Standard code (React, TypeScript, etc.) |
| **Ownership** | Platform dependency | Full code ownership |

---

## The ACD Workflow

### Phase 1: Context Establishment

Before implementation begins, establish shared context:

1. **Design System Review**: Agent reads CLAUDE.md or equivalent
2. **Codebase Exploration**: Agent explores relevant files and patterns
3. **Requirements Clarification**: Dialogue to understand the goal
4. **Constraint Confirmation**: Explicit agreement on what's in/out of scope

```
Human: "I want to improve the Console tab empty state"
Agent: [reads current implementation, checks design system]
Agent: "I see the current empty state is basic. Based on CLAUDE.md,
        I should use Bootstrap Icons, slate+cyan colors, and follow
        the empty state pattern. Should I add interactive elements
        like quick-start examples?"
Human: "Yes, add clickable examples that execute common commands"
```

### Phase 2: Implementation

The agent implements the solution:

1. **Plan**: Outline approach (for complex changes)
2. **Implement**: Write code following established patterns
3. **Explain**: Describe what was done and why
4. **Highlight**: Point out decisions that might need review

```
Agent: "I've updated ConsoleHistory.tsx with:
        1. New `onExecuteCode` prop for executing examples
        2. Four quick-start buttons (data, data.classes, node, /help)
        3. Keyboard shortcuts section

        Note: This requires CSS for the new `.console-empty__*` classes.
        Should I create those styles now?"
```

### Phase 3: Review and Feedback

Human reviews and provides feedback:

- **Visual review**: Screenshots, browser testing
- **Code review**: Check implementation details
- **Functional review**: Test the feature works
- **Feedback**: Specific, actionable guidance

```
Human: [screenshot] "The buttons are too large and the spacing is off"
Agent: [analyzes screenshot, adjusts CSS]
Agent: "I've reduced button padding from 12px to 8px and gap from 16px to 12px"
```

### Phase 4: Refinement

Iterate until satisfied:

- Multiple small adjustments
- Each cycle improves the solution
- Agent learns preferences through feedback

### Phase 5: Documentation

Capture the work for future reference:

- **Handover document**: What was done, files changed, decisions made
- **Code comments**: Non-obvious implementation details
- **Changelog**: User-facing summary of changes

---

## Roles and Responsibilities

### Human Developer

| Responsibility | Description |
|----------------|-------------|
| **Vision** | Define what success looks like |
| **Priorities** | Decide what to work on and in what order |
| **Review** | Validate implementations meet requirements |
| **Decisions** | Make final calls on design/architecture |
| **Feedback** | Provide clear, actionable guidance |
| **Approval** | Authorize commits, merges, deployments |

### AI Agent

| Responsibility | Description |
|----------------|-------------|
| **Understanding** | Comprehend requirements and context |
| **Exploration** | Search codebase for patterns and context |
| **Implementation** | Write production-quality code |
| **Explanation** | Describe what was done and why |
| **Proposals** | Suggest alternatives when appropriate |
| **Questions** | Ask for clarification when needed |
| **Documentation** | Create handover docs and update changelogs |

### Shared Responsibilities

- **Quality**: Both parties care about the end result
- **Communication**: Clear, specific, actionable
- **Learning**: Human learns agent capabilities; agent learns human preferences

---

## Communication Patterns

### Effective Request Patterns

**Specific over vague:**
```
// ❌ Vague
"Make the buttons better"

// ✅ Specific
"Change the buttons from filled style to outline style
 (transparent background with border)"
```

**Context-rich:**
```
// ❌ Missing context
"Fix the export bug"

// ✅ With context
"The NodeEditor component isn't exporting correctly.
 Dock.tsx imports it as a named export but it's only
 a default export. Error: 'does not provide an export
 named NodeEditor'"
```

**Outcome-focused:**
```
// ❌ Implementation-focused
"Add a useState hook for tracking collapsed state"

// ✅ Outcome-focused
"The sections should be collapsible - users should be
 able to click the header to expand/collapse content"
```

### Effective Feedback Patterns

**Visual feedback:**
```
Human: [screenshot] "See how the inputs are too wide here"
```

**Comparative feedback:**
```
Human: "The font should match the Anchors section -
        13px, normal weight, not bold"
```

**Prioritized feedback:**
```
Human: "Main issue: buttons are filled, should be outline.
        Minor: spacing could be tighter but not critical."
```

### Agent Response Patterns

**Acknowledge + Plan + Execute:**
```
Agent: "I understand - you want outline-style buttons.
        I'll:
        1. Update Button.module.css to use transparent backgrounds
        2. Change border to 1.5px solid with color matching text
        3. Update hover states to use light background tint

        Let me make these changes..."
```

**Highlight decisions:**
```
Agent: "I chose 'secondary' variant for the Edit button
        (slate border) and 'danger' for Delete (red border).
        Let me know if you'd prefer different variants."
```

**Ask when uncertain:**
```
Agent: "Should the quick-start examples execute immediately
        when clicked, or populate the input field for the
        user to review first?"
```

---

## Multi-Session Continuity

### The Challenge

AI agents don't have persistent memory across sessions. Each new conversation starts fresh.

### The Solution: Handover Documentation

Create explicit documentation that captures:

1. **What was done**: Summary of changes
2. **Why**: Decisions and rationale
3. **How**: Technical implementation details
4. **Files changed**: Inventory of modifications
5. **What's next**: Pending tasks, known issues

### Handover Document Template

```markdown
# Session Handover - [Date]

## Summary
Brief description of what was accomplished.

## Changes Made
### Feature/Fix 1
- Files: list of files
- Description: what was done
- Decisions: why certain choices were made

### Feature/Fix 2
...

## Files Inventory
- `/path/to/file.tsx` - Description of changes
- `/path/to/style.scss` - Description of changes

## Pending Tasks
- [ ] Task 1
- [ ] Task 2

## Notes for Next Session
- Important context
- Unresolved questions
- Dependencies
```

### Session Summary (for context window management)

When a session runs long, create a summary:

```markdown
## Session Summary

### Completed
1. Created UI component library (10 components)
2. Fixed button styles in Properties Panel
3. Updated NodeEditor export

### In Progress
- Console empty state enhancement (needs CSS)

### Key Decisions
- All buttons must be outline-style (transparent + border)
- Using CSS Modules for component styling
- Design tokens in /styles/tokens.css

### Files Modified
- Info.tsx, NodeEditor.tsx, ConsoleHistory.tsx
- node-editor-redesign.scss
- Created 37 new files in /components/ui/
```

---

## Artifacts and Documentation

### Required Artifacts

| Artifact | Purpose | When to Create |
|----------|---------|----------------|
| **Handover Doc** | Session continuity | End of each significant session |
| **Changelog** | Track changes over time | After each release/milestone |
| **Design System** | Persistent constraints | Once, updated as needed |
| **Implementation Log** | Technical details | During implementation |

### Optional Artifacts

| Artifact | Purpose | When to Create |
|----------|---------|----------------|
| **Architecture Decision Records** | Capture significant decisions | For major architectural choices |
| **Component Documentation** | Usage examples | For reusable components |
| **Testing Checklist** | Ensure quality | For complex features |

### Documentation Hierarchy

```
/docs/
├── CLAUDE.md                    # Design system (primary)
├── AGENTIC-CONVERSATIONAL-DEVELOPMENT.md  # This document
├── CHANGELOG.md                 # Version history
├── DEVELOPER_GUIDE.md           # Human developer guide
├── handover/
│   ├── HANDOVER-2026-01-22.md   # Session handover
│   └── HANDOVER-2026-01-24.md   # Session handover
└── redesign/
    ├── implementation-log.md    # Technical details
    └── ...
```

---

## When ACD Works Best

### Ideal Scenarios

1. **UI/UX Development**
   - Visual feedback through screenshots
   - Iterative refinement based on appearance
   - Design system as constraint

2. **Refactoring**
   - Agent can understand patterns across codebase
   - Systematic changes with human oversight
   - Low risk of breaking changes with review

3. **Documentation**
   - Agent excels at synthesizing and organizing
   - Human provides accuracy check
   - Iterative improvement of clarity

4. **Feature Implementation**
   - Clear requirements
   - Existing patterns to follow
   - Well-defined constraints

5. **Bug Fixing**
   - Agent can search and analyze
   - Human provides context on expected behavior
   - Quick iteration to solution

### Less Ideal Scenarios

1. **Greenfield Architecture**
   - Too many decisions without constraints
   - Better to establish patterns first

2. **Performance Optimization**
   - Requires profiling and measurement
   - Agent can't run and measure code

3. **Security-Critical Code**
   - Needs specialized review
   - Human expertise essential

4. **Novel Algorithms**
   - Agent knowledge may be outdated
   - Requires deep domain expertise

---

## Limitations and Challenges

### Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Context window** | Can't process entire large codebases at once | Focus on relevant files, use summaries |
| **No execution** | Agent can't run code to verify | Human testing, clear error messages |
| **No visual perception** | Can't see rendered output directly | Screenshots with descriptions |
| **Knowledge cutoff** | May not know latest APIs/patterns | Human provides updates, documentation |

### Process Challenges

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| **Session discontinuity** | Loss of context between sessions | Handover documentation |
| **Ambiguous requirements** | Misaligned implementations | Clarifying questions, examples |
| **Over-reliance** | Human skills may atrophy | Stay engaged in review, understand code |
| **Quality variance** | Output quality can vary | Consistent constraints, thorough review |

### Communication Challenges

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| **Imprecise feedback** | Multiple iterations needed | Be specific, use screenshots |
| **Assumed context** | Agent may misunderstand | Explicit context, check understanding |
| **Scope creep** | Conversations drift | Clear task boundaries |

---

## Tools and Infrastructure

### Essential Tools

| Tool | Purpose |
|------|---------|
| **AI Agent Interface** | Claude Code, Cursor, similar |
| **Version Control** | Git for tracking changes |
| **Code Editor** | IDE with agent integration |
| **Screenshot Tool** | For visual feedback |
| **Documentation** | Markdown files in repo |

### Helpful Additions

| Tool | Purpose |
|------|---------|
| **Design System Doc** | CLAUDE.md or similar |
| **Linter/Formatter** | Automatic code style |
| **Type Checker** | Catch errors early |
| **Component Library** | Reusable patterns |

### Infrastructure

```
Repository Structure:
├── /docs/                    # Documentation
│   ├── CLAUDE.md            # Design system
│   ├── handover/            # Session handovers
│   └── ...
├── /src/                     # Source code
│   ├── components/
│   │   └── ui/              # Component library
│   └── ...
├── .claude/                  # Agent-specific config (if any)
└── README.md
```

---

## Case Study: Jjodel UI Redesign

### Project Overview

**Goal**: Modernize the Jjodel metamodeling tool UI/UX
**Duration**: January 21-24, 2026 (ongoing)
**Methodology**: Agentic Conversational Development

### Approach

1. **Design System First**: Created CLAUDE.md with colors, typography, spacing, component patterns
2. **Iterative Implementation**: Feature by feature with visual review
3. **Handover Documentation**: Daily summaries for continuity
4. **Component Library**: Built reusable UI components as foundation

### Results (as of January 24, 2026)

| Metric | Value |
|--------|-------|
| **Sessions** | 4 major sessions |
| **Features Implemented** | 28+ UI improvements |
| **Components Created** | 10 production-ready |
| **Files Created/Modified** | 80+ |
| **Documentation Pages** | 6 handover docs |

### Key Learnings

1. **Design systems are essential**: CLAUDE.md prevented endless style debates
2. **Visual feedback accelerates iteration**: Screenshots > descriptions
3. **Handover docs enable continuity**: Each session built on previous
4. **Constraints enable autonomy**: Clear rules let agent work independently
5. **Incremental > big bang**: Small, reviewable changes compound

### Example Conversation Flow

```
Session Start:
Human: [provides context] "Continue from yesterday's session.
        Focus on Properties Panel buttons."
Agent: [reads handover doc, understands context]

Implementation:
Agent: "I see the buttons use filled backgrounds. Per CLAUDE.md,
        they should be outline-style. I'll update Info.tsx."
[implements changes]

Review:
Human: [screenshot] "Better, but they're taking full width"
Agent: "I'll remove the fullWidth prop and let them auto-size"
[fixes issue]

Completion:
Human: "Good. Update the documentation with today's changes."
Agent: [creates handover doc, updates changelog]
```

---

## Best Practices

### For Humans

1. **Be specific**: "Change X to Y" beats "make it better"
2. **Provide context**: Share relevant files, error messages, screenshots
3. **Review thoroughly**: Don't assume agent output is correct
4. **Establish constraints early**: Design systems prevent debates
5. **Document decisions**: Future sessions will thank you
6. **Stay engaged**: Understand what the agent produces

### For Working with Agents

1. **Start with exploration**: Let agent understand codebase first
2. **Confirm understanding**: "Before you implement, tell me your plan"
3. **Iterate in small steps**: Easier to review and correct
4. **Use screenshots liberally**: Visual feedback is unambiguous
5. **Capture decisions**: Ask agent to document non-obvious choices
6. **Create handovers**: Don't rely on memory

### For Multi-Session Projects

1. **End sessions with summaries**: Capture state before closing
2. **Start sessions with context**: Reference previous handovers
3. **Maintain design docs**: Single source of truth for constraints
4. **Track files modified**: Know what changed when
5. **Version documentation**: Keep history of decisions

---

## Glossary

| Term | Definition |
|------|------------|
| **Agent** | AI system capable of autonomous reasoning and action within constraints |
| **Agentic** | Characterized by agency—ability to make decisions and take actions |
| **Conversational** | Through natural language dialogue, iterative and bidirectional |
| **Handover Document** | Documentation enabling continuity between sessions |
| **Design System** | Codified visual and interaction standards (colors, typography, patterns) |
| **Context Window** | Amount of text an AI can process in one interaction |
| **Constraint** | Rule or boundary within which agent operates |
| **Session** | One continuous conversation with an AI agent |
| **Iteration** | One cycle of request → implementation → feedback |

---

## Conclusion

Agentic Conversational Development represents a new paradigm in software development—one where AI agents are genuine collaborators rather than passive tools. By combining the reasoning capabilities of AI with human judgment and creativity, ACD enables rapid, high-quality software development while maintaining human oversight and control.

The key to success is structure: design systems provide constraints, handover documents provide continuity, and clear communication patterns enable effective collaboration.

As AI capabilities continue to evolve, ACD practices will evolve with them. This document represents our current understanding as of January 2026—a snapshot in a rapidly changing landscape.

---

**Document Author**: Alfonso (human) + Claude (AI agent)
**Methodology**: This document was itself created using Agentic Conversational Development
