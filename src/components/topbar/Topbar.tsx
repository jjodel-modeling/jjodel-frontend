import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import './style.scss';
import {LModel, LModelElement, Selectors} from "../../joiner";
import {SaveManager} from "./SaveManager";
import Undoredocomponent from "./undoredocomponent";

function Topbar(props: AllProps) {
    const metamodel = props.metamodel;

    const click = (evt: React.MouseEvent<HTMLLabelElement>) => {
        alert('todo')
    }


    return(<div className={'topbar d-flex'}>
        <div className={'ms-1'}>
            <Undoredocomponent />

            <label className={'item border round ms-1'}
                    onClick={() => {if(metamodel) SaveManager.save()}}>Save</label>
            <label className={'item border round ms-1'}
                    onClick={() => {if(metamodel) SaveManager.load()}}>Load</label>

            <label className={'item border round ms-1'}
                    onClick={() => {if(metamodel) SaveManager.exportEcore_click(false, true)}}>Export JSON</label>
            <label className={'item border round ms-1'}
                    onClick={() => {if(metamodel) SaveManager.importEcore_click(false, true)}}>Import JSON</label>
            <label className={'item border round ms-1'}
                    onClick={() => {if(metamodel) SaveManager.exportEcore_click(true, true)}}>Export XML</label>
            <label className={'item border round ms-1'}
                    onClick={() => {if(metamodel) SaveManager.importEcore_click(true, true)}}>Import XML</label>
        </div>
    </div>);
}
interface OwnProps {}
interface StateProps { metamodel: null|LModel }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const selected = state._lastSelected?.modelElement;
    if(selected) {
        const me = LModelElement.fromPointer(selected);
        ret.metamodel = (me) ? me.model : null;
    } else ret.metamodel = null;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TopBarConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(Topbar);

export const TopBar = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <TopBarConnected {...{...props, childrens}} />;
}
export default TopBar;
