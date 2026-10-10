import React, {Dispatch, ReactNode} from 'react';
import type {GObject} from '../../joiner';
import {U} from '../../joiner';

type OwnProps = GObject;
type StateProps = GObject;
type DispatchProps = GObject;
type AllProps = GObject; // Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;

export function View(props: AllProps, children: ReactNode) {
    // Merge classNameAdd (injected by UX.tsx with comma-separated view IDs)
    // into className so the CSS scoping selector (`.Pointer_View_XXX { ... }`)
    // matches the rendered element. Without this, view CSS is never applied.
    const rootprops: Partial<GObject<AllProps>> = {...props};
    delete rootprops.graph;
    delete rootprops.view;
    const addClasses = props.classNameAdd ? String(props.classNameAdd).replace(/,/g, ' ') : '';
    const mergedcn = ('view ' + (props.className || '') + ' ' + addClasses).trim();
    return(<view {...rootprops} className={mergedcn}>{props.children || children}</view>); }

View.cname = 'View';
