import {DState, DUser, LUser, Try} from '../joiner';
import {Dashboard} from './components';
import {FakeStateProps, windoww} from '../joiner/types';
import React, {Component, Dispatch, JSX, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import { Edit } from './components/Edit/Edit';
import { UsersApi} from '../api/persistance';
import { useStateIfMounted } from 'use-state-if-mounted';
import Storage from '../data/storage';
import {UpdateUserRequest} from "../api/DTO/UpdateUserRequest";
import {ChangePasswordRequest} from "../api/DTO/ChangePasswordRequest";

import { U} from '../joiner';



function AccountComponent(props: AllProps): JSX.Element {
    const {user} = props;

    const [name, setName] = useStateIfMounted(user.name);
    const [surname, setSurname] = useStateIfMounted(user.surname);
    const [nickname, setNickname] = useStateIfMounted(user.nickname);
    const [country, setCountry] = useStateIfMounted(user.country);
    const [affiliation, setAffiliation] = useStateIfMounted(user.affiliation);
    const [newsletter, setNewsletter] = useStateIfMounted(user.newsletter);
    const [email, setEmail] = useStateIfMounted(user.email);
    const [old_password, setOldPassword] = useStateIfMounted('');
    const [new_password, setNewPassword] = useStateIfMounted('');
    const [check_password, setCheckPassword] = useStateIfMounted('');

    async function update_password(old_password: string, new_password:string, check_password:string) : Promise<void> {
        const U = windoww.U;

        if (new_password !== check_password) {
            U.alert('e', 'Passwords do not match.', '');
            return;
        }

        try {
            const changePasswordRequest: ChangePasswordRequest = new ChangePasswordRequest();
            changePasswordRequest.UserName = nickname;
            changePasswordRequest.OldPassword = old_password;
            changePasswordRequest.Password = new_password;
            changePasswordRequest.PasswordConfirm = check_password;

            const response_code = await UsersApi.updatePassword(changePasswordRequest);

            switch (response_code) {
                case 200:
                    U.alert('i', 'Your password has been successfully updated!','');
                    break;
                default:
                case 400:
                    U.alert('e', 'Something went wrong. re-check your old password.','');
                    break;
            }


        } catch (error) {
            U.alert('e', 'Something went wrong.','');
        }

    }
   
    function update_newsletter(check_value: boolean): boolean {
        setNewsletter(check_value);
        return check_value;
    }


    async function  update_profile (id: string,  name: string,  surname: string,  nickname: string, email :string, country: string, affiliation: string, newsletter: boolean) :Promise<void> {

        const readUser = Storage.read<DUser>('user');

        const updateUserRequest :UpdateUserRequest = new UpdateUserRequest();
        updateUserRequest.id = readUser.id;
        updateUserRequest._Id = readUser._Id;
        updateUserRequest.name = name;
        updateUserRequest.surname = surname;
        updateUserRequest.nickname = nickname;
        updateUserRequest.country = country;
        updateUserRequest.email = email;
        updateUserRequest.affiliation = affiliation;
        updateUserRequest.newsletter = newsletter; //update_newsletter(newsletter);



        try {
            const response = await UsersApi.updateUserById(updateUserRequest);

            if (!response) {
                U.alert('e', 'Could not update your profile.', 'Something went wrong ...');
                return;
            }

            const updated_user = DUser.new(
                name, surname, nickname, affiliation, country, newsletter, email, readUser.token, readUser.id, readUser._Id
            );
            Storage.write('user', updated_user);
            U.resetState();
            U.alert('i', 'Your profile has been updated!', '');

        } catch (error) {
            U.alert('e', 'Could not update your profile.', 'Something went wrong ...');
        }

    }


    return(<Try>
        <Dashboard active={'Account'} version={props.version}>
            <>
            <div className={'p-2 edit-container'}>
                <h2><i className="bi bi-person-square"></i> Profile</h2>

                <Edit 
                    id={user.id}
                    name={'name'} 
                    label={'Name'} 
                    type={'text'} 
                    value={name} 
                    required={true}
                    disabled={false}
                    onChange={(e) => setName(e.target.value)}
                    tooltip={'Your first name.'}  
                />
                <Edit 
                    id={user.id}
                    name={'surname'} 
                    label={'Surname'} 
                    type={'text'} 
                    value={surname} 
                    required={true}
                    onChange={(e) => setSurname(e.target.value)}
                    tooltip={'Your family name.'}
                />

                <Edit
                    id={user.id}
                    name={'nickname'}
                    label={'Nickname'}
                    type={'text'}
                    value={nickname}
                    required={true}
                    onChange={(e) => setNickname(e.target.value)}
                    tooltip={'Your nickname, it will be used as a short form for addressing you.'}
                />

                <Edit
                    id={user.id}
                    name={'email'} 
                    label={'Email'} 
                    type={'email'} 
                    value={email}
                    required={true}
                    //required={true}
                    onChange={(e) => setEmail(e.target.value)}
                    tooltip={'Your email, it is not possible to change it.'}
                />
                <Edit 
                    id={user.id}
                    name={'affiliation'} 
                    label={'Affiliation'} 
                    type={'text'} 
                    value={affiliation}
                    required={true}
                    onChange={(e) => setAffiliation(e.target.value)}
                    tooltip={'Your current affiliation.'}
                />
                <Edit 
                    id={user.id}
                    name={'country'} 
                    label={'Country'} 
                    type={'country'} 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    tooltip={'Select your affiliation country.'}
                />

                
                <Edit 
                    id={user.id}
                    name={'newsletter'} 
                    label={'Newsletter'} 
                    type={'checkbox'} 
                    value={newsletter+''}
                    onChange={(e) => update_newsletter(!newsletter)}
                    tooltip={'Select it if you want to receive low-intensity updates from us (e.g., new releases, new learning and teaching material, and the likes).'}
                />

                <button 
                    className="btn alert-btn my-2 px-4 space-above" 
                    onClick={(e) => {
                         update_profile(
                            user.id,
                            name,
                            surname,
                            nickname,
                            email,
                            country,
                            affiliation,
                            newsletter)
                    }}>save</button>


            </div>
            <div className={'p-2 edit-container space-above'}>
                <div className={'password-container'}>
                    <h3><i className="bi bi-fingerprint"></i> Password</h3>

                    <Edit 
                        id={user.id}
                        name={'old_password'}
                        placeholder={'old password'}
                        label={'Password'} 
                        type={'password'}
                        required={true}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />


                    <Edit 
                        id={user.id}
                        name={'new_password'}
                        placeholder={'new password'}
                        label={'New Password'} 
                        type={'password'}
                        required={true}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={'space-above'}                 
                    />
                    <Edit 
                        id={user.id}
                        name={'check_password'}
                        placeholder={'repeat new password'}
                        label={'Confirm Password'}
                        type={'password'} 
                        required={true}
                        onChange={(e) => setCheckPassword(e.target.value)}
                    />
                    <button 
                        className="btn alert-btn my-2  px-4 space-above"
                        onClick={(e) => update_password(old_password, new_password, check_password)}
                        >change password</button>
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

const AccountPage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AccountPage};
