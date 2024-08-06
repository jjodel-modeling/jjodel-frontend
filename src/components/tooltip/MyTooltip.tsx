import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import './mytooltip.scss';


type TooltipProps = {
    text: string;
}

export const MyTooltip = (props: TooltipProps) => {
    const tooltip = props.text;

    return(
        <label className={'my-tooltip'}>{tooltip}</label>
    );
}

/*
function TooltipComponent(props: TooltipProps) {
    const tooltip = props.label;

    return(
        <label className={'my-tooltip'}>{tooltip}</label>
    );
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


export const TooltipConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TooltipComponent);

export const Tooltip = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return(<TooltipConnected {...{...props, children}} />);
}
export default Tooltip;
*/
