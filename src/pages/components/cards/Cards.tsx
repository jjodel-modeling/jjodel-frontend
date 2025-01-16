import React, {MouseEventHandler, ReactNode} from 'react';
import "./cards.scss";
import { Tooltip } from '../../../components/forEndUser/Tooltip';

type CardsType = {
    children: any;
};

export const Cards = (props: CardsProps): any => {
    return (
        <React.Fragment>
            <div className='mb-5 commandbar'>
                {props.children}
            </div>
        </React.Fragment>
    );
}

type CardProps = {
    icon: "add" | "import" | "question" | "gettingstarted" | "alexa";
    style?: "ottanio" | "red" | "dark" | "blue" | "clear" | "rainbow" | "red-orange" | "yellow" | "green" | "gray" | "light-green" | "azure" | "orange-yellow" | "dark-blue" | "default";
    title: string;
    subtitle: string;
    action?: MouseEventHandler;
    url?: string;
};

export const Card = (props: CardProps) => {

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
                            props.url ?
                                <i onClick={() => {
                                    window.open(
                                        props.url,
                                        '_blank' // <- This is what makes it open in a new window.
                                      );
                                }} className={`bi ${icons[props.icon]}`}></i> :
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


