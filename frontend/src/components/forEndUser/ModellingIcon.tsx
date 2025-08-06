import React from 'react';
import EPackage from '../../static/icon/modelling/package.png';
import EClass from '../../static/icon/modelling/class.png';
import EAttribute from '../../static/icon/modelling/attribute.png';
import EReference from '../../static/icon/modelling/reference.png';
import EOperation from '../../static/icon/modelling/operation.png';
import EEnumerator from '../../static/icon/modelling/enumerator.png';
import ELiteral from '../../static/icon/modelling/literal.png';
import Utility from '../../static/img/utility.png';

interface Props {name?: string, className?: string, src?:string}

/* function ModellingIcon(props: Props) {
    const name = props.name;
    const className = props.className ? props.className : '';
    const pprops = {width:20, height:20, className:`my-auto ${className||''} ` + (name || '')}
    if (props.src) return <img {...pprops} src={props.src} />;
    switch (name) {
        case 'package': return(<img {...pprops} src={EPackage} />);
        case 'object':
        case 'class':
            return(<img {...pprops} src={EClass} />);
        case 'reference': return(<img {...pprops} src={EReference} />);
        case 'operation': return(<img {...pprops} src={EOperation} />);
        case 'enumerator': return(<img {...pprops} src={EEnumerator} />);
        case 'literal': return(<img {...pprops} src={ELiteral} />);
        case 'value':
        case 'attribute':
            return(<img {...pprops} src={EAttribute} />);
        default:
            return(<img {...pprops} src={Utility} />);

    }
}*/

{/* 
type IconProps = {
    letter: string
}
function Icon(props: IconProps) {

    return (
       <label className={'element-icon'}>{props.letter}</label>
    );

};

function ModellingIcon(props: Props) {
    const name = props.name;
    const className = props.className ? props.className : '';
    const pprops = {width:20, height:20, className:`my-auto ${className||''} ` + (name || '')}
    if (props.src) return <img {...pprops} src={props.src} />;
    switch (name) {
        case 'package': return(<Icon letter={'P'} />);
        case 'object':
            return(<Icon letter={'O'} />);
        case 'feature':
            return(<Icon letter={'F'} />);
        case 'class':
            return(<Icon letter={'C'} />);
        case 'reference': return(<Icon letter={'R'} />)
        case 'operation': return(<Icon letter={'O'} />)
        case 'enumerator': return(<Icon letter={'E'} />)
        case 'literal': return(<Icon letter={'L'} />)
        case 'value':
        case 'attribute':
            return(<Icon letter={'A'} />)
        default:
            return(<Icon letter={'U'} />)
    }
}
*/}

type IconProps2 = {
    letter: string
}
function Icon2(props: IconProps2) {

    return (
       <label className={'element-icon'}>{props.letter}</label>
    );

};

type IconProps = {
    element: string
}

function Icon(props: IconProps) {

    return (
       <i className={'jj jj-'+props.element+' palette'}/>
    );

};

function ModellingIcon(props: Props) {
    const name = props.name;
    const className = props.className ? props.className : '';
    const pprops = {width:20, height:20, className:`my-auto ${className||''} ` + (name || '')}
    if (props.src) return <img {...pprops} src={props.src} />;
    switch (name) {
        case 'package': 
        case 'class':
        case 'reference':
            return(<Icon element={name} />);
            break;
        case 'attribute':
            return(<Icon element={'attribute2'} />);
            break;
        case 'operation': 
            return(<Icon element={'operation'} />);
            break;
        case 'enumerator': 
            return(<Icon element={'enumerator'} />);
            break
        break;
         case 'literal': 
            return(<Icon element={'literal'} />);
        break;
        case 'object':
            return(<Icon element={'object'} />);
            break;

        
        case 'feature':
            return(<Icon element={name} />);
        case 'class':
            return(<Icon element={'C'} />);

        
       

        case 'value':
            return(<Icon2 letter={'L'} />);
        break
        default:
            return(<Icon2 letter={'U'} />);
        break;
    }
}

export default ModellingIcon;
