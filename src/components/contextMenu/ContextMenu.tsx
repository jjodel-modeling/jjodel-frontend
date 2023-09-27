import React, {Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {CreateElementAction, SetRootFieldAction} from '../../redux/action/action';
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
} from '../../joiner';
import MemoRec from '../../memorec/api';
import {useStateIfMounted} from 'use-state-if-mounted';
import ModellingIcon from "../forEndUser/ModellingIcon";

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
        SetRootFieldAction.new('contextMenu', {display: false, x: 0, y: 0});
    }
    const addView = () => {
        if(me) {
            const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
            const dView: DViewElement = DViewElement.new(me.name + 'View', jsx);
            switch(me.className) {
                case 'DClass':
                    dView.query = `context DObject inv: self.instanceof.id = '${me.id}'`;
                    break;
                case 'DAttribute':
                case 'DReference':
                    dView.query = `context DValue inv: self.instanceof.id = '${me.id}'`;
                    break;
                default:
                    dView.query = `context ${me.className} inv: self.id = '${me.id}'`;
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
        jsxList.push(<div className={'mt-1 col text-center'}><b>{me.className}</b></div>);
        jsxList.push(<hr className={'my-1'} />);

        /* Memorec */
        if(me.className === 'DClass')
            jsxList.push(<div onClick={structuralFeature} className={'col item'}>AI Suggest <i
                className='bi bi-arrow-right-short'></i></div>);
        if(me.className === 'DPackage')
            jsxList.push(<div onClick={classifier} className={'col item'}>
                AI Suggest
                <i className={'ms-1 bi bi-arrow-right'}></i>
            </div>);
        jsxList.push(<div onClick={() => {close(); node.zIndex += 1;}} className={'col item'}>Up</div>);
        jsxList.push(<div onClick={() => {close(); node.zIndex -= 1;}} className={'col item'}>Down</div>);
        jsxList.push(<div onClick={() => {close(); addView();}} className={'col item'}>Add View</div>);
        jsxList.push(<div onClick={() => {close(); me?.delete();}} className={'col item'}>Delete</div>);
        switch (me.className) {
            case 'DValue': if ((me as any as LValue).instanceof) jsxList.pop(); break;
            case 'DClass':
                jsxList.push(<div onClick={() => {
                    close();
                    SetRootFieldAction.new('isEdgePending', {user: user.id, source: me.id});
                }} className={'col item'}>Extend</div>);
                break;
        }
    }

    return(<>
        <div className={'context-menu round'} style={{top: position.y - 100, left: position.x - 10}} onContextMenu={(e)=>e.preventDefault()}>
            {jsxList.map((jsx, index) => {return <div key={index}>{jsx}</div>})}
        </div>
        {(memorec) && <div className={'context-menu round'} style={{overflow: 'auto', maxHeight: '12em', top: position.y - 100, left: position.x + 130}}>
            {(memorec && memorec.data?.map((obj, index) => {
                return (<div key={index}>
                    <div className={'col item d-block'} onClick={e => setSuggestedName(obj.recommendedItem)}>
                        {obj.recommendedItem} :
                        <span className={'ms-1 text-primary'}>{Math.round(obj.score * 100) / 100}</span>
                    </div>
                </div>)
            }))}
        </div>}

        {(memorec && suggestedName) && <div className={'memorec-overlay'}>
            <div tabIndex={-1} onBlur={e => close()} className={'memorec-popup'}>
                <div className={'d-block text-center mb-1'}>Add <b>{suggestedName}</b> as:</div>
                {(memorec.type === 'class') ? <>
                    <div tabIndex={-1} onClick={e =>suggestOnClass(true)} className={'d-flex memorec-button'}>
                        <ModellingIcon className={'my-auto'} name={'attribute'} />
                        <span className={'ms-2 my-auto'}>Attribute</span>
                    </div>
                    <div tabIndex={-1} onClick={e =>suggestOnClass(false)} className={'d-flex memorec-button mt-1'}>
                        <ModellingIcon className={'my-auto'} name={'reference'} />
                        <span className={'ms-2 my-auto'}>Reference</span>
                    </div>
                </> :
                    <div tabIndex={-1} onClick={e =>suggestOnPackage()} className={'d-flex memorec-button mt-1'}>
                        <ModellingIcon className={'my-auto'} name={'class'} />
                        <span className={'ms-2 my-auto'}>Class</span>
                    </div>
                }
                <div className={'d-flex memorec-button mt-3'} tabIndex={-1} onClick={e => close()}>
                    <span className={'mx-auto text-danger'}>Close</span>
                </div>
            </div>
        </div>}
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
