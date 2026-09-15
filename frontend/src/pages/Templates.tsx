import React, {JSX, ReactElement, ReactNode} from 'react';
import {Try} from '../joiner';
import {Dashboard} from './components';
import {ComingSoonPlaceholder} from '../components/ComingSoonPlaceholder/ComingSoonPlaceholder';

interface OwnProps {}

function TemplatesComponent(_props: OwnProps): JSX.Element {
    return (<Try>
        <Dashboard active={'Templates'}>
            <ComingSoonPlaceholder
                icon="bi-grid-3x3-gap"
                title="Templates"
                description="A curated gallery of starter projects, tutorials, and case studies you can clone into your workspace."
            />
        </Dashboard>
    </Try>);
}

const TemplatePage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <TemplatesComponent {...{...props, children}} />;
}

export {TemplatePage};
