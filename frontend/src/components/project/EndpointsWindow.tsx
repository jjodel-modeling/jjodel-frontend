/**
 * EndpointsWindow — #186 (P-2026-10-14-1101): the dedicated window where the stand-alone
 * environment is configured (R-CFG-4, R-CFG-5). Opened from the «Endpoints» menu of the top app
 * bar, from the left bar's «Configure environment» and from Tools › «Configure Environment...»,
 * all through `EnvGenEvents.OPEN_WIZARD`, which ProjectEditor listens to. Two tabs mount the
 * wizard's steps as they are: «Editable metaclasses» (MetaclassesStep) and «Roles»
 * (ProfilesStep). The steps read and write the project-state config themselves and create it at
 * the first write, so opening the window writes nothing; they are mounted only while it is open.
 *
 * «Done» saves the project when it has unsaved changes and closes, as the wizard's «Done» does
 * (#157 R1, `EnvGenWizardModal.tsx`); «Cancel» beside it, Escape, the close button and the backdrop
 * close without a save (R-CFG-8, P-2026-10-20-1123): the changes stay in the project, unsaved. The
 * arrows ‹ › beside the tabs move to the previous and the next tab, disabled at the ends, beside the
 * click and the keyboard. A portal on `document.body`, as the wizard: ProjectEditor's pane may be
 * inactive.
 *
 * Developer only: the doors are hidden in consumer mode, and the window closes when a
 * `?profile=` enters the hash (re-read on hashchange, as LeftBar and Dashboard do).
 */
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { LProject, U } from '../../joiner';
import { MetaclassesStep } from '../envgen/steps/MetaclassesStep';
import { ProfilesStep } from '../envgen/steps/ProfilesStep';
import { isConsumerMode } from '../environment/consumerMode';
import { saveProjectWithFeedback } from '../../common/libraries/saveProject';
// The window wears the wizard's modal classes and the steps' `envgen-*` rules; both are global and
// live with the wizard, imported here too so the window does not depend on ProjectEditor's import.
import '../envgen/EnvGenWizardModal.scss';
import './EndpointsWindow.scss';

export type EndpointsTab = 'metaclasses' | 'roles';

export interface EndpointsWindowProps {
    /** The tab on screen, or null when the window is closed. */
    tab: EndpointsTab | null;
    onTabChange: (tab: EndpointsTab) => void;
    onClose: () => void;
}

const TABS: Array<{ id: EndpointsTab; label: string; icon: string }> = [
    { id: 'metaclasses', label: 'Editable metaclasses', icon: 'bi-grid-1x2' },
    { id: 'roles', label: 'Roles', icon: 'bi-people' },
];

const PANEL_ID = 'endpoints-panel';
const TITLE_ID = 'endpoints-window-title';
const tabId = (tab: EndpointsTab) => `endpoints-tab-${tab}`;

/** The Endpoints window: a tablist over the two environment steps, with «Done». */
export const EndpointsWindow: React.FC<EndpointsWindowProps> = ({ tab, onTabChange, onClose }) => {
    const tabRefs = useRef<Partial<Record<EndpointsTab, HTMLButtonElement | null>>>({});

    // isConsumerMode() reads the hash live; this component re-renders only with the project page.
    const [, forceHashTick] = useState(0);
    useEffect(() => {
        const onHash = () => forceHashTick((t) => t + 1);
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    const consumer = isConsumerMode();
    const open = tab !== null && !consumer;
    useEffect(() => {
        if (tab !== null && consumer) onClose();
    }, [tab, consumer, onClose]);

    // Escape closes without a save, as in the wizard.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // The selected tab takes the focus when the window opens, so the keyboard starts in the tablist.
    const wasOpen = useRef(false);
    useEffect(() => {
        if (open && !wasOpen.current && tab) tabRefs.current[tab]?.focus();
        wasOpen.current = open;
    }, [open, tab]);

    if (!open || tab === null) return null;

    // #157 R1: the environment reaches the server only with a project save, and «Done» is that save
    // when the project has unsaved changes (the same call as Ctrl+S).
    const done = () => {
        if (U.isProjectModified) void saveProjectWithFeedback(LProject.getProject());
        onClose();
    };

    const tabIndex = TABS.findIndex((t) => t.id === tab);
    // Roving tabindex: the arrows, Home and End move the selection and the focus together.
    const selectAt = (index: number) => {
        const next = TABS[(index + TABS.length) % TABS.length];
        onTabChange(next.id);
        tabRefs.current[next.id]?.focus();
    };
    const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowRight') selectAt(index + 1);
        else if (e.key === 'ArrowLeft') selectAt(index - 1);
        else if (e.key === 'Home') selectAt(0);
        else if (e.key === 'End') selectAt(TABS.length - 1);
        else return;
        e.preventDefault();
    };

    return ReactDOM.createPortal(
        <div className="envgen-backdrop visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="envgen-modal visible endpoints-window" role="dialog" aria-modal="true" aria-labelledby={TITLE_ID}>
                <div className="envgen-header">
                    <div className="envgen-header__left">
                        <i className="bi bi-shield-lock envgen-header__icon" aria-hidden="true" />
                        <div>
                            <h2 id={TITLE_ID} className="envgen-header__title">Endpoints</h2>
                            <p className="envgen-header__subtitle">
                                The stand-alone environment: which metaclasses can be edited, and by which role
                            </p>
                        </div>
                    </div>
                    <button type="button" className="envgen-close" onClick={onClose} title="Close without saving" aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="envgen-content endpoints-window__body">
                    {/* R-CFG-8: the arrows sit outside the tablist, which holds tabs only. */}
                    <div className="endpoints-window__tabbar">
                    <button
                        type="button"
                        className="endpoints-window__arrow"
                        aria-label="Previous tab"
                        title="Previous tab"
                        disabled={tabIndex <= 0}
                        onClick={() => selectAt(tabIndex - 1)}
                    >
                        <i className="bi bi-chevron-left" aria-hidden="true" />
                    </button>
                    <div className="endpoints-window__tabs" role="tablist" aria-label="Endpoints">
                        {TABS.map((t, i) => {
                            const selected = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    ref={(el) => { tabRefs.current[t.id] = el; }}
                                    type="button"
                                    role="tab"
                                    id={tabId(t.id)}
                                    aria-selected={selected}
                                    aria-controls={PANEL_ID}
                                    tabIndex={selected ? 0 : -1}
                                    className={`endpoints-window__tab${selected ? ' endpoints-window__tab--active' : ''}`}
                                    onClick={() => onTabChange(t.id)}
                                    onKeyDown={(e) => onTabKeyDown(e, i)}
                                >
                                    <i className={`bi ${t.icon}`} aria-hidden="true" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        className="endpoints-window__arrow"
                        aria-label="Next tab"
                        title="Next tab"
                        disabled={tabIndex >= TABS.length - 1}
                        onClick={() => selectAt(tabIndex + 1)}
                    >
                        <i className="bi bi-chevron-right" aria-hidden="true" />
                    </button>
                    </div>

                    <div className="endpoints-window__panel" role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(tab)}>
                        {tab === 'metaclasses' ? <MetaclassesStep /> : <ProfilesStep />}
                    </div>
                </div>

                <div className="envgen-footer">
                    <div className="envgen-footer__left" />
                    <div className="envgen-footer__right">
                        <button type="button" className="envgen-btn envgen-btn--secondary" onClick={onClose} title="Close without saving">
                            Cancel
                        </button>
                        <button type="button" className="envgen-btn envgen-btn--primary" onClick={done}>
                            <i className="bi bi-check-lg" /> Done
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default EndpointsWindow;
