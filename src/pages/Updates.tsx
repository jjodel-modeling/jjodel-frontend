import {Try} from '../joiner';
import {Dashboard} from './components';

function UpdatesPage(): JSX.Element {
    return(<Try>
        <Dashboard active={'Updates'} version={{n: 0, date:'fake-date'}}>
            <div>Empty page, still in progress.</div>
        </Dashboard>
    </Try>);
}

export {UpdatesPage};
