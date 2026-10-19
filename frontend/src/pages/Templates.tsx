import React, {JSX, ReactElement, ReactNode, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {DState, R, Try} from '../joiner';
import {Dashboard} from './components';
import {ProjectsApi} from '../api/persistance';
import {Button} from '../components/common/Button';
import {ElementBadge} from '../components/common/ElementBadge';
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
    /** beginner, intermediate or advanced (R-LIB-19): the level badge and the level filter. */
    level?: string;
    /** Slugs of `CONCEPTS` (R-LIB-19): the concept tags and the concept filter. */
    concepts?: string[];
    /** The amber note of a card whose content is intentional (R-LIB-19). */
    callout?: string;
    /** `<id>/<n>.preview.png` under `PREVIEW_BASE` (R-LIB-19), written by the snapshot script; it may not exist yet. */
    preview?: string;
}

/** The page's two sections, in this order, each with its one-line contract (R-LIB-13). */
const TIERS: Array<{tier: string, title: string, contract: string}> = [
    {tier: 'template', title: 'Starters', contract: 'A metamodel and a sample model to build on. Nothing else attached.'},
    {tier: 'example', title: 'Worked examples', contract: 'Complete projects with code generation templates, ready to run.'},
];

/** The closed concept vocabulary of the catalog (R-LIB-19, R-LIB-20), in chip order. */
const CONCEPTS: Array<{slug: string, label: string}> = [
    {slug: 'containment', label: 'Containment'}, {slug: 'inheritance', label: 'Inheritance'},
    {slug: 'references', label: 'References'}, {slug: 'enumerations', label: 'Enumerations'},
    {slug: 'validation', label: 'Validation'}, {slug: 'multiple-metamodels', label: 'Multiple metamodels'},
    {slug: 'simulation', label: 'Simulation'}, {slug: 'code-generation', label: 'Code generation'},
];

/** The levels, in chip order; each has its colour pair in tokens.css (`--color-level-<slug>-bg/-fg`). */
const LEVELS: Array<{slug: string, label: string}> = [
    {slug: 'beginner', label: 'Beginner'}, {slug: 'intermediate', label: 'Intermediate'}, {slug: 'advanced', label: 'Advanced'},
];

/** The «Start here» path (R-LIB-20), as gallery ids; an id the catalog does not list is skipped. */
const START_HERE = ['library', 'shapes', 'state-machine', 'families-persons', 'turnstile'];

/** Where the catalog's `preview` paths are served from: next to the packages. */
const PREVIEW_BASE = '/library/gallery/';

const conceptLabel = (slug: string) => CONCEPTS.find(c => c.slug === slug)?.label ?? slug;
/** The card's element id, the target of the «Start here» links. */
const cardAnchor = (id: string) => `tpl-card-${id}`;

/** What a package file says of itself: its metamodels, models and viewpoints, read from the project record at the top. */
interface PackageInfo {
    text: string;
    metamodels: number;
    models: number;
    /** The viewpoints other than Default (the built-in ones have `Pointer_` ids). */
    viewpoints: number;
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
    /* One concept and one level at a time, AND with each other and with the search (R-LIB-17); null is «All». */
    const [concept, setConcept] = useState<string | null>(null);
    const [level, setLevel] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    /* Per entry: its preview PNG loaded, or failed (missing until L-C writes it): the dot grid alone then. */
    const [previews, setPreviews] = useState<Record<string, 'loaded' | 'failed'>>({});
    const [scrollTo, setScrollTo] = useState<string | null>(null);
    /* Redux re-renders on a Navbar toggle, localStorage survives the reset of the open ticket (report §1.6). */
    const advanced = !!useSelector((s: DState) => s.advanced); // same source as the app bar Basic/Advanced switch (Navbar props.advanced)

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
                        const info = {text, metamodels: (json.metamodels || []).length, models: (json.models || []).length,
                            viewpoints: (json.viewpoints || []).filter((v: string) => !/^Pointer_/.test(v)).length};
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

    /* A «Start here» link: the card scrolls into view and takes the focus, after the filters are cleared if they hide it. */
    useEffect(() => {
        if (!scrollTo) return;
        const el = document.getElementById(cardAnchor(scrollTo));
        if (el) {
            el.scrollIntoView({behavior: 'smooth', block: 'start'});
            el.focus({preventScroll: true});
        }
        setScrollTo(null);
    }, [scrollTo]);

