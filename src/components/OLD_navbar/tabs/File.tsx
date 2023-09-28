import React from 'react';
import {SaveManager} from "../../topbar/SaveManager";
import {useStateIfMounted} from "use-state-if-mounted";

interface Props {setPath: (path: string) => void}
function File(props: Props) {
    const setPath = props.setPath;
    const [extension, setExtension] = useStateIfMounted('');

    const save = () => {
        SaveManager.save();
        setPath('');
    }

    const load = () => {
        SaveManager.load();
        setPath('');
    }

    const exportJson = () => {
        SaveManager.exportEcore_click(false, true);
        setPath('');
    }

    const importJson = () => {
        SaveManager.importEcore_click(false, true);
        setPath('');
    }

    const exportXml = () => {
        SaveManager.exportEcore_click(true, true);
        setPath('');
    }

    const importXml = () => {
        SaveManager.importEcore_click(true, true);
        setPath('');
    }

    const exportLayout = () => {
        SaveManager.exportLayout_click(false);
        setPath('');
    }

    const importLayout = () => {
        SaveManager.importLayout_click(false);
        setPath('');
    }

    return(<div className={'tab'} style={{marginLeft: '0.25%'}}>
        <div tabIndex={-1} onClick={save} className={'tab-item'}>Save</div>
        <div tabIndex={-1} onClick={load}  className={'tab-item'}>Load</div>
        <div tabIndex={-1} onClick={e => setExtension('export')}  className={'tab-item'}>
            Export
            <i className={'ms-1 bi bi-arrow-right'}></i>
        </div>
        {extension === 'export' && <div className={'extension'}>
            <div tabIndex={-1} onClick={exportJson}  className={'tab-item'}>JSON</div>
            <div tabIndex={-1} onClick={exportXml}  className={'tab-item'}>XMI</div>
            <div tabIndex={-1} onClick={exportLayout}  className={'tab-item'}>Layout</div>
            <div tabIndex={-1} onClick={e => setExtension('')}  className={'text-danger tab-item'}>Close</div>
        </div>}
        <div tabIndex={-1} onClick={e => setExtension('import')}  className={'tab-item'}>
            Import
            <i className={'ms-1 bi bi-arrow-right'}></i>
        </div>
        {extension === 'import' && <div className={'extension'}>
            <div tabIndex={-1} onClick={importJson}  className={'tab-item'}>JSON</div>
            <div tabIndex={-1} onClick={importXml}  className={'tab-item'}>XMI</div>
            <div tabIndex={-1} onClick={importLayout}  className={'tab-item'}>Layout</div>
            <div tabIndex={-1} onClick={e => setExtension('')}  className={'text-danger tab-item'}>Close</div>
        </div>}
        <div tabIndex={-1} onClick={e => setPath('')}  className={'text-danger tab-item'}>Close</div>
    </div>);
}

export default File;
