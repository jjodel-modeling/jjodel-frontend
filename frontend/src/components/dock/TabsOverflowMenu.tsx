import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { PinnableDock } from './MyRcDock';
import './tabs-overflow-menu.scss';

interface TabEntry {
    id: string;
    label: string;
    type: 'metamodel' | 'model' | 'transformation' | 'documentation' | 'summary' | 'other';
    isActive: boolean;
}

function extractLabel(node: React.ReactNode): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (React.isValidElement(node)) {
        const children = (node.props as any).children;
        if (!children) return '';
        if (typeof children === 'string') return children;
        if (typeof children === 'number') return String(children);
        if (Array.isArray(children)) {
            return children.map(extractLabel).join('').trim();
        }
        return extractLabel(children);
    }
    return '';
}

function getTabInfo(tab: any): Pick<TabEntry, 'label' | 'type'> {
    const id: string = tab.id || '';

    if (id === 'project_summary') {
        const name = extractLabel(tab.title).trim() || 'Project';
        return { label: name || 'Project', type: 'summary' };
    }
    if (id.startsWith('jjtl_')) {
        return { label: extractLabel(tab.title).trim() || 'Transformation', type: 'transformation' };
    }
    if (id.startsWith('doc_')) {
        return { label: extractLabel(tab.title).trim() || 'Documentation', type: 'documentation' };
    }

    const dataType = React.isValidElement(tab.title)
        ? (tab.title.props as any)['data-type']
        : null;
    const label = extractLabel(tab.title).trim() || id;

    if (dataType === 'metamodel') return { label, type: 'metamodel' };
    if (dataType === 'model') return { label, type: 'model' };
    if (dataType === 'documentation') return { label, type: 'documentation' };
    return { label, type: 'other' };
}

const TYPE_ICON: Record<TabEntry['type'], string> = {
    metamodel: 'bi-diagram-3',
    model:      'bi-box',
    transformation: 'bi-arrow-left-right',
    documentation:  'bi-file-text',
    summary:    'bi-house',
    other:      'bi-file',
};

function getAllModelsTabs(): TabEntry[] {
    const dock = PinnableDock.instance;
    if (!dock) return [];

    const layout = dock.getLayout();
    const modelsPanel = layout?.dockbox?.children?.[0] as any;
    if (!modelsPanel?.tabs) return [];

    const activeId: string = modelsPanel.activeId || '';
    return (modelsPanel.tabs as any[]).map(t => ({
        id: t.id,
        ...getTabInfo(t),
        isActive: t.id === activeId,
    }));
}

export const TabsOverflowMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tabs, setTabs] = useState<TabEntry[]>([]);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const moreBtnRef = useRef<Element | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const openDropdown = useCallback((btn: Element) => {
        const rect = btn.getBoundingClientRect();
        setTabs(getAllModelsTabs());
        setPos({
            top: rect.bottom + 6,
            left: Math.max(4, rect.right - 220), // right-align to button, min 4px from edge
        });
        setIsOpen(true);
    }, []);

    // Intercept click on .dock-nav-more using capture phase so we fire
    // before rc-dock's synthetic event handler and can suppress it.
    useEffect(() => {
        const attach = () => {
            const btn = document.querySelector('.dock-nav-more');
            if (btn === moreBtnRef.current) return;

            if (moreBtnRef.current) {
                (moreBtnRef.current as any).__jjOverflowHandler &&
                    moreBtnRef.current.removeEventListener(
                        'click',
                        (moreBtnRef.current as any).__jjOverflowHandler,
                        true
                    );
            }

            if (!btn) { moreBtnRef.current = null; return; }

            const handler = (e: Event) => {
                e.stopImmediatePropagation();
                e.preventDefault();
                openDropdown(btn);
            };
            (btn as any).__jjOverflowHandler = handler;
            btn.addEventListener('click', handler, true);
            moreBtnRef.current = btn;
        };

        attach();
        const observer = new MutationObserver(attach);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            if (moreBtnRef.current && (moreBtnRef.current as any).__jjOverflowHandler) {
                moreBtnRef.current.removeEventListener(
                    'click',
                    (moreBtnRef.current as any).__jjOverflowHandler,
                    true
                );
            }
        };
    }, [openDropdown]);

    // Close on outside click / Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                moreBtnRef.current && !moreBtnRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen]);

    const handleTabClick = (tabId: string) => {
        const dock = PinnableDock.instance;
        if (dock) {
            // null as any = keep existing tab data, only change active state
            dock.updateTab(tabId, null as any, true);
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            className="jj-tabs-overflow-menu"
            style={{ top: pos.top, left: pos.left }}
            role="listbox"
            aria-label="All open tabs"
        >
            <div className="jj-tabs-overflow-menu__header">Open editors</div>
            {tabs.length === 0 ? (
                <div className="jj-tabs-overflow-menu__empty">No open editors</div>
            ) : (
                tabs.map(tab => (
                    <button
                        key={tab.id}
                        role="option"
                        aria-selected={tab.isActive}
                        className={[
                            'jj-tabs-overflow-menu__item',
                            tab.isActive ? 'jj-tabs-overflow-menu__item--active' : '',
                        ].join(' ').trim()}
                        onClick={() => handleTabClick(tab.id)}
                        title={tab.label}
                    >
                        <i className={`bi ${TYPE_ICON[tab.type]} jj-tabs-overflow-menu__icon`} />
                        <span className="jj-tabs-overflow-menu__label">{tab.label || tab.id}</span>
                        {tab.isActive && (
                            <i className="bi bi-check2 jj-tabs-overflow-menu__check" aria-hidden="true" />
                        )}
                    </button>
                ))
            )}
        </div>,
        document.body
    );
};

export default TabsOverflowMenu;
