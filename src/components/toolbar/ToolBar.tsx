import React, {Dispatch, ReactElement, ReactNode} from "react";
import {IStore} from "../../redux/store";

import {connect} from "react-redux";
import "./toolbar.scss";
import {
    DGraphElement,
    DModel,
    DModelElement, DNamedElement, DObject,
    DPointerTargetable,
    DViewElement,
    LGraphElement,
    LModel,
    LModelElement,
    LViewElement,
    MyProxyHandler,
    Pointer,
    SetFieldAction
} from "../../joiner";
import {ToolBarItem} from "./ToolBarItem";

interface ThisState {}
function ToolBarComponent(props: AllProps, state: ThisState) {

    const lModelElement: LModelElement = props.selected?.modelElement ? props.selected?.modelElement : MyProxyHandler.wrap(props.model);
    const isMetamodel: boolean = props.isMetamodel;
    const metamodel: LModel|undefined = props.metamodel;
    const myDictValidator: Map<string, ReactNode[]> = new Map();
    const addChildrens = (...items: string[]) => [...ToolBarItem.getItems(lModelElement, items)];

    myDictValidator.set("DModel", addChildrens("package"));
    myDictValidator.set("DPackage", addChildrens("package", "class", "enumerator"));
    myDictValidator.set("DClass", addChildrens("attribute", "reference", "operation"));
    myDictValidator.set("DEnumerator", addChildrens("literal"));
    myDictValidator.set("DOperation", addChildrens("parameter", "exception"));


    console.log("toolbar", {props, metamodel, isMetamodel, myDictValidator})
    if(isMetamodel) {
        return(<div className={"toolbar"}>
            {myDictValidator.get(lModelElement?.className as string)?.map((item) => {
                return item;
            })}
            <div className={"toolbar-item annotation"} onClick={() => lModelElement.addChild("annotation")}>+annotation</div>
        </div>);
    }
    else {
        const classes = metamodel?.classes;
        const model: LModel = LModel.fromPointer(props.model);

        return(<div className={"toolbar"}>
            {classes?.filter((lClass) => {return !lClass.abstract && !lClass.interface}).map((lClass, index) => {
                return <div key={lClass.id} className={"toolbar-item class"} onClick={() => { model.addObject(lClass.id) }}>
                    +{lClass.name}
                </div>
            })}
            <div key={"Object"} className={"toolbar-item class"} onClick={() => { model.addObject(); }}>+Object</div>
        </div>);
    }

}
interface OwnProps {
    model: Pointer<DModel, 1, 1, LModel>;
    isMetamodel: boolean;
    metamodelId?: Pointer<DModel, 1, 1, LModel>;
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

export const ToolBar = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ToolBarConnected {...{...props, childrens}} />;
}
export default ToolBar;




