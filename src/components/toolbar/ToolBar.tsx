import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from "react";
import {IStore} from "../../redux/store";
import {connect} from "react-redux";
import "./toolbar.scss";
import {
    DGraphElement, DModel,
    DModelElement, DPointerTargetable,
    DViewElement,
    GObject,
    LGraphElement,
    LModel,
    LModelElement,
    LViewElement, MyProxyHandler,
    Pointer
} from "../../joiner";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";
import {ToolBarItem} from "./ToolBarItem";

interface ThisState {}
function ToolBarComponent(props: AllProps, state: ThisState) {

    const lModelElement: LModelElement = props.selected?.modelElement ? props.selected?.modelElement : MyProxyHandler.wrap(props.model);
    const myDictValidator: Map<string, ReactNode[]> = new Map();
    myDictValidator.set("DModel", ToolBarItem.getItems(lModelElement, ["package"]));
    myDictValidator.set("DPackage", ToolBarItem.getItems(lModelElement, ["package", "class", "enumerator"]));
    myDictValidator.set("DClass", ToolBarItem.getItems(lModelElement, ["attribute", "reference"]));
    myDictValidator.set("DEnumerator", ToolBarItem.getItems(lModelElement, ["literal"]));


    useEffect(() => {
        const element: JQuery & GObject = $(".toolbar");
        element.resizable({});
    })
    return(<div className={"toolbar"}>
        {myDictValidator.get(lModelElement?.className as string)?.map((item) => {
            return item;
        })}
    </div>);

}
interface OwnProps {
    model: Pointer<DModel, 1, 1, LModel>;
}

interface StateProps {
    selectedid?: { node: Pointer<DGraphElement, 1, 1>; view: Pointer<DViewElement, 1, 1>; modelElement: Pointer<DModelElement, 0, 1> };
    selected?: { node: LGraphElement; view: LViewElement; modelElement?: LModelElement };
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




