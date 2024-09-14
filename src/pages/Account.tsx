import {DState, DUser, LUser, Try} from '../joiner';
import {Dashboard} from './components';
import {FakeStateProps} from '../joiner/types';
import React, {Component, Dispatch, ReactElement} from "react";
import {connect} from "react-redux";

function AccountComponent(props: AllProps): JSX.Element {
    const {user} = props;
    return(<Try>
        <Dashboard active={'Account'} version={props.version}>

            <div className={'p-2'}>
                <text className={'d-block'}><b>Name: </b>{user.name}</text>
                <text className={'d-block'}><b>Surname: </b>{user.surname}</text>
                <text className={'d-block'}><b>Nickname: </b>{user.nickname}</text>
                <text className={'d-block'}><b>Email: </b>{user.email}</text>
                <text className={'d-block'}><b>Country: </b>{user.country}</text>
                <text className={'d-block'}><b>Affiliation: </b>{user.affiliation}</text>
                <text className={'d-block'}><b>Newsletter: </b>{user.newsletter + ''}</text>
            </div>
        </Dashboard>
    </Try>);
}

interface OwnProps {}
interface StateProps {
    user: LUser;
    version: DState["version"];
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.version = state.version;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const AllProjectsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(AccountComponent);

const AccountPage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AccountPage};
