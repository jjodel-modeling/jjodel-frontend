import React, {Dispatch, ReactElement, ReactNode} from "react";
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
    LEdgePoint
} from "../../joiner";
import {InitialVertexSizeObj} from "../../joiner/types";
import ModellingIcon from "./ModellingIcon";

interface ThisState {}

function getItems(data: LModelElement|undefined, myDictValidator: Dictionary<DocString<"DClassName">, DocString<"hisChildren">[]>, items: string[], node?:LGraphElement): ReactNode[] {
    const reactNodes: ReactNode[] = [];
    // todo: does myDictValidator have any reason to exist? if something is invalid it should not make it on toolbar jsx generated list
    for (let item_dname of items) {
        if (item_dname[0]=="_") {
            item_dname = item_dname.substring(2);
            data = data?.father || data;
        }
        let item = item_dname.substring(1).toLowerCase();
        reactNodes.push(<div className={'toolbar-item'} key={item_dname} onClick={() => {
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
                    let longestIndex: number=0;
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
                    let goodway = true; // not working// todo: keep his true branch and remove this when finished debug. false crashed for missing father on subelements, guess i need more delay??
                    if (goodway) newmp.index = prevnodeindex;
                    // delete (newmp as any).id;
                    let mp = [...dedge.midPoints];
                    mp.splice(longestIndex, 0, newmp);
                    wedge.midPoints = mp;
                    //
                    let olddebug = [...subelements];
                    subelements.splice(prevnodeindex, 0, newmp.id as string);
                    console.log("injecting ep", {prevnodeindex, newmp, prevNodeid, longestSeg, old: olddebug, new: subelements, ledge, dedge});
                    // this might break pointers too
                    let fixorder = () => { wedge.subElements = subelements; }
                    if (!goodway) setTimeout( fixorder, 1); // need to wait edgepoint creation
                    // selectNode(newmp);
                    break;
                default:
                    if (!data || !myDictValidator) return;
                    let d = data.addChild(item);
                    try {
                        let d2 = (d as any)();
                        if (myDictValidator[item_dname]) select(d2);
                    } catch(e) {
                        if (myDictValidator[item_dname]) select(d);
                    }
                    break;
            }
        }}>
            <ModellingIcon name={item} />
            <span className={'ms-1 text-capitalize'}>{item}</span>
        </div>);
    }
    return reactNodes;
}
function select(d: DModelElement): DModelElement {
    if (d && d.id) setTimeout(()=>$(".Graph [data-dataid='"+d?.id+"']").trigger("click"), 10);
    return d; }
function selectNode(d: DGraphElement|{id: string}): any {
    if (d && d.id) setTimeout(()=>$(".Graph [data-nodeid='"+d?.id+"']").trigger("click"), 10);
    return d; }

