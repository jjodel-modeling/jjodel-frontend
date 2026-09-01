/**
 * NAV1 — «Data manager» in the toolbar viewpoint picker.
 *
 * Two halves, for one measured reason. `Toolbar.tsx` is not importable under the `node`
 * environment of vitest (it pulls `../../joiner`, which reaches the store and dies on
 * `window is not defined` — the same wall nine suites in this repo already hit), so the
 * behaviour that lives in the component is asserted on its SOURCE, exactly as
 * `instanceManager10c.test.ts` does for `InstanceManagerTab.tsx`. The vocabulary itself
 * lives in `dataManagerOption.ts`, which imports nothing, and is exercised as a real unit.
 *
 * NAV2 (2026-09-01) replaced the native `<select>` with a custom listbox. The LOGIC is
 * NAV1's and its assertions below are untouched; the six that pinned the `<select>`'s
 * markup are remapped onto the new control and each says, in place, what it used to read.
 * The suite grew a NAV2 section for what the old control gave for free and this one has to
 * declare: roles, `aria-selected`, `aria-activedescendant`, the keys, and the portal.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    DATA_MANAGER_OPTION_LABEL,
    DATA_MANAGER_OPTION_VALUE,
    DATA_MANAGER_SEPARATOR_LABEL,
    isDataManagerOption,
} from '../dataManagerOption';

const TSX = readFileSync(resolve(__dirname, '../Toolbar.tsx'), 'utf8');

/** The construction of the picker's entries: what the `<select>`'s option list was.
 *  REMAPPED (NAV2): the vocabulary is no longer JSX — it is the `syntaxEntries` array the
 *  listbox renders — so the slice moves from `<option …>…</select>` to that array. */
