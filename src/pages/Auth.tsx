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

    return(<section className={'w-100 h-100'}>
        <form className={'d-block bg-white rounded border mx-auto w-fit px-5 py-4 mt-5'} onSubmit={onSubmit}>
            <label className={'fs-1 d-block text-center text-primary'}>
                {isRegister ? 'REGISTER' : 'LOGIN'}
            </label>
            <hr />
            {error && <section><label className={'text-danger mt-2 w-min text-center'}>{error}</label></section>}
            <input className={'input w-fit d-block mx-auto mt-3'} id={'email'} placeholder={'Email'} type={'email'}  required={true} />
            {isRegister && <input className={'input w-fit d-block mx-auto mt-2'} id={'username'} placeholder={'Username'} type={'text'} required={true} />}
            <input className={'input w-fit d-block mx-auto  mt-2'} id={'password'} placeholder={'Password'} type={'password'} required={true} />
            <button className={'d-block btn btn-primary p-1 mx-auto mt-3'} type={'submit'}>Submit</button>
            <label className={'mt-3 d-block text-center'}>
                {isRegister ? 'Already have an account?' : 'Doesn\'t have an account?'}
                <b tabIndex={-1} onClick={e => setIsRegister(!isRegister)} className={'ms-1 text-primary text-decoration-none cursor-pointer'}>click here</b>
            </label>
        </form>
    </section>);
}

export default Auth;
