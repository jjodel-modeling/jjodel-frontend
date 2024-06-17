import React, {Dispatch, ReactNode} from 'react';
import type {GObject} from '../../joiner';
import {U} from '../../joiner';

type InputOwnProps = GObject;
type StateProps = GObject;
type DispatchProps = GObject;
type AllProps = GObject; // Overlap<InputOwnProps, Overlap<StateProps, DispatchProps>>;

export function View(props: AllProps) {
    console.log("VIEW", {props});
    return(<view className={"root view"}>{props.children}</view>); }
View.cname = 'View';
