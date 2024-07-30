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
        DViewPoint.new2(name, '', (d) => { /*d.isExclusiveView = !(d.isValidation = props.validation); */} );
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

    const activateVP = (viewPoint: LViewPoint) => { project.activeViewpoint = viewPoint; }
    const clone = (v: LViewElement) => { v.duplicate(true); }
    const getSubElements = (v: DViewElement) => v.subViews || {};

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

        return <li className={"entry-root"} key={d.id} >
            <div className={"inline-row"} onClick={()=>setView(d.id)}>
                <div className={"left-stuff vertical-centering"} onClick={preventClick}>
                    {parr.length >= 1 ?
                        <>
                            <i className={'bi cursor-pointer d-block my-auto bi-chevron-' + (isExpanded ? 'down' : 'right')} onClick={toggleExpansion} />
                            {isExpanded && <div className={"expansion-line"} />}
                        </>
                        :
                        <i className={'bi bi-caret-right-fill d-block my-auto'} />
                    }
                </div>
                <div className={"mid-stuff vertical-centering"}>
                    <div className={`icon type tree-${appliableTo}`}>{appliableTo === "Any" ? "*" : appliableTo[0]}</div>
                    <div>{d.name}</div>
                </div>
                <div className={"hover-stuff vertical-centering d-flex"}>
                    <div className={"ms-auto d-flex"} onClick={preventClick}>
                        {/*@ts-ignore*/}
                        <button className="bg btn-delete my-auto ms-2 green" onClick={(e)=> { l.duplicate(); preventClick(e);}}><i className='bx bx-duplicate' /></button>
                        <button className="bg btn-delete my-auto ms-2" onClick={(e)=> { l.delete(); preventClick(e);}}><i className="p-1 bi bi-dash" /></button>
                    </div>
                </div>
                <div className={"right-stuff vertical-centering"}>
                    <div className={"right-content"} onClick={preventClick}>
                        <span className={"priority"}>priority: {l.explicitApplicationPriority} *</span>
                        <Input type="number"
                               className={"change-boost hidden-input"}
                               inputClassName={"change-boost hidden-input"}
                               readonly={false}
                               data={l}
                               getter={()=>scoreBoost + ''}
                               setter={(v)=>{l.subViews = {...childrens, [d.id]: +v} as any}} />
                        <span className={"ocl-ico vertical-centering " + (d.oclCondition.length ? "" : "hidden")}>OCL</span>
                        <span className={"js-ico vertical-centering " + (d.jsCondition.length ? "" : "hidden")}>
                        <i className="bi bi-lightning"></i>JS</span>
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
    let vieweditor = view && <div className={"single-view-content"}><ViewData viewid={view} setSelectedView={setView} /></div>;
    if (test) return(<div className={"view-editor-root"}>
        <div className={"view-editor-fullsize-content"}>
            <div className={'d-flex ps-2 pt-2'}>
                <b className={'ms-1 my-auto'}>Views</b>
                <button className={'btn btn-primary ms-auto'} onClick={addVP}>
                    <i className={'p-1 bi bi-plus'}></i>
                </button>
            </div>
            {vieweditor}
            <ul className={"ps-2 pt-2"}>
                {viewpoints.map(vp=><GenericTree
                    data={vp.__raw}
                    getSubElements={getSubElements}
                    renderEntry={renderEntry}
                    metadata={{setView, scoreBoost:0}}
                    initialHidingState={true} />)}
            </ul>
        </div>
    </div>);

    let hoverID: any = '';
    function setHoverID(a:any){}
    function select(a: any){}
    let validation: false;// props.validation
    return (<div>
        {viewpoints.map((viewpoint, index) => {
            return <div key={index} className={'d-flex p-1 mt-1 border round mx-1'}
                        onMouseEnter={(e) => setHoverID(viewpoint.id)}
                        onMouseLeave={(e) => setHoverID('')}
                        style={{backgroundColor: (active.id === viewpoint.id) ? 'white' :
                                (hoverID === viewpoint.id ? '#E0E0E0' : 'transparent')}}>
                <input className={'p-0 input hidden-input'} value={viewpoint.name} type={'text'}
                       onChange={(evt) => {editName(evt, viewpoint)}} disabled={index <= 0} />
                <Input className={"ms-auto"} data={viewpoint} field={"isExclusiveView"} type={"checkbox"}
                       label={"Is exclusive"} readonly={validation || index <= 0} />
                {(!validation || true) && <button className={'btn btn-success ms-1'} disabled={active.id === viewpoint.id}
                                                        onClick={(evt) => {select(viewpoint)}}>
                    <i className={'p-1 bi bi-check2'}></i>
                </button>
                    // todo: validation views should not be "activable" but so far it is the only way to see the subviews in it.
                }
                <button className={'btn btn-success ms-1'}
                        onClick={(evt) => {clone(viewpoint)}}>
                    <i className={'p-1 bi bi-clipboard2-fill'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={index <= 0 || active.id === viewpoint.id}
                        onClick={(e) => deleteV(e, viewpoint)}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
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
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user: LUser = LUser.fromPointer(DUser.current);
    const project = U.wrapper<LProject>(user.project);
    ret.project = project;
    ret.viewpoints = project.viewpoints.filter( (vp) => !!vp/* && vp.isValidation === ownProps.validation*/);
    ret.active = project.activeViewpoint;
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
