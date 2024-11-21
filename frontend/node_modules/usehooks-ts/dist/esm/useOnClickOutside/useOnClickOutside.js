import { useEventListener } from '..';
function useOnClickOutside(ref, handler, mouseEvent = 'mousedown') {
    useEventListener(mouseEvent, event => {
        const el = ref === null || ref === void 0 ? void 0 : ref.current;
        if (!el || el.contains(event.target)) {
            return;
        }
        handler(event);
    });
}
export default useOnClickOutside;
