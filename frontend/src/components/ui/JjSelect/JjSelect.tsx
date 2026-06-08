import React from 'react';
import Select, {
    components,
    GroupBase,
    Props as ReactSelectProps,
    StylesConfig,
    DropdownIndicatorProps,
    MultiValueRemoveProps,
    ClearIndicatorProps,
} from 'react-select';

/**
 * JjSelect — the single shared react-select wrapper for the Property Panel.
 *
 * Styling is co-located here as a react-select `styles` object + a custom
 * Bootstrap-icon DropdownIndicator, on purpose: external `.jj-select__*` SCSS in
 * info.scss caused order/specificity bugs (a leftover debug border, white-on-white
 * option hover, an invisible chip label). Keeping the styles next to the component
 * removes that class of bug.
 *
 * Design axes (see docs/discovery/2026-06-06_property_panel_form_controls.md):
 *   - focus ring     = slate (#334155)   → keyboard focus is present now
 *   - active/selected = cyan (#0ea5e9)    → the value is on / selected
 * These are orthogonal: a focused control shows the slate ring; a selected option
 * shows the cyan tint. Multi-value chips stay slate-dark with a white legible label.
 */
function buildStyles<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>
>(): StylesConfig<Option, IsMulti, Group> {
    return {
        control: (base, state) => ({
            ...base,
            minHeight: 36,
            height: 36,
            backgroundColor: 'var(--form-input-bg)',
            borderColor: state.isFocused
                ? 'var(--form-input-border-color-focus)'
                : 'var(--form-input-border-color)',
            borderRadius: 6,
            boxShadow: state.isFocused ? 'var(--form-input-focus-shadow)' : 'none',
            fontSize: 13,
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            '&:hover': { borderColor: 'var(--form-input-border-color-hover)' },
        }),
        valueContainer: (base) => ({ ...base, padding: '0 10px' }),
        placeholder: (base) => ({ ...base, color: '#94a3b8' }),
        singleValue: (base) => ({ ...base, color: '#1e293b' }),
        input: (base) => ({ ...base, margin: 0, padding: 0, color: '#1e293b' }),
        indicatorSeparator: () => ({ display: 'none' }),
        indicatorsContainer: (base) => ({ ...base, padding: '0 4px' }),
        menu: (base) => ({
            ...base,
            marginTop: 4,
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            zIndex: 20,
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menuList: (base) => ({ ...base, padding: 4 }),
        option: (base, state) => ({
            ...base,
            color: '#0f172a',
            padding: '6px 10px',
            borderRadius: 4,
            backgroundColor: state.isSelected
                ? 'rgba(14, 165, 233, 0.16)'
                : state.isFocused
                    ? 'rgba(14, 165, 233, 0.10)'
                    : 'transparent',
            cursor: 'pointer',
            '&:active': { backgroundColor: 'rgba(14, 165, 233, 0.16)' },
        }),
        groupHeading: (base) => ({
            ...base,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#94a3b8',
            padding: '8px 10px 4px',
        }),
        multiValue: (base) => ({ ...base, backgroundColor: '#334155', borderRadius: 4 }),
        multiValueLabel: (base) => ({ ...base, color: '#ffffff', fontSize: 12 }),
        multiValueRemove: (base) => ({
            ...base,
            color: '#cbd5e1',
            '&:hover': { backgroundColor: 'transparent', color: '#ffffff' },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: '#94a3b8',
            cursor: 'pointer',
            '&:hover': { color: '#64748b' },
        }),
    };
}

// Bootstrap-icon chevron (the only allowed icon library), rotating when the menu opens.
function DropdownIndicator<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>
>(props: DropdownIndicatorProps<Option, IsMulti, Group>) {
    const open = props.selectProps.menuIsOpen;
    return (
        <components.DropdownIndicator {...props}>
            <i
                className="bi bi-chevron-down"
                style={{
                    fontSize: 13,
                    color: '#94a3b8',
                    display: 'block',
                    lineHeight: 1,
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                }}
            />
        </components.DropdownIndicator>
    );
}

// Bootstrap-icon remove glyph for multi-value chips. The default MultiValueRemove renders
// `children || <CrossIcon/>`, so passing children swaps only the glyph and keeps its remove
// onClick/innerProps. Color is inherited from styles.multiValueRemove (#cbd5e1 / white on hover).
function MultiValueRemove<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>
>(props: MultiValueRemoveProps<Option, IsMulti, Group>) {
    return (
        <components.MultiValueRemove {...props}>
            <i className="bi bi-x-lg" style={{ fontSize: 12, display: 'block', lineHeight: 1 }} />
        </components.MultiValueRemove>
    );
}

// Bootstrap-icon clear glyph. Same wrap-and-pass-children pattern; keeps the default wrapper's
// clear onClick/innerProps. Color is inherited from styles.clearIndicator (#94a3b8 / #64748b hover).
function ClearIndicator<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>
>(props: ClearIndicatorProps<Option, IsMulti, Group>) {
    return (
        <components.ClearIndicator {...props}>
            <i className="bi bi-x-lg" style={{ fontSize: 14, display: 'block', lineHeight: 1 }} />
        </components.ClearIndicator>
    );
}

export type JjSelectProps<
    Option = unknown,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
> = ReactSelectProps<Option, IsMulti, Group>;

export function JjSelect<
    Option = unknown,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
>(props: JjSelectProps<Option, IsMulti, Group>) {
    const { components: userComponents, styles: userStyles, isMulti, ...rest } = props;
    return (
        <Select<Option, IsMulti, Group>
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            className={'jj-select'}
            menuPosition="fixed"
            maxMenuHeight={440}
            isSearchable={true}
            closeMenuOnSelect={!isMulti}
            isMulti={isMulti}
            {...rest}
            components={{ DropdownIndicator, MultiValueRemove, ClearIndicator, ...(userComponents || {}) }}
            styles={{ ...buildStyles<Option, IsMulti, Group>(), ...(userStyles || {}) }}
        />
    );
}

export default JjSelect;
