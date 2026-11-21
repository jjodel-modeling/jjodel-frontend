/**
 * EditorBar — the one bar under the tab strip of an editor, shared by the diagram canvas (Toolbar.tsx) and the Text
 * tab (codegen/textual/ui/TextualTab.tsx) (R-MT-38, P-2026-11-20-1610). Same height, padding and separator for both
 * (R-MT-36); each editor passes its own zone contents.
 *
 * Three zones, left to right: editing actions, view controls, and, at the right end, the representation
 * (`Diagram | Text`, R-MT-35) with what follows it. The left and middle zones sit in the one box that scrolls when the
 * bar is short of room, so the right zone and `trailing` never leave the view. A zone adds no box of its own
 * (`display: contents`, the right one excepted), so the
 * canvas's groups keep the flex layout they had as direct children of its bar. `trailing` comes after the right zone
 * (the canvas's empty reserve over its rail, since its identity cell went, P-2026-11-20-1610). One 1px divider separates the left
 * zone from the middle one and the scroller from the right zone, the same in both bars.
 */

import type { ReactNode } from 'react';
import { DIAGRAM_ENTRY_TITLE } from './representationSwitch';
import type { TextAvailability } from './representationSwitch';
import './EditorBar.scss';

export interface EditorBarProps {
    /** Extra classes of the root (the canvas keeps `editor-v2-toolbar`, which its sheets are written against). */
    readonly className?: string;
    /** Extra classes of the fieldset that wraps the controls (the canvas keeps `editor-v2-toolbar__commands`). */
    readonly controlsClassName?: string;
    /** Disables every control at once (the inactive pane of a split). */
    readonly disabled?: boolean;
    readonly left?: ReactNode;
    readonly middle?: ReactNode;
    readonly right?: ReactNode;
    readonly trailing?: ReactNode;
    readonly ariaLabel?: string;
}

/** The bar: root, one fieldset, the left and middle zones in the one box that scrolls, the right zone, `trailing`. */
export default function EditorBar({ className, controlsClassName, disabled, left, middle, right, trailing, ariaLabel }: EditorBarProps) {
    return (
        <div className={'editor-bar' + (className ? ` ${className}` : '')} role="toolbar" aria-label={ariaLabel ?? 'Editor'}>
            <fieldset className={'editor-bar__controls' + (controlsClassName ? ` ${controlsClassName}` : '')} disabled={!!disabled}>
                <div className="editor-bar__scroll">
                    <div className="editor-bar__zone editor-bar__zone--left">{left}</div>
                    {middle !== undefined && <span className="editor-bar__divider" aria-hidden="true" />}
                    <div className="editor-bar__zone editor-bar__zone--middle">{middle}</div>
                </div>
                {right !== undefined && <span className="editor-bar__divider" aria-hidden="true" />}
                <div className="editor-bar__zone editor-bar__zone--right">{right}</div>
                {trailing}
            </fieldset>
        </div>
    );
}

export interface RepresentationSwitchProps {
    /** The representation this tab shows. */
    readonly active: 'diagram' | 'text';
    /** The Text entry (representationSwitch.ts `textAvailability`); the switch renders nothing when not `shown`. */
    readonly text: TextAvailability;
    /** Whether the Text entry reads as pressed: the Text tab passes false while it shows its EBNF or Syntax mode. */
    readonly textPressed?: boolean;
    readonly onDiagram?: () => void;
    readonly onText?: () => void;
}

/**
 * The segmented `Diagram | Text` (R-MT-35): it brings forward the other tab of the same artifact. A disabled entry is
 * `aria-disabled`, not `disabled`, so its tooltip still shows on hover and the bar does not shift.
 */
export function RepresentationSwitch({ active, text, textPressed, onDiagram, onText }: RepresentationSwitchProps) {
    if (!text.shown) return null;
    const pressedText = textPressed ?? active === 'text';
    return (
        <div className="editor-bar__switch" role="group" aria-label="Representation">
            <button type="button" className={'editor-bar__switch-btn' + (active === 'diagram' ? ' editor-bar__switch-btn--active' : '')}
                    aria-pressed={active === 'diagram'} aria-label="Diagram" title={DIAGRAM_ENTRY_TITLE} data-representation="diagram"
                    onClick={() => { if (active !== 'diagram') onDiagram?.(); }}>
                <i className="bi bi-diagram-3" aria-hidden="true" />
            </button>
            <button type="button" className={'editor-bar__switch-btn' + (pressedText ? ' editor-bar__switch-btn--active' : '')}
                    aria-pressed={pressedText} aria-disabled={!text.enabled || undefined} aria-label="Text" title={text.title} data-representation="text"
                    onClick={() => { if (text.enabled) onText?.(); }}>
                <i className="bi bi-file-earmark-text" aria-hidden="true" />
            </button>
        </div>
    );
}
