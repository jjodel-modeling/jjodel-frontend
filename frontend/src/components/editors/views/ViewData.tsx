import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
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
import HelpButton from '../../HelpButton';
import "./nestedView.scss";
import {ComponentsTab} from "./data/ComponentsTab";
import {VertexAuthoringPanel} from "../../editor-v2/viewpoint/authoring/VertexAuthoringPanel";
import {RowAuthoringPanel} from "../../editor-v2/viewpoint/authoring/RowAuthoringPanel";
import {EdgeAuthoringPanel} from "../../editor-v2/viewpoint/authoring/EdgeAuthoringPanel";
import {EnableIRPanel} from "../../editor-v2/viewpoint/authoring/EnableIRPanel";
import {HelpText} from "../../ui";

type TabId = 'apply-to' | 'template' | 'style' | 'events' | 'options' | 'components' | 'ir';

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

    // Build the tab list. Each `render` closure captures the current view/readonly
    // so the children stay in sync with Redux updates.
    const tabs: TabDescriptor[] = [
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
                    <TemplateData viewID={view.id} readonly={readOnly} />
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
                                            <HelpText>View IR di kind "{ir.kind}": authoring non ancora disponibile.</HelpText>
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

    // Fallback: if the currently-active tab is not in the list (e.g. switched
    // from a view to a viewpoint), snap to the first available.
    const activeDescriptor = tabs.find(t => t.id === activeTab) ?? tabs[0];

    // Context actions (back + help) are hosted by the Properties card header, so the
    // card shows a single header row and the context row carries only the breadcrumb.
    // The slot is looked up after mount — on the first render the header is committed
    // but not yet queryable. When there is no slot (the standalone NestedView host,
    // which owns no such header) the actions render inline, exactly as before.
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setHeaderSlot(document.querySelector<HTMLElement>('.properties-panel-header__actions'));
    }, []);

    const headerActions = (
        <>
            <CommandBar>
                <Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/>
            </CommandBar>
            <HelpButton helpKey="properties-panel" />
        </>
    );

    return (
        <div className={"view-editor-root"}>
            <div className={'view-editor-header view-entity-header'}>
                {/* Context row — the element being edited + its type badge. The ancestor
                    chain was dropped (2026-07-30): the Tree card sitting right above the
                    Properties card already exposes it, so repeating it here only cost
                    width. Back and help moved to the card header row (`headerActions`). */}
                <div className="props-header props-header--view">
                    {headerSlot ? createPortal(headerActions, headerSlot) : headerActions}
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
}
interface StateProps {
    view: LViewElement;
    project: LProject;
    viewpoints: LViewPoint[];
    debug: boolean;
}
interface DispatchProps { }
type AllProps = Overlap<OwnProps, StateProps> & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    // const user = LUser.fromPointer(DUser.current, state);
    // ret.project = LProject.getProject();
    ret.viewpoints = LPointerTargetable.fromArr(ownProps.viewpoints); // ret.project.viewpoints;
    ret.debug = state.debug;
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
