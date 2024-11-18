import {DState, DUser, LUser, Try} from '../joiner';
import {Dashboard} from './components';
import {FakeStateProps} from '../joiner/types';
import React, {Component, Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import { Edit, EditCountry } from './components/Edit/Edit';




function AccountComponent(props: AllProps): JSX.Element {
    const {user} = props;
    return(<Try>
        <Dashboard active={'Account'} version={props.version}>
            <>
            <div className={'p-2 edit-container'}>
                <h2><i className="bi bi-person-square"></i> Profile</h2>

                <Edit name={'name'} 
                    label={'Name'} 
                    type={'text'} 
                    value={user.name} 
                    required={true}
                    tooltip={'Your first name.'}
                />
                <Edit name={'surname'} 
                    label={'Surname'} 
                    type={'text'} 
                    value={user.surname} 
                    required={true}
                    tooltip={'Your family name.'}
                />
                <Edit name={'nickname'} 
                    label={'Nickname'} 
                    type={'text'} 
                    value={user.nickname} 
                    required={true}
                    tooltip={'Your nickname, it will be used as a short form for addressing you.'}
                />
                <Edit name={'email'} 
                    label={'Email'} 
                    type={'email'} 
                    value={user.email} 
                    disabled={true}
                    tooltip={'Your email, it is not possible to change it.'}
                />
                <Edit name={'affiliation'} 
                    label={'Affiliation'} 
                    type={'text'} 
                    value={user.affiliation}
                    required={true}
                    tooltip={'Your current affiliation.'}
                />
                <Edit name={'country'} 
                    label={'Country'} 
                    type={'country'} 
                    value={user.country}
                    tooltip={'Select your affiliation country.'}
                />
                
                <Edit name={'newsletter'} 
                    label={'Newsletter'} 
                    type={'checkbox'} 
                    value={user.newsletter+''}
                    tooltip={'Select it if you want to receive low-intensity updates from us (e.g., new releases, new learning and teaching material, and the likes).'}
                />

                <button className="btn alert-btn my-2  px-4 space-above">save</button>
            </div>
            <div className={'p-2 edit-container space-above'}>
                <div className={'password-container'}>
                    <h3><i className="bi bi-fingerprint"></i> Password</h3>

                    <Edit name={'password'} 
                        label={'Password'} 
                        type={'password'} 
                        value={'user.password'}                 
                    />
                    <Edit name={'password'} 
                        label={'New Password'} 
                        type={'password'} 
                        value={'user.password'}
                        className={'space-above small'}                 
                    />
                    <Edit name={'password'} 
                        label={'Confirm Password'} 
                        type={'password'} 
                        value={'user.password'}                 
                    />
                    <button className="btn alert-btn my-2  px-4 space-above">change password</button>
                </div>

            </div>
            </>
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
