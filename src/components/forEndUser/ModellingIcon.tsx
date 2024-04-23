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
function ModellingIcon(props: Props) {
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
}

export default ModellingIcon;
