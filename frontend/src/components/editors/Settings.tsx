import {DState, Select} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';

function SettingsComponent(props: AllProps) {
    const {background, setBackground, color, setColor} = props;
    return(<section>
        <div className={'input-container'}>
            <b className={'me-2'}>Background:</b>
            <input className={'input'} type={'color'} defaultValue={background} onChange={e => setBackground(e.target.value)} />
        </div>
        <div className={'input-container'}>
            <b className={'me-2'}>Color:</b>
            <input className={'input'} type={'color'} defaultValue={color} onChange={e => setColor(e.target.value)} />
        </div>
    </section>);

}

interface OwnProps {
    background: string
    setBackground: React.Dispatch<React.SetStateAction<string>>
    color: string
    setColor: React.Dispatch<React.SetStateAction<string>>
}
interface StateProps {}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const SettingsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SettingsComponent);

export const Settings = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <SettingsConnected {...{...props, children}} />;
}
export default Settings;
