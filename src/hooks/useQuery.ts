import {useLocation} from 'react-router-dom';
import {useMemo} from 'react';

/* Custom hook for retrieving query parameters */
export default function useQuery() {
    const {search} = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}
