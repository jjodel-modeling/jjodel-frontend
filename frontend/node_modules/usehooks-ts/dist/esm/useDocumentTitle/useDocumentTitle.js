import { useIsomorphicLayoutEffect } from '..';
function useDocumentTitle(title) {
    useIsomorphicLayoutEffect(() => {
        window.document.title = title;
    }, [title]);
}
export default useDocumentTitle;
