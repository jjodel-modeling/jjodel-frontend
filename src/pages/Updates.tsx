import {Try} from '../joiner';
import {Dashboard} from './components';

import {Cards, Card} from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';

function UpdatesPage(): JSX.Element {
    // NB: this works only in production if you put subfolders with past builds in the new build root.
    return(<Try>
        <Dashboard active={'Updates'} version={{n: 0, date:'fake-date'}}>
            <>                

            <Cards>
                <Cards.Item
                    title={'Getting started'} 
                    subtitle={'Create your first notation.'}
                    icon={'gettingstarted'} 
                    style={'rainbow'}   
                />
                {true && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>}
            </Cards>

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
