import React from 'react';
import EPackage from '../../static/icon/modelling/package.png';
import EClass from '../../static/icon/modelling/class.png';
import EAttribute from '../../static/icon/modelling/attribute.png';
import EReference from '../../static/icon/modelling/reference.png';
import EOperation from '../../static/icon/modelling/operation.png';
import EEnumerator from '../../static/icon/modelling/enumerator.png';
import ELiteral from '../../static/icon/modelling/literal.png';

interface Props {name: string, className?: string}
function ModellingIcon(props: Props) {
    const name = props.name;
    const className = props.className ? props.className : '';
    switch (name) {
        case 'package': return(<img width={16} height={16} className={'d-block'} src={EPackage} />);
        case 'object':
        case 'class':
            return(<img width={16} height={16} className={'d-block'} src={EClass} />);
        case 'reference': return(<img width={16} height={16} className={'d-block'} src={EReference} />);
        case 'operation': return(<img width={16} height={16} className={'d-block'} src={EOperation} />);
        case 'enumerator': return(<img width={16} height={16} className={'d-block'} src={EEnumerator} />);
        case 'literal': return(<img width={16} height={16} className={'d-block'} src={ELiteral} />);
        case 'value':
        default:
            return(<img width={16} height={16} className={`d-block ${className}`} src={EAttribute} />);
    }
}

export default ModellingIcon;