    const all = entries || [];
    const q = query.trim().toLowerCase();
    /** The search reads the name, the description and the concept labels. */
    const found = (e: GalleryEntry) => !q || [e.label, e.description || '', ...(e.concepts || []).map(conceptLabel)]
        .some(t => t.toLowerCase().includes(q));
    const shown = (e: GalleryEntry, c: string | null, l: string | null) =>
        found(e) && (!c || (e.concepts || []).includes(c)) && (!l || e.level === l);
    /** The entries a chip would leave: its own row's choice replaced, the other row's and the search kept. */
    const countConcept = (c: string | null) => all.filter(e => shown(e, c, level)).length;
    const countLevel = (l: string | null) => all.filter(e => shown(e, concept, l)).length;
    const visible = all.filter(e => shown(e, concept, level));
    const filtering = !!concept || !!level || !!q;
    const clearFilters = () => { setConcept(null); setLevel(null); setQuery(''); };
    const goTo = (id: string) => {
        if (!visible.some(e => e.id === id)) clearFilters();
        setScrollTo(id);
    };

    /** A filter chip: pressed when it is the row's choice, dashed and grey when it would leave no entry (R-LIB-17). */
    const chip = (key: string, label: string, pressed: boolean, count: number, onClick: () => void,
                  opts: {dot?: string, showCount?: boolean} = {}) => (
        <button key={key} type="button" aria-pressed={pressed} onClick={onClick} data-count={count}
                className={'tpl-chip' + (pressed ? ' tpl-chip--pressed' : '') + (count === 0 ? ' tpl-chip--empty' : '')}>
            {opts.dot && <span className={`tpl-chip__dot tpl-level--${opts.dot}`} aria-hidden="true" />}
            {label}
            {opts.showCount && <span className="tpl-chip__count">{count}</span>}
        </button>
    );

    const card = (e: GalleryEntry) => {
        const info = infos[e.id];
        const version = currentVersion(e)!;
        const lvl = LEVELS.find(l => l.slug === e.level);
        const previewState = previews[e.id];
        const titleId = `${cardAnchor(e.id)}-title`;
        const count = (type: string, n: number, word: string) => (
            <span className="tpl-card__count"><span aria-hidden="true"><ElementBadge type={type} /></span>{plural(n, word)}</span>
        );
        return (
            <article className="templates-card" key={e.id} id={cardAnchor(e.id)} tabIndex={-1} data-gallery-id={e.id}
                     aria-labelledby={titleId}>
                {/* The dot grid is painted in CSS; the snapshot sits on top once it loads (R-LIB-16). */}
                <div className="tpl-card__preview" aria-hidden="true">
                    {e.preview && previewState !== 'failed' &&
                        <img className={'tpl-card__preview-img' + (previewState === 'loaded' ? ' tpl-card__preview-img--loaded' : '')}
                             src={PREVIEW_BASE + e.preview} alt="" aria-hidden="true"
                             onLoad={() => setPreviews(p => ({...p, [e.id]: 'loaded'}))}
                             onError={() => setPreviews(p => ({...p, [e.id]: 'failed'}))} />}
                </div>
                <div className="tpl-card__body">
                    <div className="tpl-card__title-row">
                        <h3 className="templates-card__label" id={titleId} title={e.label}>{e.label}</h3>
                        {lvl && <span className={`tpl-level-badge tpl-level--${lvl.slug}`}>{lvl.label}</span>}
                    </div>
                    <p className="templates-card__counts">
                        {info ? <>{count('metamodel', info.metamodels, 'metamodel')}{count('model', info.models, 'model')}
                                  {info.viewpoints > 0 && count('viewpoint', info.viewpoints, 'viewpoint')}</> : ' '}
                    </p>
                    <p className="templates-card__description">{e.description || ' '}</p>
                    {e.callout && <p className="tpl-card__callout" role="note">
                        <i className="bi bi-lightbulb" aria-hidden="true" />{e.callout}
                    </p>}
                    {!!e.concepts?.length && <ul className="tpl-card__tags" aria-label="Concepts">
                        {e.concepts.map(c => <li className="tpl-tag" key={c}>{conceptLabel(c)}</li>)}
                    </ul>}
                    <div className="templates-card__actions">
                        {/* The citable id, Advanced mode only (R-LIB-15). No «Preview»: this branch has no read-only
                            opening of a gallery entry, and R-LIB-14's companion waits for one. */}
                        {advanced && <span className="tpl-card__id" title={galleryRefOf(e.id, version.n)}>{galleryRefOf(e.id, version.n)}</span>}
                        <Button variant="secondary" size="sm" onClick={() => setCloning({entry: e, version})} aria-label={`Clone ${e.label}`}>
                            <i className="bi bi-copy" aria-hidden="true" />Clone
                        </Button>
                    </div>
                </div>
            </article>
        );
    };

