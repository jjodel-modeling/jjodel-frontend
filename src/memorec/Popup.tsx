import React, {Dispatch, ReactElement, useState} from "react";
import {connect} from "react-redux";
import './style.scss';
import {DState, GObject, SetRootFieldAction} from "../joiner";

function PopupComponent(props: AllProps) {
    const memorec = props.memorec;
    if(!memorec) return(<></>);

    const close = () => {SetRootFieldAction.new('memorec', null)}
    return(<>
        <div className={'overlay'}></div>
        <div className={'popup p-3'}>
            <div className={'btn-close p-2'} onClick={close}></div>
            <div className={'table p-3'}>
                <table>
                    <thead>
                        <tr>
                            <th className={'mx-2'}>Name</th>
                            <th className={'mx-2'}>Score</th>
                            <th className={'mx-2'}>Attribute</th>
                            <th className={'mx-2'}>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>isbn</td>
                            <td>0.5</td>
                            <td><button className={'btn btn-primary px-2'}>+</button></td>
                            <td><button className={'btn btn-primary px-2'}>+</button></td>
                        </tr>

                        <tr>
                            <td>address</td>
                            <td>0.9</td>
                            <td><button className={'btn btn-primary px-2'}>+</button></td>
                            <td><button className={'btn btn-primary px-2'}>+</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </>);
}
interface OwnProps {}
interface StateProps {memorec: null|GObject[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.memorec = state.memorec;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PopupConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PopupComponent);

export const Popup = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <PopupConnected {...{...props, childrens}} />;
}


export default Popup;
