import React, {JSX, ReactElement, ReactNode, useEffect, useRef, useState} from 'react';
import {R, Try} from '../joiner';
import {Dashboard} from './components';
import {ProjectsApi} from '../api/persistance';
import {Button} from '../components/common/Button';
import '../components/CreateProjectDialog/create-project-dialog.scss';
import './Templates.scss';

interface OwnProps {}

/** A catalog entry of kind `galleryProject` (docs/library/catalog.json, R-LIB-6), as the Templates page reads it. */
export interface GalleryEntry {
    id: string;
    kind: string;
    label: string;
    status: string;
    package?: string;
    description?: string;
}

/** What a package file says of itself: its metamodels and models, read from the project record at the top. */
interface PackageInfo {
    text: string;
    metamodels: number;
    models: number;
}

/* The catalog is the public copy of docs/library/catalog.json (scripts/library/copy-catalog.mjs): Vite serves only
 * the frontend root, and docs/ sits outside it. */
const CATALOG_URL = '/library/catalog.json';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function CloneDialog(props: {entry: GalleryEntry, info?: PackageInfo, onClose: () => void}): JSX.Element {
    const {entry, info, onClose} = props;
    const [name, setName] = useState(entry.label);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.select(); }, []);

    const clone = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (busy || !name.trim()) return;
        setBusy(true);
        setError('');
        try {
            const text = info?.text ?? await (await fetch('/' + entry.package)).text();
            const id = await ProjectsApi.importFromText(text, name.trim(), Date.now(), {clonedFrom: entry.id});
            R.navigate(`/project?id=${id}`, true);
        } catch (err) {
            setBusy(false);
            setError('The project could not be cloned: ' + ((err as Error)?.message || String(err)));
        }
    };

    return (
        <div className="dialog-overlay" onClick={() => !busy && onClose()}>
            <div className="dialog-content templates-clone-dialog" onClick={(e) => e.stopPropagation()}
                 onKeyDown={(e) => { if (e.key === 'Escape' && !busy) onClose(); }}>
                <div className="dialog-header">
                    <div className="dialog-header-icon"><i className="bi bi-copy" /></div>
                    <h2>Clone «{entry.label}»</h2>
                    <button className="dialog-close" onClick={onClose} aria-label="Close" disabled={busy}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
                <form onSubmit={clone}>
                    <div className="dialog-body">
                        <div className="form-group">
                            <label htmlFor="templates-clone-name">Project name</label>
                            <input ref={inputRef} id="templates-clone-name" type="text" className="form-input"
                                   value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
                            {error && <span className="error-message">{error}</span>}
                        </div>
                    </div>
                    <div className="dialog-footer">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
                            {busy ? <><i className="bi bi-arrow-repeat spinning" />Cloning...</>
                                  : <><i className="bi bi-box-arrow-in-right" />Clone & open</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TemplatesComponent(_props: OwnProps): JSX.Element {
    const [entries, setEntries] = useState<GalleryEntry[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [infos, setInfos] = useState<Record<string, PackageInfo>>({});
    const [cloning, setCloning] = useState<GalleryEntry | null>(null);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const catalog = await (await fetch(CATALOG_URL)).json() as {entries: GalleryEntry[]};
                const gallery = catalog.entries.filter(e => e.kind === 'galleryProject' && e.status === 'available' && !!e.package);
                if (!live) return;
                setEntries(gallery);
                for (const e of gallery) {
                    fetch('/' + e.package).then(r => r.text()).then(text => {
                        const json = JSON.parse(text);
                        const info = {text, metamodels: (json.metamodels || []).length, models: (json.models || []).length};
                        if (live) setInfos(prev => ({...prev, [e.id]: info}));
                    }).catch(() => undefined);
                }
            } catch {
                if (live) setFailed(true);
            }
        })();
        return () => { live = false; };
    }, []);

    return (<Try>
        {/* The Projects page's shell: `projects-view` (dashboard.scss) in place of the centred `user` panel, and its
            main content and title row (AllProjects.tsx). */}
        <Dashboard active={'Templates'} style={'projects-view'}><>
            <div className="dashboard-main-content">
                <div className="dashboard-cta-row">
                    <div className="dashboard-cta-left">
                        <h1 className="dashboard-page-title">Templates</h1>
                    </div>
                    <div className="dashboard-cta-right">
                        <p className="templates-page__sub">Starter projects you clone into your workspace. The clone is yours: the original never changes.</p>
                    </div>
                </div>
                {failed && <p className="templates-page__sub">The gallery could not be loaded.</p>}
                <div className="templates-grid">
                    {(entries || []).map(e => {
                        const info = infos[e.id];
                        return (
                            <div className="templates-card" key={e.id} data-gallery-id={e.id}>
                                <div className="templates-card__head">
                                    <div className="templates-card__icon"><i className="bi bi-diagram-3" aria-hidden="true" /></div>
                                    <h3 className="templates-card__label">{e.label}</h3>
                                </div>
                                <p className="templates-card__counts">
                                    {info ? `${plural(info.metamodels, 'metamodel')} · ${plural(info.models, 'model')}` : ' '}
                                </p>
                                <p className="templates-card__description">{e.description || ' '}</p>
                                <div className="templates-card__actions">
                                    <Button variant="primary" size="sm" onClick={() => setCloning(e)}>
                                        <i className="bi bi-copy" />Clone to my workspace
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {cloning && <CloneDialog entry={cloning} info={infos[cloning.id]} onClose={() => setCloning(null)} />}
        </></Dashboard>
    </Try>);
}

const TemplatePage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <TemplatesComponent {...{...props, children}} />;
}

export {TemplatePage};
