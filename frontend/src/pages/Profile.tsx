import {Try} from '../joiner';
import {Dashboard} from './components';

import {Cards} from './components/cards/Cards';
import {JSX} from "react";

function ProfilePage(): JSX.Element {
    // NB: this works only in production if you put subfolders with past builds in the new build root.
    return(<Try>
        <Dashboard active={'Profile'} version={{n: 0, date:'fake-date'}}>
            <>                

            <Cards>
                <Cards.Item
                    title={'Getting started'} 
                    subtitle={'Create your first notation.'}
                    icon={'gettingstarted'} 
                    style={'rainbow'}   
                />
                {<Cards.Item icon={'question'} style={'clear'} title={'Ehy!'}
                             subtitle={'What do you want to do today?'}/>}
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

export {ProfilePage};
