import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {
    Defaults,
    DState,
    DViewElement,
    DViewPoint,
    LPointerTargetable,
    LProject,
    LViewElement,
    LViewPoint,
    Pointer,
    Try,
    U
} from '../../../joiner';
import InfoData from './data/InfoData';
import TemplateData from './data/TemplateData';
import EventsData from './data/CustomData';
import {FakeStateProps, Overlap} from "../../../joiner/types";
import {connect} from "react-redux";
import PaletteData from "./data/PaletteData";
import GenericNodeData from "./data/GenericNodeData";

import {Btn, CommandBar} from '../../commandbar/CommandBar';
import "./nestedView.scss";
import {ComponentsTab} from "./data/ComponentsTab";
import {VertexAuthoringPanel} from "../../editor-v2/viewpoint/authoring/VertexAuthoringPanel";
import {RowAuthoringPanel} from "../../editor-v2/viewpoint/authoring/RowAuthoringPanel";
import {EdgeAuthoringPanel} from "../../editor-v2/viewpoint/authoring/EdgeAuthoringPanel";
import {EnableIRPanel} from "../../editor-v2/viewpoint/authoring/EnableIRPanel";
import {SymbolCard} from "../../editor-v2/viewpoint/authoring/SymbolCard";
import {HelpText} from "../../ui";
import {JjodelEvents} from "../../../events/registry";
import {
    IR_TAB_LABELS,
    irTabsForKind,
    type IRAuthoringKind,
    type IRTabId
} from "../../editor-v2/viewpoint/authoring/irTabs";

type TabId = 'apply-to' | 'template' | 'style' | 'events' | 'options' | 'components' | 'ir' | IRTabId;

interface TabDescriptor {
    id: TabId;
    label: string;
    render: () => ReactElement;
}

