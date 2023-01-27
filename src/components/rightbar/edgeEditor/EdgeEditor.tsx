import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {GObject, SetFieldAction, SetRootFieldAction} from "../../../joiner";


interface ThisState {}
function EdgeEditorComponent(props: AllProps, state: ThisState) {

    const showAnchor = props.showAnchor;
    const size = props.size;
    const color = props.color;

    const changeShowAnchor = (event: React.MouseEvent<HTMLInputElement>) => {
        let value = (event.target as GObject).checked;
        if(value === undefined) value = true;
        const tmp = {showAnchor: value, size, color};
        SetRootFieldAction.new('_edgeSettings', tmp, '', false);
    }

    const changeSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = (event.target as GObject).value;
        if(value === undefined) value = 1;
        const tmp = {showAnchor, size: value, color};
        SetRootFieldAction.new('_edgeSettings', tmp, '', false);
    }

    const changeColor = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = (event.target as GObject).value;
        if(value === undefined) value = '#000000';
        const tmp = {showAnchor, size, color: value};
        SetRootFieldAction.new('_edgeSettings', tmp, '', false);
    }

    return(<div className={"mt-3"}>
        <div className={"d-flex mx-3"}>
            <label>Show Anchor</label>
            <input  checked={showAnchor} className={"ms-auto"} type={'checkbox'} onClick={changeShowAnchor} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Size</label>
            <input value={size} className={"ms-auto"} type={'number'} onChange={changeSize} step={0.1} min={0} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Color</label>
            <input className={"ms-auto"} type={'color'} onChange={changeColor} />
        </div>

    </div>);
}
interface OwnProps {}
interface StateProps {showAnchor: boolean, size: number, color: string}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const edgeSettings = state._edgeSettings;
    const showAnchor = edgeSettings.showAnchor;
    const size = edgeSettings.size;
    const color = edgeSettings.color;
    const ret: StateProps = {showAnchor, size, color};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgeEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeEditorComponent);

export const EdgeEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgeEditorConnected {...{...props, childrens}} />;
}
export default EdgeEditor;
