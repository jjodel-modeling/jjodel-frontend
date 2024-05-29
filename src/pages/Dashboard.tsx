import {ReactNode} from 'react';
import Navbar from "./components/Navbar";
import LeftBar from "./components/LeftBar";
import './style.scss'
import {SetRootFieldAction} from "../redux/action/action";

type Props = {children?: ReactNode};
function Dashboard(props: Props) {
    const {children} = props;

    const click = () => {
        console.clear();
        const obj = {value: {raw: 999, unit: 's'}, timestamp: 4};
        SetRootFieldAction.new("topics.sensors/3", obj, '+=', false);
    }

    return(<>
        <Navbar />
        <LeftBar />
        <div style={{marginLeft: '12%'}} className={'p-2'}>
            <button onClick={click}>test</button>
            {children}
        </div>
    </>);
}

export default Dashboard;

