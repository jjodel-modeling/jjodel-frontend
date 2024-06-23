import {Try} from '../joiner';
import {Dashboard} from './components';

function SettingsPage(): JSX.Element {
    return(<Try>
        <Dashboard active={'Settings'} version={{n: 0, date:'fake-date'}}>
            <div>Empty page, still in progress.</div>
        </Dashboard>
    </Try>);
}

export {SettingsPage};
