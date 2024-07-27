import React, {Dispatch, ReactElement, ReactNode, useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import "./toolbar.scss";
import {
    DState,
    DGraphElement,
    Dictionary,
    DModel,
    DModelElement,
    DNamedElement,
    DObject,
    DocString,
    DPointerTargetable,
    DViewElement,
    LGraphElement,
    LModel,
    LModelElement,
    LObject,
    LValue,
    LViewElement,
    MyProxyHandler,
    Pointer,
    SetFieldAction,
    RuntimeAccessibleClass,
    DVoidEdge,
    DEdge,
    DEdgePoint,
    EdgeSegment,
    LVoidEdge,
    Constructors,
    WVoidEdge,
    Log,
    LEdgePoint, DUser,
    U, LPointerTargetable, SetRootFieldAction, GObject, EMeasurableEvents, TRANSACTION
} from "../../joiner";

import {InitialVertexSizeObj} from "../../joiner/types";
import ModellingIcon from "../forEndUser/ModellingIcon";

interface ThisState {}

let ti = 0; // tabindex counter

function toolbarClick(item_dname: string, data: LModelElement|undefined, myDictValidator: Dictionary<DocString<"DClassName">, DocString<"hisChildren">[]>, node?:LGraphElement) {
    switch(item_dname){
        case DVoidEdge.cname:
        case DEdge.cname:
            // no add edges through toolbar for now
            break;
        case DEdgePoint.cname:
            let ledge: LVoidEdge = (node as LEdgePoint | LVoidEdge).edge;
            let dedge: DVoidEdge = ledge.__raw;
            let wedge: WVoidEdge = ledge as any;
            // if (!myDictValidator[item_dname]) return;
            let longestSeg: EdgeSegment = undefined as any; // just because compiler does not know it is always found through the for loop
            let longestIndex: number = 0;
            let segms = ledge.segments.segments;
            // longestIndex = segms.length - 1;// i just put it at end because this edgepoint
            for (; longestIndex < segms.length; longestIndex++) if (segms[longestIndex].isLongest) { longestSeg = segms[longestIndex]; break;}
            // let index = edge.segments.all.findIndex((s: EdgeSegment) => s.isLongest);
            let newmp: InitialVertexSizeObj = {...(longestSeg.start.pt.add(longestSeg.end.pt, true).divide(2)), w: 15, h: 15, index:longestIndex};
            // @ts-ignore
            newmp.x -= newmp.w/2; newmp.y -= newmp.h/2;

            newmp.id = Constructors.makeID();
            let subelements = [...dedge.subElements];
            let prevNodeid = longestSeg.start.ge.id;
            let prevnodeindex = subelements.indexOf(prevNodeid);
            if (prevnodeindex === -1) {
                if (prevNodeid === dedge.start) prevnodeindex = 0; // first and last are not subelements
                else if (prevNodeid === dedge.end) prevnodeindex = subelements.length;
                else Log.exDevv("edgepoint insert position not found", {subelements, prevNodeid, longestSeg, dedge, ledge});
            } else prevnodeindex += 1;
            newmp.index = prevnodeindex;
            // delete (newmp as any).id;
            let mp = [...dedge.midPoints];
            mp.splice(longestIndex, 0, newmp);
            wedge.midPoints = mp;
            let olddebug = [...subelements];
            subelements.splice(prevnodeindex, 0, newmp.id as string);
            console.log("injecting ep", {prevnodeindex, newmp, prevNodeid, longestSeg, old: olddebug, new: subelements, ledge, dedge});
            break;
        default:
            if (!data || !myDictValidator) return;
            let item = item_dname.substring(1).toLowerCase();
            let d = data.addChild(item);
            try {
                let d2 = (d as any)();
                if (myDictValidator[item_dname]) select(d2);
            } catch(e) {
                if (myDictValidator[item_dname]) select(d);
            }
            break;
    }
}
let n_agonSides = 10; //this shuld be in react.setState(), but the function handling it is outside a component, so i don't wanna rewrite it.
// it should be fine, except for the input value being shared on different sidebar components, which might even be better.
function getItems(data: LModelElement|undefined, myDictValidator: Dictionary<DocString<"DClassName">, DocString<"hisChildren">[]>, items: DocString<"D-ClassNames">[], node?:LGraphElement): ReactNode[] {
    const reactNodes: ReactNode[] = [];
    // todo: does myDictValidator have any reason to exist? if something is invalid it should not make it on toolbar jsx generated list
    for (let item_dname of items) {
        if (item_dname[0]=="_") {
            item_dname = item_dname.substring(2);
            data = data?.father || data;
        }
        let item = item_dname.substring(1).toLowerCase();
        reactNodes.push(<div className={'toolbar-item'} tabIndex={ti} style={{cursor:"pointer"}} key={item_dname} onClick={()=>toolbarClick(item_dname, data, myDictValidator, node)}>
            <ModellingIcon name={item} />
            <span className={'ms-1 my-auto text-capitalize'}>{item}</span>
            {/*
            <i className="bi bi-arrow-right-short hoverable">
                <ul className={"content"}>
                    <li className={"hoverable"}>
                        <span className={'ms-1 my-auto text-capitalize'}>Polygon</span>
                        <i className="bi bi-arrow-right-short hoverable">
                            <ul className={"content"}>
                                <span className={'ms-1 my-auto text-capitalize'}>Triangle</span>
                                <span className={'ms-1 my-auto text-capitalize'}>Pentagon</span>
                                <span className={'ms-1 my-auto text-capitalize'}>Hexagon</span>
                                <span className={'ms-1 my-auto text-capitalize'}>Octagon</span>
                                <span className={'ms-1 my-auto text-capitalize'}>
                                    <input className={"autosize-input"} type={"number"} min={3} step={1}
                                           value={n_agonSides} onClick{(evt) => { evt.stopPropagation()}}
                                        onChange={(evt) => {
                                            n_agonSides = +evt.target.value || 10;
                                            if (n_agonSides<3) n_agonSides = 10;
                                        }}
                                    />-agon</span>
                            </ul>
                        </i>
                    </li>
                </ul>
            </i>
            <i className="bi bi-arrow-right-short hoverable">
                <ul className={"content"}>
                    <li className={"hoverable"}>
                        <span className={'ms-1 my-auto text-capitalize'}>Polygon</span>
                    </li>
                </ul>
            </i>
                */
            }

        </div>);
    }
    return reactNodes;
}
function select(dl: DModelElement | LModelElement): DModelElement {
    let d: DModelElement = (dl as LModelElement)?.__raw || dl as DModelElement;
    //console.log("selecting", {d, dl, selector:".Graph [data-dataid='"+d?.id+"']", $ : $(".Graph [data-dataid='"+d?.id+"']")});
    if (d && d.id) setTimeout(()=>$(".Graph [data-dataid='"+d?.id+"']").trigger("click"), 10);
    return d; }

function selectNode(d: DGraphElement|{id: string}): any {
    if (d && d.id) setTimeout(()=>$(".Graph [data-nodeid='"+d?.id+"']").trigger("click"), 10);
    return d; }

function ToolBarComponent(props: AllProps, state: ThisState) {
    const node = props.node;
    let [pinned, setPinned] = useState(true);

    const htmlref: React.MutableRefObject<null | HTMLDivElement>= useRef(null);
    useEffect(() => {
        if (!htmlref.current) return;
        let draggableOptions = {
            cursor: 'grabbing',
            axis: "y",
            opacity: 0.0,
            distance: 5,
            containment: 'parent',
            // helper: 'clone'
        };
        ($(htmlref.current) as GObject<'JQuery + ui plugin'>).draggable(draggableOptions);
    }, [htmlref.current]);

    if (!node) return null;
    const data: LModelElement|LModel = (node.model) ? node.model : LModel.fromPointer(props.model);

    const isMetamodel: boolean = props.isMetamodel;
    const metamodel: LModel|undefined = props.metamodel;
    const downward: Dictionary<DocString<"DClassName">, DocString<"hisChildren">[]> = {}
    const addChildren = (items: string[]) => items ? getItems(data, downward, [...new Set(items)], node) : [];

    // downward["DModel"] = ["DPackage"];
    // downward["DModel"] = ["DPackage"];

    downward["DPackage"] = ["DPackage", "DClass", "DEnumerator"];
    downward["DClass"] = ["DAttribute", "DReference", "DOperation"];
    downward["DEnumerator"] = ["DLiteral"];
    downward["DOperation"] = ["DParameter", "DException"];


    // nodes
    downward["DEdge"] = ["DEdgePoint"]
    downward["DVoidEdge"] = ["DEdgePoint"]

    // for (let parentKey in downward) myDictValidator.set(parentKey, addChildren("package"));

    let upward: Dictionary<DocString<"DClassName (model)">, DocString<"hisDParents">[]> = {};
    for (let parentKey in downward){
        let vals = downward[parentKey];
        if(!vals) continue;
        for (let child of vals) {
            if (!upward[child]) upward[child] = [];
            upward[child].push(parentKey)
            upward[child].push(...(downward[parentKey]||[]));
        }
    }
    downward["DModel"] = downward["DPackage"];

    // exceptions:
    upward["DPackage"] = ["_pDPackage"]; //, "DModel"]; because from a package, i don't want to prompt the user to create a model in toolbar.
    upward["DEdgePoint"] = ["DEdgePoint"]; //, "DEdge", "DVoidEdge"]; because from a edgeNode, i don't want to prompt the user to create a edge in toolbar.
    // upward["DClass"] = ["_pDPackage", "DClass", "DEnumerator"];

    let content: ReactNode;
    // if (RuntimeAccessibleClass.extends(props.selected?.node?.className, DVoidEdge)) { }
    let contentarr: ReactNode[][] = [];
    if (isMetamodel) {
        let siblings = data ? addChildren(upward[data.className]) : [];
        if (node) siblings.push(...addChildren(upward[node.className]));
        let subelements = data ? addChildren(downward[data.className]) : [];


        if (siblings.length > 0)    contentarr.push([<span className={'toolbar-section-label'}>Structure</span>, siblings]);
        if (subelements.length > 0) contentarr.push([<span className={'toolbar-section-label'}>Features</span>, subelements]);

    }
    else {
        const classes = metamodel?.classes;
        const model: LModel = LModel.fromPointer(props.model);
        const lobj: LObject | undefined = data.className === "DObject" ? data as LObject : undefined;
        const lfeat: LValue | undefined = data.className === "DValue" ? data as LValue : undefined;

        let subleveloptions = [];
        if (lobj && (!lobj.instanceof || lobj.partial)) subleveloptions.push(
            <div key={"Feature"} className={"toolbar-item feature"} tabIndex={ti} onClick={() => { lobj.addValue(); }}>+Feature</div>
        );
        if (lfeat && lfeat.values.length < lfeat.upperBound) subleveloptions.push(
            <div key={"Value"} className={"toolbar-item value"} tabIndex={ti} onClick={() => {SetFieldAction.new(lfeat.id, 'value' as any, undefined, '+=', false); }}>
                <ModellingIcon name={'value'} />
                <span className={'ms-1 my-auto text-capitalize'}>value</span>
            </div>
        );
        if (node) subleveloptions.push(...addChildren(downward[node.className]));
        let rootobjs = classes?.filter((lClass) => {return !lClass.abstract && !lClass.interface}).map((lClass, index) => {
            let dclass = lClass.__raw;
            return <div
                onMouseEnter={e => SetRootFieldAction.new('tooltip', lClass.annotations.map(a => a.source).join(' '))}
                onMouseLeave={e => SetRootFieldAction.new('tooltip', '')}
                key={"LObject_"+dclass.id} className={"toolbar-item LObject"} tabIndex={ti} onClick={()=>select(model.addObject({}, lClass)) }>
                {dclass._state.icon ? <ModellingIcon src={dclass._state.icon}/> : <ModellingIcon name={'object'} />}
                <span className={'ms-1 my-auto text-capitalize'}>{U.stringMiddleCut(dclass.name, 14)}</span>
            </div>
        }) || [];
        rootobjs.push(<div key={"RawObject"} className={'toolbar-item'} tabIndex={ti} onClick={()=>select(model.addObject({}, null))}>
            <ModellingIcon name={'object'} />
            <span className={'ms-1 my-auto text-capitalize'}>Object</span>
        </div>);


        if (rootobjs.length > 0)    contentarr.push([<b className={'toolbar-section-label'} style={{marginRight:"1.5em"/*to avoid overlap with pin*/}}>Root level</b>, rootobjs]);
        if (subleveloptions.length > 0) contentarr.push([<b className={'toolbar-section-label'}>Sublevel</b>, subleveloptions]);
    }


    let shapes = node ? addChildren(downward[node.className]) : [];
    if (shapes.length > 0)      contentarr.push([<b className={'toolbar-section-label'}>Shape</b>, shapes]);

    let separator = <hr className={'my-2'} /> as any;
    // @ts-ignore
    content = contentarr.separator(separator);// .flat() as any;
    console.log("toolbar", {contentarr, separator, content});

    return (
        <div className="toolbar-draggable"
            ref={htmlref}
            style={{ border: 'none', top: '35px', position: "absolute", backgroundColor: 'red !important' }} // refuses to focus without event...
            onClick={(e) => {
                console.log("click focus", { htmlref }); setTimeout(() => {
                    if (htmlref.current) (htmlref.current as any).children[0].focus();
                }, 1)
            }}>
            <div className={"toolbar hoverable" + (pinned ? " pinned" : '')} tabIndex={0}>
                <i className={"content pin bi bi-pin-angle" + (pinned ? "-fill" : '')} onClick={() => setPinned(!pinned)} />
                {/*<div className={"preview toolbar-section-label mb-0 mx-1"}>
                    <i className={'bi bi-plus-lg'} />
                </div>
                <div className={"preview toolbar-section-label my-auto mx-1"}>Add</div>
                */}
                <div className={"content inline"}>
                    {content}
                </div>
            </div>
        </div>);
}

interface OwnProps {
    model: Pointer<DModel, 1, 1, LModel>;
    isMetamodel: boolean;
    metamodelId?: Pointer<DModelElement, 1, 1, LModelElement>;
}

interface StateProps {
    node: LGraphElement|null;
    metamodel?: LModel;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

//* 23/11 versione giordano
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const nodeid = state._lastSelected?.node;
    if(nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    else ret.node = null;
    if(ownProps.metamodelId) { ret.metamodel = LModel.fromPointer(ownProps.metamodelId); }
    return ret;
}
/*
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.selectedid = state._lastSelected;
    ret.selected = ret.selectedid && {
        node: LPointerTargetable.from(ret.selectedid.node, state) as LGraphElement,
        view: LPointerTargetable.from(ret.selectedid.view, state) as LViewElement,
        modelElement: ret.selectedid.modelElement ? LPointerTargetable.from(ret.selectedid.modelElement, state) : undefined
    };
    if (ownProps.metamodelId) { ret.metamodel = LModel.fromPointer(ownProps.metamodelId); }
    return ret;
}*/

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const ToolBarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ToolBarComponent);

export const ToolBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ToolBarConnected {...{...props, children}} />;
}
export default ToolBar;