function ViewDataComponent(props: AllProps) {
    const view = props.view;
    (window as any).view = view;
    const viewpoints = props.viewpoints;
    const debug = props.debug;
    const readOnly = !debug && Defaults.check(view.id);

    const isVP: boolean = view.className === DViewPoint.cname;
    const isV: boolean = !isVP;

    // IR tab visibility: vertex-IR views get the authoring panel; plain non-edge
    // views without an IR yet get the enable entry-point. Classic edge-views,
    // graphVertex-IR views and viewpoints get no IR tab.
    const ir = (view as any).ir;
    // vertex-IR → authoring panel; row-IR → row authoring panel (R3);
    // edge-IR → edge authoring panel (E-ref); plain non-edge views without an IR yet
    // → enable entry-point. Note: `view.isEdge` (classic jsxString edge-view marker)
    // is unrelated to `ir.kind === 'edge'` — an IR edge view is authored on a normal
    // (non-edge) view, so the `view.isEdge !== true` clause stays on the enable branch.
    const showIRTab = (ir?.kind === 'vertex') || (ir?.kind === 'row') || (ir?.kind === 'edge') || (isV && !ir && view.isEdge !== true);

    // Legacy view (no `ir`): its jsxString has no interpreter left after the classic
    // shutdown (Fase 5a), so the Template tab is opened READ-ONLY with an inert-runtime
    // notice. The tab is deliberately still mounted: the template is the only surviving
    // trace of the original notation, and hiding it would destroy that information.
    // IR-authored views are untouched by this (they keep whatever `readOnly` they had).
    const templateLegacy = isV && !ir;

    // Five-tab partition (ratifica 2026-08-04): a view carrying an `ir` of an
    // authorable kind gets its own bar — Applies to · Structure · Appearance · Text ·
    // Source — which REPLACES the legacy one. The legacy tab descriptors below are
    // left exactly where they are and simply stop being reachable for those views;
    // slice 1.6 removes them. A view without an `ir` keeps the legacy bar untouched,
    // IR entry-point (EnableIRPanel) included.
    const irKind: IRAuthoringKind | undefined =
        (ir?.kind === 'vertex' || ir?.kind === 'row' || ir?.kind === 'edge') ? ir.kind : undefined;

    // The authoritative controls of the legacy Apply-to tab move into the IR
    // `Applies to` body (R-H): this is what they need beyond the view itself, and it
    // is the single extra prop the panels take for them.
    const identity = { viewpoints, readOnly };

    // Every IR tab renders the SAME panel element, differing only by `activeTab`:
    // React reconciles by type and position, so switching tab updates a prop instead
    // of remounting. That is what keeps the panel's single draft, its 300 ms debounce
    // and (on the edge) the endpoint state alive across tab changes — strada B, R-A.
    const renderIRPanel = (id: IRTabId): ReactElement => (
        <Try>
            {irKind === 'vertex'
                ? <VertexAuthoringPanel view={view} activeTab={id} identity={identity} />
                : irKind === 'row'
                    ? <RowAuthoringPanel view={view} activeTab={id} identity={identity} />
                    : <EdgeAuthoringPanel view={view} activeTab={id} identity={identity} />}
        </Try>
    );

    // Build the tab list. Each `render` closure captures the current view/readonly
    // so the children stay in sync with Redux updates.
    const tabs: TabDescriptor[] = irKind ? irTabsForKind(irKind, props.advanced).map((id) => ({
        id,
        label: IR_TAB_LABELS[id],
        // The Symbol tab is the light identity card (D15), not an authoring body:
        // the anatomy is re-hosted by SymbolEditorModal on the same panel.
        render: () => id === 'ir-symbol'
            ? <Try><SymbolCard view={view} /></Try>
            : renderIRPanel(id),
    })) : [
        {
            id: 'apply-to',
            label: 'Apply to',
            render: () => (
                <Try>
                    <InfoData viewID={view.id} viewpointsID={viewpoints.map(vp => vp.id)} readonly={readOnly} />
                </Try>
            ),
        },
        ...(isV ? [{
            id: 'template' as TabId,
            label: 'Template',
            render: () => (
                <Try>
                    <TemplateData viewID={view.id} readonly={readOnly || templateLegacy} legacyNoIR={templateLegacy} />
                </Try>
            ),
        }] : []),
        ...(showIRTab ? [{
            id: 'ir' as TabId,
            label: 'IR',
            render: () => (
                <Try>
                    {ir?.kind === 'vertex'
                        ? <VertexAuthoringPanel view={view} />
                        : ir?.kind === 'row'
                            ? <RowAuthoringPanel view={view} />
                            : ir?.kind === 'edge'
                                ? <EdgeAuthoringPanel view={view} />
                                : ir
                                    ? (
                                        <section className="properties-tab properties-panel">
                                            <div className="jj-field-label" style={{ marginTop: 4 }}>IR authoring</div>
                                            <HelpText>View IR of kind "{ir.kind}": authoring not available yet.</HelpText>
                                        </section>
                                    )
                                    : <EnableIRPanel view={view} />}
                </Try>
            ),
        }] : []),
        {
            id: 'style',
            label: 'Style',
            render: () => (
                <Try>
                    <PaletteData viewID={view.id} readonly={readOnly} />
                </Try>
            ),
        },
        ...(isV ? [{
            id: 'events' as TabId,
            label: 'Events',
            render: () => (
                <Try>
                    <EventsData viewID={view.id} readonly={readOnly} />
                </Try>
            ),
        }] : []),
        ...(isV ? [{
            id: 'options' as TabId,
            label: 'Options',
            render: () => (
                <Try>
                    <GenericNodeData viewID={view.id} readonly={readOnly} />
                </Try>
            ),
        }] : []),
        ...(isVP ? [{
            id: 'components' as TabId,
            label: 'Components',
            render: () => (
                <Try>
                    <ComponentsTab viewID={view.id} readonly={readOnly} />
                </Try>
            ),
        }] : []),
    ];

    // Active tab state. Defaults to the first tab in the list (always 'apply-to').
    const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);

    // Cross-tab navigation asked for from inside a body (the Form tab's «Edit
    // compartments»). Two instances of this panel can be mounted at once (the
    // Properties card and the standalone NestedView host), so the event is filtered on
    // the view it names; a tab absent from the CURRENT list is ignored rather than
    // activated, which would leave every body hidden and the panel blank.
    const tabIds = tabs.map(t => t.id).join(',');
    useEffect(() => {
        const onTab = (e: Event) => {
            const detail = (e as CustomEvent<{ viewId?: string; tab?: string }>).detail;
            if (!detail || detail.viewId !== view.id) return;
            if (!tabIds.split(',').includes(detail.tab ?? '')) return;
            setActiveTab(detail.tab as TabId);
        };
        window.addEventListener(JjodelEvents.IR_AUTHORING_TAB, onTab);
        return () => window.removeEventListener(JjodelEvents.IR_AUTHORING_TAB, onTab);
    }, [view.id, tabIds]);

    // Fallback: if the currently-active tab is not in the list (e.g. switched
    // from a view to a viewpoint), snap to the first available.
    const activeDescriptor = tabs.find(t => t.id === activeTab) ?? tabs[0];

    // Who owns the way out is the host's business, not this panel's. Inside the
    // Properties card the way out is the Tree right above it — selecting anything
    // else replaces the panel — so the card asks for no back. The standalone
    // NestedView host has no such tree: there the back IS the only way from the
    // view editor to the viewpoint list, so it stays (default).
    const showBack = props.showBack !== false;

    return (
        <div className={"view-editor-root"}>
            <div className={'view-editor-header view-entity-header'}>
                {/* Context row — the element being edited + its type badge, and the back
                    button when the host asks for it. The ancestor chain was dropped
                    (2026-07-30): the Tree card sitting right above the Properties card
                    already exposes it, so repeating it here only cost width. The portal
                    towards `.properties-panel-header__actions` was retired (Q4): its
                    lookup was a global `document.querySelector` with empty deps — not
                    scoped to its own container, and unable to follow a remount of the
                    header. The card's contextual help now belongs to the host row. */}
                <div className="props-header props-header--view">
                    {showBack && (
                        <CommandBar>
                            <Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/>
                        </CommandBar>
                    )}
                    <div className={"path-list"}>
                        <div className={"path-element"}>{U.cropStr(view.name, 1, 1, 10, 10)}</div>
                    </div>
                    <span className={`jj-type-badge ${isVP ? 'jj-type-badge--viewpoint' : 'jj-type-badge--view'}`}>
                        {isVP ? 'VIEWPOINT' : 'VIEW'}
                    </span>
                </div>
            </div>

            <div className={"view-editor-tabs"}>
                <div className={"view-editor-tab-bar"} role="tablist">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeDescriptor.id === tab.id}
                            className={`view-editor-tab${activeDescriptor.id === tab.id ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className={"view-editor-tab-content"} role="tabpanel">
                    {activeDescriptor.render()}
                </div>
            </div>
        </div>
    );
}
interface OwnProps {
    viewid: Pointer<DViewElement>;
    viewpoints: Pointer<DViewPoint>[];
    setSelectedView: React.Dispatch<React.SetStateAction<Pointer<DViewElement> | undefined>>;// (val: LViewElement | undefined) => {}
    /** Back button in the context row. Defaults to true; the Properties card sets it
     *  to false because the Tree above the card already navigates away. */
    showBack?: boolean;
}
interface StateProps {
    view: LViewElement;
    project: LProject;
    viewpoints: LViewPoint[];
    debug: boolean;
    // Global disclosure mode. Read here (and not only inside the panels) because the
    // Source tab is gated on it at BAR level: in Basic the tab is not offered at all.
    advanced: boolean;
}
interface DispatchProps { }
type AllProps = Overlap<OwnProps, StateProps> & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    // const user = LUser.fromPointer(DUser.current, state);
    // ret.project = LProject.getProject();
    ret.viewpoints = LPointerTargetable.fromArr(ownProps.viewpoints); // ret.project.viewpoints;
    ret.debug = state.debug;
    ret.advanced = !!(state as any).advanced;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewid, state);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewDataComponent);

export const ViewData = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ViewDataConnected {...{...props, children}} />;
}
