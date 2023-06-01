import React, {Dispatch, ReactElement, ReactNode} from "react";
import {IStore} from "../../redux/store";

import {connect} from "react-redux";
import "./toolbar.scss";
import {
    DGraphElement, Dictionary,
    DModel,
    DModelElement, DNamedElement, DObject, DocString,
    DPointerTargetable,
    DViewElement,
    LGraphElement,
    LModel,
    LModelElement, LObject, LValue,
    LViewElement,
    MyProxyHandler,
    Pointer,
    SetFieldAction
} from "../../joiner";

interface ThisState {}

function getItems(data: LModelElement, myDictValidator: Dictionary<DocString<"DClassName">, DocString<"hisChildrens">[]>, items: string[]): ReactNode[] {
    const reactNodes: ReactNode[] = [];
    for (let item_dname of items) {
        if (item_dname[0]=="_") {
            item_dname = item_dname.substring(2);
            data = data.father || data;
        }
        let item = item_dname.substring(1).toLowerCase();
        reactNodes.push(<div className={"toolbar-item " + item} key={item_dname} onClick={() => {
            let d = data.addChild(item);
            if (myDictValidator[item_dname]) select(d);
        }}>+{item}</div>);
    }
    return reactNodes;
}
function select(d: DModelElement): DModelElement {
    setTimeout(()=>$(".Graph [data-dataid='"+d?.id+"']").trigger("click"), 10);
    return d; }

function ToolBarComponent(props: AllProps, state: ThisState) {

    const lModelElement: LModelElement = props.selected?.modelElement ? props.selected?.modelElement : MyProxyHandler.wrap(props.model);
    const isMetamodel: boolean = props.isMetamodel;
    const metamodel: LModel|undefined = props.metamodel;
    // const myDictValidator: Map<string, ReactNode[]> = new Map();
    const downward: Dictionary<DocString<"DClassName">, DocString<"hisChildren">[]> = {}
    const addChildren = (items: string[]) => items ? getItems(lModelElement, downward, [...new Set(items)]) : [];

    downward["DModel"] = ["DPackage"];
    downward["DPackage"] = ["DPackage", "DClass", "DEnumerator"];
    downward["DClass"] = ["DAttribute", "DReference", "DOperation"];
    downward["DEnumerator"] = ["DLiteral"];
    downward["DOperation"] = ["DParameter", "DException"];

    // for (let parentKey in downward) myDictValidator.set(parentKey, addChildren("package"));
    let upward: Dictionary<DocString<"DClassName">, DocString<"hisDParents">[]> = {};
    for (let parentKey in downward){
        let vals = downward[parentKey];
        if(!vals) continue;
        for (let child of vals) {
            if (!upward[child]) upward[child] = [];
            upward[child].push(parentKey)
            upward[child].push(...(downward[parentKey]||[]));
        }
    }
    upward["DPackage"] = ["_pDPackage"]; //, "DModel"];
    // upward["DClass"] = ["_pDPackage", "DClass", "DEnumerator"];

    if (isMetamodel) {
        return(<div className={"toolbar"}>
            <h6>Add sibling</h6>
            {lModelElement && addChildrens(upward[lModelElement.className])}
            <hr />
            <h6>Add sublevel</h6>
            {lModelElement && addChildrens(downward[lModelElement.className])}
            <div className={"toolbar-item annotation"} onClick={() => select(lModelElement.addChild("annotation"))}>+annotation</div>
        </div>);
    }
    else {
        const classes = metamodel?.classes;
        const model: LModel = LModel.fromPointer(props.model);
        const lobj: LObject | undefined = lModelElement.className === "DObject" ? lModelElement as LObject : undefined;
        const lfeat: LValue | undefined = lModelElement.className === "DValue" ? lModelElement as LValue : undefined;

        return(<div className={"toolbar"}>
            <h5>Add root level</h5>
            {classes?.filter((lClass) => {return !lClass.abstract && !lClass.interface}).map((lClass, index) => {
                return <div key={"LObject_"+lClass.id} className={"toolbar-item LObject"} onClick={() => { select(model.addObject(lClass.id)) }}>
                    +{lClass.name}
                </div>
            })}
            <div key={"RawObject"} className={"toolbar-item class"} onClick={() => { select(model.addObject()); }}>+Object</div>
            <hr />
            <h5>Add sublevel</h5>
            {(lobj && (!lobj.instanceof || lobj.partial)) && <div key={"Feature"} className={"toolbar-item feature"} onClick={() => { lobj.addValue(); }}>+Feature</div>}
            {(lfeat && lfeat.value.length < lfeat.upperBound) && <div key={"Value"} className={"toolbar-item value"} onClick={() => {
                SetFieldAction.new(lfeat.id, 'value' as any, undefined, '+=', false); }}>+Value</div>}
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

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
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


export const ToolBarConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ToolBarComponent);

export const ToolBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ToolBarConnected {...{...props, children}} />;
}
export default ToolBar;




