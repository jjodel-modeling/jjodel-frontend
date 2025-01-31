import { useEffect, useState } from 'react';
function useIntersectionObserver(elementRef, { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false, }) {
    const [entry, setEntry] = useState();
    const frozen = (entry === null || entry === void 0 ? void 0 : entry.isIntersecting) && freezeOnceVisible;
    const updateEntry = ([entry]) => {
        setEntry(entry);
    };
    useEffect(() => {
        const node = elementRef === null || elementRef === void 0 ? void 0 : elementRef.current;
        const hasIOSupport = !!window.IntersectionObserver;
        if (!hasIOSupport || frozen || !node)
            return;
        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(updateEntry, observerParams);
        observer.observe(node);
        return () => observer.disconnect();
    }, [elementRef === null || elementRef === void 0 ? void 0 : elementRef.current, JSON.stringify(threshold), root, rootMargin, frozen]);
    return entry;
}
export default useIntersectionObserver;
