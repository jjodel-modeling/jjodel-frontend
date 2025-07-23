import React, {PureComponent, ReactNode} from "react";
import ReactJson from 'react-json-view' // npm i react-json-view --force
import './logger.scss'
import {GObject, U} from "../../joiner";

// function ReactJson(p:any){ return 'reactjson to do'; }

// private
interface ThisState { }

export class DataOutputComponent extends PureComponent<AllProps, ThisState>{
    static cname: string = "DataOutputComponent";

    render(): ReactNode {
        {/* themes:
                                        export interface ThemeObject {
                                            base00: string;
                                            base01: string;
                                            base02: string;
                                            base03: string;
                                            base04: string;
                                            base05: string;
                                            base06: string;
                                            base07: string;
                                            base08: string;
                                            base09: string;
                                            base0A: string;
                                            base0B: string;
                                            base0C: string;
                                            base0D: string;
                                            base0E: string;
                                            base0F: string;
                                        }

                                            export type ThemeKeys =
                                              | 'apathy'
                                              | 'apathy:inverted'
                                              | 'ashes'
                                              | 'bespin'
                                              | 'brewer'
                                              | 'bright:inverted'
                                              | 'bright'
                                              | 'chalk'
                                              | 'codeschool'
                                              | 'colors'
                                              | 'eighties'
                                              | 'embers'
                                              | 'flat'
                                              | 'google'
                                              | 'grayscale'
                                              | 'grayscale:inverted'
                                              | 'greenscreen'
                                              | 'harmonic'
                                              | 'hopscotch'
                                              | 'isotope'
                                              | 'marrakesh'
                                              | 'mocha'
                                              | 'monokai'
                                              | 'ocean'
                                              | 'paraiso'
                                              | 'pop'
                                              | 'railscasts'
                                              | 'rjv-default'
                                              | 'shapeshifter'
                                              | 'shapeshifter:inverted'
                                              | 'solarized'
                                              | 'summerfruit'
                                              | 'summerfruit:inverted'
                                              | 'threezerotwofour'
                                              | 'tomorrow'
                                              | 'tube'
                                              | 'twilight'; */}
        let data: any = this.props.data;
        // if (data && typeof data === 'object') try { JSON.stringify(data); }
        // catch (e) { data = JSON.parse(U.circularStringify(data)); /* {'circular reference': true}; */}
        try {
            return <ReactJson src={data}
                              collapsed={1}
                              collapseStringsAfterLength={20}
                              displayDataTypes={true}
                              displayObjectSize={true}
                              enableClipboard={true}
                              groupArraysAfterLength={100}
                              indentWidth={4}
                              iconStyle={"triangle"}
                              name={this.props.rootName}
                              quotesOnKeys={true} shouldCollapse={ false /*((field: CollapsedFieldProps) => { return Object.keys(field.src).length > 3;*/ }
                              sortKeys={false}
                              theme={"rjv-default"}
            />;
        } catch (e){
            return <ReactJson src={{'circular reference': true}}
                              collapsed={1}
                              collapseStringsAfterLength={20}
                              displayDataTypes={true}
                              displayObjectSize={true}
                              enableClipboard={true}
                              groupArraysAfterLength={100}
                              indentWidth={4}
                              iconStyle={"triangle"}
                              name={this.props.rootName}
                              quotesOnKeys={true} shouldCollapse={ false /*((field: CollapsedFieldProps) => { return Object.keys(field.src).length > 3;*/ }
                              sortKeys={false}
                              theme={"rjv-default"}
            />;
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

