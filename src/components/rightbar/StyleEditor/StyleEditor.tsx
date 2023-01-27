import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {LGraphElement} from "../../../model/dataStructure";
import {LViewElement} from "../../../view/viewElement/view";
import {LModelElement} from "../../../model/logicWrapper";
import {Input} from "../../forEndUser/bidirectionalInput";
import "../rightbar.scss";

function StyleEditorComponent(props: AllProps) {

    const selected = props.selected;
    if(selected) {
        return(<div className={"px-4 mt-3"}>
            <div className={"structure-input-wrapper row"}>
                <Input obj={selected.node} field={"x"} label={"X Position:"} type={"number"}/>
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={selected.node} field={"y"} label={"Y Position:"} type={"number"} />
            </div>
        </div>);
    } else {
        return(<></>);
    }
}
interface OwnProps {}
interface StateProps {
    selected?: {
        node: LGraphElement;
        view: LViewElement;
        modelElement?: LModelElement
    };
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    let ret: StateProps = {};
    const selected = state._lastSelected;
    if(selected) {
        const modelElement = state._lastSelected?.modelElement;
        const node = state._lastSelected?.node;
        const view = state._lastSelected?.view;
        if(node && view) {
            ret.selected = {
                node: LGraphElement.fromPointer(node),
                view: LViewElement.fromPointer(node),
                modelElement: (modelElement) ? LModelElement.fromPointer(modelElement) : undefined
            }
        }
    }
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const StyleEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(StyleEditorComponent);

export const StyleEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <StyleEditorConnected {...{...props, childrens}} />;
}
export default StyleEditor;