    const startHere = START_HERE.map(id => all.find(e => e.id === id)).filter((e): e is GalleryEntry => !!e);

    return (<Try>
        {/* The Projects page's shell: `projects-view` (dashboard.scss) in place of the centred `user` panel, and its
            main content (AllProjects.tsx). */}
        <Dashboard active={'Templates'} style={'projects-view'}><>
            <div className="dashboard-main-content tpl-page">
                <header className="tpl-header">
                    <div className="tpl-header__text">
                        <h1 className="dashboard-page-title tpl-header__title">Templates</h1>
                        <p className="tpl-header__lead">Starter projects you clone into your workspace. The clone is yours: the original never changes.</p>
                    </div>
                    <div className="tpl-search">
                        <label htmlFor="tpl-search-input" className="tpl-search__label">Search templates</label>
                        <div className="tpl-search__field">
                            <i className="bi bi-search" aria-hidden="true" />
                            <input id="tpl-search-input" type="search" className="tpl-search__input" placeholder="Name or concept"
                                   value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>
                    </div>
                </header>
                {failed && <p className="templates-page__sub">The gallery could not be loaded.</p>}
                {unknownRef && <p className="templates-page__notice">No gallery entry {unknownRef}.</p>}
                {startHere.length > 0 && (
                    <section className="tpl-start" aria-labelledby="tpl-start-title">
                        <h2 className="tpl-start__title" id="tpl-start-title">New to Jjodel? Start here</h2>
                        <ol className="tpl-start__path">
                            {startHere.map((e, i) => (
                                <li key={e.id}>
                                    <button type="button" className="tpl-start__link" onClick={() => goTo(e.id)}>
                                        <span className="tpl-start__step" aria-hidden="true">{i + 1}</span>{e.label}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
                {all.length > 0 && (
                    <div className="tpl-filters">
                        <div className="tpl-filters__row" role="group" aria-label="Concept">
                            <span className="tpl-filters__eyebrow" aria-hidden="true">Concept</span>
                            {chip('all', 'All', !concept, countConcept(null), () => setConcept(null))}
                            {CONCEPTS.map(c => chip(c.slug, c.label, concept === c.slug, countConcept(c.slug),
                                () => setConcept(concept === c.slug ? null : c.slug)))}
                        </div>
                        <div className="tpl-filters__row" role="group" aria-label="Level">
                            <span className="tpl-filters__eyebrow" aria-hidden="true">Level</span>
                            {chip('all', 'All levels', !level, countLevel(null), () => setLevel(null), {showCount: true})}
                            {LEVELS.map(l => chip(l.slug, l.label, level === l.slug, countLevel(l.slug),
                                () => setLevel(level === l.slug ? null : l.slug), {dot: l.slug, showCount: true}))}
                            {filtering && <Button variant="ghost" size="sm" className="tpl-filters__clear" onClick={clearFilters}>Clear filters</Button>}
                        </div>
                        <p className="tpl-sr-only" role="status">{`${plural(visible.length, 'template')} shown`}</p>
                    </div>
                )}
                {all.length > 0 && visible.length === 0 && (
                    <div className="tpl-empty">
                        <p className="tpl-empty__text">No template matches this concept at this level.</p>
                        <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
                    </div>
                )}
                {TIERS.map(({tier, title, contract}) => {
                    const of = visible.filter(e => (e.tier || 'template') === tier);
                    return of.length > 0 && (
                        <section className="templates-section" key={tier} data-gallery-tier={tier} aria-labelledby={`tpl-section-${tier}`}>
                            <h2 className="templates-section__title" id={`tpl-section-${tier}`}>{title}</h2>
                            <p className="tpl-section__contract">{contract}</p>
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
