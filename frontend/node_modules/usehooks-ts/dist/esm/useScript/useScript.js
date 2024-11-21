import { useEffect, useState } from 'react';
const cachedScriptStatuses = {};
function getScriptNode(src) {
    const node = document.querySelector(`script[src="${src}"]`);
    const status = node === null || node === void 0 ? void 0 : node.getAttribute('data-status');
    return {
        node,
        status,
    };
}
function useScript(src, options) {
    const [status, setStatus] = useState(() => {
        var _a;
        if (!src || (options === null || options === void 0 ? void 0 : options.shouldPreventLoad)) {
            return 'idle';
        }
        if (typeof window === 'undefined') {
            return 'loading';
        }
        return (_a = cachedScriptStatuses[src]) !== null && _a !== void 0 ? _a : 'loading';
    });
    useEffect(() => {
        var _a, _b;
        if (!src || (options === null || options === void 0 ? void 0 : options.shouldPreventLoad)) {
            return;
        }
        const cachedScriptStatus = cachedScriptStatuses[src];
        if (cachedScriptStatus === 'ready' || cachedScriptStatus === 'error') {
            setStatus(cachedScriptStatus);
            return;
        }
        const script = getScriptNode(src);
        let scriptNode = script.node;
        if (!scriptNode) {
            scriptNode = document.createElement('script');
            scriptNode.src = src;
            scriptNode.async = true;
            scriptNode.setAttribute('data-status', 'loading');
            document.body.appendChild(scriptNode);
            const setAttributeFromEvent = (event) => {
                const scriptStatus = event.type === 'load' ? 'ready' : 'error';
                scriptNode === null || scriptNode === void 0 ? void 0 : scriptNode.setAttribute('data-status', scriptStatus);
            };
            scriptNode.addEventListener('load', setAttributeFromEvent);
            scriptNode.addEventListener('error', setAttributeFromEvent);
        }
        else {
            setStatus((_b = (_a = script.status) !== null && _a !== void 0 ? _a : cachedScriptStatus) !== null && _b !== void 0 ? _b : 'loading');
        }
        const setStateFromEvent = (event) => {
            const newStatus = event.type === 'load' ? 'ready' : 'error';
            setStatus(newStatus);
            cachedScriptStatuses[src] = newStatus;
        };
        scriptNode.addEventListener('load', setStateFromEvent);
        scriptNode.addEventListener('error', setStateFromEvent);
        return () => {
            if (scriptNode) {
                scriptNode.removeEventListener('load', setStateFromEvent);
                scriptNode.removeEventListener('error', setStateFromEvent);
            }
            if (scriptNode && (options === null || options === void 0 ? void 0 : options.removeOnUnmount)) {
                scriptNode.remove();
            }
        };
    }, [src, options === null || options === void 0 ? void 0 : options.shouldPreventLoad, options === null || options === void 0 ? void 0 : options.removeOnUnmount]);
    return status;
}
export default useScript;
