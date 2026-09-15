import React, {PureComponent, ReactNode} from "react";
import JsonViewer from '../shared/JsonViewer';
import './logger.scss'
import {GObject, U} from "../../joiner";

// private
interface ThisState { }

export class DataOutputComponent extends PureComponent<AllProps, ThisState>{
    static cname: string = "DataOutputComponent";

    render(): ReactNode {
        let data: any = this.props.data;
        try {
            return <JsonViewer src={data} collapsed={1} name={this.props.rootName} />;
        } catch (e){
            return <JsonViewer src={{'circular reference': true}} collapsed={1} name={this.props.rootName} />;
        }

    };

}

// private
interface OwnProps {
    data: GObject;
    rootName?: string;
    children?: ReactNode;
}
// private
type AllProps = OwnProps;
/*
if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.DataOutput = DataOutputComponent;
windoww.mycomponents.DataOutputComponent = DataOutputComponent;*/
////// mapper func

