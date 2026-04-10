import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import ReactSelect from 'react-select';
import {
    LViewElement,
    DViewElement,
    DViewPoint,
    LPointerTargetable,
    Pointer,
    Edges,
    Fields,
    Graphs,
    Vertexes,
    GraphElements,
} from '../../../../joiner';
import { baseMonacoOptions, withReadOnly } from '../../../editors/monacoConfig';
import EditorToolbar, { LANGUAGE_BADGES } from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';

type PredicateLanguage = 'ocl' | 'js' | 'jjel';

interface PredicateTabProps {
    view: LViewElement;
    viewpointId?: string;
    onViewUpdate: () => void;
}

const LANGUAGE_TOGGLE_OPTIONS = [
    { label: 'OCL', value: 'ocl' },
    { label: 'JS', value: 'js' },
    { label: 'JjEL', value: 'jjel' },
];

/** Map predicate language to Monaco language id */
const MONACO_LANG: Record<PredicateLanguage, string> = {
    ocl: 'plaintext',
    js: 'javascript',
    jjel: 'plaintext',
};

/** Object types available for "Applicable to" multi-select */
const OBJECT_TYPES = [
    'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral',
    'DClass', 'DAttribute', 'DReference', 'DOperation',
    'DParameter', 'DObject', 'DValue', 'DStructuralFeature',
];

const CLASSES_OPTIONS = OBJECT_TYPES.map(o => ({
    value: o,
    label: o.substring(1),
}));

