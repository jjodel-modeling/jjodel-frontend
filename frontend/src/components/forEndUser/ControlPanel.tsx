import {LGraphElement} from "../../model/dataStructure";
import {GObject} from "../../joiner";
import {ReactNode} from "react";


type Props = {node: LGraphElement & {state: GObject & {showPanel: boolean}}, children?: ReactNode};

function ControlPanel(props: Props) {
    const node = props.node;
    const showPanel = node.state.showPanel || false;
    const children = props.children;
    return(<div className={`control-panel-container ${showPanel && 'open'}`}>
        <div className={'button'} onClick={e => {
            node.state = {showPanel: !showPanel};
        }}>
            <i className={'bi bi-caret-left-fill'} />
        </div>
        <div className={'control-panel'}>
            {children && children}
        </div>
    </div>);
}

export {ControlPanel};




