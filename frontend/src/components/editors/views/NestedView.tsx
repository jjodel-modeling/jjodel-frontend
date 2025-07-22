/* Viewpoints */

import React, {Dispatch, JSX, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import {
    Defaults,
    DPointerTargetable,
    DState,
    DUser,
    DViewElement,
    DViewPoint,
    Input,
    LPointerTargetable,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
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
    //     ret.priority = LPointerTargetable.fromArr(ownProps.priority); // ret.project.viewpoints;
    //     ret.debug = state.debug;
    //     ret.view = LPointerTargetable.fromPointer(ownProps.viewid, state);
    //     return ret;
    // }

    const getSubElements = (v: DViewElement) => v?.subViews || {}; //
    let activeViewpointId: Pointer<DPointerTargetable> = project.activeViewpoint.id;

    let [collapseAll, setCollapseAll] = useState<boolean | undefined>( undefined );

    function renderEntry(e: DViewElement, childrens: Dictionary<Pointer, number>, isExpanded: boolean,
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
        let l: LViewElement = LPointerTargetable.fromD(d);

        const preventClick = (e: any)=>e.stopPropagation();
        let isVP = d.className === DViewPoint.cname;
        let isDefault = d.id.indexOf('Pointer_View') === 0;

        function select(ptr: Pointer<DViewPoint>){ project.activeViewpoint = ptr as any; }

        let appliableToEnhanced = (d.name === 'Singleton' ? 'Singleton' : appliableTo);

        let isActive = d.id === activeViewpointId;
        let canDelete = !isActive && !isDefault;
        return <li className={"entry-root " + d.className + (isActive ? ' selected' : '')} key={d.id}>

            <div className={'inline-row'} onClick={()=>setView(d.id)} onDoubleClick={(e) => {select(d.id)}}> {/* activate anche con il dblclick */}

                <div className={"left-stuff vertical-centering "} onClick={preventClick}>
                    {parr.length >= 1 ?
                        <>
                            <i style={{fontSize: '0.55em', marginRight: '24px!important'}} className={'bi cursor-pointer d-block my-auto bi-chevron-' + (isExpanded ? 'down' : 'right')} onClick={expandClick} />
                            {isExpanded && <div className={"expansion-line"} />}
                        </>
                        :
                        <></>
                    }
                </div>
                <div className={"mid-stuff vertical-centering"} style={{marginLeft: '8px'}}>
                    <div className={`icon type tree-${appliableToEnhanced} ${d.className}`} style={{width: '24px', height: '24px'}}>{
                        isVP ? 'VP' : (appliableToEnhanced === "Any" ? "✲" : appliableToEnhanced[0])
                    }</div>
                    <div style={{marginLeft: '4px'}}>{d.name}</div>
                </div>
                <div className={"hover-stuff vertical-centering d-flex "}>
                    <div className={"ms-auto d-flex"} onClick={preventClick}>
                        {isVP && d.isExclusiveView &&
                            <CommandBar style={{transition: '1s 0.3s', marginTop: '2px'}}>
                                <Btn icon={'check'} action={() => {select(d.id)}} tip={'Activate'}/>
                            </CommandBar>

                            /* <button className="bg btn-delete my-auto ms-2 green" disabled={active.id === d.id}
                                onClick={(evt) => {select(d.id)}}>
                                <i className='bi bi-check2' />
                            </button>*/
                        }


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
                            <Btn icon={'delete'} action={(e)=> { l.delete(); preventClick(e);}} disabled={!canDelete} tip={
                                isActive ? 'Cannot delete active viewpoint' : (isDefault ? 'Cannot delete default views' : 'Delete' )} />
                            <Tooltip tooltip={'Duplicate'} inline={true} position={'top'} offsetY={10} >
                                <i onClick={(e)=> { l.duplicate(); preventClick(e); }} className={'bx bx-copy'}/>
                            </Tooltip>
                            <Tooltip tooltip={'Deep duplication'} inline={true} position={'top'} offsetY={10} >
                                <i onClick={(e)=> { l.duplicate(true); preventClick(e); }} className={'bx bx-duplicate'}/>
                            </Tooltip>
                        </CommandBar>

                        {/* <button className="bg btn-delete my-auto ms-2 green" onClick={(e)=> { l.duplicate(); preventClick(e);}}><i className='bx bx-duplicate' /></button>
                        <button className="bg btn-delete my-auto ms-2" onClick={(e)=> { l.delete(); preventClick(e);}}><i className="p-1 bi bi-dash" /></button>*/}
                    </div>
                </div>
                <div className={"right-stuff vertical-centering"}>
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
                                <span className={"right-icon feature-border ocl-icon vertical-centering " + (d.oclCondition.length ? "" : "hidden")}></span>
                                <span className={"right-icon feature-border js-icon vertical-centering " + (d.jsCondition.length ? "" : "hidden")}></span>
                            </>
                        }
                        <Tooltip tooltip={<div>is {d.isExclusiveView ? "" : "not"} mutually exclusive with other "Ex" views.</div>} position={"bottom"} inline={true}>
                            <span className={"right-icon feature-border ex-icon vertical-centering " + (d.isExclusiveView ? '' : "hidden")}
                                  onClick={()=>l.isExclusiveView = !d.isExclusiveView}
                            /></Tooltip>
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
    let vieweditor = view && <div className={"single-view-content"}><ViewData key={view} viewid={view} viewpoints={viewpoints.map(v=>v.id)} setSelectedView={setView} /></div>;
    return(<div className={"view-editor-root"}>
        <section className={'viewpoint-tab'}>
            <div className={"view-editor-fullsize-content"}>
                <div className={'d-flexd-flex'}>
                    <h1>
                        Viewpoints
                        <CommandBar style={{float: 'right'}}>
                            <Btn icon={'shrink'} active={collapseAll}         action={() => {setCollapseAll(true)}}  tip={'Collapse all'} />
                            <Btn icon={'expand'} active={collapseAll===false} action={() => {setCollapseAll(false)}} tip={'Expand all'}   />
                            <Sep />
                            <Btn icon={'add'} action={addVP} tip={'Create a new viewpoint'} />
                        </CommandBar>
                    </h1>
                </div>
                {vieweditor}
                <ul className={"ps-2 pt-2"}>
                    {viewpoints.map(vp=><GenericTree
                        key={vp.id}
                        data={vp.__raw}
                        getSubElements={getSubElements}
                        renderEntry={renderEntry}
                        metadata={{setView, scoreBoost:0}}
                        initialHidingState={vp.id === activeViewpointId} />)}
                </ul>
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
    const user: LUser = LUser.fromPointer(DUser.current, state);
    ret.project = user.project as LProject;
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