function entriesBody(): string {
    const start = TSX.indexOf('const syntaxEntries: SyntaxEntry[] = [ABSTRACT_SYNTAX_ENTRY];');
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf('const currentSyntax', start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

/** The rendered listbox, from the portal call to its close. NAV2 only. */
function listboxBody(): string {
    const start = TSX.indexOf('{syntaxOpen && syntaxRect && createPortal(');
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf('document.body,', start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

/** The trigger button. NAV2 only. */
function triggerBody(): string {
    const start = TSX.indexOf('className="toolbar-viewpoint-trigger"');
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf('</button>', start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

/** The body of `handleViewpointChange`, callback included. */
function handlerBody(): string {
    const start = TSX.indexOf('const handleViewpointChange = useCallback(');
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf('}, [modelId]);', start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

describe('NAV1 — the vocabulary', () => {
    it('names the entry in sentence case, and not CRUD', () => {
        expect(DATA_MANAGER_OPTION_LABEL).toBe('Data manager');
        expect(DATA_MANAGER_OPTION_LABEL).not.toMatch(/CRUD/i);
        expect(DATA_MANAGER_OPTION_LABEL).not.toMatch(/syntax/i);
    });

    it('uses a sentinel that cannot be a pointer', () => {
        expect(DATA_MANAGER_OPTION_VALUE.startsWith('Pointer_')).toBe(false);
        expect(DATA_MANAGER_OPTION_VALUE.startsWith('@')).toBe(true);
        expect(DATA_MANAGER_OPTION_VALUE).not.toBe('');
    });

    it('recognises the sentinel and nothing else', () => {
        expect(isDataManagerOption(DATA_MANAGER_OPTION_VALUE)).toBe(true);
    });

    it('reads the empty string as a viewpoint value, not as the sentinel', () => {
        // '' IS «Abstract syntax»: a total predicate that swallowed it would make the
        // abstract-syntax entry open the manager instead of deactivating the viewpoint.
        expect(isDataManagerOption('')).toBe(false);
    });

    it('reads a real viewpoint id, null and undefined as not-the-sentinel', () => {
        expect(isDataManagerOption('Pointer_ViewPoint_3')).toBe(false);
        expect(isDataManagerOption(null)).toBe(false);
        expect(isDataManagerOption(undefined)).toBe(false);
        expect(isDataManagerOption(DATA_MANAGER_OPTION_LABEL)).toBe(false);
        expect(isDataManagerOption(DATA_MANAGER_SEPARATOR_LABEL)).toBe(false);
    });
});

describe('NAV1 — the entry in the picker', () => {
    it('renders the entry from the shared vocabulary, not from a literal', () => {
        // REMAPPED: `value={DATA_MANAGER_OPTION_VALUE}` (a JSX attribute) → `value:` (an
        // object property). Same claim: the entry is built from the shared module.
        const body = entriesBody();
        expect(body).toContain('value: DATA_MANAGER_OPTION_VALUE');
        expect(body).toContain('label: DATA_MANAGER_OPTION_LABEL');
        expect(body).not.toContain("'Data manager'");
    });

    it('puts it LAST — after the viewpoints, never interleaved', () => {
        // REMAPPED: `viewpoints.map` → the `for…of` that pushes them.
        const body = entriesBody();
        const viewpoints = body.indexOf('for (const vp of viewpoints)');
        const manager = body.indexOf('DATA_MANAGER_OPTION_VALUE');
        expect(viewpoints).toBeGreaterThan(-1);
        expect(manager).toBeGreaterThan(viewpoints);
    });

    it('separates it from the syntaxes — with a hairline now, not a disabled option', () => {
        // REMAPPED, and the mechanism changed with it: the `<option disabled>` is gone
        // (NAV2 removed it, as asked), and the rule is a `role="presentation"` div drawn
        // above the entry that carries `sep`. The claim that matters is the one the
        // `disabled` attribute defended — the separator is never selectable — and it is
        // now true by construction rather than by an attribute: it is not an entry.
        const entries = entriesBody();
        expect(entries).toContain('sep: true');
        expect(entries).not.toContain('DATA_MANAGER_SEPARATOR_LABEL');
        const list = listboxBody();
        expect(list).toContain('{entry.sep && (');
        expect(list).toContain('role="presentation"');
        // The hairline precedes the entry it separates, so the order stays
        // syntaxes → rule → manager.
        expect(list.indexOf('{entry.sep && (')).toBeLessThan(list.indexOf('role="option"'));
        // And it can never be picked or walked to: no click, no id, no aria-selected.
        const sep = list.slice(list.indexOf('{entry.sep && ('), list.indexOf('role="option"'));
        expect(sep).not.toContain('onClick');
        expect(sep).not.toContain('aria-selected');
    });

    it('hides it on metamodels and without a model id', () => {
        // REMAPPED: one JSX guard `{!isMetamodel && modelId && (` → two nested `if`s,
        // because the viewpoint entries sit under the same metamodel guard.
        const body = entriesBody();
        const outer = body.indexOf('if (!isMetamodel) {');
        const inner = body.indexOf('if (modelId) {');
        expect(outer).toBeGreaterThan(-1);
        expect(inner).toBeGreaterThan(outer);
        expect(inner).toBeLessThan(body.indexOf('DATA_MANAGER_OPTION_VALUE'));
    });

    it('leaves the abstract-syntax entry and the viewpoint list untouched', () => {
        // Non-regression: the vocabulary for the syntaxes alone is the before.
        // REMAPPED: the two `<option>`s → the constant and the push that replace them.
        expect(TSX).toContain(
            "const ABSTRACT_SYNTAX_ENTRY: SyntaxEntry = { value: '', label: 'Abstract syntax', icon: 'bi-diagram-3' };");
        const body = entriesBody();
        expect(body).toContain('const syntaxEntries: SyntaxEntry[] = [ABSTRACT_SYNTAX_ENTRY];');
        expect(body).toContain('syntaxEntries.push({ value: vp.id, label: vp.name, icon: VIEWPOINT_ENTRY_ICON });');
    });
});

describe('NAV1 — the routing', () => {
    it('intercepts the sentinel BEFORE the viewpoint write', () => {
        const body = handlerBody();
        const guard = body.indexOf('isDataManagerOption(vpId)');
        const write = body.indexOf('activateViewpoint(');
        expect(guard).toBeGreaterThan(-1);
        expect(write).toBeGreaterThan(guard);
    });

    it('returns before reaching activateViewpoint, so no sentinel enters state.viewpoint', () => {
        const body = handlerBody();
        const branch = body.slice(body.indexOf('isDataManagerOption(vpId)'), body.indexOf('activateViewpoint('));
        expect(branch).toContain('return;');
        expect(branch).not.toContain('activateViewpoint');
    });

    it('delegates to DockManager.openManager rather than mounting the tab itself', () => {
        const body = handlerBody();
        expect(body).toContain('DockManager.openManager(');
        // The picker owns no tab construction: that is TabDataMaker's, through DockManager.
        expect(body).not.toContain('TabDataMaker');
        expect(body).not.toContain('InstanceManagerTab');
    });

    it('resolves the LModel from the modelId the toolbar already receives', () => {
        const body = handlerBody();
        expect(body).toContain('LPointerTargetable.fromPointer(modelId)');
        expect(body).toContain('if (!modelId) return;');
    });

    it('keeps modelId in the callback deps, so the door does not close over a stale model', () => {
        expect(TSX).toContain('}, [modelId]);');
    });
});

describe('NAV1 — symmetry with the header tab', () => {
    it('uses the same entry point as the models rail', () => {
        const LEFTBAR = readFileSync(
            resolve(__dirname, '../../../pages/components/LeftBar.tsx'), 'utf8');
        expect(LEFTBAR).toContain('DockManager.openManager(');
        expect(handlerBody()).toContain('DockManager.openManager(');
    });

    it('reuses an existing tab instead of mounting a second one', () => {
        // The convergence is DockManager.open's, not the picker's: same tab id (built
        // once, in `managerTabId`) → `updateTab(..., true)` and an early return.
        const DOCK = readFileSync(
            resolve(__dirname, '../../abstract/DockManager.tsx'), 'utf8');
        const open = DOCK.slice(DOCK.indexOf('static async open(group'), DOCK.indexOf('static activateProjectSummary'));
        expect(open).toContain('DockManager.dock.find(tab.id)');
        expect(open).toContain('updateTab(tab.id, null as any, true)');
        const MAKER = readFileSync(
            resolve(__dirname, '../../abstract/tabs/TabDataMaker.tsx'), 'utf8');
        expect(MAKER).toContain('const tabId = managerTabId(model.id);');
    });

    it('never closes the manager tab from the picker', () => {
        // Going back to a syntax activates the canvas tab; the manager stays open.
        expect(handlerBody()).not.toContain('closeTab');
    });
});

/* ── NAV2 — the surface ───────────────────────────────────────────────────────
   A native <select> carried keyboard and screen-reader support for free. Replacing it
   is only legitimate if the replacement pays that back item by item, so these are not
   nice-to-haves: each one names something the old control did and the new one has to
   declare. They are asserted on the SOURCE for the reason stated at the top of the file
   — `Toolbar.tsx` cannot be imported under vitest's `node` environment — and the gate
   that measures them at screen is `scripts/smoke/_tmp_nav2_verify.ts`.
   ───────────────────────────────────────────────────────────────────────────── */

describe('NAV2 — no native select is left behind', () => {
    // These assert on the CLOSING tags and on `<option value=`, never on `<select`
    // alone: several comments in this file still explain the control that was replaced,
    // and «not.toContain('<select')» would read that prose as markup. A closing tag
    // cannot appear in a sentence about a control that no longer renders.
    it('the picker is a button plus a listbox, not a <select>', () => {
        const start = TSX.indexOf('<div className="toolbar-viewpoint-group">');
        expect(start).toBeGreaterThan(-1);
        const group = TSX.slice(start, TSX.indexOf('{/* ── Spacer ── */}', start));
        // Positive control: the slice DOES hold the group, so a silence below is a
        // measurement and not an empty read.
        expect(group).toContain('className="toolbar-viewpoint-trigger"');
        expect(group).not.toContain('</select>');
        expect(group).not.toContain('<option value=');
        expect(group).not.toContain('onChange=');
    });

    it('the whole file renders no <select> and no <option> any more', () => {
        expect(TSX).toContain('viewpoints');
        expect(TSX).not.toContain('</select>');
        expect(TSX).not.toContain('</option>');
        expect(TSX).not.toContain('<option value=');
    });
});

describe('NAV2 — accessibility parity with the control it replaces', () => {
    it('the trigger announces the popup it owns, and its state', () => {
        const body = triggerBody();
        expect(body).toContain('aria-haspopup="listbox"');
        expect(body).toContain('aria-expanded={syntaxOpen}');
        expect(body).toContain('aria-controls={SYNTAX_LISTBOX_ID}');
        expect(body).toContain('aria-label="Viewpoint"');
        // Inert on metamodels exactly as the <select> was.
        expect(body).toContain('disabled={isMetamodel}');
    });

    it('the panel is a listbox and its entries are options with aria-selected', () => {
        const body = listboxBody();
        expect(body).toContain('role="listbox"');
        expect(body).toContain('role="option"');
        expect(body).toContain('aria-selected={entry.value === shownViewpointId}');
    });

    it('the keyboard cursor is published as aria-activedescendant, with real ids', () => {
        const body = listboxBody();
        expect(body).toContain('aria-activedescendant={syntaxOptionId(syntaxHighlighted)}');
        expect(body).toContain('id={syntaxOptionId(i)}');
        expect(TSX).toContain('const syntaxOptionId = (i: number) => `toolbar-syntax-option-${i}`;');
    });

    it('the panel takes focus, so the keyboard works without a second gesture', () => {
        const body = listboxBody();
        expect(body).toContain('tabIndex={0}');
        expect(TSX).toContain('requestAnimationFrame(() => syntaxListRef.current?.focus());');
    });

    it('the arrows, Home, End, Enter, Space, Escape and Tab are all handled', () => {
        const start = TSX.indexOf('const onSyntaxListKeyDown');
        expect(start).toBeGreaterThan(-1);
        const body = TSX.slice(start, TSX.indexOf('// ── Views menu', start));
        for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Escape', 'Tab']) {
            expect(body).toContain(`case '${key}':`);
        }
        expect(body).toContain("case ' ':");
    });

    it('type-ahead survives the change — a <select> jumps on a typed prefix', () => {
        const start = TSX.indexOf('const onSyntaxListKeyDown');
        const body = TSX.slice(start, TSX.indexOf('// ── Views menu', start));
        expect(body).toContain('syntaxTypeahead.current');
        expect(body).toContain('.label.toLowerCase().startsWith(q)');
        // One character restarts AFTER the cursor, so repeating a letter cycles.
        expect(body).toContain('const from = q.length === 1 ? syntaxHighlighted + 1 : syntaxHighlighted;');
    });

    it('Escape and a pick both return focus to the trigger', () => {
        expect(TSX).toContain('syntaxTriggerRef.current?.focus();');
        const start = TSX.indexOf('const pickSyntax = (value: string) => {');
        expect(start).toBeGreaterThan(-1);
        const pick = TSX.slice(start, TSX.indexOf('};', start));
        // …except for the manager entry, which moves to another tab.
        expect(pick).toContain('if (!isDataManagerOption(value)) syntaxTriggerRef.current?.focus();');
    });

    it('the trigger keeps a visible focus ring — the one the <select> drew itself', () => {
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        const start = SCSS.indexOf('.toolbar-viewpoint-trigger {');
        expect(start).toBeGreaterThan(-1);
        const block = SCSS.slice(start, SCSS.indexOf('&--active {', start));
        expect(block).toContain('&:focus-visible {');
        expect(block).toContain('box-shadow: var(--focus-ring);');
    });
});

describe('NAV2 — the panel is not clipped, and reuses the shared geometry', () => {
    it('is portalled onto document.body rather than nested in the bar', () => {
        const body = listboxBody();
        expect(body).toContain('createPortal(');
        expect(TSX).toContain("import { createPortal } from 'react-dom';");
        expect(TSX.slice(TSX.indexOf(body))).toContain('document.body,');
    });

    it('borrows computeListStyle instead of writing a fourth copy of it', () => {
        expect(TSX).toContain("import { computeListStyle } from './components/InlineObjectSelect';");
        expect(listboxBody()).toContain('style={computeListStyle(syntaxRect)}');
    });

    it('mirrors that helper MIN_WIDTH in the sheet, so the clamp measures the painted box', () => {
        const HELPER = readFileSync(
            resolve(__dirname, '../components/InlineObjectSelect.tsx'), 'utf8');
        expect(HELPER).toContain('const MIN_WIDTH = 140;');
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        const start = SCSS.indexOf('.toolbar-viewpoint-menu {');
        expect(start).toBeGreaterThan(-1);
        expect(SCSS.slice(start, SCSS.indexOf('}', start))).toContain('min-width: 140px;');
    });

    it('closes on the gestures that move its anchor, with capture on add AND remove', () => {
        const start = TSX.indexOf('        if (!syntaxOpen) return;\n        const onDown');
        expect(start).toBeGreaterThan(-1);
        const body = TSX.slice(start, TSX.indexOf('    }, [syntaxOpen]);', start));
        for (const ev of ['mousedown', 'scroll', 'wheel']) {
            expect(body).toContain(`window.addEventListener('${ev}', `);
            expect(body).toContain(`window.removeEventListener('${ev}', `);
            // Both sides in capture: a bubble-phase removal does not unhook a capture listener.
            const inCapture = body.split('\n').filter(l => l.includes(`'${ev}'`) && l.includes(', true)'));
            expect(inCapture.length).toBe(2);
        }
        // The trigger is excluded from «outside», or mousedown would close what click reopens.
        expect(body).toContain('if (syntaxTriggerRef.current?.contains(t) || syntaxListRef.current?.contains(t)) return;');
        // Escape in capture, for the Monaco reason in CLAUDE.md §15.1.
        expect(body).toContain("window.addEventListener('keydown', onKey, true);");
    });
});

describe('NAV2 — the mock: glyphs and the ratified cyan selection', () => {
    it('every entry carries a glyph, and the manager gets the bi-table of the mock', () => {
        expect(TSX).toContain("const VIEWPOINT_ENTRY_ICON = 'bi-eye';");
        expect(entriesBody()).toContain('icon: DATA_MANAGER_OPTION_ICON');
        expect(listboxBody()).toContain('className={`bi ${entry.icon} toolbar-viewpoint-menu__icon`}');
    });

    it('the selected entry is checked with bi-check-lg on the right', () => {
        const body = listboxBody();
        expect(body).toContain('bi bi-check-lg toolbar-viewpoint-menu__check');
        expect(body).toContain('{entry.value === shownViewpointId && (');
    });

    it('the selected state is drawn with the ratified tokens, not the mock hexes', () => {
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        const start = SCSS.indexOf(".toolbar-viewpoint-menu__option[aria-selected='true'] {");
        expect(start).toBeGreaterThan(-1);
        const block = SCSS.slice(start, SCSS.indexOf('\n}', start));
        // #ecfeff, #0e7490, #0891b2 — through the tokens that carry their dark correction.
        expect(block).toContain('background: var(--color-inode-ref-bg);');
        expect(block).toContain('color: var(--color-inode-selected-badge-fg);');
        expect(block).toContain('box-shadow: inset 3px 0 0 var(--color-selection-bar);');
        expect(block).not.toMatch(/#ecfeff|#0e7490|#0891b2/i);
    });

    it('the panel has an opaque ground in both themes and the mock radius', () => {
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        const start = SCSS.indexOf('.toolbar-viewpoint-menu {');
        const block = SCSS.slice(start, SCSS.indexOf('\n}', start));
        expect(block).toContain('border-radius: var(--radius-dropdown);');
        // NOT --color-bg-elevated: rgba(255,255,255,0.04) in dark is a see-through panel.
        expect(block).toContain('background: var(--color-form-surface);');
        // The refusal is asserted on the DECLARATION, not on the whole block: the comment
        // above it names --color-bg-elevated in order to say why it was not used.
        expect(block).not.toContain('background: var(--color-bg-elevated)');
        // NOT var(--shadow-dropdown): --shadow-lg is one of the names tokens.css redeclares.
        expect(block).toContain('box-shadow: 0 4px 12px var(--color-node-shadow);');
        expect(block).not.toContain('box-shadow: var(--shadow-dropdown)');
    });

    it('the panel rules are flat, so they reach the portal outside .editor-v2', () => {
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        // Top of a line, i.e. column 0: a nested rule would be indented.
        expect(SCSS).toMatch(/\n\.toolbar-viewpoint-menu \{/);
        expect(SCSS).toMatch(/\n\.toolbar-viewpoint-menu__option \{/);
    });
});

describe('NAV2 — the shrink ladder followed the element', () => {
    it('step 3 of the toolbar ladder now floors the trigger, not a dead select', () => {
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        expect(SCSS).not.toContain('.toolbar-viewpoint-selector select');
        const start = SCSS.indexOf('    .toolbar-viewpoint-trigger {\n        min-width: 72px;');
        expect(start).toBeGreaterThan(-1);
    });

    it('the eye and the --active lit state are preserved', () => {
        const SCSS = readFileSync(resolve(__dirname, '../EditorV2.scss'), 'utf8');
        const start = SCSS.indexOf('    &--active {');
        expect(start).toBeGreaterThan(-1);
        const block = SCSS.slice(start, SCSS.indexOf('\n}', start));
        expect(block).toContain('.toolbar-viewpoint-trigger {');
        expect(block).toContain('.bi-eye {');
        expect(block).toContain('color: #0ea5e9;');
        // The eye moved inside the button but stays a descendant of the wrapper.
        expect(triggerBody()).toContain('<i className="bi bi-eye" aria-hidden="true" />');
    });
});
