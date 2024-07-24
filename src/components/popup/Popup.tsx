import React, {Dispatch, ReactElement, ReactNode, Component, useEffect} from 'react';
import './style.scss';
import {DState, GObject, SetRootFieldAction} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import {connect} from "react-redux";

function PopupComponent(props: AllProps) {
    const children = props.children;

    return(<section>
        {children?.map((child: ReactNode) => {
            if(!React.isValidElement(child)) return(<></>);
            return child;
        })}
    </section>);
}

interface OwnProps {
    children?: GObject
}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    SetRootFieldAction.new('popup', 0);
    return ret;
}

export const PopupConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PopupComponent);

const Popup = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <PopupConnected {...{...props, children}} />;
}

export {Popup};
