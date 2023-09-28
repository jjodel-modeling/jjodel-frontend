import React from 'react';
import {SaveManager} from "../../topbar/SaveManager";

interface Props {}
function File(props: Props) {

    const save = () => {
        SaveManager.save();
    }

    const load = () => {
        SaveManager.load();
    }

    const exportJson = () => {
        SaveManager.exportEcore_click(false, true);
    }

    const importJson = () => {
        SaveManager.importEcore_click(false, true);
    }

    const exportXml = () => {
        SaveManager.exportEcore_click(true, true);
    }

    const importXml = () => {
        SaveManager.importEcore_click(true, true);
    }

    const exportLayout = () => {
        SaveManager.exportLayout_click(false);
    }

    const importLayout = () => {
        SaveManager.importLayout_click(false);
    }

    return(<li className={'nav-item dropdown'}>
        <div tabIndex={-1} className={'dropdown-toggle'} data-bs-toggle={'dropdown'}>File</div>
        <ul className={'dropdown-menu'}>
            <li tabIndex={-1} onClick={save} className={'dropdown-item'}>Save</li>
            <li tabIndex={-1} onClick={load} className={'dropdown-item'}>Load</li>
            <li tabIndex={-1} className={'dropdown-item'}>Export
                <i className={'ms-1 bi bi-arrow-right'}></i>
                <ul className={'submenu dropdown-menu'}>
                    <li tabIndex={-1} onClick={exportJson} className={'dropdown-item'}>JSON</li>
                    <li tabIndex={-1} onClick={exportXml} className={'dropdown-item'}>XML</li>
                    <li tabIndex={-1} onClick={exportLayout} className={'dropdown-item'}>Layout</li>
                </ul>
            </li>
            <li tabIndex={-1} className={'dropdown-item'}>Import
                <i className={'ms-1 bi bi-arrow-right'}></i>
                <ul className={'submenu dropdown-menu'}>
                    <li tabIndex={-1} onClick={importJson} className={'dropdown-item'}>JSON</li>
                    <li tabIndex={-1} onClick={importXml} className={'dropdown-item'}>XML</li>
                    <li tabIndex={-1} onClick={importLayout} className={'dropdown-item'}>Layout</li>
                </ul>
            </li>
        </ul>
    </li>);

}

export default File;
