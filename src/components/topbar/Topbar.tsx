import React, {Dispatch, ReactElement, useState} from "react";
import {connect} from "react-redux";
import './style.scss';
import type { GObject } from "../../joiner";
import {
    DState,
    SetRootFieldAction,} from "../../joiner";
import {SaveManager} from "./SaveManager";
import toast from "react-hot-toast";
import Undoredocomponent from "./undoredocomponent";
import RoomManager from "../room/RoomManager";

function Topbar(props: AllProps) {

    const debug = props.debug;

    const notify = (text: string) => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{text}</label>
        </div>
    ));
    const [edgetest, setEdgeTest] = useState(<div id={"edgetest-empty"}></div>);

    const save = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.save();
        notify('Saved');
    }
    const load = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.load();
    }

    const importJson = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.importEcore_click(false, true);
    }
    const exportJson = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.exportEcore_click(false, true);
    }

    const importXml = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.importEcore_click(true, true);
    }
    const exportXml = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.exportEcore_click(true, true);
    }

    if (debug && !document.body.classList.contains("debug")) document.body.classList.add("debug");
    else document.body.classList.remove("debug")

    return(<div className={'topbar d-flex'}>
        <label className={'item border round ms-1'} onClick={save}>Save</label>
        <label className={'item border round ms-1'} onClick={load}>Load</label>
        {debug && <Undoredocomponent /> }

        <label className={'item border round ms-1'} onClick={exportJson}>Export JSON</label>
        <label className={'item border round ms-1'} onClick={importJson}>Import JSON</label>

        {debug && <>
                <label className={'item border round ms-1'} onClick={exportXml}>Export XML</label>
                <label className={'item border round ms-1'} onClick={importXml}>Import XML</label>

                <div className={'ms-auto me-1 d-flex'}>
                    <label className={'item border round ms-1'} onClick={ () => SaveManager.exportLayout_click(false) }>Export Layout</label>
                    <label className={'item border round ms-1'} onClick={ () => SaveManager.importLayout_click(false) }>Import Layout</label>
                </div>
            </>
        }

        <label className={"p-1 "} style={{display: "flex", cursor: "auto"}}>
            <label className={"my-auto"}>Debug mode</label>
            <input className={"my-auto input ms-auto"} type={"checkbox"} checked={props.debug}
                   onChange={(e)=>{SetRootFieldAction.new("debug", e.target.checked)}}
            />
        </label>

        <div className={'ms-auto d-flex'}>
            <RoomManager room={props.room} />
        </div>
    </div>);
}
interface OwnProps {room?: string}
interface StateProps {debug: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.debug = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TopBarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(Topbar);

export const TopBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TopBarConnected {...{...props, children}} />;
}

export default TopBar;
