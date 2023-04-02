import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useCallback, useEffect, useState} from "react";
import {connect} from "react-redux";
import "./style.scss";
import {SetRootFieldAction} from "../../redux/action/action";
import {LModelElement, LNamedElement} from "../../model/logicWrapper";
import {LPointerTargetable, LUser} from "../../joiner";
import JSX from "../../common/JSX";


interface ThisState {}
function ContextMenuComponent(props: AllProps, state: ThisState) {

    const user = props.user;
    const display = props.display;
    const position = props.position;
    const selected = props.selected;

    const close = () => { SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0}); }

    if(display && selected) {
        const jsxList: ReactElement[] = [];
        jsxList.push(<div className={"col title text-center"}>{selected.className}</div>);
        jsxList.push(<hr className={"mt-0 mb-0"} />);
        switch (selected.className) {
            case "DClass":
                jsxList.push(<div onClick={() => {
                    close();
                    SetRootFieldAction.new('isEdgePending', {user: user.id, source: selected.id});
                }} className={"col item"}>Extend</div>);
                break;
        }
        jsxList.push(<div onClick={() => {close(); selected.delete();}} className={"col item"}>Delete</div>);
        return <>
            <div className={"context-menu"} style={{top: position.y - 40, left: position.x - 10}}>
                {jsxList/*.map((jsx) => { return jsx })*/}
            </div>
        </>;
    } else { return <></>; }
}
interface OwnProps {}
interface StateProps { user: LUser, display: boolean, position: {x: number, y: number}, selected: LModelElement | undefined }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const user = LUser.from(state.currentUser);
    const display = state.contextMenu.display;
    const position = {x: state.contextMenu.x, y: state.contextMenu.y}
    const selectedPointer = state._lastSelected?.modelElement;
    const selected: LModelElement | undefined = selectedPointer ? LModelElement.from(selectedPointer) : undefined;
    const ret: StateProps = { user, display, selected, position };
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ContextMenuConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ContextMenuComponent);

export const ContextMenu = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // @ts-ignore
    return <ContextMenuConnected {...{...props, childrens}} />;
}
export default ContextMenu;

