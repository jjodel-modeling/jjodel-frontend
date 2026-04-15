import React, {Dispatch, ReactElement, ReactNode, useState} from 'react';
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

type TabId = 'apply-to' | 'template' | 'style' | 'events' | 'options' | 'components';

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
    const viewChain: LViewElement[] = [...view.fatherChain.reverse(), view];

    const isVP: boolean = view.className === DViewPoint.cname;
    const isV: boolean = !isVP;

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

    return (
        <div className={"view-editor-root"}>
            <div className={'view-editor-header'}>
                <CommandBar>
                    <Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/>
                </CommandBar>
                <div className={"path-list"}>{
                    (viewChain.map((v, i) => <>
                        <div className={"path-element"} onClick={()=>props.setSelectedView(v.id)}>
                            {U.cropStr(v.name, 1,1, 10, 10)}
                        </div>
                        {i === viewChain.length - 1 && (
                            <span className={`breadcrumb-type-badge ${isVP ? 'viewpoint' : 'view'}`}>
                                {isVP ? 'VIEWPOINT' : 'VIEW'}
                            </span>
                        )}
                    </>) as any
                    ).separator(
                        <i className={"path-separator bi bi-chevron-right"} />
                    )
                }</div>
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
