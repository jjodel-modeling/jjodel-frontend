import {useNavigate} from 'react-router-dom';

type Props = {active: 'Account'|'Settings'|'Updates'|'Community'|'All'|'Archive'};
function LeftBar(props: Props): JSX.Element {
    const {active} = props;
    const navigate = useNavigate();
    const info = [
        {icon: 'person-fill', link: 'account', label: 'Account'},
        {icon: 'gear-fill', link: 'settings', label: 'Settings'},
        {icon: 'app-indicator', link: 'updates', label: 'Updates'},
        {icon: 'chat-fill', link: 'community', label: 'Community'}
    ];
    const projects = [
        {icon: 'grid-fill', link: 'allProjects', label: 'All'},
        {icon: 'archive-fill', link: 'archive', label: 'Archive'}
    ];

    return(<div className={'leftbar border-end border-light-subtle '}>
        <b className={'d-block px-1 mt-2'}>Generals</b>
        {info.map((data, i) => <div key={i} onClick={e => navigate(`/${data.link}`)} className={`${active === data.label && 'bg-gray'} p-2`} tabIndex={-1}>
            <i style={{fontSize: '1.2em'}} className={`bi bi-${data.icon}`} />
            <label className={'ms-2 my-auto'}>{data.label}</label>
        </div>)}
        <hr className={'my-2'} />
        <b className={'d-block px-1'}>Projects</b>
        {projects.map((data, i) => <div key={i} onClick={e => navigate(`/${data.link}`)} className={`${active === data.label && 'bg-gray'} p-2`} tabIndex={-1}>
            <i style={{fontSize: '1.2em'}} className={`bi bi-${data.icon}`} />
            <label className={'ms-2 my-auto'}>{data.label}</label>
        </div>)}
    </div>)
}

export {LeftBar};
