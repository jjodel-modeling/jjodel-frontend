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
    const { classNameAdd, className, ...rest } = props;
    const addClasses = classNameAdd ? String(classNameAdd).replace(/,/g, ' ') : '';
    const merged = ('view ' + (className || '') + ' ' + addClasses).trim();
    return(<view className={merged} {...rest}>{props.children || children}</view>); }

View.cname = 'View';
