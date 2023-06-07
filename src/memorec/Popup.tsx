import React, {Dispatch, ReactElement, useState} from "react";
import {connect} from "react-redux";
import './style.scss';
import {IStore} from "../redux/store";

function PopupComponent(props: AllProps) {
    const datas = [
        [
            {
                "recommendedItem": "address",
                "score": 0.8
            },
            {
                "recommendedItem": "bookTitle",
                "score": 0.8
            },
            {
                "recommendedItem": "edition",
                "score": 0.8
            },
            {
                "recommendedItem": "fromPage",
                "score": 0.8
            },
            {
                "recommendedItem": "isbn",
                "score": 0.8
            },
            {
                "recommendedItem": "month",
                "score": 0.8
            },
            {
                "recommendedItem": "name",
                "score": 0.8
            },
            {
                "recommendedItem": "number",
                "score": 0.8
            },
            {
                "recommendedItem": "series",
                "score": 0.8
            },
            {
                "recommendedItem": "title",
                "score": 0.8
            },
            {
                "recommendedItem": "toPage",
                "score": 0.8
            },
            {
                "recommendedItem": "volume",
                "score": 0.8
            },
            {
                "recommendedItem": "year",
                "score": 0.8
            }
        ]
    ];
    
    // const popupClose = (event: React.MouseEvent<HTMLButtonElement>) =>
    return(<div className={'popup'}>
        <button className={'btn-close'}></button>
        <div className={'table'}>

        <table>

            <thead>

            </thead>
            <tbody>

            <tr>

                <th>Name</th>
                <th>Score</th>
                <th>Attribute</th>
                <th>Reference</th>
            </tr>

            <tr>
                <td>isbn</td>
                <td>0.5</td>
                <td><button className={'button-24'}>+</button></td>
                <td><button className={'button-24'}>+</button></td>
            </tr>

            <tr>
                <td>address</td>
                <td>0.9</td>
                <td><button className={'button-24'}>+</button></td>
                <td><button className={'button-24'}>+</button></td>
            </tr>
            </tbody>


        </table>

        </div>
    </div>);
}
interface OwnProps {}
interface StateProps { }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PopupConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(PopupComponent);

export const Popup = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <PopupConnected {...{...props, childrens}} />;
}


export default Popup;
