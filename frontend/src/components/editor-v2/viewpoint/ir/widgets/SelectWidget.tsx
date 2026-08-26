/**
 * SelectWidget — enum literals and (in the degraded reference case) element targets.
 *
 * Wraps `ui/Select`, and exists mainly to contain ONE trap. That component prepends an
 * option unconditionally:
 *
 *     <option value="">{placeholder}</option>
 *
 * even when no placeholder was passed, in which case the option is there with an empty
 * label. So `''` is a value the change handler will see, and it means "the user landed on
 * the placeholder", never "the user chose the empty string". Writing it through would put
 * `''` into a slot typed as an enum literal or a pointer.
 *
 * This is not a hypothetical: the closed vocabulary of `edge.routing` in irValidate exists
 * precisely because that empty string reached a persisted IR once, and its comment names
 * "the empty string of a Select placeholder" as the first thing it guards against.
 *
 * So `''` commits nothing here. Slice 1a therefore has no way to UNSET an enum from the
 * form; clearing values arrives with the list controls in 1b, where a clear is an explicit
 * gesture (the row's `x`) rather than a side effect of picking a blank option.
 */

import { Select } from '../../../../ui';
import type { FormFieldOptionGroup } from '../useFormWidgets';

export interface SelectWidgetProps {
    /** Current raw value: a pointer id for a reference or an enum literal. */
    value: string;
    onCommit: (next: string) => void;
    options: FormFieldOptionGroup[];
    readOnly?: boolean;
    invalid?: boolean;
    placeholder?: string;
    id?: string;
    ariaLabel?: string;
}

export function SelectWidget(props: SelectWidgetProps) {
    const { value, onCommit, options, readOnly, invalid, placeholder, id, ariaLabel } = props;

    // A value that is not among the options (a dangling pointer, a literal removed from
    // the enum) would make the native select fall back to its first option and SHOW a
    // value the model does not hold. Selecting the placeholder instead keeps the control
    // honest: the field reads as empty, and the diagnostic that explains why is the
    // registry's job, not the widget's.
    const known = options.some(g => g.options.some(o => o.value === value));
    const shown = known ? value : '';

    return (
        <Select
            id={id}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            className="ir-field__control"
            fullWidth
            size="sm"
            error={invalid}
            disabled={readOnly}
            placeholder={placeholder ?? ''}
            options={options}
            value={shown}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const next = e.target.value;
                if (next === '') return;   // the placeholder, never a value — see above
                if (next === value) return;
                onCommit(next);
            }}
        />
    );
}

export default SelectWidget;
