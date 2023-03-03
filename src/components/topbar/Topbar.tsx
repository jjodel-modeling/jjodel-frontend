import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import './style.scss';


function Topbar(props: AllProps) {

    const click = (evt: React.MouseEvent<HTMLLabelElement>) => {
        alert('todo')
    }

    return(<div className={'topbar d-flex'}>
        <div className={'ms-1'}>
            <label className={'item border round'} onClick={click}>Test 1</label>
            <label className={'item border round ms-1'} onClick={click}>Test 2</label>
        </div>
        <div className={'ms-auto me-1'}>
            <label className={'item border round'} onClick={click}>Test 3</label>
            <label className={'item border round ms-1'} onClick={click}>Test 4</label>
        </div>
    </div>);
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
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
