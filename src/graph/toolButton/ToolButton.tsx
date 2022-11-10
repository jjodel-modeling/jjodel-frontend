import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DClass, DeleteElementAction,
    DModelElement, DPackage, DViewElement,
    IStore, LClass, LClassifier, LEnumLiteral,
    LModelElement,
    LPackage, MDE,
    MyProxyHandler,
    Pointer, SetFieldAction,
    SetRootFieldAction, U, windoww,
} from "../../joiner";
import "./ToolButton.scss"
import {useStateIfMounted} from "use-state-if-mounted";

interface ThisState {}
function ToolButtonComponent(props: AllProps, state: ThisState) {

    const data = props.data;
    const isVertex = props.isVertex;
    const [visible, setVisible] = useStateIfMounted(false);

    const onClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        windoww.temp = data;
        //MDE.deleteModelElement(data);
        data.delete();

    }

    const cssClass: string = isVertex ? "tool-button" : "tool-button-no-vertex";
    return (<div className={"tool-container"} onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {setVisible(false)}}>
        <div className={cssClass + " text-center text-white bg-primary"}
             onClick={(e: React.MouseEvent<HTMLDivElement>) => {setVisible(true)}} >
            {isVertex ? <i style={{fontSize: ".75rem"}} className="bi bi-tools"></i> :
                <></>
            }
        </div>
        {data.className === "DClass" ?
            <div className={"tool-menu"} style={{display: visible ? "block" : "none"}}>
                <div onClick={onClick}>Class option</div>
                <div onClick={onClick}>Class option</div>
                <div onClick={onClick}>Class option</div>
                <div onClick={onClick}>Class option</div>
            </div> : <></>
        }
        {data.className === "DEnumerator" ?
            <div className={"tool-menu"} style={{display: visible ? "block" : "none"}}>
                <div onClick={onClick}>Enum option</div>
                <div onClick={onClick}>Enum option</div>
                <div onClick={onClick}>Enum option</div>
                <div onClick={onClick}>Enum option</div>
            </div> : <></>
        }
        {data.className === "DAttribute" ?
            <div className={"tool-menu-no-vertex"} style={{display: visible ? "block" : "none"}}>
                <div onClick={onClick}>Attrib option</div>
                <div onClick={onClick}>Attrib option</div>
                <div onClick={onClick}>Attrib option</div>
                <div onClick={onClick}>Attrib option</div>
            </div> : <></>
        }
        {data.className === "DReference" ?
            <div className={"tool-menu-no-vertex"} style={{display: visible ? "block" : "none"}}>
                <div onClick={onClick}>Reference option</div>
                <div onClick={onClick}>Reference option</div>
                <div onClick={onClick}>Reference option</div>
                <div onClick={onClick}>Reference option</div>
            </div> : <></>
        }
        {data.className === "DEnumLiteral" ?
            <div className={"tool-menu-no-vertex"} style={{display: visible ? "block" : "none"}}>
                <div onClick={onClick}>Literal option</div>
                <div onClick={onClick}>Literal option</div>
                <div onClick={onClick}>Literal option</div>
                <div onClick={onClick}>Literal option</div>
            </div> : <></>
        }
        {data.className === "DPackage" ?
            <div className={"tool-menu-no-vertex"} style={{display: visible ? "block" : "none"}}>
                <div onClick={onClick}>Package option</div>
                <div onClick={onClick}>Package option</div>
                <div onClick={onClick}>Package option</div>
                <div onClick={onClick}>Package option</div>
            </div> : <></>
        }
    </div>);

}

interface OwnProps {data: LModelElement, isVertex: boolean | undefined}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const ToolButtonConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ToolButtonComponent);

export const ToolButton = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ToolButtonConnected {...{...props, childrens}} />;
}
export default ToolButton;
