import {Try} from '../joiner';
import {Dashboard} from './components';

function UpdatesPage(): JSX.Element {
    // NB: this works only in production if you put subfolders with past builds in the new build root.
    return(<Try>
        <Dashboard active={'Updates'} version={{n: 0, date:'fake-date'}}>
            <>
                <h2>Available versions</h2>
                <ul>
                    <li><a href={window.location.origin + '/jjodel'}>2.0</a></li>
                    <li><a href={window.location.origin + '/jjodel/2.1/'}>2.1</a></li>
                    <li><a href={window.location.origin + '/jjodel/2.2/'}>2.2 (to come)</a></li>
                </ul>
            </>
        </Dashboard>
    </Try>);
}

export {UpdatesPage};