function ToolBarComponent(props: AllProps, state: ThisState) {
    const lModelElement: LModelElement = props.selected?.modelElement ? props.selected?.modelElement : MyProxyHandler.wrap(props.model);
    const node: LGraphElement | undefined = props.selected?.node;
    const isMetamodel: boolean = props.isMetamodel;
    const metamodel: LModel|undefined = props.metamodel;
    // const myDictValidator: Map<string, ReactNode[]> = new Map();
    const downward: Dictionary<DocString<"DClassName">, DocString<"hisChildren">[]> = {}
    const addChildren = (items: string[]) => items ? getItems(lModelElement, downward, [...new Set(items)], node) : [];

    downward["DModel"] = ["DPackage"];
    downward["DPackage"] = ["DPackage", "DClass", "DEnumerator"];
    downward["DClass"] = ["DAttribute", "DReference", "DOperation"];
    downward["DEnumerator"] = ["DLiteral"];
    downward["DOperation"] = ["DParameter", "DException"];

    // nodes
    // downward["DEdge"] = ["DEdgePoint"]
    // downward["DVoidEdge"] = ["DEdgePoint"]

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

    // exceptions:
    upward["DPackage"] = ["_pDPackage"]; //, "DModel"]; because from a package, i don't want to prompt the user to create a model in toolbar.
    upward["DEdgeNode"] = []; //, "DEdge", "DVoidEdge"]; because from a edgeNode, i don't want to prompt the user to create a edge in toolbar.
    // upward["DClass"] = ["_pDPackage", "DClass", "DEnumerator"];

    // if (RuntimeAccessibleClass.extends(props.selected?.node?.className, DVoidEdge)) { }
    if (isMetamodel) {
        return(<div className={"toolbar mt-2"}>
            <b className={'d-block text-center text-uppercase mb-1'}>Add sibling</b>
            {lModelElement && addChildren(upward[lModelElement.className])}
            {node && addChildren(upward[node.className])}
            <hr className={'my-2'} />
            <b className={'d-block text-center text-uppercase mb-1'}>Add sublevel</b>
            {lModelElement && addChildren(downward[lModelElement.className])}
            {node && addChildren(downward[node.className])}
            {/*<div className={"toolbar-item annotation"} onClick={() => select(lModelElement.addChild("annotation"))}>+annotation</div>*/}
            <hr className={'my-2'} />
        </div>);
    }
    else {
        const classes = metamodel?.classes;
        const model: LModel = LModel.fromPointer(props.model);
        const lobj: LObject | undefined = lModelElement.className === "DObject" ? lModelElement as LObject : undefined;
        const lfeat: LValue | undefined = lModelElement.className === "DValue" ? lModelElement as LValue : undefined;

        return(<div className={"toolbar mt-2"}>
            <b className={'d-block text-center text-uppercase mb-1'}>Add root level</b>
            {classes?.filter((lClass) => {return !lClass.abstract && !lClass.interface}).map((lClass, index) => {
                return <div key={"LObject_"+lClass.id} className={"toolbar-item LObject"} onClick={() => { select(model.addObject(lClass.id)) }}>
                    <ModellingIcon name={'object'} />
                    <span className={'ms-1 text-capitalize'}>{lClass.name}</span>
                </div>
            })}
            <div key={"RawObject"} className={'toolbar-item'} onClick={e => select(model.addObject())}>
                <ModellingIcon name={'object'} />
                <span className={'ms-1 text-capitalize'}>Object</span>
            </div>
            <hr className={'my-2'} />
            <b className={'d-block text-center text-uppercase mb-1'}>Add sublevel</b>
            {(lobj && (!lobj.instanceof || lobj.partial)) && <div key={"Feature"} className={"toolbar-item feature"} onClick={() => { lobj.addValue(); }}>+Feature</div>}
            {(lfeat && lfeat.values.length < lfeat.upperBound) && <div key={"Value"} className={"toolbar-item value"} onClick={() => {
                SetFieldAction.new(lfeat.id, 'value' as any, undefined, '+=', false); }}>
                <ModellingIcon name={'value'} />
                <span className={'ms-1 text-capitalize'}>value</span>
            </div>}
            {node && addChildren(downward[node.className])}
            <hr className={'my-2'} />
        </div>);
    }

}
interface OwnProps {
    model: Pointer<DModel, 1, 1, LModel>;
    isMetamodel: boolean;
    metamodelId?: Pointer<DModelElement, 1, 1, LModelElement>;
}

interface StateProps {
    selectedid?: { node: Pointer<DGraphElement, 1, 1>; view: Pointer<DViewElement, 1, 1>; modelElement: Pointer<DModelElement, 0, 1> };
    selected?: { node: LGraphElement; view: LViewElement; modelElement?: LModelElement };
    metamodel?: LModel;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.selectedid = state._lastSelected;
    ret.selected = ret.selectedid && {
        node: DPointerTargetable.wrap(state.idlookup[ret.selectedid.node]) as LGraphElement,
        view: DPointerTargetable.wrap(state.idlookup[ret.selectedid.view]) as LViewElement,
        modelElement: ret.selectedid.modelElement ? DPointerTargetable.wrap<DPointerTargetable, LModelElement>(state.idlookup[ret.selectedid.modelElement]) : undefined
    };
    if(ownProps.metamodelId) { ret.metamodel = LModel.fromPointer(ownProps.metamodelId); }
    return ret;
}

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




