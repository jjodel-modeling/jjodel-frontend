import {DState, DUser, LUser, Try} from '../joiner';
import {Dashboard} from './components';
import {FakeStateProps, windoww} from '../joiner/types';
import React, {Component, Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import { Edit, EditCountry } from './components/Edit/Edit';
import {AuthApi, UsersApi} from '../api/persistance';
import { useStateIfMounted } from 'use-state-if-mounted';
import Storage from '../data/storage';
import { ResetPasswordRequest } from '../api/DTO/ResetPasswordRequest';
import {UpdateUserRequest} from "../api/DTO/UpdateUserRequest";
import {ChangePasswordRequest} from "../api/DTO/ChangePasswordRequest";
import {LoginRequest} from "../api/DTO/LoginRequest";


function AccountComponent(props: AllProps): JSX.Element {
    const {user} = props;

    const [name, setName] = useStateIfMounted(user.name);
    const [surname, setSurname] = useStateIfMounted(user.surname);
    const [nickname, setNickname] = useStateIfMounted(user.nickname);
    const [country, setCountry] = useStateIfMounted(user.country);
    const [affiliation, setAffiliation] = useStateIfMounted(user.affiliation);
    const [newsletter, setNewsletter] = useStateIfMounted(user.newsletter);
    const [email, setEmail] = useStateIfMounted(user.email);

    const [old_password, setOldPassword] = useStateIfMounted('01234567');
    const [new_password, setNewPassword] = useStateIfMounted('12345678');
    const [check_password, setCheckPassword] = useStateIfMounted('23456789');

    async function update_password(old_password: string, new_password:string, check_password:string) {

        const U = windoww.U;

        /*
        if(response.code !== 200) {
            U.alert('e', 'Your password does not match our records.','');
            return;
        }
        */

        if (new_password !== check_password) {
            U.alert('e', 'Paswords do not match.','');
            return;
        }

        const changePasswordRequest :ChangePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.UserName = nickname;
        changePasswordRequest.OldPassword = old_password;
        changePasswordRequest.Password= new_password;
        changePasswordRequest.PasswordConfirm = check_password;

        const response_password = await UsersApi.updatePassword(changePasswordRequest);

        if(response_password === null) {
            U.alert('e', 'Something went wrong.','');
            return;
        }

        U.alert('i', 'Your password has been successfully updated!','');
    }


    /*

    async function update_password(old_password: string, new_password:string, check_password:string) {

        const U = windoww.U;
        
        //const response = await AuthApi.login(email, old_password);


        if (response.code !== 200) {
            U.alert('e', 'Your password does not match our records.','');
            return;
        } 

        if (new_password !== check_password) {
            U.alert('e', 'Paswords do not match.','');
            return;
        }

        const response_password = await UsersApi.updatePasswordById(user.id, new_password);

        if (response_password === null) {
            U.alert('e', 'Something went wrong.','');
            return;
        }

        
        U.alert('i', 'Your password has been successfully updated!','');
        
        
        
        
        setNewPassword('01234567');
        setCheckPassword('12345678');


    }
    */



   
    function update_newsletter(check_value: boolean): boolean {

        if(!check_value) {
            return false;
        }
        setNewsletter(check_value);
        return true;


    }



    function update_profile (id: string,  name: string,  surname: string,  nickname: string, email :string, country: string, affiliation: string, newsletter: boolean) {

        const U = windoww.U;
        const readUser = Storage.read<DUser>('user');

        const updateUserRequest :UpdateUserRequest = new UpdateUserRequest();
        updateUserRequest.id = readUser.id;
        console.log(updateUserRequest.id);
        updateUserRequest.name = name;
        updateUserRequest.surname = surname;
        updateUserRequest.nickname = nickname;
        updateUserRequest.country = country;
        updateUserRequest.email = email;
        updateUserRequest.affiliation = affiliation;
        updateUserRequest.newsletter = update_newsletter(newsletter);

        console.log(updateUserRequest);

        const response = UsersApi.updateUserById(updateUserRequest);


        if (response === null) {
            U.alert('e', 'Could not update your profile.', 'Something went wrong ...');
            return;
        }

        const updated_user = DUser.new(name, surname, nickname, affiliation, country, newsletter, email, user.token, updateUserRequest.id);
        console.log("NUOVO UTENTE", updated_user);
        Storage.write('user', updated_user);
        U.resetState();

        U.alert('i', 'Your profile has been updated!','');

    }

    /*

    function update_profile (id: string,  name: string,  surname: string,  nickname: string, country: string, affiliation: string, newsletter: boolean) {

        alert("sono nella funzione update_profile")
        const U = windoww.U;

        const response = UsersApi.updateUserById(user.id, name, surname, nickname, country, affiliation, newsletter);


        if (response === null) {
            U.alert('e', 'Could not update your profile.', 'Something went wrong ...');
            return;
        } 

        const updated_user = DUser.new(name, surname, nickname, affiliation, country, newsletter, user.email, user.token, user.id);
        Storage.write('user', updated_user);
        U.resetState();
        
        U.alert('i', 'Your profile has been updated!','');
        
    }

     */


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
                    onClick={(e) => {update_profile(
                        user.id, 
                        name, 
                        surname, 
                        nickname,
                        email,
                        country,
                        affiliation,
                        newsletter)}}>save</button>


            </div>
            <div className={'p-2 edit-container space-above'}>
                <div className={'password-container'}>
                    <h3><i className="bi bi-fingerprint"></i> Password</h3>

                    <Edit 
                        id={user.id}
                        name={'old_password'} 
                        label={'Password'} 
                        type={'password'} 
                        value={old_password}
                        required={true}
                        onChange={(e) => setOldPassword(e.target.value)}              
                    />


                    <Edit 
                        id={user.id}
                        name={'new_password'} 
                        label={'New Password'} 
                        type={'password'} 
                        value={new_password}
                        required={true}
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className={'space-above'}                 
                    />
                    <Edit 
                        id={user.id}
                        name={'check_password'} 
                        label={'Confirm Password'} 
                        type={'password'} 
                        required={true}
                        value={check_password}
                        onChange={(e) => setCheckPassword(e.target.value)}              
                    />
                    <button 
                        className="btn alert-btn my-2  px-4 space-above"
                        onClick={(e) => update_password(old_password, new_password, check_password)}
                        //onClick={(e) => update_password(old_password, new_password, check_password)}
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

const AccountPage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AccountPage};
