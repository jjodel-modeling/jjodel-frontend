/* Viewpoints */

import React, {Dispatch, JSX, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import {
    DState,
    DUser,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    DPointerTargetable,
    DViewElement,
    DViewPoint,
    GObject,
} from '../../../joiner';
import {
    Defaults,
    Input,
    L,
    TRANSACTION,
    U,
    windoww
} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {Dictionary, FakeStateProps} from '../../../joiner/types';
import {GenericTree} from "../../forEndUser/Tree";
import "./nestedView.scss"
import {ViewData} from './ViewData';
import {Tooltip} from "../../forEndUser/Tooltip";
import {Btn, CommandBar, Sep} from '../../commandbar/CommandBar';
import {InternalToggle} from '../../widgets/Widgets';
import {VersionFixer} from "../../../redux/VersionFixer";
import ActivityLogger from '../../../services/ActivityLogger';
import { ActivityType } from '../../../types/activity';
import { LockedFeature } from '../../ModeSystem';

type Metadata = {setView: (p: Pointer)=>any, scoreBoost: number}
function NestedViewComponent(props: AllProps) {
    let [forceUpdate, setForceUpdate] = useState(0);
    const project = props.project;
    const viewpoints = props.viewpoints;
    const active = props.active;

    const editName = (evt: React.ChangeEvent<HTMLInputElement>, vp: LViewElement) => { vp.name = evt.target.value; }
    const addVP = () => {
        let name = 'viewpoint_' + 0;
        let viewpointNames: string[] = viewpoints.map(vp => vp && vp.name);
        name = U.increaseEndingNumber(name, false, false, newName => viewpointNames.indexOf(newName) >= 0);
        DViewPoint.newVP(name);
    }
    const deleteV = (e: React.MouseEvent, viewPoint: LViewElement) => {
        e.stopPropagation();
        TRANSACTION('delete ' + viewPoint.name, ()=>{
            // viewPoint.subViews.map(v => v.delete());
            viewPoint.delete();
            // SetFieldAction.new(project.id, 'viewpoints', viewPoint.id as any, '-=', false);
        });
    }
    const deleteVP = (e: React.MouseEvent, viewPoint: LViewPoint) => {
        e.stopPropagation();
        TRANSACTION('delete viewpoint '+viewPoint.name, ()=>{
            // viewPoint.subViews.map(v => v.delete());
            viewPoint.delete();
            // SetFieldAction.new(project.id, 'viewpoints', viewPoint.id as any, '-=', false);
        });
    }


    // function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    //     const ret: StateProps = {} as FakeStateProps;
    //     // const user = LUser.fromPointer(DUser.current, state);
    //     // ret.project = user.project as LProject;
    //     ret.priority = L.fromArr(ownProps.priority); // ret.project.viewpoints;
    //     ret.debug = state.debug;
    //     ret.view = L.fromPointer(ownProps.viewid, state);
    //     return ret;
    // }

    const getSubElements = (v: DViewElement) => v?.subViews || {}; //
    let activeViewpointId: Pointer<DPointerTargetable> = project.activeViewpoint.id;

    let [collapseAll, setCollapseAll] = useState<boolean | undefined>( undefined );
function renderEntry(d: DViewElement, childrens: GObject, isExpanded: boolean, toggleExpansion: () => any, depth: number, path: number[], metadata?: Metadata): ReactNode {
        if (!d) return null;
        let appliableTo: string;

        if (collapseAll !== undefined && collapseAll === isExpanded) toggleExpansion();
        let expandClick = () => {
            setCollapseAll(undefined);
            toggleExpansion();
        }

        if (d.appliableToClasses.length === 1) appliableTo = d.appliableToClasses[0].substring(1);
        else if (d.appliableToClasses.length === 0) appliableTo = d.appliableTo;
        else appliableTo = "Any";
        appliableTo = U.replaceAll(appliableTo, "Void", "");
        let parr = Object.keys(childrens);
        let scoreBoost = metadata?.scoreBoost || 0;
        let l: LViewElement = L.fromD(d);

        const preventClick = (e: any) => e.stopPropagation();
        let isVP = d.className === DViewPoint.cname;
        let isDefault = d.id.indexOf('Pointer_View') === 0;
        let isOverlay = isVP && !d.isExclusiveView;
        let isExclusive = isVP && d.isExclusiveView;

        function select(ptr: Pointer<DViewPoint>) {
            const previousViewpoint = project.activeViewpoint;
            project.activeViewpoint = ptr as any;

            if (ptr !== previousViewpoint?.id) {
                try {
                    const viewpointName = d.name || 'Unnamed Viewpoint';
                    ActivityLogger.log({
                        type: ActivityType.VIEWPOINT_CHANGED,
                        projectId: project.id,
                        projectName: project.name || 'Unnamed Project',
                        entityId: ptr as string,
                        entityName: viewpointName,
                    });
                } catch (e) {
                    console.warn('Failed to log viewpoint change activity:', e);
                }
            }
        }

        let appliableToEnhanced = (d.name === 'Singleton' ? 'Singleton' : appliableTo);
        let isActive = d.id === activeViewpointId;
        let canDelete = !isActive && !isDefault;

        // ============================================
        // VIEWPOINT RENDERING (Box container)
        // ============================================
        if (isVP) {
            return (
                <li className={`viewpoint-box ${isActive ? 'viewpoint-box--active' : ''} ${isOverlay ? 'viewpoint-box--overlay' : 'viewpoint-box--exclusive'}`} key={d.id}>
                    {/* Viewpoint Header */}
                    <div className="viewpoint-box__header" onClick={() => setView(d.id)}>
                        
                        <div className="viewpoint-box__header-left">
                            {/* Radio for Exclusive, Checkbox for Overlay */}
                            {isExclusive ? (
                                <label className="viewpoint-radio" onClick={preventClick}>
                                    <input
                                        type="radio"
                                        name="active-viewpoint"
                                        checked={isActive}
                                        onChange={() => select(d.id)}
                                    />
                                    <span className="viewpoint-radio__custom"></span>
                                </label>
                            ) : (
                                <label className="viewpoint-checkbox" onClick={preventClick}>
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => {/* TODO: overlay selection logic */}}
                                    />
                                  
                                </label>
                            )}
                            
                            {/* VP Badge */}
                            <div className={`icon type DViewPoint ${isOverlay ? 'overlay' : 'exclusive'}`}>
                                VP
                            </div>
                            
                            {/* Viewpoint Name */}
                            <span className="viewpoint-box__name">{d.name || 'Unnamed'}</span>
                        </div>
                        
                        <div className="viewpoint-box__header-right">
                            {/* Expand/Collapse */}
                            {parr.length > 0 && (
                                <button className="viewpoint-box__toggle" onClick={(e) => { preventClick(e); expandClick(); }}>
                                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
                                </button>
                            )}
                            
                            {/* EX/OV Badge */}
                            <span className={`viewpoint-badge ${isExclusive ? 'viewpoint-badge--exclusive' : 'viewpoint-badge--overlay'}`}>
                                {isExclusive ? 'EX' : 'OV'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Viewpoint Content (Views) */}
                    {isExpanded && parr.length > 0 && (
                        <div className="viewpoint-box__content">
                            <ul>
                                {parr.map((ptr, i) => (
                                    <GenericTree
                                        key={ptr}
                                        data={DPointerTargetable.from(ptr)}
                                        getSubElements={getSubElements}
                                        renderEntry={renderEntry}
                                        depth={depth + 1}
                                        path={[...path, i]}
                                        metadata={{ setView: metadata?.setView, scoreBoost: childrens[ptr] } as Metadata}
                                        initialHidingState={true}
                                    />
                                ))}
                            </ul>
                        </div>
                    )}
                </li>
            );
        }

        // ============================================
        // VIEW RENDERING (Inside viewpoint box)
        // ============================================
        return (
            <li className={`view-entry ${view === d.id ? 'view-entry--selected' : ''}`} key={d.id}>
                <div className="view-entry__row" onClick={() => setView(d.id)}>
                    {/* Left: Expand + Icon + Name */}
                    <div className="view-entry__left">
                        {/* Expand toggle */}
                        <div className="view-entry__toggle" onClick={preventClick}>
                            {parr.length >= 1 ? (
                                <i 
                                    className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} 
                                    onClick={expandClick}
                                />
                            ) : (
                                <span className="view-entry__toggle-spacer" />
                            )}
                        </div>
                        
                        {/* Type Icon */}
                        <div className={`icon type tree-${appliableToEnhanced} ${d.className}`}>
                            {appliableToEnhanced.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* View Name */}
                        <span className="view-entry__name">{d.name || 'Unnamed'}</span>
                    </div>
                    
                    {/* Right: Priority + Badges */}
                    <div className="view-entry__right">
                        {props.isAdvanced && d.isExclusiveView && (
                            <div className="view-entry__priority" onClick={preventClick}>
                                <span className="priority">priority: {l.explicitApplicationPriority}</span>
                                <i className="bi bi-x priority-clear" onClick={() => { l.explicitApplicationPriority = undefined as any; }}></i>
                                <Input
                                    type="number"
                                    className="priority-booster digits3"
                                    inputClassName="priority-booster-input"
                                    readOnly={false}
                                    data={l}
                                    getter={() => scoreBoost + ''}
                                    setter={(v) => { let pv = l.father; if (pv) pv.subViews = { ...pv.__raw.subViews, [d.id]: +v } as any }}
                                />
                            </div>
                        )}
                        
                        {/* Feature Badges */}
                        <div className="view-entry__badges">
                            <span className={`feature-badge feature-badge--ocl ${d.oclCondition?.length ? '' : 'feature-badge--inactive'}`}>OCL</span>
                            <span className={`feature-badge feature-badge--js ${d.jsCondition?.length ? '' : 'feature-badge--inactive'}`}>JS</span>
                            <span className={`feature-badge feature-badge--ex ${d.isExclusiveView ? '' : 'feature-badge--inactive'}`}>EX</span>
                        </div>
                    </div>
                </div>
                
                {/* Nested Views */}
                {isExpanded && parr.length > 0 && (
                    <ul className="view-entry__children">
                        {parr.map((ptr, i) => (
                            <GenericTree
                                key={ptr}
                                data={DPointerTargetable.from(ptr)}
                                getSubElements={getSubElements}
                                renderEntry={renderEntry}
                                depth={depth + 1}
                                path={[...path, i]}
                                metadata={{ setView: metadata?.setView, scoreBoost: childrens[ptr] } as Metadata}
                                initialHidingState={true}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    function renderEntry2(e: DViewElement, childrens: Dictionary<Pointer, number>, isExpanded: boolean,
                         toggleExpansion: ()=>any, depth: number, path: number[], metadata: Metadata): ReactNode {
        let d = e;
        let appliableTo: string;
        if (!d) return null;

        if (collapseAll !== undefined && collapseAll === isExpanded) toggleExpansion();
        let expandClick = () => {
            setCollapseAll(undefined);
            toggleExpansion();
        }

        if (d.appliableToClasses.length === 1) appliableTo = d.appliableToClasses[0].substring(1);
        else if (d.appliableToClasses.length === 0) appliableTo = d.appliableTo;
        else appliableTo = "Any";
        appliableTo = U.replaceAll(appliableTo, "Void", "");
        let parr = Object.keys(childrens);
        let scoreBoost = metadata?.scoreBoost || 0;
        let l: LViewElement = L.fromD(d);

        const preventClick = (e: any)=>e.stopPropagation();
        let isVP = d.className === DViewPoint.cname;
        let isDefault = d.id.indexOf('Pointer_View') === 0;

        function select(ptr: Pointer<DViewPoint>){
            const previousViewpoint = project.activeViewpoint;
            project.activeViewpoint = ptr as any;

            // Log activity for viewpoint change
            if (ptr !== previousViewpoint?.id) {
                try {
                    const viewpointName = d.name || 'Unnamed Viewpoint';
                    ActivityLogger.log({
                        type: ActivityType.VIEWPOINT_CHANGED,
                        projectId: project.id,
                        projectName: project.name || 'Unnamed Project',
                        entityId: ptr as string,
                        entityName: viewpointName,
                    });
                } catch (e) {
                    console.warn('Failed to log viewpoint change activity:', e);
                }
            }
        }

        let appliableToEnhanced = (d.name === 'Singleton' ? 'Singleton' : appliableTo);

        let isActive = d.id === activeViewpointId;
        let canDelete = !isActive && !isDefault;
        let vpClass = isVP ? (d.isExclusiveView ? ' exclusive-vp' : ' overlay-vp') : '';
        return <li className={"entry-root " + d.className + (isActive ? ' selected' : '') + vpClass} key={d.id}>

            <div className={'inline-row'} onClick={()=>setView(d.id)} onDoubleClick={(e) => {select(d.id)}}> {/* activate anche con il dblclick */}

                {/* LEFT GROUP - Toggle + Icon + Label */}
                <div className="row-left">
                    <div className={"left-stuff"} onClick={preventClick}>
                        {parr.length >= 1 ?
                            <>
                                <i className={'bi cursor-pointer bi-chevron-' + (isExpanded ? 'down' : 'right')} onClick={expandClick} />
                                {isExpanded && <div className={"expansion-line"} />}
                            </>
                            :
                            <></>
                        }
                    </div>
                    <div className={`icon type tree-${appliableToEnhanced} ${d.className}`}>{
                        isVP ? 'VP' : (appliableToEnhanced === "Any" ? "✲" : appliableToEnhanced[0])
                    }</div>
                    <div className="node-label">{d.name}</div>
                </div>

                {/* RIGHT GROUP - Toggle + Actions + Badges */}
                <div className="row-right">
                    {/* Active Toggle - Always visible for viewpoints */}
                    {isVP && d.isExclusiveView && (
                        <div className="viewpoint-active-toggle" onClick={preventClick}>
                            <Tooltip tooltip={isActive ? 'Active viewpoint' : 'Click to activate'} inline={true} position={'top'} offsetY={10}>
                                <div
                                    className={`vp-toggle ${isActive ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        select(d.id);
                                    }}
                                    role="switch"
                                    aria-checked={isActive}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            select(d.id);
                                        }
                                    }}
                                >
                                    <div className="vp-toggle__thumb"></div>
                                </div>
                            </Tooltip>
                        </div>
                    )}

                    <div className={"hover-stuff"}>
                        <div className={"d-flex"} onClick={preventClick}>
                        {/* Activate button removed - replaced with always-visible toggle above */}


                        <CommandBar style={{transition: '1s 0.3s', marginTop: '2px'}}>
                            {Defaults.check(d.id) && d.version !== VersionFixer.get_highestversion() ?
                                <Btn icon={'bi-arrow-up-square-fill'/*bi-arrow-repeat*/} action={(e)=> {
                                    preventClick(e);
                                    LViewElement.updateDefaultView(d);
                                    // setForceUpdate(forceUpdate+1);
                                }}
                                     tip={
                                    'This view has been edited by the user, but a new version made from the developers is available.' +
                                    '\nIt is suggested to update it and reapply your changes.'} style={{background:'black', color:'gold'}}/>
                                : null
                            }
                            
                            
                            <Tooltip tooltip={isActive ? 'Cannot delete active viewpoint' : (isDefault ? 'Cannot delete default views' : 'Delete' )} inline={true} position={'top'} offsetY={10}>
                                <i onClick={(e)=> { l.delete(); preventClick(e); }} className={'jj jj-delete'} style={{marginRight: '16px'}}/>
                            </Tooltip>

                            <Tooltip tooltip={'Duplicate'} inline={true} position={'top'} offsetY={10}>
                                <i onClick={(e)=> { l.duplicate(); preventClick(e); }} className={'jj jj-copy'}/>
                            </Tooltip>
                            <Tooltip tooltip={'Deep duplication'} inline={true} position={'top'} offsetY={10}>
                                <i onClick={(e)=> { l.duplicate(true); preventClick(e); }} className={'jj jj-deep-copy'}/>
                            </Tooltip>
                        </CommandBar>

                        </div>
                    </div>

                    <div className={"right-stuff"}>
                        <div className={"right-content"} onClick={preventClick} >
                            {
                                isVP ? <>
                                    <div className={"spacer"}/>
                                </> : <>{ props.isAdvanced && d.isExclusiveView && <>
                                    <span className={"priority"}>priority: {l.explicitApplicationPriority} </span><i style={{paddingTop: '4px'}} className="bi bi-x"></i>
                                    <div className={"spacer"}/>
                                    <Input type="number"
                                           className={"change-boost hidden-input priority-booster"}
                                           inputClassName={"change-boost hidden-input"}
                                           readOnly={false}
                                           data={l}
                                           getter={()=>scoreBoost + ''}
                                           setter={(v)=>{let pv = l.father; if (pv) pv.subViews = {...pv.__raw.subViews, [d.id]: +v} as any}}
                                    />
                                </>}
                                    <span className={"right-icon feature-border ocl-icon " + (d.oclCondition.length ? "" : "hidden")}></span>
                                    <span className={"right-icon feature-border js-icon " + (d.jsCondition.length ? "" : "hidden")}></span>
                                </>
                            }
                            <Tooltip tooltip={<div>is {d.isExclusiveView ? "" : "not"} mutually exclusive with other "Ex" views.</div>} position={"bottom"} inline={true}>
                                <span className={"right-icon feature-border ex-icon " + (d.isExclusiveView ? '' : "hidden")}
                                      onClick={()=>l.isExclusiveView = !d.isExclusiveView}
                                /></Tooltip>
                        </div>
                    </div>
                </div>
            </div>

            <ul>{isExpanded && parr.map( (ptr, i) => (
                <GenericTree key={ptr}
                             data={DPointerTargetable.from(ptr)}
                             getSubElements={getSubElements}
                             renderEntry={renderEntry}
                             depth={depth + 1} path={[...path, i]}
                             metadata={{setView:metadata.setView, scoreBoost:childrens[ptr]} as Metadata}
                             initialHidingState={depth < 100}
                    // metadata={{...metadata, depth: metadata.depth + 1, path:[...metadata.path, i], scoreBoost: }}
                />))}</ul>
        </li>;
    }


    let [view, setView] = useStateIfMounted(undefined as (undefined | Pointer<DViewElement>));

    // Basic mode: show locked feature placeholder
    console.log('nestedViewTab', {props, isad:props.isAdvanced});
    if (!props.isAdvanced) {
        return (
            <div className={"view-editor-root"}>
                <section className={'viewpoint-tab'}>
                    {<LockedFeature
                        title="Viewpoints"
                        description="Viewpoints allow you to create custom visual representations for your metamodel elements. Switch to Advanced mode to access this feature."
                        icon="eye"
                        advanced={props.isAdvanced}
                        features={[
                        'Create custom visual templates',
                        'Define conditional styling rules',
                        'Configure element appearance',
                        'Manage multiple viewpoints'
                        ]}
                />}
                </section>
            </div>
        );
    }

    let vieweditor = view && <div className={"single-view-content"}><ViewData key={view} viewid={view} viewpoints={viewpoints.map(v=>v.id)} setSelectedView={setView} /></div>;
    return(<div className={"view-editor-root"}>
        <section className={'viewpoint-tab'}>
            <div className={"view-editor-fullsize-content"}>
                {/* Header - matches Properties style */}
                <div className="viewpoints-header">
                    <div className="viewpoints-header__icon">
                        <i className="bi bi-eye" />
                    </div>
                    <h1 className="viewpoints-header__title">Viewpoints</h1>
                    <div className="viewpoints-header__actions">
                        <button className="btn-new" onClick={addVP} title="Create a new viewpoint">
                            + New
                        </button>
                    </div>
                </div>
                {view ?
                    vieweditor
                    :
                    <ul className={"ps-2 pt-2"}>
                        {viewpoints.map(vp => <GenericTree
                            key={vp.id}
                            data={vp.__raw}
                            getSubElements={getSubElements}
                            renderEntry={renderEntry}
                            metadata={{setView, scoreBoost: 0}}
                            initialHidingState={vp.id === activeViewpointId}/>)}
                    </ul>}
                {}
            </div>
        </section>
    </div>);
}

interface OwnProps {
}
interface StateProps {
    project: LProject;
    viewpoints: LViewPoint[];
    active: LViewPoint;
    isAdvanced: boolean;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    //const user: LUser = LUser.fromPointer(DUser.current, state);
    ret.project = LProject.getProject();
    ret.viewpoints = ret.project.viewpoints.filter( (vp) => !!vp/* && vp.isValidation === ownProps.validation*/);
    ret.active = ret.project.activeViewpoint;
    ret.isAdvanced = state.advanced;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const NestedViewConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NestedViewComponent);

export const NestedView = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <NestedViewConnected {...{...props, children}} />;
}
