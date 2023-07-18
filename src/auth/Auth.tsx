import {useStateIfMounted} from "use-state-if-mounted";
import Login from "./Login";
import Signin from "./Signin";

interface IProps {}
export default function Auth(props: IProps) {
    // creazione di due form in base a accesso/registrazione
    const [flag, setFlag] = useStateIfMounted(false);

    return(<div>
        <button className={'btn btn-primary'} onClick={(evt) => setFlag(!flag)}>switch</button>
        {(flag) ? <Login /> : <Signin />}
    </div>);


}
