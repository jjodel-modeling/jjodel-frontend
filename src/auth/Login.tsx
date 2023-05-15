import React from 'react';
import {useStateIfMounted} from "use-state-if-mounted";
import Persistance from "../persistance/api";

interface IProps {}
export default function Login(props: IProps) {

    const [email, setEmail] = useStateIfMounted('');

    function submit(evt: React.MouseEvent<HTMLFormElement>) {
        Persistance.test(email);
        evt.preventDefault();
    }

    return(<form onSubmit={submit}>
        <input type={'email'} onChange={(evt) => setEmail(evt.target.value)} />
        <button type={'submit'} className={'btn btn-primary'}>submit</button>
    </form>)
}
