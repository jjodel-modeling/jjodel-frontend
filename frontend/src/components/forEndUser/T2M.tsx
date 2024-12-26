import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import './example.scss';
import {GObject, LModelElement, Log, Overlap} from "../../joiner";

function T2M(props: AllProps, children?: JSX.Element): ReactNode{
    if (!children) children = props.children;
    let content: string='';
    if (Array.isArray(children)) {
        if (children.length > 1) {
            children = undefined;
            content = 'Error: M2T must have exactly 1 subNode in DOM';
        }
        children = (children as any)[0];
    }
    if (children === null) children = undefined;
    if (!React.isValidElement(children)) switch (typeof children){
        case 'function': case 'object': case 'symbol':
            children = undefined;
            content = 'Error: M2T must have serializable subnodes, found ' + typeof children;
            break;
         default:
             content = ''+children;
             children = undefined;
             break;
    }

    if (!children) children = <div className='M2T' contentEditable={true} onBlur={(e)=>{ doM2T(e as any, props); }}>{content+''}</div>
    else {
        let injectProps: GObject = {};
        let child: JSX.Element = children;
        Log.ex(!child.props, 'Unexpected subelement found in M2T', {child});
        injectProps.className = child.props.className ? child.props.className + ' M2T' : child.props.className;
        injectProps.onBlur = (e: Event)=>{ if (child.props.onBlur) child.props.onBlur(); doM2T(e, props); }
        children = React.cloneElement(child, injectProps);
    }
    return (<>{children}</>);
}
function doM2T(e: Event, props: AllProps): void {
    let html: HTMLDivElement | HTMLInputElement  | HTMLTextAreaElement = e.target as any;
    let txt: string;
    switch (html.tagName.toLowerCase()){
        case 'input': case 'textarea': case 'select': txt = (html as HTMLInputElement).value; break;
        default: txt = html.innerText; break;
    }
    let parsername = props.parser || 'JodelT2M';

    // let parserfunc = find parser by name
    // let modelFragment: DModelElement[] = parserfunc(txt); // apply it to txt (parse it)
    // props.data.replaceContent(modelFragment); // overwrite current model with M2T result
}

// private
interface OwnProps {
    // propsRequestedFromJSX_AsAttributes: string;
    children?: JSX.Element;
    parser?: string;
    data: LModelElement;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;


(T2M as any).cname = 'T2M';
