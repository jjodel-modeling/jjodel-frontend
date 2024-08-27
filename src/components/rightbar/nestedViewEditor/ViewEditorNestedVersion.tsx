/* Viewpoints */


import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {
    DPointerTargetable,
    DState,
    DViewElement,
    Input, LPointerTargetable,
    LViewElement,
    Pointer,
    TRANSACTION,
    windoww
} from '../../../joiner';
import {DUser, DViewPoint, LProject, LUser, LViewPoint, U, SetFieldAction} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {Dictionary, FakeStateProps} from '../../../joiner/types';
import {add} from "lodash";
import Tree, {GenericTree} from "../../forEndUser/Tree";
import "./VPNestedTree.scss"
import ViewData from '../viewsEditor/View';
import {Tooltip} from "../../forEndUser/Tooltip";
import { CommandBar, Btn, Sep } from '../../commandbar/CommandBar';
import { Toggle } from '../../widgets/Widgets';


// import "./tree.scss" already imported by <Tree> subcomponent
type Metadata = {setView: (p: Pointer)=>any, scoreBoost: number}
function NestedViewComponent(props: AllProps) {
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
        TRANSACTION(()=>{
            // viewPoint.subViews.map(v => v.delete());
            viewPoint.delete();
            // SetFieldAction.new(project.id, 'viewpoints', viewPoint.id as any, '-=', false);
        });
    }
    const deleteVP = (e: React.MouseEvent, viewPoint: LViewPoint) => {
        e.stopPropagation();
        TRANSACTION(()=>{
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

    const activateVP = (viewPoint: LViewPoint) => { project.activeViewpoint = viewPoint; }
    const clone = (v: LViewElement) => { v.duplicate(true); }
    const getSubElements = (v: DViewElement) => v.subViews || {};
    let activeViewpointId: Pointer<DPointerTargetable> = project.activeViewpoint.id;

    function renderEntry(e: DViewElement, childrens: Dictionary<Pointer, number>, isExpanded: boolean, toggleExpansion: ()=>any, depth: number, path: number[], metadata: Metadata): JSX.Element{
        let d = e;
        let appliableTo: string;
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

        
        
        const max_priority = l.explicitApplicationPriority 

        return <li className={"entry-root" + d.className + (d.id === activeViewpointId ? ' selected' : '')} key={d.id}>

            <div className={'inline-row'} onClick={()=>!isVP && setView(d.id)} onDoubleClick={(e) => {select(d.id)}}> {/* activate anche con il dblclick */}
                
                <div className={"left-stuff vertical-centering "} onClick={preventClick}>
                    {parr.length >= 1 ?
                        <>
                            <i style={{fontSize: '0.55em', marginRight: '24px!important'}} className={'bi cursor-pointer d-block my-auto bi-chevron-' + (isExpanded ? 'down' : 'right')} onClick={toggleExpansion} />
                            {isExpanded && <div className={"expansion-line"} />}
                        </>
                        :
                        <></>
                    }
                </div>
                <div className={"mid-stuff vertical-centering"} style={{marginLeft: '8px'}}>
                    <div className={`icon type tree-${appliableTo} ${d.className}`} style={{width: '24px', height: '24px'}}>{
                        isVP ? 'VP' : (appliableTo === "Any" ? "✲" : appliableTo[0])
                    }</div>
                    <div style={{marginLeft: '4px'}}>{d.name}</div>
                </div>
                <div className={"hover-stuff vertical-centering d-flex "}>
                    <div className={"ms-auto d-flex"} onClick={preventClick}>
                        {isVP && 
                            <CommandBar style={{transition: '1s 0.3s', marginTop: '2px'}}>
                                <Btn icon={'check'} action={(evt) => {select(d.id)}} tip={'Activate'}/>
                            </CommandBar>
                            
                                /* <button className="bg btn-delete my-auto ms-2 green" disabled={active.id === d.id}
                                    onClick={(evt) => {select(d.id)}}>
                                    <i className='bi bi-check2' />
                                </button>*/
                        }
                            
                        
                        <CommandBar style={{transition: '1s 0.3s', marginTop: '2px'}}>
                            <Btn icon={'delete'} action={(e)=> { l.delete(); preventClick(e); alert(l)}} tip={'Delete'}/> {/* todo per damiano, la cancellazione non funziona*/}
                            <Btn icon={'copy'} action={(e)=> { l.duplicate(); preventClick(e);}} tip={'Duplicate'}/>
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
                            </> : <>{ props.isAdvanced && <>
                                <span className={"priority"}>priority: {l.explicitApplicationPriority} </span><i style={{paddingTop: '4px'}} className="bi bi-x"></i>
                                <div className={"spacer"}/>
                                <Input type="number"
                                       className={"change-boost hidden-input priority-booster"}
                                       inputClassName={"change-boost hidden-input"}
                                       readonly={false}
                                       data={l}
                                       getter={()=>scoreBoost + ''}
                                       setter={(v)=>{l.subViews = {...childrens, [d.id]: +v} as any}} 
                                />
                            </>}
                                <span className={"right-icon feature-border ocl-icon vertical-centering " + (d.oclCondition.length ? "" : "hidden")}></span>
                                <span className={"right-icon feature-border js-icon vertical-centering " + (d.jsCondition.length ? "" : "hidden")}></span>
                            </>
                        }
                        <Tooltip tooltip={<div>is {d.isExclusiveView ? "" : "not"} mutually exclusive with other "Ex" views.</div>} position={"bottom"} inline={true}>
                            <span className={"right-icon feature-border ex-icon vertical-centering " + (d.isExclusiveView ? '' : "hidden")}></span></Tooltip>
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

    let test = windoww;

    let [view, setView] = useStateIfMounted(undefined as (undefined | Pointer<DViewElement>));
    let vieweditor = view && <div className={"single-view-content"}><ViewData key={view} viewid={view} viewpoints={viewpoints.map(v=>v.id)} setSelectedView={setView} /></div>;
    if (test) return(<div className={"view-editor-root"}>
        <section className={'viewpoint-tab'}>
            <div className={"view-editor-fullsize-content"}>
                <div className={'d-flexd-flex'}>
                    <h1>Viewpoints

                    
                        <CommandBar style={{float: 'right'}}>
                            <Btn icon={'shrink'} action={() => {alert('collapse')}} tip={'Collapse all'} /> {/* todo per damiano*/}
                            <Btn icon={'expand'} action={() => {alert('expand')}} tip={'Expand all'} />  {/* todo per damiano */}
                            <Sep />
                            <Btn icon={'add'} action={addVP} tip={'Create a new viewpoint'} />
                        </CommandBar>
                        <Toggle 
                            name={'advanced'} 
                            values={{false: 'false', true: 'true'}} 
                            labels={{false: 'show priorities', true: 'hide priorities'}} 
                            style={{float: 'right', paddingRight: '20px', fontSize: '0.9em'}}
                            size={'small'}
                        />

                    </h1>
                </div>
                {vieweditor}
                <ul className={"ps-2 pt-2"}>
                    {viewpoints.map(vp=><GenericTree
                        data={vp.__raw}
                        getSubElements={getSubElements}
                        renderEntry={renderEntry}
                        metadata={{setView, scoreBoost:0}}
                        initialHidingState={vp.id === activeViewpointId} />)}
                </ul>
            </div>
        </section>
    </div>);

    let hoverID: any = '';
    function setHoverID(a:any){}
    function selectt(a: any){}
    let validation: false;// props.validation
    return (<div>
        {viewpoints.map((viewpoint, index) => {
            
            return (
                <div key={index} 
                    className={'d-flex p-1 mt-1 border round mx-1 viewpoint'}
                    onMouseEnter={(e) => setHoverID(viewpoint.id)}
                    onMouseLeave={(e) => setHoverID('')}
                    style={{backgroundColor: (active.id === viewpoint.id) ? 'white' :
                            (hoverID === viewpoint.id ? '#E0E0E0' : 'transparent')}}>
                    <input 
                        className={'p-0 input hidden-input'} 
                        value={viewpoint.name} type={'text'}
                        onChange={(evt) => {editName(evt, viewpoint)}} 
                        disabled={index <= 0} 
                    />
                    <Input 
                        className={"ms-auto"} 
                        data={viewpoint} 
                        field={"isExclusiveView"} 
                        type={"checkbox"}
                        label={"Is exclusive"} 
                        readonly={validation || index <= 0} 
                    />
                    {(!validation || true) && <button className={'btn btn-success ms-1'} disabled={active.id === viewpoint.id}
                                                            onClick={(evt) => {selectt(viewpoint.id)}}>
                        <i className={'p-1 bi bi-check2'}/>
                    </button>
                        // todo: validation views should not be "activable" but so far it is the only way to see the subviews in it.
                    }
                    <button 
                        className={'btn btn-success ms-1'}
                        onClick={(evt) => {clone(viewpoint)}}>
                        <i className={'p-1 bi bi-clipboard2-fill'}></i>
                    </button>
                    <button 
                        className={'btn btn-danger ms-1'} 
                        disabled={index <= 0 || active.id === viewpoint.id}
                        onClick={(e) => deleteV(e, viewpoint)}>
                        <i className={'p-1 bi bi-trash3-fill'}></i>
                    </button>
                </div>
            )
        })}
        <label className={'p-1'}>
            *To apply a custom viewpoint, first activate the default one, and then proceed to activate the custom one.
        </label>
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

export const NestedView = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <NestedViewConnected {...{...props, children}} />;
}
export default NestedView;
