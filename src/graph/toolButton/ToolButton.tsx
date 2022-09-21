import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DClass, DeleteElementAction,
    DModelElement, DPackage, DViewElement,
    IStore, LClass, LClassifier,
    LModelElement,
    LPackage,
    MyProxyHandler,
    Pointer, SetFieldAction,
    SetRootFieldAction,
} from "../../joiner";
import "./ToolButton.scss"

interface ThisState {}

class ToolButtonComponent extends PureComponent<AllProps, ThisState> {

    lPackage = this.props.lPackage;
    data = this.props.data;

    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    private deleteClass = (e: React.MouseEvent<HTMLDivElement>): void => {
        let index = 0;
        for(let classifier of this.lPackage.classifiers) {
            // @ts-ignore
            if(classifier === this.data.id) {
                new SetFieldAction(this.lPackage.id, "classifiers-=", index);
            }
            index++;
        }
        new DeleteElementAction(this.data.__raw);
    }

    render(): ReactNode {
        return (<div className={"tool-container"}>
            <div className={"tool-button text-center text-white bg-primary"}>
                <i style={{fontSize: ".75rem"}} className="bi bi-tools"></i>
            </div>
            <div className={"tool-menu"}>
                <div onClick={this.deleteClass}>Delete</div>
                <div>Option</div>
                <div>Option</div>
                <div>Option</div>
                <div>Option</div>
            </div>
        </div>);
    }
}

interface OwnProps {data: LModelElement}
interface StateProps {lPackage: LPackage}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {
        lPackage: MyProxyHandler.wrap(state.packages[0])
    };
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
