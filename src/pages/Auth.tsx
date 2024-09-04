import {FormEvent} from 'react';
import {useStateIfMounted} from 'use-state-if-mounted';
import {DUser, SetRootFieldAction, U} from '../joiner';
import Storage from '../data/storage';
import {useNavigate} from "react-router-dom";
import {AuthApi} from "../api/persistance";

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

    return(<section className={'w-100 h-100'}>
        <form className={'d-block bg-white rounded border mx-auto w-fit px-5 py-4 mt-5'} onSubmit={onSubmit}>
            <label className={'fs-1 d-block text-center text-primary'}>
                {isRegister ? 'REGISTER' : 'LOGIN'}
            </label>
            <hr />
            <input className={'w-100 input w-fit d-block mx-auto mt-3'} placeholder={'Email'}
                   value={email} onChange={e => setEmail(e.target.value)} type={'email'}  required={true} />
            {isRegister &&
                <input className={'w-100 input w-fit d-block mx-auto mt-2'} placeholder={'Username'}
                       value={username} onChange={e => setUsername(e.target.value)} type={'text'} required={true} />
            }
            <input className={'w-100 input w-fit d-block mx-auto  mt-2'} placeholder={'Password'}
                   value={password} onChange={e => setPassword(e.target.value)} type={'password'} required={true} />
            <button className={'d-block btn btn-primary p-1 mx-auto mt-3'} type={'submit'}>Submit</button>
            <label className={'mt-3 d-block text-center'}>
                {isRegister ? 'Already have an account?' : 'Don\'t have an account?'}
                <b tabIndex={-1} onClick={e => setIsRegister(!isRegister)} className={'ms-1 text-primary text-decoration-none cursor-pointer'}>
                    click here
                </b>
                <br/>Or start in
                <b tabIndex={-1} className={'ms-1 text-primary text-decoration-none cursor-pointer'}
                   onClick={e => offline()}
                >
                    Offline Mode
                </b>
            </label>
        </form>
    </section>);
}

export {AuthPage};
