import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import './style.scss';
import {LModel} from "../../joiner";
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


            <button className={'item border round ms-1'} onClick={ SaveManager.save }>Save</button>
            <button className={'item border round ms-1'} onClick={ ()=>SaveManager.load() }>Load</button>

            <button className={'item border round ms-1'} onClick={ () => SaveManager.exportEcore_click(false, false) }>Export JSON</button>
            <button className={'item border round ms-1'} onClick={ () => SaveManager.importEcore_click(false, false) }>Import JSON</button>
            <button className={'item border round ms-1'} onClick={ () => SaveManager.exportEcore_click(true, true) }>Export XML</button>
            <button className={'item border round ms-1'} onClick={ () => SaveManager.importEcore_click(true, true) }>Import XML</button>
        </div>
        <div className={'ms-auto me-1'}>
            <label className={'item border round'} onClick={click}>Test 3</label>
            <label className={'item border round ms-1'} onClick={click}>Test 4</label>
        </div>
    </div>);
}
interface OwnProps {}
interface StateProps { metamodel?: LModel }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state.models[0]; // changed from state.metamodel
    if(pointer) ret.metamodel = LModel.fromPointer(pointer);
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
