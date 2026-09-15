/**
 * TextWidget — the single-line and multiline text field of a form.
 *
 * One component for both because they differ only in the element rendered: the draft
 * state, the commit-on-blur, the commit-on-Enter and the revert-on-Escape are identical,
 * and splitting them would mean maintaining that dance twice. `multiline` picks
 * `ui/Textarea` over `ui/Input`; the JjEL presentation (mono face, taller box) is a class
 * on the wrapper, applied by irFormStyle.
 *
 * Commit semantics, shared with NumberWidget: the widget is UNCONTROLLED between focus
 * and blur. It holds a draft, so typing never round-trips through Redux, and writes once
 * on blur or Enter. Escape restores the committed value and leaves the field. When the
 * value changes underneath (another surface edited the same slot) the draft is resynced,
 * but only while the field is not focused — otherwise a background write would yank the
 * text out from under whoever is typing.
 */

import { useEffect, useRef, useState } from 'react';
import { Input, Textarea } from '../../../../ui';

export interface TextWidgetProps {
    value: string;
    onCommit: (next: string) => void;
    multiline?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    maxLength?: number;
    placeholder?: string;
    id?: string;
    /** Accessible name: the visible label lives in the field's label row, not here. */
    ariaLabel?: string;
}

export function TextWidget(props: TextWidgetProps) {
    const { value, onCommit, multiline, readOnly, invalid, maxLength, placeholder, id, ariaLabel } = props;
    const [draft, setDraft] = useState(value);
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) setDraft(value);
    }, [value]);

    const commit = () => {
        focused.current = false;
        if (draft !== value) onCommit(draft);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            focused.current = false;
            (e.target as HTMLElement).blur();
            return;
        }
        // Enter commits a single-line field. In a textarea it inserts a newline, which is
        // what a JjEL expression needs, so only the modified chord commits there.
        if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
            (e.target as HTMLElement).blur();
        }
    };

    const shared = {
        id,
        'aria-label': ariaLabel,
        'aria-invalid': invalid || undefined,
        value: draft,
        readOnly,
        placeholder,
        onFocus: () => { focused.current = true; },
        onBlur: commit,
        onKeyDown,
    };

    if (multiline) {
        return (
            <Textarea
                {...shared}
                className="ir-field__control ir-field__control--mono"
                fullWidth
                rows={3}
                error={invalid}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            />
        );
    }

    return (
        <Input
            {...shared}
            className="ir-field__control"
            fullWidth
            size="sm"
            maxLength={maxLength}
            // `error` on ui/Input is a MESSAGE, not a flag: passing a string would render
            // a second message under the control and break the fixed 16px slot this form
            // reserves. The invalid look is carried by aria-invalid plus our own class.
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        />
    );
}

export default TextWidget;
