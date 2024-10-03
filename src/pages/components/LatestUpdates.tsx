
/* LatestUpdates */

import './latestupdates.scss';

type UpdatesProps = {
    page: string;

}

const LatestUpdates = (props: UpdatesProps) => {
    return(<div className={'updates-container d-none'}>
        <h1><i className="bi bi-activity"></i> Latest Updates</h1>
        <div className='updates-item'>
            <h2>(22-sept-2024) Tutorial at MODELS Conference</h2>
            <p>A tutorial has been given in Linz during the MODELS Conference on jjodel. At the end of the tutorial, attendees were able to design their own modeling notation and the associated workbench.</p>
        </div>
        <div className='updates-item'>
            <h2>(16-sept-2024) Release 0.9b is out</h2>
            <p>jjodel announces the launch of the new release jjodel v0.9b. A new release is already scheduled for the next days.</p>
        </div>
    </div>);
}

export { LatestUpdates };
