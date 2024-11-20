import {Try} from "../components/forEndUser/Try";
import {Dashboard} from "./components";

type Props = {};
function NewsPage(props: Props) {
    return(<Try>
        <Dashboard active={'UsersInfo'} version={{n: 0, date:'fake-date'}}>
            <b>Ciao</b>
        </Dashboard>
    </Try>);
}

export {NewsPage};
