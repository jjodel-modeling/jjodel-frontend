import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import "./style.scss";
import {CreateElementAction, SetRootFieldAction} from "../../redux/action/action";
import {DValue, LNamedElement, LValue} from "../../model/logicWrapper";
import {DViewElement, LGraphElement, LUser} from "../../joiner";
import MemoRec from "../../memorec/api";

function ContextMenuComponent(props: AllProps) {

    const user = props.user;
    const display = props.display;
    const position = props.position;
    const me = props.me;
    const node = props.node;
    const jsxList: ReactNode[] = [];

    const close = () => { SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0}); }
    const addView = () => {
        if(me) {
            const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
            const dView: DViewElement = DViewElement.new(me.name + 'View', jsx);
            switch(me.className) {
                case 'DClass':
                    dView.query = `context DObject inv: self.instanceof.name = '${me.name}'`;
                    break;
                case 'DAttribute':
                case 'DReference':
                    dView.query = `context DValue inv: self.instanceof.name = '${me.name}'`;
                    break;
                case 'DObject':
                    dView.query = `context DObject inv: self.id = '${me.id}'`;
                    break;
            }
            CreateElementAction.new(dView);
            SetRootFieldAction.new('stackViews', dView.id, '+=', true);
        }
    }

    if(display && me && node) {
        jsxList.push(<div className={"col title text-center"}>{me.className}</div>);
        jsxList.push(<hr />);

        /* Memorec */
        jsxList.push(<div onClick={async() => {close(); await MemoRec.structuralFeature(me);}} className={"col item"}>AI Suggest</div>);

        jsxList.push(<div onClick={() => {close(); node.zIndex += 1;}} className={"col item"}>Up</div>);
        jsxList.push(<div onClick={() => {close(); node.zIndex -= 1;}} className={"col item"}>Down</div>);
        jsxList.push(<div onClick={() => {close(); addView();}} className={"col item"}>Add View</div>);
        jsxList.push(<div onClick={() => {close(); me?.delete();}} className={"col item"}>Delete</div>);
        switch (me.className) {
            case 'DValue': if ((me as any as LValue).instanceof) jsxList.pop(); break;
            case 'DClass':
                jsxList.push(<div onClick={() => {
                    close();
                    SetRootFieldAction.new('isEdgePending', {user: user.id, source: me.id});
                }} className={"col item"}>Extend</div>);
                break;
        }
    }
    return(<>
        <div className={"context-menu round"} style={{top: position.y - 100, left: position.x - 10}}>
            {jsxList.map((jsx, index) => { return <div key={index}>{jsx}</div>; })}
        </div>
    </>);
}
interface OwnProps {}
interface StateProps {
    user: LUser,
    display: boolean,
    position: {x: number, y: number},
    me?: LNamedElement,
    node?: LGraphElement,
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const user = LUser.from(state.currentUser);
    const display = state.contextMenu.display;
    const position = {x: state.contextMenu.x, y: state.contextMenu.y}
    const mePointer = state._lastSelected?.modelElement;
    const me: LNamedElement | undefined = mePointer ? LNamedElement.fromPointer(mePointer) : undefined;
    const nodePointer = state._lastSelected?.node;
    const node: LGraphElement | undefined = nodePointer ? LGraphElement.fromPointer(nodePointer) : undefined;
    const ret: StateProps = { user, display, position, me, node };
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
    return <ContextMenuConnected {...{...props, childrens}} />;
}
export default ContextMenu;

