import React, {JSX, ReactElement, ReactNode, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {R, Try} from '../joiner';
import {Dashboard} from './components';
import {ProjectsApi} from '../api/persistance';
import {Button} from '../components/common/Button';
import {currentVersion, galleryRefOf, resolveGalleryRef, type GalleryVersion} from '../library/galleryRef';
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
    /** template or example (R-LIB-9): the section of the page the card is in. */
    tier?: string;
    /** The current version, `n` of one of `versions`. */
    version?: number;
    versions?: GalleryVersion[];
}

/** The page's two sections, in this order. */
const TIERS: Array<{tier: string, title: string}> = [{tier: 'template', title: 'Templates'}, {tier: 'example', title: 'Examples'}];

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

/** The entry to clone and the version the clone is made from. */
interface CloneTarget {
    entry: GalleryEntry;
    version: GalleryVersion;
}

function CloneDialog(props: {target: CloneTarget, info?: PackageInfo, onClose: () => void}): JSX.Element {
    const {target: {entry, version}, info, onClose} = props;
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
            const text = info?.text ?? await (await fetch('/' + version.file)).text();
            const id = await ProjectsApi.importFromText(text, name.trim(), Date.now(), {clonedFrom: galleryRefOf(entry.id, version.n)});
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
                    <h2>Clone «{entry.label}» <span className="templates-card__ref">{galleryRefOf(entry.id, version.n)}</span></h2>
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
    /* `#/templates/<id>@<n>` or `#/templates/<id>` (R-LIB-9): the page, with that version's clone dialog open. */
    const {ref} = useParams();
    const [entries, setEntries] = useState<GalleryEntry[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [infos, setInfos] = useState<Record<string, PackageInfo>>({});
    const [cloning, setCloning] = useState<CloneTarget | null>(null);
    const [unknownRef, setUnknownRef] = useState('');

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const catalog = await (await fetch(CATALOG_URL)).json() as {entries: GalleryEntry[]};
                const gallery = catalog.entries.filter(e => e.kind === 'galleryProject' && e.status === 'available' && !!currentVersion(e));
                if (!live) return;
                setEntries(gallery);
                for (const e of gallery) {
                    fetch('/' + currentVersion(e)!.file).then(r => r.text()).then(text => {
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

    useEffect(() => {
        if (!entries || !ref) { setUnknownRef(''); return; }
        const found = resolveGalleryRef(entries, ref);
        setUnknownRef(found ? '' : ref);
        setCloning(found);
    }, [entries, ref]);

    const card = (e: GalleryEntry) => {
        const info = infos[e.id];
        const version = currentVersion(e)!;
        return (
            <div className="templates-card" key={e.id} data-gallery-id={e.id}>
                <div className="templates-card__head">
                    <div className="templates-card__icon"><i className="bi bi-diagram-3" aria-hidden="true" /></div>
                    <h3 className="templates-card__label">{e.label}</h3>
                    <span className="templates-card__ref">{galleryRefOf(e.id, version.n)}</span>
                </div>
                <p className="templates-card__counts">
                    {info ? `${plural(info.metamodels, 'metamodel')} · ${plural(info.models, 'model')}` : ' '}
                </p>
                <p className="templates-card__description">{e.description || ' '}</p>
                <div className="templates-card__actions">
                    <Button variant="primary" size="sm" onClick={() => setCloning({entry: e, version})}>
                        <i className="bi bi-copy" />Clone to my workspace
                    </Button>
                </div>
            </div>
        );
    };

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
                {unknownRef && <p className="templates-page__notice">No gallery entry {unknownRef}.</p>}
                {TIERS.map(({tier, title}) => {
                    const of = (entries || []).filter(e => (e.tier || 'template') === tier);
                    return of.length > 0 && (
                        <section className="templates-section" key={tier} data-gallery-tier={tier}>
                            <h2 className="templates-section__title">{title}</h2>
                            <div className="templates-grid">{of.map(card)}</div>
                        </section>
                    );
                })}
            </div>
            {cloning && <CloneDialog key={galleryRefOf(cloning.entry.id, cloning.version.n)} target={cloning}
                                     info={cloning.version.n === cloning.entry.version ? infos[cloning.entry.id] : undefined}
                                     onClose={() => setCloning(null)} />}
        </></Dashboard>
    </Try>);
}

const TemplatePage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <TemplatesComponent {...{...props, children}} />;
}

export {TemplatePage};