const PredicateTab: React.FC<PredicateTabProps> = ({ view, viewpointId, onViewUpdate }) => {
    const dview: DViewElement = view.__raw;
    const [language, setLanguage] = useState<PredicateLanguage>('ocl');
    const [localValue, setLocalValue] = useState('');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

    const isViewpoint = view.className === DViewPoint.cname;

    /** Read the persisted value for the current language */
    const getPersistedValue = useCallback((lang: PredicateLanguage): string => {
        switch (lang) {
            case 'ocl': return (dview as any).oclCondition || '';
            case 'js': return (dview as any).jsCondition || '';
            case 'jjel': return (dview as any).jjelCondition || '';
        }
    }, [dview]);

    // Sync local value when view or language changes externally
    useEffect(() => {
        if (!isFullscreenOpen) {
            setLocalValue(getPersistedValue(language));
        }
    }, [language, dview, getPersistedValue, isFullscreenOpen]);

    /** Persist current value to the model */
    const persist = useCallback(() => {
        switch (language) {
            case 'ocl':
                view.oclCondition = localValue;
                break;
            case 'js':
                view.jsCondition = localValue;
                break;
            case 'jjel':
                (view as any).jjelCondition = localValue;
                break;
        }
        onViewUpdate();
    }, [language, localValue, view, onViewUpdate]);

    const handleBlur = useCallback(() => {
        persist();
    }, [persist]);

    const handleLanguageChange = useCallback((newLang: string) => {
        // Persist current language's value before switching
        persist();
        setLanguage(newLang as PredicateLanguage);
    }, [persist]);

    const handleFullscreenClose = useCallback(() => {
        persist();
        setIsFullscreenOpen(false);
    }, [persist]);

    // --- View property handlers ---

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        view.name = e.target.value;
    }, [view]);

    const handleExclusiveToggle = useCallback(() => {
        view.isExclusiveView = !dview.isExclusiveView;
    }, [view, dview]);

    const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        (view as any).explicitApplicationPriority = val ? +val : undefined;
    }, [view]);

    const handleAppearanceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        (view as any).forceNodeType = e.target.value === 'unset' ? undefined : e.target.value;
    }, [view]);

    const handleApplicableToChange = useCallback((selected: any) => {
        const values = selected ? selected.map((s: any) => s.value) : [];
        view.appliableToClasses = values;
    }, [view]);

    const handleParentViewChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        (view as any).father = e.target.value || undefined;
    }, [view]);

    // --- Computed values ---

    const applicableToValue = useMemo(() => {
        const classes = dview.appliableToClasses || [];
        return classes
            .filter((c: string) => c)
            .map((c: string) => ({ value: c, label: c.substring(1) }));
    }, [dview.appliableToClasses]);

    const parentViewOptions = useMemo(() => {
        try {
            const possibleParents = (view as any).allPossibleParentViews || [];
            return possibleParents
                .filter((v: any) => !viewpointId || v.viewpoint?.id === viewpointId)
                .map((v: any) => ({ id: v.id, name: v.name || 'Unnamed' }));
        } catch { return []; }
    }, [view, viewpointId]);

    const viewpointName = useMemo(() => {
        try {
            const vp = (view as any).viewpoint;
            return vp?.name || '';
        } catch { return ''; }
    }, [view]);

    const activeBadge = LANGUAGE_BADGES[language];
    const monacoLang = MONACO_LANG[language];

    return (
        <div className="vep-template-tab vep-apply-to-tab">
            {/* View properties form */}
            <div className="vep-apply-to__form">
                {/* Name */}
                <div className="vep-apply-to__field">
                    <label className="vep-apply-to__label">Name</label>
                    <input
                        className="vep-apply-to__input"
                        value={dview.name || ''}
                        onChange={handleNameChange}
                        placeholder="View name"
                    />
                </div>

                {/* Is Exclusive */}
                <div className="vep-apply-to__field vep-apply-to__field--toggle">
                    <label className="vep-apply-to__label">Is Exclusive</label>
                    <button
                        type="button"
                        className={`vep-apply-to__switch ${dview.isExclusiveView ? 'vep-apply-to__switch--active' : ''}`}
                        onClick={handleExclusiveToggle}
                    />
                </div>

                {!isViewpoint && (
                    <>
                        {/* Priority */}
                        <div className="vep-apply-to__field">
                            <label className="vep-apply-to__label">Priority</label>
                            <input
                                className="vep-apply-to__input"
                                type="number"
                                value={dview.explicitApplicationPriority ?? ''}
                                onChange={handlePriorityChange}
                                placeholder={`automatic: ${view.explicitApplicationPriority ?? ''}`}
                            />
                        </div>

                        {/* Preferred appearance */}
                        <div className="vep-apply-to__field">
                            <label className="vep-apply-to__label">Preferred appearance</label>
                            <select
                                className="vep-apply-to__select"
                                value={dview.forceNodeType || 'unset'}
                                onChange={handleAppearanceChange}
                            >
                                <option value="unset">Automatic</option>
                                <optgroup label="Graph">
                                    {Object.keys(Graphs).map(k => (
                                        <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Edge">
                                    {Object.keys(Edges).map(k => (
                                        <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Field">
                                    {Object.keys(Fields).map(k => (
                                        <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Vertex">
                                    {Object.keys(Vertexes).map(k => (
                                        <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Applicable to (multi-select) */}
                        <div className="vep-apply-to__field">
                            <label className="vep-apply-to__label">Applicable to</label>
                            <ReactSelect
                                isMulti
                                classNamePrefix="jjodel-select"
                                value={applicableToValue}
                                onChange={handleApplicableToChange}
                                options={CLASSES_OPTIONS}
                                placeholder="Select classifiers..."
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                    control: (base: any) => ({
                                        ...base,
                                        minHeight: 30,
                                        fontSize: 12,
                                        borderColor: '#e2e8f0',
                                        boxShadow: 'none',
                                        '&:hover': { borderColor: '#cbd5e1' },
                                    }),
                                    multiValue: (base: any) => ({
                                        ...base,
                                        background: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 4,
                                    }),
                                    multiValueLabel: (base: any) => ({
                                        ...base,
                                        color: '#334155',
                                        fontSize: 11,
                                        fontWeight: 500,
                                        padding: '1px 4px',
                                    }),
                                    multiValueRemove: (base: any) => ({
                                        ...base,
                                        color: '#94a3b8',
                                        ':hover': { background: '#e2e8f0', color: '#ef4444' },
                                    }),
                                    option: (base: any, state: any) => ({
                                        ...base,
                                        fontSize: 12,
                                        padding: '6px 10px',
                                        background: state.isSelected
                                            ? 'rgba(14, 165, 233, 0.08)'
                                            : state.isFocused ? '#f1f5f9' : 'transparent',
                                        color: state.isSelected ? '#0ea5e9' : '#334155',
                                        fontWeight: state.isSelected ? 500 : 400,
                                    }),
                                    indicatorSeparator: () => ({ display: 'none' }),
                                    dropdownIndicator: (base: any) => ({
                                        ...base,
                                        padding: '4px',
                                        color: '#94a3b8',
                                    }),
                                }}
                            />
                        </div>

                        {/* Viewpoint (read-only) */}
                        <div className="vep-apply-to__field">
                            <label className="vep-apply-to__label">Viewpoint</label>
                            <input
                                className="vep-apply-to__input"
                                value={viewpointName}
                                readOnly
                                tabIndex={-1}
                            />
                        </div>

                        {/* Parent view */}
                        <div className="vep-apply-to__field">
                            <label className="vep-apply-to__label">Parent view</label>
                            <select
                                className="vep-apply-to__select"
                                value={dview.father || ''}
                                onChange={handleParentViewChange}
                            >
                                <option value="">None</option>
                                {parentViewOptions.map((pv: { id: string; name: string }) => (
                                    <option key={pv.id} value={pv.id}>{pv.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {/* Divider */}
                <div className="vep-apply-to__divider">
                    <span className="vep-apply-to__divider-text">Predicate</span>
                </div>
            </div>

            {/* Predicate editor (existing) */}
            <EditorToolbar
                languageBadge={activeBadge}
                editorLabel="predicate"
                onFullscreen={() => setIsFullscreenOpen(true)}
                languageToggle={{
                    options: LANGUAGE_TOGGLE_OPTIONS,
                    active: language,
                    onChange: handleLanguageChange,
                }}
            />

            <div
                className="vep-template-tab__body"
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    value={localValue}
                    language={monacoLang}
                    theme="vs"
                    options={{
                        ...withReadOnly(baseMonacoOptions, false),
                        automaticLayout: true,
                        lineNumbers: 'on',
                    }}
                    onChange={(val) => setLocalValue(val || '')}
                />
            </div>

            <EditorFullscreenModal
                isOpen={isFullscreenOpen}
                onClose={handleFullscreenClose}
                title={`Predicate — ${view.name || 'View'}`}
                subtitle={`${activeBadge.label} predicate for this view element`}
                languageBadge={activeBadge}
                language={monacoLang}
                value={localValue}
                onChange={setLocalValue}
            />
        </div>
    );
};

export default PredicateTab;
