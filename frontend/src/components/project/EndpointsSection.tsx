/**
 * EndpointsSection — #186 (P-2026-10-14-1101): the project page's ENDPOINTS section, the one
 * place where the stand-alone environment is configured (R-CFG-4). Two tabs mount the wizard's
 * steps as they are: «Editable metaclasses» (MetaclassesStep) and «Roles» (ProfilesStep). The
 * steps read and write the project-state config themselves and create it at the first write, so
 * a project opened without an environment does not get one.
 *
 * Developer only. ProjectEditor stays mounted under the consumer's Configurator page (measured,
 * docs/discovery/discovery_2026-10-14_186_endpoints.md §4.5), so the section renders nothing
 * while a `?profile=` is in the hash, re-read on hashchange as LeftBar and Dashboard do.
 */
import React, { useEffect, useRef, useState } from 'react';
import DockManager from '../abstract/DockManager';
import { MetaclassesStep } from '../envgen/steps/MetaclassesStep';
import { ProfilesStep } from '../envgen/steps/ProfilesStep';
import { isConsumerMode } from '../environment/consumerMode';
// The steps' `envgen-*` rules are global and live with the wizard; imported here too so the
// section does not depend on ProjectEditor importing the wizard.
import '../envgen/EnvGenWizardModal.scss';
import './EndpointsSection.scss';

/** The section's element id, beside `section-viewpoints` and `section-documentation`. */
export const ENDPOINTS_SECTION_ID = 'section-endpoints';

type EndpointsTab = 'metaclasses' | 'roles';

const TABS: Array<{ id: EndpointsTab; label: string; icon: string }> = [
    { id: 'metaclasses', label: 'Editable metaclasses', icon: 'bi-grid-1x2' },
    { id: 'roles', label: 'Roles', icon: 'bi-people' },
];

const PANEL_ID = 'endpoints-panel';
const tabId = (tab: EndpointsTab) => `endpoints-tab-${tab}`;

/**
 * Brings the Endpoints section into view. The project page's tab is activated first: the rail is
 * also visible on the Documentation tab, and an inactive pane is laid out off-screen
 * (`DockManager.activateProjectSummary`). The scroll waits two frames for the activated pane.
 */
export function revealEndpointsSection(): void {
    DockManager.activateProjectSummary();
    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.getElementById(ENDPOINTS_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
}

/** The ENDPOINTS section of the project page: a tablist over the two environment steps. */
const EndpointsSection: React.FC = () => {
    const [tab, setTab] = useState<EndpointsTab>('metaclasses');
    const tabRefs = useRef<Partial<Record<EndpointsTab, HTMLButtonElement | null>>>({});

    // isConsumerMode() reads the hash live, but this component re-renders only with the project
    // page: subscribe to hashchange so adding or removing `?profile=` shows or hides the section.
    const [, forceHashTick] = useState(0);
    useEffect(() => {
        const onHash = () => forceHashTick((t) => t + 1);
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    if (isConsumerMode()) return null;

    // Roving tabindex: the arrows, Home and End move the selection and the focus together.
    const selectAt = (index: number) => {
        const next = TABS[(index + TABS.length) % TABS.length];
        setTab(next.id);
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

    return (
        <div className="project-section endpoints-section" id={ENDPOINTS_SECTION_ID}>
            <div className="project-section-header">
                <h2 className="project-section-header__title">ENDPOINTS</h2>
            </div>

            <div className="endpoints-section__tabs" role="tablist" aria-label="Endpoints">
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
                            className={`endpoints-section__tab${selected ? ' endpoints-section__tab--active' : ''}`}
                            onClick={() => setTab(t.id)}
                            onKeyDown={(e) => onTabKeyDown(e, i)}
                        >
                            <i className={`bi ${t.icon}`} aria-hidden="true" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div className="endpoints-section__panel" role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(tab)}>
                {tab === 'metaclasses' ? <MetaclassesStep /> : <ProfilesStep />}
            </div>
        </div>
    );
};

export default EndpointsSection;
