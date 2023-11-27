import {MouseEvent} from 'react';
import './style.scss';
import {Oval} from 'react-loader-spinner';

interface Props {}
function Loader(props: Props) {

    const prevent = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }

    return(<div className={'loader'} onContextMenu={prevent} onClick={prevent}>
        <Oval height={50} width={50} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
              color={'rgba(0, 0, 0, 0.9)'} secondaryColor={'rgba(0, 0, 0, 0.6)'} />
    </div>);
}

export default Loader;

