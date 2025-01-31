import { useEventListener } from '..';
function useClickAnyWhere(handler) {
    useEventListener('click', event => {
        handler(event);
    });
}
export default useClickAnyWhere;
