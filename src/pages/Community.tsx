import {Try} from '../joiner';
import {Dashboard} from './components';

function CommunityPage(): JSX.Element {
    return(<Try>
        <Dashboard active={'Community'} version={{n: 0, date:'fake-date'}}>
            <div>Empty page, still in progress.</div>
        </Dashboard>
    </Try>);
}

export {CommunityPage};
