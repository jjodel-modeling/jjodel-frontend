import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import "./style.scss";
import {CreateElementAction, SetRootFieldAction} from "../../redux/action/action";
import {
    DValue,
    DViewElement,
    GObject,
    LClass,
    LGraphElement,
    LNamedElement,
    LPackage,
    LUser,
    LValue, DState,
} from "../../joiner";
import MemoRec from "../../memorec/api";
import {useStateIfMounted} from "use-state-if-mounted";

function ContextMenuComponent(props: AllProps) {

    const user = props.user;
    const display = props.display;
    const position = props.position;
    const me = props.me; //refer to selected
    const node = props.node;
    const jsxList: ReactNode[] = [];
    const [memorec, setMemorec] = useStateIfMounted<{data:GObject[], type:'class'|'package'}|null>(null);
    const [suggestedName, setSuggestedName] = useStateIfMounted('');


    useEffect(() => {
        if(!display) close();
    },[display])

    const close = () => {
        setSuggestedName('');
        setMemorec(null);
        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
    }
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
    const structuralFeature = async () => {
        if(!me) return;
        const data = await MemoRec.structuralFeature(me);
        setMemorec(data);
    }
    const classifier = async() => {
        if (!me) return;
        const data = await MemoRec.classifier(me);
        setMemorec(data);
    }

    const suggestOnClass = (isAttribute:boolean) => {
        if(!me) return;
        const lClass: LClass = LClass.fromPointer(me.id);
        if(isAttribute) lClass.addAttribute(suggestedName);
        else lClass.addReference(suggestedName);
        //add attribute/refence to class
        close();

    }
    const suggestOnPackage = () => {
        if(!me) return;
        const lPackage: LPackage = LPackage.fromPointer(me.id);
        lPackage.addClass(suggestedName);
        //add class to package
        close();
    }
    if(display && me && node) {
        jsxList.push(<div className={"col title text-center"}>{me.className}</div>);
        jsxList.push(<hr />);

        /* Memorec */
        if(me.className === 'DClass')
            jsxList.push(<div onClick={structuralFeature} className={"col item"}>AI Suggest <i
                className="bi bi-arrow-right-short"></i></div>);
        if(me.className === 'DPackage')
            jsxList.push(<div onClick={classifier} className={"col item"}>AI Suggest</div>);
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

        {(memorec) && <div className={"context-menu round"} style={{top: position.y - 100, left: position.x + 130}}>

            {(memorec && memorec.data?.map((obj) => {
                return (<div>
                    <div className={"col item2"} onClick={() => setSuggestedName(obj.recommendedItem)}>
                        {obj.recommendedItem} : {obj.score}
                    </div>
                </div>)
            })) }

        </div>}
        {(memorec && suggestedName) && <div className={"context-menu round"} style={{top: position.y - 100, left: position.x + 270}}>

            {(memorec?.type === 'class') ? <>
                <div> <div className={'col item2'} onClick={() =>suggestOnClass(true)} >attribute</div> </div>
                <div><div className={'col item2'} onClick={() =>suggestOnClass(false)} >reference</div> </div>
            </> : <div> <div className={'col item2'} onClick={() =>suggestOnPackage()}> class </div> </div>}
        </div>
        }
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


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
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


export const ContextMenuConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ContextMenuComponent);

export const ContextMenu = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ContextMenuConnected {...{...props, childrens}} />;
}
export default ContextMenu;
