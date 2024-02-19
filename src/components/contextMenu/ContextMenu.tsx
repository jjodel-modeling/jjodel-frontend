import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {SetRootFieldAction} from '../../redux/action/action';
import {
    DClass,
    DState,
    DUser,
    DValue,
    DViewElement,
    GObject,
    LClass,
    LGraphElement,
    LNamedElement,
    LPackage,
    LProject,
    LUser,
    LValue,
    windoww,
} from '../../joiner';
import MemoRec from '../../memorec/api';
import {useStateIfMounted} from 'use-state-if-mounted';
import ModellingIcon from "../forEndUser/ModellingIcon";
import {FakeStateProps} from "../../joiner/types";

function ContextMenuComponent(props: AllProps) {
    const user = props.user;
    const project = user.project as LProject;
    const display = props.display;
    const position = props.position;
    const node = props.node;
    const data: LNamedElement = LNamedElement.fromPointer(node?.model?.id);
    const jsxList: ReactNode[] = [];
    const [memorec, setMemorec] = useStateIfMounted<{data:GObject[], type:'class'|'package'}|null>(null);
    const [suggestedName, setSuggestedName] = useStateIfMounted('');

    if(!node || !data) return(<></>);

    const close = () => {
        // if (!windoww.ContextMenuVisible) return;
        windoww.ContextMenuVisible = false;
        setSuggestedName('');
        setMemorec(null);
        SetRootFieldAction.new('contextMenu', {display: false, x: 0, y: 0});
    }

    const addView = async() => {
        const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
        let query = '';
        switch(data.className) {
            case 'DClass':
                query = `context DObject inv: self.instanceof.id = '${data.id}'`;
                break;
            case 'DAttribute':
            case 'DReference':
                query = `context DValue inv: self.instanceof.id = '${data.id}'`;
                break;
            default:
                query = `context ${data.className} inv: self.id = '${data.id}'`;
                break;
        }
        DViewElement.new(data.name + 'View', jsx, undefined, '', '', '', [], query, 2);
        close();
    }

    const structuralFeature = async () => {setMemorec(await MemoRec.structuralFeature(data))}

    const classifier = async() => {setMemorec(await MemoRec.classifier(data))}

    const suggestOnClass = (isAttribute:boolean) => {
        const lClass: LClass = LClass.fromPointer(data.id);
        if(isAttribute) lClass.addAttribute(suggestedName);
        else lClass.addReference(suggestedName);
        close();

    }
    const suggestOnPackage = () => {
        const lPackage: LPackage = LPackage.fromPointer(data.id);
        lPackage.addClass(suggestedName);
        close();
    }
    if(display) {
        jsxList.push(<div className={'mt-1 col text-center'}><b>{data.className}</b></div>);
        jsxList.push(<hr className={'my-1'} />);

        /* Memorec */
        if(data.className === 'DClass')
            jsxList.push(<div onClick={structuralFeature} className={'col item'}>AI Suggest <i
                className='bi bi-arrow-right-short'></i></div>);
        if(data.className === 'DPackage')
            jsxList.push(<div onClick={classifier} className={'col item'}>
                AI Suggest
                <i className={'ms-1 bi bi-arrow-right'}></i>
            </div>);
        jsxList.push(<div onClick={() => {
            close();
            SetRootFieldAction.new(`selected.${DUser.current}`, '', '', false);
        }} className={'col item'}>Deselect</div>);
        jsxList.push(<div onClick={() => {close(); node.zIndex += 1;}} className={'col item'}>Up</div>);
        jsxList.push(<div onClick={() => {close(); node.zIndex -= 1;}} className={'col item'}>Down</div>);
        jsxList.push(<div onClick={async () => {close(); await addView();}} className={'col item'}>Add View</div>);
        jsxList.push(<div onClick={() => {close(); data.delete(); node.delete();}} className={'col item'}>Delete</div>);
        switch (data.className) {
            case 'DValue': if ((data as any as LValue).instanceof) jsxList.pop(); break;
            case 'DClass':
                jsxList.push(<div onClick={() => {
                    close();
                    SetRootFieldAction.new('isEdgePending', {user: user.id, source: data.id});
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
    node: LGraphElement|null,
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.display = state.contextMenu.display;
    ret.position = {x: state.contextMenu.x, y: state.contextMenu.y};
    const nodeid = state.contextMenu.nodeid; //state._lastSelected?.node;
    if (nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    else ret.node = null;
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
