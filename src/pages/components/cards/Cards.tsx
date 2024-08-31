import React, {MouseEventHandler, ReactNode} from 'react';
import "./cards.scss";
import { Tooltip } from '../../../components/forEndUser/Tooltip';

type CardsType = {
    children: any;
};

export const Cards = (props: CardsType): any => {
    return (
        <React.Fragment>
            <div className='mb-5 commandbar'>
                {props.children}
            </div>
        </React.Fragment>
    );
}

type CardType = {
    icon: "add" | "import" | "question" | "gettingstarted" | "alexa";
    style?: "ottanio" | "red" | "dark" | "blue" | "clear" | "rainbow" | "red-orange" | "default";
    title: string;
    subtitle: string;
    action?: MouseEventHandler;
};

export const Card = (props: CardType) => {

    const icons = {
        add: "bi-plus-circle",
        import: "bi-box-arrow-in-up",
        question: "bi-question-square",
        gettingstarted: "bi-airplane" ,
        alexa: "bi-alexa"
    };

    return (
            <div className={`card ${props.style ? props.style : 'default' }`}>
                <div className={'col icon'}>
                    {props.action ?
                        <i onClick={props.action} className={`bi ${icons[props.icon]}`}></i> :
                        <i className={`bi ${icons[props.icon]} disabled`}></i>
                    }
                </div>
                <div className={'col body'}>
                    <h5>{props.title}</h5>
                    <span>{props.subtitle}</span>
                </div>
            </div>
    );
}

Cards.Item = Card;


