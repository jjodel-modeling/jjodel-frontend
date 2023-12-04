import {FormEvent} from 'react';
import {useStateIfMounted} from 'use-state-if-mounted';
import PersistanceApi from '../api/persistance';
import {DUser, Json, SetRootFieldAction, stateInitializer} from '../joiner';

interface Props {}
function Auth(props: Props) {
    const [isRegister, setIsRegister] = useStateIfMounted(false);
    const [error, setError] = useStateIfMounted('');

    const onSubmit = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setError('');
        SetRootFieldAction.new('isLoading', true);
        const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
        const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
        if(isRegister) {
            const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
            await register(username, email, password);
        } else await login(email, password);
        if(!error) stateInitializer();
        SetRootFieldAction.new('isLoading', false);
    }
    const login = async(email: string, password: string) => {
        const response = await PersistanceApi.login(email, password);
        if(response.code === 200) {
            const user = response.body as Json;
            const id = user.id as string;
            const username = user.username as string;
            DUser.new(username, id); DUser.current = id;
        } else setError(response.body as string);
    }
    const register = async(username: string, email: string, password: string) => {
        const response = await PersistanceApi.register(username, email, password);
        if(response.code === 200) {
            const user = response.body as Json;
            const id = user.id as string;
            const username = user.username as string;
            DUser.new(username, id); DUser.current = id;
        } else setError(response.body as string);
    }

    return(<section className={'container p-3'}>
        <div className={'d-flex m-1'}>
            <h5 className={'me-3'}>{(isRegister) ? 'Register' : 'Login'}</h5>
            <button className={'py-1 px-2 btn btn-primary'} onClick={e => setIsRegister(!isRegister)}>
                {(isRegister) ? 'Go To Login' : 'Go To Register'}
            </button>
        </div>
        <hr className={'my-2'} />
        {(error) && <section className={'m-1'}>
            <b className={'text-danger'}>{error}</b>
            <hr className={'my-2'} />
        </section>}
        <form onSubmit={onSubmit}>
            {(isRegister) && <input className={'m-1 d-block input'} placeholder={'Username'} name={'username'} type={'username'} required={true} />}
            <input className={'m-1 d-block input'} placeholder={'Email'} name={'email'} type={'email'} required={true} />
            <input className={'m-1 d-block input'} placeholder={'Password'} name={'password'} type={'password'} required={true} />
            <button className={'m-1 py-1 px-2 btn btn-success'} type={'submit'}>Submit</button>
        </form>
    </section>);
}

export default Auth;
