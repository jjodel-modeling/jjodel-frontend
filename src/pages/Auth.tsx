import {FormEvent} from 'react';
import {useStateIfMounted} from 'use-state-if-mounted';
import {DUser, SetRootFieldAction, U} from '../joiner';
import Storage from '../data/storage';
import {useNavigate} from "react-router-dom";
import {AuthApi} from "../api/persistance";

import logo from '../static/img/jjodel.jpg';
import { Tooltip } from '../components/forEndUser/Tooltip';

function AuthPage(): JSX.Element {
    const [isRegister, setIsRegister] = useStateIfMounted(false);
    const [username, setUsername] = useStateIfMounted('');
    const [email, setEmail] = useStateIfMounted('');
    const [password, setPassword] = useStateIfMounted('');
    const navigate = useNavigate();

    const onSubmit = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        SetRootFieldAction.new('isLoading', true);
        if(isRegister) await register(username, email, password);
        else await login(email, password);
        SetRootFieldAction.new('isLoading', false);
    }
    const login = async(email: string, password: string) => {
        const response = await AuthApi.login(email, password);
        if(response.code !== 200) {
            alert('Bad Data!');
            return;
        }
        const data = U.wrapper<DUser>(response.data);
        const user = DUser.new(data.username, data.id);
        user.token = data.token;
        Storage.write('user', user);
        Storage.write('token', user.token);
        //navigate('/dashboard');
        navigate('/allProjects');
        U.refresh();
    }
    const register = async(username: string, email: string, password: string) => {
        const response = await AuthApi.register(username, email, password);
        if(response.code !== 200) {
            alert('Bad Data!');
            return;
        }
        const data = U.wrapper<DUser>(response.data);
        Storage.write('token', data.token);
        const user = DUser.new(data.username, data.id);
        Storage.write('user', user);
        //navigate('/dashboard');
        navigate('/allProjects');
        U.refresh();
    }
    const offline = () => {
        AuthApi.offline();
        //navigate('/dashboard');
        navigate('/allProjects');
        U.refresh();
    }

    return(<section className={`w-100 h-100 login bg-3 ${isRegister && 'register'}`}>
        <form className={'d-block bg-white rounded border mx-auto w-fit px-5 py-4 mt-5'} onSubmit={onSubmit}>
            <label className={'fs-1 d-block text-center text-primary login-header'}>
                {isRegister ? 'Create an Account' : 'Sign In'}
            </label>

            {isRegister ? <>
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>First Name</h6>Your first name will be visible to others whenever you interact with them, such as during collaboration on shared projects.</div>} >
                    <label>
                        First Name
                        <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            type={'text'} required={true} 
                        />
                    </label>
                </Tooltip>

                <label>
                    Last Name (optional) 
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        type={'text'} required={true} 
                    />
                </label>
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Affiliation</h6>Your affiliation refers to the organization, institution, or company you’re associated with, will be displayed in relevant contexts like project collaborations or professional interactions, and will help us keep track of where jjodel is being used.</div>} ><label>
                    Affiliation 
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        type={'text'} required={true} 
                    />
                    </label>
                </Tooltip>
                <label>
                    Country (optional)
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        type={'text'} required={true} 
                    />
                </label>
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Email</h6>Your email address will be used for communication, notifications, and to identify you in the system, but it won’t be shared publicly without your consent.</div>} >
                    <label>
                        Email 
                        <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            type={'text'} required={true} 
                        />
                    </label>
                </Tooltip>
                <br /><br /><br />
                
                <label>
                    Password 
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                        value={password} 
                        onChange={e => setUsername(e.target.value)} 
                        type={'password'} required={true} 
                    />
                </label>

            
                <label>
                    Confirm Password 
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'} 
                        value={password} 
                        onChange={e => setUsername(e.target.value)} 
                        type={'password'} required={true} 
                    />
                </label>

                <br /><br /><br />
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Email</h6>Your email address will be used for communication, notifications, and to identify you in the system, but it won’t be shared publicly without your consent.</div>} >
                    <label>
                        
                        <input className={'checkbox'} 
                            placeholder={'newsletter'}
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            type={'checkbox'}
                            style={{outline: 'none', marginTop: '10px', float: 'left'}}
                        />
                        <div style={{display: 'block', width: '90%', float: 'left', marginBottom: '10px',     paddingLeft: '10px'}}>Newsletter. Subscribe to the newsletter to receive updates and news. You can manage your registration preferences at any time. </div>
                    </label>
                    
                </Tooltip>
                <br />
                <div style={{width: '100%', textAlign: 'center'}}>
                    By proceeding you accept the terms and conditions.
                </div>
                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'}>
                    Create
                </button>
            </>
            : 
            <>
                <input className={'w-100 input w-fit d-block mx-auto mt-3'} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} type={'email'}  
                    required={true} 
                />
                <input className={'w-100 input w-fit d-block mx-auto  mt-2'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    type={'password'} 
                    required={true} 
                />
                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'}>
                    Login
                </button>
            </>}



            
            
            
            <label className={'mt-3 d-block text-center'}>
                {isRegister ? 'Already have an account?' : 'Don\'t have an account?'}
                <b tabIndex={-1} onClick={e => setIsRegister(!isRegister)} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}>
                    click here
                </b>
                <br/>Or start in
                <b tabIndex={-1} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}
                   onClick={e => offline()}
                >
                    offline mode
                </b>
            </label>
            <div className='login-logo'><img src={logo}></img></div>
        </form>
    </section>);
}

export {AuthPage};
