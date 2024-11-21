import { useEffect, useState } from 'react';
function useMediaQuery(query) {
    const getMatches = (query) => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    };
    const [matches, setMatches] = useState(getMatches(query));
    function handleChange() {
        setMatches(getMatches(query));
    }
    useEffect(() => {
        const matchMedia = window.matchMedia(query);
        handleChange();
        if (matchMedia.addListener) {
            matchMedia.addListener(handleChange);
        }
        else {
            matchMedia.addEventListener('change', handleChange);
        }
        return () => {
            if (matchMedia.removeListener) {
                matchMedia.removeListener(handleChange);
            }
            else {
                matchMedia.removeEventListener('change', handleChange);
            }
        };
    }, [query]);
    return matches;
}
export default useMediaQuery;
