import {DUser, SetRootFieldAction, Try} from '../joiner';
import {Dashboard} from './components';
import {useEffect, useState} from "react";


type Props = {};
function UsersInfoPage(props: Props) {
    const [users, setUsers] = useState<DUser[]>([]);
    useEffect(() => {
        (async function() {
            SetRootFieldAction.new('isLoading', true);
            SetRootFieldAction.new('isLoading', false);
        })();
    }, []);

    return(<Try>
        <Dashboard active={'UsersInfo'} version={{n: 0, date:'fake-date'}}>
            <div>
                Users: {users.length}
                {users.map(u => <div key={u.email}>
                    {u.email}: {u.affiliation}
                </div>)}
            </div>
        </Dashboard>
    </Try>);
}

export {UsersInfoPage};
