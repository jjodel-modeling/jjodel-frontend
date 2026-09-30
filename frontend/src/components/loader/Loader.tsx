import {MouseEvent} from 'react';
import {createPortal} from 'react-dom';
import './style.scss';
// import {Oval} from 'react-loader-spinner';

interface Props {}
function Loader(props: Props) {
    const prevent = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }

    // Portaled to <body>, per D-UI-14. #root is position:fixed (index.scss), so it is a
    // stacking context at level 0, and the 99999 of .loader-spinner only ranked it inside
    // #root: the Properties rail, a body-level sibling at 900, stayed bright on top of the
    // save overlay (P-2026-09-30-2025). Same pattern as ToastContainer and SymbolEditorModal.
    return createPortal(<div className={'loader-spinner'} onContextMenu={prevent} onClick={prevent}>
        <span className="spinner-animated" />
        {/* react-loader-spinner removed
        <Oval height={50} width={50} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
              color={'rgba(0, 0, 0, 0.9)'} secondaryColor={'rgba(0, 0, 0, 0.6)'}/>*/}
    </div>, document.body);
}

export default Loader;

