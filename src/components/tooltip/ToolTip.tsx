import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import './style.scss';

function ToolTipComponent(props: AllProps) {
    const tooltip = props.tooltip;

    return(<div className={'my-tooltip'}>
        <label>{tooltip}</label>
    </div>);
}

interface OwnProps {}
interface StateProps {tooltip: string}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.tooltip = state.tooltip;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ToolTipConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ToolTipComponent);

export const ToolTip = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ToolTipConnected {...{...props, children}} />;
}
export default ToolTip;

