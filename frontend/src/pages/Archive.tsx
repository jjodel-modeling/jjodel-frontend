import {Try} from '../joiner';
import {Dashboard} from './components';
import {JSX} from "react";

function ArchivePage(): JSX.Element {
    return(<Try>
        <Dashboard active={'Archive'} version={{n: 0, date:'fake-date'}}>
            <div>Empty page, still in progress.</div>
        </Dashboard>
    </Try>);
}

export {ArchivePage};
