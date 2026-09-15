import React, {JSX, ReactElement, ReactNode} from 'react';
import {Try} from '../joiner';
import {Dashboard} from './components';
import {ComingSoonPlaceholder} from '../components/ComingSoonPlaceholder/ComingSoonPlaceholder';

interface OwnProps {}

function ExploreComponent(_props: OwnProps): JSX.Element {
    return (<Try>
        <Dashboard active={'Explore'}>
            <ComingSoonPlaceholder
                icon="bi-compass"
                title="Explore"
                description="Discover public projects from the Jjodel community: recent uploads, trending models, and what other modelers are building."
            />
        </Dashboard>
    </Try>);
}

const ExplorePage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ExploreComponent {...{...props, children}} />;
}

export {ExplorePage};
