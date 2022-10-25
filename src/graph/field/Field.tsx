import React, {Component, ReactElement} from "react";
import {
    windoww,
    GraphElementDispatchProps,
    GraphElementReduxStateProps,
    GraphElementOwnProps,
    IStore,
    GraphElementComponent, RuntimeAccessibleClass, GraphElementStatee, DClassifier, DModelElement,
} from "../../joiner";
import {connect} from "react-redux";
const superclass: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;

class FieldState extends GraphElementStatee{

}

export class FieldComponent
    extends superclass<AllProps, FieldState>{

    render(): React.ReactNode {
        return super.render();
    }

    // Obsoleta? usa Vertex con isVertex = false e cambia nome al componente
}

// private
class FieldOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isField?: boolean = true;
    // isVertex: boolean = false;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
class FieldReduxStateProps extends GraphElementReduxStateProps{
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
class FieldDispatchProps extends GraphElementDispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = FieldOwnProps & FieldReduxStateProps & FieldDispatchProps;

const FieldConnected = connect<FieldReduxStateProps, FieldDispatchProps, FieldOwnProps, IStore>(
    FieldComponent.mapStateToProps,
    FieldComponent.mapDispatchToProps
)(FieldComponent as any);

export const Field = (props: FieldOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <FieldConnected {...{...props, childrens}} isField={true} />; }

// DModelElement.defaultComponent = Field;
/*
if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.Field = Field;*/
