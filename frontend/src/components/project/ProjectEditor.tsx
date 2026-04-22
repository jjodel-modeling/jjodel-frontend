import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    LModel,
    LProject,
    LViewPoint,
    LClass,
    LObject,
    LPointerTargetable,
    U,
    store,
    DModel,
    DGraph,
    DObject,
    DVertex,
    GraphSize,
    Constructors,
    SetFieldAction,
    SetRootFieldAction,
    TRANSACTION,
    getViewpointType,
    DViewPoint,
} from '../../joiner';
import DockManager from '../abstract/DockManager';
import { createM2, createM1 } from '../../pages/components/Navbar';
import { formatVersionNumber } from '../../utils/versionUtils';
import ShareProjectModal from './ShareProjectModal';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import DocumentationSection from './DocumentationSection';
import { EcoreService, XMIService } from '../../services/export';
import { NewTransformationDialog, TransformationsList } from '../../jjtl/components';
import { NewViewpointDialog } from './NewViewpointDialog';
import { JjtlTransformation, createTransformation, TransformationAST } from '../../jjtl/types';
import { execute as executeTransformation, ExecutionResult } from '../../jjtl/executor';
import { convertMetamodelToJjtl, findMetamodelById } from '../../jjtl/utils/metamodelConverter';
import { EnvGenWizardModal, EnvGenPersistence } from '../envgen';
import type { EnvGenConfigSummary } from '../envgen';
import { loadMegamodel, getSerializedMegamodel } from '../../model/megamodelPersistence';
import { setRuntimeMegamodel, clearRuntimeMegamodel, getRuntimeMegamodel } from '../../model/megamodelRuntime';
import MegamodelView, { type ArtifactStats } from '../megamodel/MegamodelView';
import { Badge } from '../common/Badge';
import { EmptyState } from '../ui/EmptyState';
import { JjodelEvents, SystemEvents, EnvGenEvents } from '../../events/registry';
import './project-editor.scss';


// Types for contextual menu
type MenuType = 'metamodel' | 'model' | 'transformation' | null;
interface OpenMenu {
    type: MenuType;
    id: string;
}

/**
 * Get the engine (platform) version from the Redux store
 */
const getEngineVersion = (): string => {
    const state = store.getState();
    return `v${state.version?.n || '2.0'}`;
};

// ============================================
// SectionHeader — Standardized section header
// ============================================
interface SectionHeaderProps {
    title: string;
    count: number;
    primaryAction?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
        disabledTitle?: string;
        hasDropdown?: boolean;
        isDropdownOpen?: boolean;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
        icon?: string;
        hasDropdown?: boolean;
        isDropdownOpen?: boolean;
    };
    children?: React.ReactNode;
}

function SectionHeader({ title, count, primaryAction, secondaryAction, children }: SectionHeaderProps) {
    return (
        <div className="project-section-header">
            <h2 className="project-section-header__title">
                {title}
                <span className="project-section-header__count">({count})</span>
            </h2>
            <div className="project-section-header__actions">
                {children}
                {secondaryAction && (
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={secondaryAction.onClick}
                    >
                        {secondaryAction.icon && <i className={`bi bi-${secondaryAction.icon}`} />}
                        {secondaryAction.label}
                        {secondaryAction.hasDropdown && (
                            <i className={`bi bi-chevron-${secondaryAction.isDropdownOpen ? 'up' : 'down'} btn-chevron`} />
                        )}
                    </button>
                )}
                {primaryAction && (
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={primaryAction.onClick}
                        disabled={primaryAction.disabled}
                        title={primaryAction.disabled ? primaryAction.disabledTitle : undefined}
                    >
                        {primaryAction.label}
                        {primaryAction.hasDropdown && (
                            <i className={`bi bi-chevron-${primaryAction.isDropdownOpen ? 'up' : 'down'} btn-chevron`} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

interface ProjectEditorProps {
    project: LProject;
    onNavigateBack?: () => void;  // Optional callback when user wants to navigate back
}

/**
 * Format date for display
 */
const formatDate = (date: Date | string | number | undefined): string => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Project Editor - Clean minimal layout
 * Shows project header with badges, and sections for metamodels, models, viewpoints
 */
const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onNavigateBack }) => {
    if (!project) return null;
    const metamodels = project.metamodels || [];
    const models = project.models || [];
    const viewpoints = project.viewpoints || [];
    const tags = project.tagNames || [];

    // Transformations: hydrated from persisted DProject.transformations,
    // synced back to Redux on every change so SaveManager picks them up.
    // TODO: include documentation in project save
    const [transformations, setTransformationsRaw] = useState<JjtlTransformation[]>(
        () => ((project as any).transformations as JjtlTransformation[]) || []
    );
    const setTransformations = useCallback(
        (updater: React.SetStateAction<JjtlTransformation[]>) => {
            setTransformationsRaw(prev => {
                const next = typeof updater === 'function'
                    ? (updater as (p: JjtlTransformation[]) => JjtlTransformation[])(prev)
                    : updater;
                SetFieldAction.new(project.id, 'transformations', next, '', false);
                return next;
            });
        },
        [project.id]
    );
    const [showNewTransformationDialog, setShowNewTransformationDialog] = useState(false);
    const [showNewViewpointDialog, setShowNewViewpointDialog] = useState(false);

    // Editing states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedName, setEditedName] = useState(project.name || '');
    const [editedDescription, setEditedDescription] = useState(project.description || '');
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    // Project menu (⋮) state
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const projectMenuRef = useRef<HTMLDivElement>(null);

    // Section from URL search params (driven by LeftBar sidebar)
    const [searchParams] = useSearchParams();
    const currentSection = (searchParams.get('section') || 'metamodels') as
        'metamodels' | 'models' | 'transformations' | 'viewpoints' | 'documentation';

    const [showShareModal, setShowShareModal] = useState(false);
    const [showMegamodelModal, setShowMegamodelModal] = useState(false);

    // Contextual menu state
    const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
    const [menuPosition, setMenuPosition] = useState<{
        align: 'left' | 'right';
        direction: 'up' | 'down';
    }>({ align: 'right', direction: 'down' });
    const [renamingItem, setRenamingItem] = useState<{ type: MenuType; id: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    // New model metamodel selection menu
    const [showMetamodelMenu, setShowMetamodelMenu] = useState(false);
    const metamodelMenuRef = useRef<HTMLDivElement>(null);

    // Import menu for metamodels
    const [showImportMenu, setShowImportMenu] = useState(false);
    const importMenuRef = useRef<HTMLDivElement>(null);

    // Hidden file inputs for import
    const importJmmRef = useRef<HTMLInputElement>(null);
    const importEcoreRef = useRef<HTMLInputElement>(null);

    // Environment Generation state
    const [showEnvGenWizard, setShowEnvGenWizard] = useState(false);
    const [envGenConfigs, setEnvGenConfigs] = useState<EnvGenConfigSummary[]>([]);
    const [editingEnvGenId, setEditingEnvGenId] = useState<string | undefined>(undefined);

    // Unsaved changes tracking
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingDescription && descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
        }
    }, [isEditingDescription]);

    useEffect(() => {
        if (isAddingTag && tagInputRef.current) {
            tagInputRef.current.focus();
        }
    }, [isAddingTag]);

    // Sync with project changes
    useEffect(() => {
        setEditedName(project.name || '');
        setEditedDescription(project.description || '');
    }, [project.name, project.description]);

    // Click-outside handler for contextual menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };

        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [openMenu]);

    // Click-outside handler for metamodel selection menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (metamodelMenuRef.current && !metamodelMenuRef.current.contains(event.target as Node)) {
                setShowMetamodelMenu(false);
            }
        };

        if (showMetamodelMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMetamodelMenu]);

    // Click-outside handler for import menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
                setShowImportMenu(false);
            }
        };

        if (showImportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showImportMenu]);

    // Click-outside handler for project menu (⋮)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
                setShowProjectMenu(false);
            }
        };

        if (showProjectMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showProjectMenu]);

    // IntersectionObserver removed — section is now driven by URL ?section= param via LeftBar sidebar

    // Focus rename input when renaming starts
    useEffect(() => {
        if (renamingItem && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingItem]);

    // Browser beforeunload handler - use global handler from U
    // This allows LeftBar and other components to disable it before programmatic navigation
    useEffect(() => {
        // Enable the warning when component mounts
        U.enableUnsavedChangesWarning();

        // Disable when component unmounts
        return () => U.disableUnsavedChangesWarning();
    }, []);

    // Environment Generation: load configs from localStorage and listen for changes
    useEffect(() => {
        setEnvGenConfigs(EnvGenPersistence.getAll());
        const handler = () => setEnvGenConfigs(EnvGenPersistence.getAll());
        window.addEventListener(EnvGenEvents.CONFIG_CHANGED, handler);
        return () => window.removeEventListener(EnvGenEvents.CONFIG_CHANGED, handler);
    }, []);

    // Environment Generation: listen for open-wizard event from Navbar
    useEffect(() => {
        const handler = () => {
            setEditingEnvGenId(undefined);
            setShowEnvGenWizard(true);
        };
        window.addEventListener(EnvGenEvents.OPEN_WIZARD, handler);
        return () => window.removeEventListener(EnvGenEvents.OPEN_WIZARD, handler);
    }, []);

    // Open megamodel modal when TreeView entry is clicked
    useEffect(() => {
        const handler = () => setShowMegamodelModal(true);
        window.addEventListener(JjodelEvents.OPEN_MEGAMODEL, handler);
        return () => window.removeEventListener(JjodelEvents.OPEN_MEGAMODEL, handler);
    }, []);

    // Open New Transformation dialog when Navbar's "+" dropdown requests it
    useEffect(() => {
        const handler = () => setShowNewTransformationDialog(true);
        window.addEventListener(JjodelEvents.OPEN_NEW_TRANSFORMATION_DIALOG, handler);
        return () => window.removeEventListener(JjodelEvents.OPEN_NEW_TRANSFORMATION_DIALOG, handler);
    }, []);

    // Broadcast transformations to TreeView via CustomEvent
    useEffect(() => {
        const detail = transformations.map(t => ({
            id: t.id,
            name: t.name,
            sourceMMName: t.sourceMetamodelName,
            targetMMName: t.targetMetamodelName,
            rules: t.ast?.mappings?.map(m => `${m.sources?.map(s => s.className).join(', ') || '?'} → ${m.targetClass}`) || [],
            helpers: t.ast?.helpers?.map(h => h.name) || [],
        }));
        window.dispatchEvent(new CustomEvent(JjodelEvents.TRANSFORMATIONS, { detail }));
    }, [transformations]);

    // Megamodel: compute and register runtime megamodel whenever artifacts change
    useEffect(() => {
        const projectId = project.id;
        if (!projectId) return;

        const artifacts = {
            metamodels: metamodels.map(mm => ({ id: mm.id, name: mm.name || '' })),
            models: models.map(m => {
                const rawInstanceof = (m.__raw as any)['instanceof'];
                const instanceofMetamodelId = typeof rawInstanceof === 'string' ? rawInstanceof : undefined;
                const rawState = (m.__raw as any)['_state'];
                const generatedBy = rawState?.generatedBy ?? undefined;
                return { id: m.id, name: m.name || '', instanceofMetamodelId, generatedBy };
            }),
            transformations: transformations.map(t => ({
                id: t.id,
                name: t.name || '',
                sourceMetamodelId: t.sourceMetamodelId,
                targetMetamodelId: t.targetMetamodelId,
            })),
        };

        const serialized = getSerializedMegamodel(projectId);
        const megamodel = loadMegamodel(serialized, artifacts);
        setRuntimeMegamodel(projectId, megamodel);

        return () => { clearRuntimeMegamodel(projectId); };
    }, [project.id, metamodels, models, transformations]);

    // Mark project as dirty (unsaved changes)
    // Sets both local state and global U.isProjectModified for consistency
    const markDirty = useCallback(() => {
        setIsDirty(true);
        U.isProjectModified = true;
    }, []);

    // Clear dirty state (after save)
    // Resets both local state and global U.isProjectModified
    const clearDirty = useCallback(() => {
        setIsDirty(false);
        U.isProjectModified = false;
    }, []);

    // Handle navigation with unsaved changes check
    const handleNavigateWithCheck = useCallback((action: () => void) => {
        if (isDirty) {
            pendingActionRef.current = action;
            setShowUnsavedDialog(true);
        } else {
            action();
        }
    }, [isDirty]);

    // Handle back navigation with unsaved changes check
    const handleBackNavigation = useCallback(() => {
        if (onNavigateBack) {
            handleNavigateWithCheck(onNavigateBack);
        }
    }, [onNavigateBack, handleNavigateWithCheck]);

    // Unsaved dialog handlers
    const handleDontSave = useCallback(() => {
        setShowUnsavedDialog(false);
        clearDirty();
        if (pendingActionRef.current) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    }, [clearDirty]);

    const handleCancelDialog = useCallback(() => {
        setShowUnsavedDialog(false);
        pendingActionRef.current = null;
    }, []);

    const handleSaveAndContinue = useCallback(async () => {
        setIsSaving(true);
        try {
            // Trigger project save - this depends on your save implementation
            // For example: await project.save() or dispatch a save action
            // For now, we'll simulate a brief delay for the save operation
            await new Promise(resolve => setTimeout(resolve, 500));

            clearDirty();
            setShowUnsavedDialog(false);

            if (pendingActionRef.current) {
                pendingActionRef.current();
                pendingActionRef.current = null;
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            U.alert('e', 'Save failed', 'Could not save the project. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [clearDirty]);

    // scrollToSection removed — section navigation is now URL-based via LeftBar sidebar

    // Download entire project as JSON
    const handleDownloadProject = useCallback(() => {
        try {
            const projectData = {
                format_version: '1.0',
                metadata: {
                    name: project.name || 'Unnamed Project',
                    exported_at: new Date().toISOString(),
                    jjodel_version: '2.0'
                },
                project: (project as any).__raw || project
            };
            const jsonString = JSON.stringify(projectData, null, 2);
            const filename = `${project.name || 'project'}.jjodel`;
            U.download(filename, jsonString);
            U.alert('i', 'Downloaded', `Project exported: ${filename}`);
        } catch (error) {
            console.error('Download project error:', error);
            U.alert('e', 'Download Failed', 'Could not download the project.');
        }
        setShowProjectMenu(false);
    }, [project]);

    // Name editing handlers
    const handleStartEditName = () => {
        setEditedName(project.name || '');
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        if (editedName.trim()) {
            const newName = editedName.trim();
            if (newName !== project.name) {
                project.name = newName;
                markDirty();
            }
        } else {
            U.alert('e', 'Name required', 'Project name cannot be empty');
            setEditedName(project.name || '');
        }
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setEditedName(project.name || '');
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveName();
        } else if (e.key === 'Escape') {
            handleCancelEditName();
        }
    };

    // Description editing handlers
    const handleStartEditDescription = () => {
        setEditedDescription(project.description || '');
        setIsEditingDescription(true);
    };

    const handleSaveDescription = () => {
        const newDescription = editedDescription.trim();
        if (newDescription !== project.description) {
            project.description = newDescription;
            markDirty();
        }
        setIsEditingDescription(false);
    };

    const handleCancelEditDescription = () => {
        setEditedDescription(project.description || '');
        setIsEditingDescription(false);
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancelEditDescription();
        }
    };

    // Tag handlers - supports comma-separated multiple tags
    const handleAddTag = () => {
        if (newTag.trim()) {
            // Split by comma, trim each, filter empty and duplicates
            const newTags = newTag
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0 && !tags.includes(t));

            if (newTags.length > 0) {
                project.tagNames = [...tags, ...newTags];
                markDirty();
            }
            setNewTag('');
        }
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        project.tagNames = tags.filter(t => t !== tagToRemove);
        markDirty();
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTag();
        } else if (e.key === 'Escape') {
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    // Type toggle handler - toggles between public/private
    const handleToggleType = () => {
        project.type = project.type === 'public' ? 'private' : 'public';
        markDirty();
    };

    // Contextual menu handlers with smart positioning
    const toggleMenu = (type: MenuType, id: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent card click

        if (openMenu?.type === type && openMenu?.id === id) {
            setOpenMenu(null);
        } else {
            // Calculate smart positioning based on viewport space
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();

            // Determine horizontal alignment
            const spaceOnRight = window.innerWidth - rect.right;
            const spaceOnLeft = rect.left;
            const align = spaceOnRight < 200 && spaceOnLeft > spaceOnRight ? 'left' : 'right';

            // Determine vertical direction
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const direction = spaceBelow < 200 && spaceAbove > spaceBelow ? 'up' : 'down';

            setMenuPosition({ align, direction });
            setOpenMenu({ type, id });
        }
    };

    const closeMenu = () => {
        setOpenMenu(null);
    };

    // Export metamodel as .jmm file
    const handleExportMetamodel = (mm: LModel) => {
        try {
            const jmmData = {
                format_version: '1.0',
                metadata: {
                    name: mm.name || project.name + '-metamodel',
                    version: project.version?.toString() || '1.0.0',
                    author: (project as any).author?.name || 'Unknown',
                    description: project.description || '',
                    exported_at: new Date().toISOString(),
                    source_project: project.id,
                    jjodel_version: '2.0'
                },
                metamodel: (mm as any).__raw || mm
            };

            const jsonString = JSON.stringify(jmmData, null, 2);
            const filename = `${mm.name || project.name}-metamodel.jmm`;
            U.download(filename, jsonString);
            U.alert('i', 'Exported', `Metamodel exported: ${filename}`);
        } catch (error) {
            console.error('Export metamodel error:', error);
            U.alert('e', 'Export Failed', 'Could not export the metamodel.');
        }
        closeMenu();
    };

    // Export model as .jm file
    const handleExportModel = (model: LModel) => {
        try {
            const jmData = {
                format_version: '1.0',
                metadata: {
                    name: model.name || project.name + '-model',
                    version: project.version?.toString() || '1.0.0',
                    author: (project as any).author?.name || 'Unknown',
                    description: project.description || '',
                    exported_at: new Date().toISOString(),
                    source_project: project.id,
                    jjodel_version: '2.0'
                },
                model: (model as any).__raw || model
            };

            const jsonString = JSON.stringify(jmData, null, 2);
            const filename = `${model.name || project.name}-model.jm`;
            U.download(filename, jsonString);
            U.alert('i', 'Exported', `Model exported: ${filename}`);
        } catch (error) {
            console.error('Export model error:', error);
            U.alert('e', 'Export Failed', 'Could not export the model.');
        }
        closeMenu();
    };

    // Export metamodel as Ecore (.ecore)
    const handleExportEcore = (mm: LModel) => {
        try {
            EcoreService.exportToFile(mm);
            U.alert('i', 'Exported', `Metamodel exported as Ecore: ${mm.name}.ecore`);
        } catch (error) {
            console.error('Export Ecore error:', error);
            U.alert('e', 'Export Failed', 'Could not export as Ecore format.');
        }
        closeMenu();
    };

    // Import metamodel from .jmm file
    const handleImportJmm = () => {
        importJmmRef.current?.click();
        setShowImportMenu(false);
    };

    const handleJmmFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            const jmmData = JSON.parse(content);

            // Validate format
            if (!jmmData.metamodel) {
                throw new Error('Invalid .jmm file format: missing metamodel data');
            }

            // Extract name from metadata or filename
            const name = jmmData.metadata?.name || file.name.replace(/\.jmm$/, '');

            // Create new metamodel in project using existing createM2
            const newMM = createM2(project);

            // TODO: Populate metamodel with imported data
            // For now, just show success with the created metamodel
            U.alert('i', 'Imported', `Metamodel "${name}" imported successfully`);
            markDirty();

        } catch (error) {
            console.error('Import JMM error:', error);
            U.alert('e', 'Import Failed', `Could not import metamodel: ${(error as Error).message}`);
        }

        // Reset input
        if (importJmmRef.current) {
            importJmmRef.current.value = '';
        }
    };

    // Import metamodel from .ecore file
    const handleImportEcore = () => {
        importEcoreRef.current?.click();
        setShowImportMenu(false);
    };

    const handleEcoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await EcoreService.importFromFile(file);

            if (result.success && result.model) {
                U.alert('i', 'Imported', `Metamodel "${result.model.name}" imported from Ecore`);
                markDirty();

                // Show warnings if any
                if (result.warnings.length > 0) {
                    console.warn('Ecore import warnings:', result.warnings);
                }
            } else {
                throw new Error(result.errors.join(', '));
            }

        } catch (error) {
            console.error('Import Ecore error:', error);
            U.alert('e', 'Import Failed', `Could not import Ecore: ${(error as Error).message}`);
        }

        // Reset input
        if (importEcoreRef.current) {
            importEcoreRef.current.value = '';
        }
    };

    // Export model as XMI (.xmi) with embedded metamodel
    const handleExportXMI = (model: LModel) => {
        try {
            XMIService.exportToFile(model);
            U.alert('i', 'Exported', `Model exported as XMI: ${model.name}.xmi`);
        } catch (error) {
            console.error('Export XMI error:', error);
            U.alert('e', 'Export Failed', 'Could not export as XMI format.');
        }
        closeMenu();
    };

    // Rename handlers
    const startRename = (type: MenuType, id: string, currentName: string) => {
        setRenamingItem({ type, id });
        setRenameValue(currentName || '');
        closeMenu();
    };

    const handleRenameSubmit = (item: LModel) => {
        if (renameValue.trim()) {
            const newName = renameValue.trim();
            if (newName !== item.name) {
                item.name = newName;
                markDirty();
            }
        }
        setRenamingItem(null);
        setRenameValue('');
    };

    const handleRenameCancel = () => {
        setRenamingItem(null);
        setRenameValue('');
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent, item: LModel) => {
        if (e.key === 'Enter') {
            handleRenameSubmit(item);
        } else if (e.key === 'Escape') {
            handleRenameCancel();
        }
    };

    // Handle badge click - if public, open share modal; if private, toggle to public
    const handleVisibilityBadgeClick = () => {
        if (project.type === 'public') {
            setShowShareModal(true);
        } else {
            handleToggleType();
        }
    };

    const handleOpenMetamodel = async (mm: LModel) => {
        await DockManager.open2(mm);
    };

    const handleOpenModel = async (model: LModel) => {
        await DockManager.open2(model);
    };

    const handleCreateMetamodel = () => {
        createM2(project);
    };

    // Handle "+ New" button click for models
    const handleNewModelClick = () => {
        if (metamodels.length === 0) {
            // No metamodels - button should be disabled, but handle just in case
            return;
        }

        if (metamodels.length === 1) {
            // Only one metamodel - create model directly
            createM1(project, metamodels[0]);
            return;
        }

        // Multiple metamodels - show selection menu
        setShowMetamodelMenu(!showMetamodelMenu);
    };

    // Create model with selected metamodel
    const handleCreateModel = (metamodel: LModel) => {
        setShowMetamodelMenu(false);
        createM1(project, metamodel);
    };

    const handleDeleteMetamodel = (mm: LModel) => {
        // Close any open tabs for this metamodel before deleting
        DockManager.closeTabsForEntity(mm.id, 'metamodel');
        mm.delete();
    };

    const handleDeleteModel = (model: LModel) => {
        // Close any open tabs for this model before deleting
        DockManager.closeTabsForEntity(model.id, 'model');
        model.delete();
    };

    const handleOpenViewpoint = async (vp: LViewPoint) => {
        // TODO: redirect to panels/viewpoint-editor
        DockManager.openViewpoint(vp);
    };

    const handleDuplicateViewpoint = (vp: LViewPoint) => {
        vp.duplicate();
    };

    const handleDeleteViewpoint = (vp: LViewPoint) => {
        vp.delete();
    };

    const handleCreateViewpoint = (data: { name: string; type: import('../../joiner').ViewpointType }) => {
        const dVp = DViewPoint.newVP(data.name, (vp) => {
            // Set legacy booleans based on type
            switch (data.type) {
                case 'syntax':
                    vp.isExclusiveView = true;
                    vp.isValidation = false;
                    break;
                case 'validation':
                    vp.isExclusiveView = false;
                    vp.isValidation = true;
                    break;
                default: // decoration, semantics, editor_behavior
                    vp.isExclusiveView = false;
                    vp.isValidation = false;
                    break;
            }
            // Set explicit viewpointType field
            (vp as any).viewpointType = data.type;
        });
        setShowNewViewpointDialog(false);

        // TODO: redirect to panels/viewpoint-editor
        DockManager.openViewpoint(dVp);
    };

    // Transformation handlers
    const handleCreateTransformation = (name: string, sourceId?: string, targetId?: string, description?: string) => {
        const sourceMM = metamodels.find(mm => mm.id === sourceId);
        const targetMM = metamodels.find(mm => mm.id === targetId);

        const newTransformation = createTransformation(
            name,
            sourceId,
            sourceMM?.name,
            targetId,
            targetMM?.name,
            description
        );

        setTransformations(prev => [...prev, newTransformation]);
        setShowNewTransformationDialog(false);
        markDirty();
    };

    const handleOpenTransformation = async (transformation: JjtlTransformation) => {
        // Find source and target metamodels (initial snapshot)
        const sourceMM = findMetamodelById(metamodels, transformation.sourceMetamodelId);
        const targetMM = findMetamodelById(metamodels, transformation.targetMetamodelId);

        // Convert metamodels to JjTL format (initial snapshot)
        const sourceMetamodelElements = sourceMM ? convertMetamodelToJjtl(sourceMM) : [];
        const targetMetamodelElements = targetMM ? convertMetamodelToJjtl(targetMM) : [];

        // Build available models list for transformation execution
        // Models (not metamodels) with their conforming metamodel info
        // DEBUG: Log raw data to understand the structure
        // console.log('[ProjectEditor] DEBUG - Raw data:', {
        //     modelsCount: models?.length || 0,
        //     metamodelsCount: metamodels?.length || 0,
        //     metamodelIds: metamodels?.map(m => ({ id: m.id, name: m.name })),
        //     sourceMetamodelName: transformation.sourceMetamodelName,
        //     firstModel: models?.[0] ? {
        //         id: models[0].id,
        //         name: models[0].name,
        //         instanceof: models[0].instanceof,
        //         instanceofType: typeof models[0].instanceof,
        //         // Also try to access as proxy
        //         instanceofId: (models[0].instanceof as any)?.id,
        //         instanceofName: (models[0].instanceof as any)?.name,
        //     } : null,
        // });

        const availableModels = (models || []).map(model => {
            // model.instanceof can be:
            // 1. An LModel proxy (has .id and .name) when accessed through LModel proxy
            // 2. A raw Pointer string when accessed from raw DModel data
            // 3. undefined/null
            const instanceOf = model.instanceof;
            let mmId = '';
            let mmName = '';

            if (instanceOf) {
                if (typeof instanceOf === 'string') {
                    // Raw Pointer string - need to look up metamodel by ID
                    mmId = instanceOf;
                    const mm = metamodels?.find(m => m.id === mmId);
                    mmName = mm?.name || '';
                } else if (typeof instanceOf === 'object') {
                    // LModel proxy - can access .id and .name directly
                    mmId = (instanceOf as any).id || '';
                    mmName = (instanceOf as any).name || '';
                }
            }

            // console.log('[ProjectEditor] DEBUG - Model mapping:', {
            //     modelName: model.name,
            //     instanceofRaw: instanceOf,
            //     instanceofType: typeof instanceOf,
            //     extractedMmId: mmId,
            //     extractedMmName: mmName,
            // });

            return {
                id: model.id,
                name: model.name || 'Unnamed Model',
                metamodelId: mmId,
                metamodelName: mmName,
            };
        });

        // Get existing model names to prevent duplicates when creating output
        const existingModelNames = [
            ...(models || []).map(m => m.name || ''),
            ...(metamodels || []).map(m => m.name || '')
        ].filter(Boolean);

        // console.log('[ProjectEditor] Opening transformation', {
        //     name: transformation.name,
        //     sourceMetamodelId: transformation.sourceMetamodelId,
        //     sourceMetamodelName: transformation.sourceMetamodelName,
        //     sourceElements: sourceMetamodelElements.length,
        //     targetElements: targetMetamodelElements.length,
        //     modelsInProject: models?.length || 0,
        //     availableModels: availableModels.map(m => ({
        //         id: m.id,
        //         name: m.name,
        //         metamodelId: m.metamodelId,
        //         metamodelName: m.metamodelName
        //     }))
        // });

        // Create getter functions that fetch FRESH metamodel data on demand
        // These are called when user clicks "Analyze" in Suggested Mappings panel
        const getSourceMetamodel = () => {
            const freshMM = findMetamodelById(project.metamodels || [], transformation.sourceMetamodelId);
            const result = freshMM ? convertMetamodelToJjtl(freshMM) : [];
            // console.log('[ProjectEditor] getSourceMetamodel called, classes:', result.filter(e => e.type === 'class').length);
            return result;
        };

        const getTargetMetamodel = () => {
            const freshMM = findMetamodelById(project.metamodels || [], transformation.targetMetamodelId);
            const result = freshMM ? convertMetamodelToJjtl(freshMM) : [];
            // console.log('[ProjectEditor] getTargetMetamodel called, classes:', result.filter(e => e.type === 'class').length);
            return result;
        };

        /**
         * Generate unique model name by appending (N) suffix if needed.
         * Finds the highest existing suffix and increments by 1.
         *
         * @param baseName - The desired name (e.g., "metamodel_1_to_metamodel_2")
         * @param existingNames - Array of existing names
         * @returns Unique name (e.g., "metamodel_1_to_metamodel_2 (1)")
         */
        const generateUniqueModelName = (baseName: string, existingNames: string[]): string => {
            // If base name doesn't exist, use it directly
            if (!existingNames.includes(baseName)) {
                return baseName;
            }

            // Find all existing names that match the pattern "baseName (N)"
            // Escape special regex characters in baseName
            const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`^${escapedBaseName} \\((\\d+)\\)$`);

            let maxSuffix = 0;
            for (const name of existingNames) {
                const match = name.match(pattern);
                if (match) {
                    const suffix = parseInt(match[1], 10);
                    if (suffix > maxSuffix) {
                        maxSuffix = suffix;
                    }
                }
            }

            // Return baseName with the next available suffix (max + 1)
            return `${baseName} (${maxSuffix + 1})`;
        };

        // Execution guard to prevent double-firing
        let isExecutingTransformation = false;

        // Wrap Pointer IDs as { __ref: id } so the executor can distinguish
        // reference values from plain strings during cross-type resolution.
        // Jjodel Pointer IDs follow the pattern "Pointer<digits>_<context>_<digits>".
        const wrapIfRef = (val: any): any => {
            if (typeof val === 'string' && val.startsWith('Pointer')) return { __ref: val };
            return val;
        };

        // Callback when transformation is executed
        // Returns ExecutionResult so JjtlDevelopmentEnv can update trace display
        const handleExecuteTransformation = async (
            sourceModelId: string,
            outputModelName: string,
            ast: TransformationAST
        ): Promise<ExecutionResult | void> => {
            // Guard against double execution (React StrictMode, button+form submit, etc.)
            if (isExecutingTransformation) {
                console.warn('[ProjectEditor] Transformation already executing, skipping duplicate call');
                return;
            }
            isExecutingTransformation = true;

            // console.log('[ProjectEditor] handleExecuteTransformation called', {
            //     sourceModelId,
            //     outputModelName,
            //     astMappings: ast?.mappings?.length || 0
            // });

            // Validate AST
            if (!ast || !ast.mappings || ast.mappings.length === 0) {
                console.error('[ProjectEditor] AST has no mappings!');
                U.alert('e', 'Error', 'Transformation has no mappings defined.');
                isExecutingTransformation = false;
                return;
            }

            try {
                // Find source model
                const sourceModel = models.find(m => m.id === sourceModelId);
                if (!sourceModel) {
                    U.alert('e', 'Error', `Source model not found`);
                    isExecutingTransformation = false;
                    return;
                }

                // Use the current transformation from the enclosing closure
                // (previously: transformations.find(t => t.targetMetamodelId) which always returned the FIRST one)
                const targetMetamodel = metamodels.find(mm => mm.id === transformation.targetMetamodelId);
                if (!targetMetamodel) {
                    U.alert('e', 'Error', `Target metamodel not found`);
                    isExecutingTransformation = false;
                    return;
                }

                // Prepare source data (deep copy)
                // Filter out null/undefined entries: LModel.objects can contain broken
                // pointers (e.g. deleted DObjects) that dereference to undefined and
                // would crash downstream property accesses like `obj.instanceof`.
                const sourceObjects = (sourceModel.objects || []).filter((obj: LObject | null | undefined) => {
                    if (!obj) {
                        //console.warn('[ProjectEditor] Skipping null/undefined object in source model');
                        return false;
                    }
                    return true;
                });
                // console.log('[ProjectEditor] Source objects count:', sourceObjects.length);


                const sourceModelData = sourceObjects.map((obj: LObject) => {
                    // Resolve className with multiple fallback paths
                    let className = '';

                    // Method 1: Direct instanceof.name (standard path)
                    if (obj.instanceof && obj.instanceof.name) {
                        className = obj.instanceof.name;
                        // console.log(`[ProjectEditor] className from instanceof.name: "${className}"`);
                    }

                    // Method 2: Check __raw.instanceof and resolve via Redux state
                    if (!className && (obj as any).__raw?.instanceof) {
                        const classPointer = (obj as any).__raw.instanceof;
                        const state = store.getState() as any;
                        const classData = state[classPointer];
                        if (classData && classData.name) {
                            className = classData.name;
                            // console.log(`[ProjectEditor] className from __raw.instanceof lookup: "${className}"`);
                        }
                    }

                    // Method 3: Check features for __class or type indicator
                    if (!className && obj.features) {
                        for (const feature of obj.features) {
                            if (feature.name === '__class' || feature.name === '__type') {
                                const val = feature.values?.length > 0 ? feature.values[0] : feature.value;
                                if (typeof val === 'string') {
                                    className = val;
                                    // console.log(`[ProjectEditor] className from feature "${feature.name}": "${className}"`);
                                    break;
                                }
                            }
                        }
                    }

                    // Method 4: Extract from object name pattern (e.g., "A_0" → "A")
                    if (!className && obj.name) {
                        const match = obj.name.match(/^([A-Za-z]+)_\d+$/);
                        if (match) {
                            className = match[1];
                            // console.log(`[ProjectEditor] className extracted from name pattern "${obj.name}": "${className}"`);
                        }
                    }

                    // Debug: Log all attempts if still no className
                    if (!className) {
                        console.warn('[ProjectEditor] Could not resolve className for object:', {
                            id: obj.id,
                            name: obj.name,
                            instanceof: obj.instanceof,
                            __raw: (obj as any).__raw,
                            features: obj.features?.map(f => ({ name: f.name, value: f.value, values: f.values }))
                        });
                        // Last resort: use object name as-is
                        className = obj.name || 'UnknownClass';
                    }

                    const result: Record<string, any> = {
                        id: obj.id,
                        name: obj.name,
                        className: className,
                        __type: className,
                    };
                    if (obj.features) {
                        for (const feature of obj.features) {
                            if (!feature.name) continue;
                            // Read from the raw DValue rather than the L-layer getter.
                            // L-layer `.values` resolves Pointer IDs to LObject proxies
                            // which have circular back-refs (e.g., LClass.attributes[0].owner)
                            // that freeze the thread during deep copy.
                            // Raw values are either primitives (for attributes) or Pointer
                            // ID strings (for references).
                            const rawVals: any[] = (() => {
                                const r = (feature as any).__raw?.values;
                                return Array.isArray(r) ? r : [];
                            })();
                            // Filter empty and deduplicate: DValue.values can contain
                            // the same Pointer ID twice (e.g., edge created via canvas
                            // and then via auto-populate, or data corruption).
                            const seen = new Set<string>();
                            const meaningful = rawVals.filter((v: any) => {
                                if (v == null || v === '') return false;
                                if (typeof v === 'string') {
                                    if (seen.has(v)) return false;
                                    seen.add(v);
                                }
                                return true;
                            });
                            if (meaningful.length === 0) {
                                result[feature.name] = null;
                            } else if (meaningful.length === 1) {
                                result[feature.name] = wrapIfRef(meaningful[0]);
                            } else {
                                result[feature.name] = meaningful.map(wrapIfRef);
                            }
                        }
                    }

                    // Compute _containerId: the DObject that owns this object through
                    // a containment reference. Traverses the father chain:
                    //   DObject.father → DValue (containment feature) → DValue.father → owning DObject
                    // If father points to a DModel, the object is root → _containerId = null.
                    const fatherPtr = (obj as any).__raw?.father;
                    if (fatherPtr && typeof fatherPtr === 'string') {
                        const idl = (store.getState() as any).idlookup;
                        const fatherData = idl?.[fatherPtr];
                        if (fatherData?.className === 'DValue' && fatherData.father) {
                            result._containerId = String(fatherData.father);
                        }
                    }

                    return result;
                });

                // Source data is now safe to pass directly: reference values
                // are wrapped as { __ref: PointerId } (no L-layer proxies),
                // and attribute values are primitives from __raw.values.
                console.log('[ProjectEditor] sourceModelData built, handing to executor');
                console.time('[TIMING] JSON deep copy (now pass-through)');
                const sourceModelDataCopy = sourceModelData;
                console.timeEnd('[TIMING] JSON deep copy (now pass-through)');

                // Execute transformation
                console.time('[TIMING] executeTransformation');
                const result: ExecutionResult = await executeTransformation(ast, sourceModelDataCopy, targetMetamodel);
                console.timeEnd('[TIMING] executeTransformation');

                if (!result.success) {
                    U.alert('e', 'Transformation Failed', result.errors.join('\n'));
                    isExecutingTransformation = false;
                    return result;
                }

                // ============================================
                // CREAZIONE MODELLO - NON USARE createM1!
                // ============================================

                // CRITICAL: Get fresh model names from Redux store, NOT from stale component state
                // This ensures we catch recently created models that haven't triggered a re-render yet.
                // DModels live under state.idlookup (not at the root) — iterating root keys would
                // only see "idlookup", "graphs", etc. and miss every model.
                const freshState = store.getState() as any;
                const freshExistingNames: string[] = [];
                const idlookup = freshState?.idlookup || {};
                for (const key in idlookup) {
                    const item = idlookup[key];
                    if (item && typeof item === 'object' && item.className === 'DModel' && item.name) {
                        freshExistingNames.push(item.name);
                    }
                }

                // Also include names from component state as fallback
                const existingNames = [
                    ...freshExistingNames,
                    ...(models || []).map(m => m.name || ''),
                    ...(metamodels || []).map(m => m.name || '')
                ].filter((name, index, arr) => name && arr.indexOf(name) === index); // Remove duplicates

                // Genera nome unico
                const uniqueOutputName = generateUniqueModelName(outputModelName, existingNames);

                // console.log('[ProjectEditor] Output model name:', {
                //     requested: outputModelName,
                //     unique: uniqueOutputName,
                //     existingNames: existingNames,
                //     freshNamesCount: freshExistingNames.length
                // });

                let createdDModel: DModel | null = null;
                let createdDGraph: DGraph | null = null;
                let createdModelId: string | null = null;
                let createdGraphId: string | null = null;
                let instancesCreated = 0;

                // Store object NAME (not ID!) with attributes — ID from DObject.new() is unreliable
                const pendingAttributeSets: Array<{
                    objectName: string;
                    className: string;
                    attributes: Record<string, any>;
                }> = [];

                // Pending references: { __ref_result: true, targets: [...] } values
                // from executor cross-type resolution. Written via LValue.setValueAtPosition
                // with isPtr: true (same API as the Properties panel dropdown).
                const pendingReferenceSets: Array<{
                    objectName: string;
                    references: Record<string, { targets: any[] }>;
                }> = [];

                // Map __sourceId → objectName: the reliable bridge between executor
                // target instances and the DObjects created from them.
                // Each executor target has __sourceId (the Pointer ID of the source
                // element that produced it). We key by __sourceId so STEP 8b can
                // resolve reference targets without depending on JS object identity
                // (which breaks across deep copies) or on .name (which may not be
                // set if the transformation has no `name := name` binding).
                const sourceIdToObjectName = new Map<string, string>();

                // Collect object IDs + positions for DVertex creation AFTER the TRANSACTION
                // (DVertex.new has its own internal TRANSACTION — nesting causes coordinates to be lost)
                const pendingVertices: Array<{
                    objectId: string;
                    posX: number;
                    posY: number;
                }> = [];

                console.time('[TIMING] TRANSACTION total');
                TRANSACTION('Execute Transformation: Create Target Model', () => {
                    // STEP 1: Crea DModel con il nome UNICO
                    console.time('[TIMING] DModel.new');
                    const dModel: DModel = DModel.new(
                        uniqueOutputName,       // ← USA IL NOME UNICO!
                        targetMetamodel.id,     // instanceof = target metamodel
                        false,                  // isMetamodel = false
                        true                    // persist = true
                    );
                    console.timeEnd('[TIMING] DModel.new');
                    createdDModel = dModel;
                    createdModelId = dModel.id;
                    // console.log('[ProjectEditor] Created DModel with UNIQUE name:', {
                    //     id: dModel.id,
                    //     name: uniqueOutputName
                    // });

                    // STEP 2: Crea DGraph
                    console.time('[TIMING] DGraph.new');
                    const graphId = Constructors.DGraph_makeID(dModel.id);
                    const dGraph: DGraph = DGraph.new(0, dModel.id, undefined, undefined, graphId);
                    console.timeEnd('[TIMING] DGraph.new');
                    createdDGraph = dGraph;
                    createdGraphId = dGraph.id;
                    // console.log('[ProjectEditor] Created DGraph:', { id: dGraph.id });

                    console.time('[TIMING] SetFieldActions');
                    // Tag graph as v2-flow so EditorV2/useJjomSync can find it
                    SetFieldAction.new(dGraph.id, 'graphStyle', 'v2-flow', '', false);

                    // STEP 3: Aggiungi model a project.models
                    SetFieldAction.new(project.id, 'models', dModel.id, '+=', true);
                    // console.log('[ProjectEditor] Added model to project.models');

                    // STEP 4: Aggiungi graph a state.graphs (ROOT!) - per ModelTab
                    SetRootFieldAction.new('graphs', dGraph.id, '+=', true);
                    // console.log('[ProjectEditor] Added graph to state.graphs (ROOT)');

                    // STEP 5: Aggiungi graph a project.graphs - per persistenza
                    SetFieldAction.new(project.id, 'graphs', dGraph.id, '+=', true);
                    // console.log('[ProjectEditor] Added graph to project.graphs');

                    // STEP 5b: Tag model as generated by transformation
                    SetFieldAction.new(dModel.id, '_state', {
                        generatedBy: {
                            transformationId: transformation.id,
                            sourceModelId: sourceModelId,
                            timestamp: Date.now(),
                        }
                    }, '', false);
                    console.timeEnd('[TIMING] SetFieldActions');

                    // STEP 6: Crea istanze
                    console.time('[TIMING] DObject creation loop');
                    if (result.targetModel?.instances) {
                        const targetClasses: LClass[] = targetMetamodel.classes || [];
                        // console.log('[ProjectEditor] Target classes:', targetClasses.map(c => c.name));

                        result.targetModel.instances.forEach((instances: any[], className: string) => {
                            // console.log(`[ProjectEditor] Creating ${instances.length} instances of "${className}"`);

                            const targetClass = targetClasses.find(c => c.name === className);
                            if (!targetClass) {
                                console.warn(`[ProjectEditor] Class "${className}" not found`);
                                return;
                            }

                            // Grid layout constants for DVertex positioning
                            const GRID_COLS = 3;
                            const NODE_W = 200;
                            const NODE_H = 80;
                            const GAP_X = 50;
                            const GAP_Y = 50;
                            const START_X = 50;
                            const START_Y = 50;

                            for (const instanceData of instances) {
                                // console.log(`[ProjectEditor] instanceData from executor:`, instanceData);

                                const objectName = instanceData.name || `${className}_${instancesCreated}`;
                                const objTimingLabel = `[TIMING] DObject.new #${instancesCreated} (${className})`;
                                console.time(objTimingLabel);
                                const dObject = DObject.new(targetClass.id, dModel.id, DModel, objectName, true);

                                // Map __sourceId → objectName for reference wiring in STEP 8b
                                if (instanceData.__sourceId) {
                                    sourceIdToObjectName.set(String(instanceData.__sourceId), objectName);
                                }

                                // Collect for DVertex creation AFTER the TRANSACTION.
                                // DVertex.new has its own internal TRANSACTION — nesting
                                // causes coordinates to be lost (all positions become 0,0).
                                const col = instancesCreated % GRID_COLS;
                                const row = Math.floor(instancesCreated / GRID_COLS);
                                const posX = START_X + col * (NODE_W + GAP_X);
                                const posY = START_Y + row * (NODE_H + GAP_Y);
                                pendingVertices.push({ objectId: dObject.id, posX, posY });

                                // Collect attributes for deferred setting (after TRANSACTION)
                                // Use WHITELIST approach: only include attributes that exist in the
                                // target metamodel class. This avoids collisions between system
                                // properties (id, name, className) and domain attributes with the
                                // same names.
                                const domainAttrNames = new Set(
                                    (targetClass.attributes || []).map((a: any) => a.name).filter(Boolean)
                                );
                                const attrs: Record<string, any> = {};
                                for (const [attrName, attrValue] of Object.entries(instanceData)) {
                                    if (!domainAttrNames.has(attrName)) continue;
                                    if (attrValue === undefined || attrValue === null) continue;
                                    attrs[attrName] = attrValue;
                                }

                                if (Object.keys(attrs).length > 0) {
                                    pendingAttributeSets.push({
                                        objectName: objectName,
                                        className,
                                        attributes: attrs,
                                    });
                                    // console.log(`[ProjectEditor] Queued attributes for "${objectName}":`, attrs);
                                }

                                // Collect reference values (marked by executor with __ref_result)
                                const refs: Record<string, { targets: any[] }> = {};
                                for (const [key, val] of Object.entries(instanceData)) {
                                    if (val && typeof val === 'object' && (val as any).__ref_result) {
                                        refs[key] = val as { targets: any[] };
                                    }
                                }
                                if (Object.keys(refs).length > 0) {
                                    pendingReferenceSets.push({ objectName, references: refs });
                                    console.log(`[ProjectEditor] Queued references for "${objectName}":`,
                                        Object.keys(refs).map(k => `${k}(${refs[k].targets.length})`));
                                }

                                instancesCreated++;
                            }
                        });
                    }
                    console.timeEnd('[TIMING] DObject creation loop');
                    console.log('[ProjectEditor] sourceId→name map:', Object.fromEntries(sourceIdToObjectName));

                    // console.log(`[ProjectEditor] Total instances created: ${instancesCreated}`);
                });
                console.timeEnd('[TIMING] TRANSACTION total');

                // STEP 7: Open tab AFTER a delay for Redux (fire-and-forget)
                // Scheduled FIRST so tab opens even if DVertex/attribute steps fail.
                // Delay bumped to 2000ms so it fires after DVertex creation + attribute
                // setting have settled — otherwise open2 runs while the graph/vertex
                // dispatches are still in flight and ReactFlow loops on stale state.
                if (createdDModel) {
                    const modelToOpen = createdDModel;
                    const modelName = uniqueOutputName;
                    const count = instancesCreated;

                    setTimeout(() => {
                        try {
                            // Use open2() so EDITOR_TYPE_CHANGE dispatches and Dashboard hides the LeftBar.
                            DockManager.open2(LModel.fromD(modelToOpen));
                            U.alert('i', 'Transformation Executed',
                                `Created model "${modelName}" with ${count} instances.`);
                            markDirty();
                        } catch (e) {
                            console.error('[ProjectEditor] Error opening tab:', e);
                        }
                    }, 2000);
                }

                // Yield one frame before creating DVertices. TRANSACTION above is an
                // async function that suspends at `await func()` — outer depth stays
                // at 1 until the microtask runs FINAL_END. Waiting for the next paint
                // lets React flush renders + lets Redux drain before N DVertex.new()
                // calls each open their own internal TRANSACTION.
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

                // STEP 6b: Create DVertices OUTSIDE the TRANSACTION.
                // DVertex.new has its own internal TRANSACTION — calling it inside
                // another TRANSACTION causes nested transactions that lose coordinates.
                // Same pattern as useJjomSync's auto-population.
                // Wrapped in try-catch so vertex creation failures don't prevent tab opening.
                if (pendingVertices.length > 0 && createdGraphId) {
                    const gid = createdGraphId;
                    const NODE_W = 200;
                    const NODE_H = 80;
                    console.time('[TIMING] DVertex creation');
                    try {
                        let dvIdx = 0;
                        for (const pv of pendingVertices) {
                            const size = new GraphSize(pv.posX, pv.posY, NODE_W, NODE_H);
                            const dvLabel = `[TIMING] DVertex.new #${dvIdx}`;
                            console.time(dvLabel);
                            DVertex.new(0, pv.objectId, gid, gid, undefined, size);

                        }
                    } catch (e) {
                        console.error('[ProjectEditor] Error creating DVertices (non-fatal):', e);
                    }
                    console.timeEnd('[TIMING] DVertex creation');
                }

                // STEP 8: Set attributes after delay — use LModel proxy to find objects by name
                if (pendingAttributeSets.length > 0 && createdModelId) {
                    const modelId = createdModelId;
                    // console.log(`[ProjectEditor] STEP 8: Will set attributes for ${pendingAttributeSets.length} objects via LModel proxy`);

                    // Use setTimeout to wait for Redux propagation and rendering
                    setTimeout(() => {
                        try {
                            const lModel = LPointerTargetable.fromD(modelId) as LModel;
                            if (!lModel) {
                                console.error(`[ProjectEditor] Could not get LModel for ${modelId}`);
                                return;
                            }

                            const objects = lModel.objects || [];
                            // console.log(`[ProjectEditor] LModel has ${objects.length} objects:`, objects.map((o: LObject) => o.name));

                            for (const pending of pendingAttributeSets) {
                                // Find object by name
                                const lObject = objects.find((o: LObject) => o.name === pending.objectName);
                                if (!lObject) {
                                    console.warn(`[ProjectEditor] Object "${pending.objectName}" not found in model`);
                                    continue;
                                }

                                // console.log(`[ProjectEditor] Found "${pending.objectName}", setting attributes...`);

                                for (const [attrName, attrValue] of Object.entries(pending.attributes)) {
                                    try {
                                        const feature = (lObject as any)['$' + attrName];
                                        if (feature) {
                                            feature.value = attrValue;
                                            // console.log(`[ProjectEditor] ✅ Set ${pending.objectName}.${attrName} = ${JSON.stringify(attrValue)}`);
                                        } else {
                                            console.warn(`[ProjectEditor] ❌ Feature "$${attrName}" not found on "${pending.objectName}"`);
                                            // Try listing available features for debugging
                                            const features = lObject.features || [];
                                            console.warn(`[ProjectEditor] Available features:`, features.map((f: any) => f.name));
                                        }
                                    } catch (e) {
                                        console.error(`[ProjectEditor] Error setting ${attrName} on "${pending.objectName}":`, e);
                                    }
                                }
                            }

                            console.log(`[ProjectEditor] ✅ Attribute setting complete`);

                            // STEP 8b: Set references — same LModel proxy, same objects list.
                            // Uses setValueAtPosition with isPtr:true (same API the Properties
                            // panel dropdown uses in Info.tsx changeDValue).
                            //
                            // Lookup strategy: each executor target has __sourceId (the Pointer
                            // ID of the source element that produced it). sourceIdToObjectName
                            // maps __sourceId → the DObject name assigned during creation.
                            // We then find the real DObject via LModel proxy by name to get
                            // the real Pointer ID.
                            if (pendingReferenceSets.length > 0) {
                                console.log(`[ProjectEditor] STEP 8b: Setting references for ${pendingReferenceSets.length} objects`);
                                for (const pending of pendingReferenceSets) {
                                    const lObject = objects.find((o: LObject) => o.name === pending.objectName);
                                    if (!lObject) {
                                        console.warn(`[ProjectEditor] Ref: Object "${pending.objectName}" not found`);
                                        continue;
                                    }
                                    for (const [refName, refData] of Object.entries(pending.references)) {
                                        try {
                                            const feature = (lObject as any)['$' + refName];
                                            if (!feature) {
                                                console.warn(`[ProjectEditor] Ref: Feature "$${refName}" not found on "${pending.objectName}"`);
                                                continue;
                                            }
                                            const targets = refData.targets || [];
                                            for (let ri = 0; ri < targets.length; ri++) {
                                                const target = targets[ri];
                                                const sourceId = target?.__sourceId;
                                                const targetName = sourceId
                                                    ? sourceIdToObjectName.get(String(sourceId))
                                                    : target?.name;
                                                if (!targetName) {
                                                    if (sourceId) {
                                                        console.warn(`[ProjectEditor] Ref: sourceId not found in map: ${sourceId} (for ${pending.objectName}.${refName}[${ri}])`);
                                                    } else {
                                                        console.warn(`[ProjectEditor] Ref: target has no __sourceId or name for ${pending.objectName}.${refName}[${ri}]`);
                                                    }
                                                    continue;
                                                }
                                                const targetLObj = objects.find((o: LObject) => o.name === targetName);
                                                if (!targetLObj) {
                                                    console.warn(`[ProjectEditor] Ref: Target "${targetName}" not found in model for ${pending.objectName}.${refName}[${ri}]`);
                                                    continue;
                                                }
                                                const targetRealId = targetLObj.id;
                                                feature.setValueAtPosition(ri, targetRealId, { isPtr: true });
                                                console.log(`[ProjectEditor] ✅ Ref: ${pending.objectName}.${refName}[${ri}] → ${targetName} (${targetRealId})`);
                                            }
                                        } catch (e) {
                                            console.error(`[ProjectEditor] Error setting ref ${refName} on "${pending.objectName}":`, e);
                                        }
                                    }
                                }
                                console.log(`[ProjectEditor] ✅ Reference setting complete`);
                            }

                        } catch (e) {
                            console.error(`[ProjectEditor] Error in STEP 8:`, e);
                        }
                    }, 1000); // 1 second delay — generous, ensures everything is propagated
                }

                // Return the execution result IMMEDIATELY so JjtlDevelopmentEnv can update trace display
                // Tab opening and attribute setting happen in the background (fire-and-forget)
                // Broadcast execution result via custom event (for JjtlDevelopmentEnv trace display)
                window.dispatchEvent(new CustomEvent(SystemEvents.JJTL_EXECUTION_RESULT, { detail: result }));

                // Reset execution guard
                isExecutingTransformation = false;
                return result;

            } catch (error) {
                console.error('[ProjectEditor] Error:', error);
                U.alert('e', 'Error', `Failed to execute transformation: ${error}`);
                // Reset execution guard
                isExecutingTransformation = false;
                // Return failed result so JjtlDevelopmentEnv can show errors
                return {
                    success: false,
                    errors: [error instanceof Error ? error.message : String(error)],
                    warnings: [],
                } as ExecutionResult;
            }
        };

        // Open transformation in JjTL Development Environment tab
        DockManager.openTransformation(
            transformation,
            sourceMetamodelElements,
            targetMetamodelElements,
            (updatedCode) => {
                // Update transformation code when saved
                setTransformations(prev => prev.map(t =>
                    t.id === transformation.id
                        ? { ...t, code: updatedCode, modifiedAt: Date.now() }
                        : t
                ));
                markDirty();
            },
            getSourceMetamodel,
            getTargetMetamodel,
            availableModels,
            existingModelNames,
            handleExecuteTransformation
        );
    };

    // Open transformation tab when TreeView entry is clicked
    const handleOpenTransformationRef = useRef(handleOpenTransformation);
    handleOpenTransformationRef.current = handleOpenTransformation;
    const transformationsRef = useRef(transformations);
    transformationsRef.current = transformations;
    useEffect(() => {
        const handler = (e: Event) => {
            const { id } = (e as CustomEvent).detail || {};
            if (!id) return;
            const t = transformationsRef.current.find((tr: any) => tr.id === id);
            if (t) handleOpenTransformationRef.current(t);
        };
        window.addEventListener(JjodelEvents.OPEN_TRANSFORMATION, handler);
        return () => window.removeEventListener(JjodelEvents.OPEN_TRANSFORMATION, handler);
    }, []);

    const handleRenameTransformation = (id: string, newName: string) => {
        setTransformations(prev => prev.map(t =>
            t.id === id
                ? { ...t, name: newName, modifiedAt: Date.now() }
                : t
        ));
        markDirty();
    };

    const handleDeleteTransformation = (id: string) => {
        // Close any open tabs for this transformation before deleting
        DockManager.closeTabsForEntity(id, 'transformation');
        setTransformations(prev => prev.filter(t => t.id !== id));
        markDirty();
    };

    const handleDuplicateTransformation = (id: string) => {
        const original = transformations.find(t => t.id === id);
        if (original) {
            const duplicate = createTransformation(
                `${original.name} (copy)`,
                original.sourceMetamodelId,
                original.sourceMetamodelName,
                original.targetMetamodelId,
                original.targetMetamodelName,
                original.description
            );
            duplicate.code = original.code;
            setTransformations(prev => [...prev, duplicate]);
            markDirty();
        }
    };

    // Section definitions removed — navigation is now in LeftBar sidebar

    const versionList = store.getState().version.conversionList;
    return (
        <div className="project-editor">

            <div className="project-editor__body">
                {/* Main content — single section driven by URL ?section= param */}
                <div className="project-editor__main">

            {/* Project Header — inside centered container */}
            <div className="project-header-compact">
                <div className="project-header-compact__row1">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            className="project-header-compact__title-input"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={handleNameKeyDown}
                        />
                    ) : (
                        <h1
                            className="project-header-compact__title"
                            onClick={handleStartEditName}
                            title="Click to edit name"
                        >
                            {project.name || 'Unnamed Project'}
                        </h1>
                    )}
                    <span className="project-header-compact__version">
                        <i className="bi bi-gear" />
                        {getEngineVersion()}
                    </span>
                    <span className="project-header-compact__version">
                        Rev {formatVersionNumber(project.version)}
                    </span>
                    <div className="project-header-compact__actions">
                        {isAddingTag ? (
                            <div className="project-tag__input-wrapper" style={{ display: 'inline-flex' }}>
                                <input
                                    ref={tagInputRef}
                                    type="text"
                                    className="project-tag__input"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onBlur={handleAddTag}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="e.g. client, server"
                                />
                            </div>
                        ) : (
                            <button
                                className="btn btn--ghost btn--xs"
                                onClick={() => setIsAddingTag(true)}
                                title="Add tags to organize your project"
                            >
                                <i className="bi bi-tag" />
                                Tags
                            </button>
                        )}
                        <div className="project-menu-wrapper" ref={projectMenuRef}>
                            <button
                                className="icon-btn icon-btn--menu"
                                onClick={() => setShowProjectMenu(!showProjectMenu)}
                                title="Project actions"
                            >
                                <i className="bi bi-three-dots-vertical" />
                            </button>
                            {showProjectMenu && (
                                <div className="project-menu-dropdown">
                                    <button onClick={handleDownloadProject}>
                                        <i className="bi bi-download" />
                                        Download project
                                    </button>
                                    <button onClick={() => { handleVisibilityBadgeClick(); setShowProjectMenu(false); }}>
                                        <i className={`bi bi-${project.type === 'public' ? 'lock' : 'globe'}`} />
                                        {project.type === 'public' ? 'Make private' : 'Make public'}
                                    </button>
                                    <div className="project-menu-dropdown__divider" />
                                    {onNavigateBack && (
                                        <button onClick={() => { handleBackNavigation(); setShowProjectMenu(false); }}>
                                            <i className="bi bi-x-lg" />
                                            Close project
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="project-header-compact__row2">
                    {isEditingDescription ? (
                        <div className="project-header-compact__desc-editor">
                            <textarea
                                ref={descriptionInputRef}
                                className="project-header__description-input"
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                onBlur={handleSaveDescription}
                                onKeyDown={handleDescriptionKeyDown}
                                rows={3}
                                placeholder="Add a project description..."
                            />
                        </div>
                    ) : (
                        <span className="project-header-compact__desc-row">
                            {project.description ? (
                                <span>{project.description}</span>
                            ) : (
                                <span
                                    className="project-header-compact__desc-placeholder"
                                    onClick={handleStartEditDescription}
                                >
                                    Add a description...
                                </span>
                            )}
                            <button
                                className="edit-btn edit-btn--inline"
                                onClick={handleStartEditDescription}
                                title="Edit description"
                            >
                                <i className="bi bi-pencil" />
                            </button>
                        </span>
                    )}
                    <span className="project-header-compact__sep">&middot;</span>
                    <span>{formatDate(project.creation)}</span>
                    {tags.length > 0 && (
                        <>
                            <span className="project-header-compact__sep">&middot;</span>
                            {tags.map((tag) => (
                                <span key={tag} className="project-tag project-tag--compact">
                                    {tag}
                                    <button
                                        className="project-tag__remove"
                                        onClick={() => handleRemoveTag(tag)}
                                        title="Remove tag"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Metamodels Section */}
            <div className="project-section" id="section-metamodels">
                <SectionHeader
                    title="METAMODELS"
                    count={metamodels.length}
                    primaryAction={{ label: '+ New', onClick: handleCreateMetamodel }}
                    secondaryAction={{
                        label: 'Import',
                        onClick: () => setShowImportMenu(!showImportMenu),
                        icon: 'upload',
                        hasDropdown: true,
                        isDropdownOpen: showImportMenu,
                    }}
                >
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={() => setShowMegamodelModal(true)}
                        title="View relationships between project artifacts"
                    >
                        <i className="bi bi-diagram-3" />
                        View Megamodel
                    </button>
                    {/* Import dropdown menu (rendered inside actions area) */}
                    {showImportMenu && (
                        <div className="import-select-menu" ref={importMenuRef}>
                            <button
                                className="import-select-menu__item"
                                onClick={handleImportJmm}
                            >
                                <i className="bi bi-file-earmark" />
                                Import .jmm
                            </button>
                            <button
                                className="import-select-menu__item"
                                onClick={handleImportEcore}
                            >
                                <i className="bi bi-file-earmark-code" />
                                Import Ecore (.ecore)
                            </button>
                        </div>
                    )}
                </SectionHeader>

                {metamodels.length === 0 ? (
                    <EmptyState
                        icon="bi-diagram-3"
                        title="No metamodels yet"
                        description="Create a metamodel to define the structure and rules for your domain models."
                        action={{ label: 'Create Your First Metamodel', onClick: handleCreateMetamodel }}
                    />
                ) : (
                    <div className="list-card">
                        {metamodels.map((mm) => (
                            <div
                                className={`list-card__item ${openMenu?.type === 'metamodel' && openMenu?.id === mm.id ? 'list-card__item--menu-open' : ''}`}
                                key={mm.id}
                                onClick={() => handleOpenMetamodel(mm)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenMetamodel(mm);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="list-card__icon list-card__icon--mm">M</span>
                                <div className="list-card__content" style={{ pointerEvents: 'none' }}>
                                    {renamingItem?.type === 'metamodel' && renamingItem?.id === mm.id ? (
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            className="list-card__rename-input"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={() => handleRenameSubmit(mm)}
                                            onKeyDown={(e) => handleRenameKeyDown(e, mm)}
                                        />
                                    ) : (
                                        <>
                                            <div className="list-card__name">{mm.name || 'Unnamed'}</div>
                                            <div className="list-card__type">Metamodel</div>
                                        </>
                                    )}
                                </div>
                                <div className="list-card__actions">
                                    <button
                                        className="icon-btn icon-btn--menu"
                                        title="More actions"
                                        onClick={(e) => toggleMenu('metamodel', mm.id, e)}
                                    >
                                        <i className="bi bi-three-dots-vertical" />
                                    </button>

                                    {/* Contextual Menu */}
                                    {openMenu?.type === 'metamodel' && openMenu?.id === mm.id && (
                                        <div
                                            className="context-menu"
                                            ref={menuRef}
                                            data-align={menuPosition.align}
                                            data-direction={menuPosition.direction}
                                        >
                                            <button
                                                className="context-menu__item"
                                                onClick={() => {
                                                    handleOpenMetamodel(mm);
                                                    closeMenu();
                                                }}
                                            >
                                                <i className="bi bi-box-arrow-up-right" />
                                                Open
                                            </button>
                                            <button
                                                className="context-menu__item"
                                                onClick={() => handleExportMetamodel(mm)}
                                            >
                                                <i className="bi bi-download" />
                                                Export (.jmm)
                                            </button>
                                            <button
                                                className="context-menu__item"
                                                onClick={() => handleExportEcore(mm)}
                                            >
                                                <i className="bi bi-file-earmark-code" />
                                                Export Ecore (.ecore)
                                            </button>
                                            <div className="context-menu__divider" />
                                            <button
                                                className="context-menu__item"
                                                onClick={() => startRename('metamodel', mm.id, mm.name || '')}
                                            >
                                                <i className="bi bi-pencil" />
                                                Rename
                                            </button>
                                            <div className="context-menu__divider" />
                                            <button
                                                className="context-menu__item context-menu__item--danger"
                                                onClick={() => {
                                                    handleDeleteMetamodel(mm);
                                                    closeMenu();
                                                }}
                                            >
                                                <i className="bi bi-trash" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Models Section */}
            <div className="project-section" id="section-models">
                <div className="project-section-header" ref={metamodelMenuRef}>
                    <h2 className="project-section-header__title">
                        MODELS
                        <span className="project-section-header__count">({models.length})</span>
                    </h2>
                    <div className="project-section-header__actions">
                        <button
                            className="btn btn--ghost btn--sm"
                            disabled={metamodels.length === 0}
                            title={metamodels.length === 0 ? 'Create a metamodel first' : 'Create new model'}
                            onClick={handleNewModelClick}
                        >
                            + New
                            {metamodels.length > 1 && (
                                <i className={`bi bi-chevron-${showMetamodelMenu ? 'up' : 'down'} btn-chevron`} />
                            )}
                        </button>

                        {/* Metamodel selection dropdown */}
                        {showMetamodelMenu && metamodels.length > 1 && (
                            <div className="metamodel-select-menu">
                                <div className="metamodel-select-menu__header">
                                    Select metamodel
                                </div>
                                <div className="metamodel-select-menu__list">
                                    {metamodels.map((mm) => (
                                        <button
                                            key={mm.id}
                                            className="metamodel-select-menu__item"
                                            onClick={() => handleCreateModel(mm)}
                                        >
                                            {mm.name || 'Unnamed'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {models.length === 0 ? (
                    <EmptyState
                        icon="bi-box"
                        title={metamodels.length === 0 ? 'Create a metamodel first' : 'No models yet'}
                        description={metamodels.length === 0
                            ? 'Models are instances of metamodels. You need to create a metamodel structure before you can create models.'
                            : 'Create a model to instantiate your metamodel.'}
                        hints={metamodels.length === 0
                            ? [{ icon: 'bi-arrow-up', text: 'Create your first metamodel in the section above' }]
                            : undefined}
                    />
                ) : (
                    <div className="list-card">
                        {models.map((model) => (
                            <div
                                className={`list-card__item ${openMenu?.type === 'model' && openMenu?.id === model.id ? 'list-card__item--menu-open' : ''}`}
                                key={model.id}
                                onClick={() => handleOpenModel(model)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenModel(model);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="list-card__icon list-card__icon--model">m</span>
                                <div className="list-card__content" style={{ pointerEvents: 'none' }}>
                                    {renamingItem?.type === 'model' && renamingItem?.id === model.id ? (
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            className="list-card__rename-input"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={() => handleRenameSubmit(model)}
                                            onKeyDown={(e) => handleRenameKeyDown(e, model)}
                                        />
                                    ) : (
                                        <>
                                            <div className="list-card__name">{model.name || 'Unnamed'}</div>
                                            <div className="list-card__type">
                                                Model {model.instanceof?.name ? `· ${model.instanceof.name}` : ''}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="list-card__actions">
                                    <button
                                        className="icon-btn icon-btn--menu"
                                        title="More actions"
                                        onClick={(e) => toggleMenu('model', model.id, e)}
                                    >
                                        <i className="bi bi-three-dots-vertical" />
                                    </button>

                                    {/* Contextual Menu */}
                                    {openMenu?.type === 'model' && openMenu?.id === model.id && (
                                        <div
                                            className="context-menu"
                                            ref={menuRef}
                                            data-align={menuPosition.align}
                                            data-direction={menuPosition.direction}
                                        >
                                            <button
                                                className="context-menu__item"
                                                onClick={() => {
                                                    handleOpenModel(model);
                                                    closeMenu();
                                                }}
                                            >
                                                <i className="bi bi-box-arrow-up-right" />
                                                Open
                                            </button>
                                            <button
                                                className="context-menu__item"
                                                onClick={() => handleExportModel(model)}
                                            >
                                                <i className="bi bi-download" />
                                                Export (.jm)
                                            </button>
                                            <button
                                                className="context-menu__item"
                                                onClick={() => handleExportXMI(model)}
                                            >
                                                <i className="bi bi-file-earmark-code" />
                                                Export XMI (.xmi)
                                            </button>
                                            <div className="context-menu__divider" />
                                            <button
                                                className="context-menu__item"
                                                onClick={() => startRename('model', model.id, model.name || '')}
                                            >
                                                <i className="bi bi-pencil" />
                                                Rename
                                            </button>
                                            <div className="context-menu__divider" />
                                            <button
                                                className="context-menu__item context-menu__item--danger"
                                                onClick={() => {
                                                    handleDeleteModel(model);
                                                    closeMenu();
                                                }}
                                            >
                                                <i className="bi bi-trash" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transformations Section */}
            <div className="project-section" id="section-transformations">
                <SectionHeader
                    title="TRANSFORMATIONS"
                    count={transformations.length}
                    primaryAction={{ label: '+ New', onClick: () => setShowNewTransformationDialog(true) }}
                />

                {transformations.length === 0 ? (
                    <EmptyState
                        icon="bi-arrow-left-right"
                        title="No transformations yet"
                        description="Create model-to-model transformations using JjTL to automate conversions between metamodels."
                        action={{ label: 'Create Your First Transformation', onClick: () => setShowNewTransformationDialog(true) }}
                    />
                ) : (
                    <TransformationsList
                        transformations={transformations}
                        onOpen={handleOpenTransformation}
                        onRename={handleRenameTransformation}
                        onDelete={handleDeleteTransformation}
                        onDuplicate={handleDuplicateTransformation}
                    />
                )}
            </div>

            {/* Viewpoints Section */}
            <div className="project-section" id="section-viewpoints">
                <SectionHeader
                    title="VIEWPOINTS"
                    count={viewpoints.length}
                    primaryAction={{ label: '+ New', onClick: () => setShowNewViewpointDialog(true) }}
                />

                {viewpoints.length === 0 ? (
                    <EmptyState
                        icon="bi-eye"
                        title="No viewpoints defined"
                        description="Viewpoints let you define custom perspectives on your models."
                    />
                ) : (
                    <div className="list-card">
                        {viewpoints.map((vp) => {
                            if (!vp) return null;
                            const isDefault = vp.name === 'Default' || vp.name === 'Validation default';
                            const vpType = getViewpointType(vp as any);
                            const isExclusive = vpType === 'syntax';
                            // Count sub-views recursively
                            const countViews = (v: any): number => {
                                let subs: any[] = [];
                                try { subs = v.subViews || []; } catch { subs = []; }
                                let count = subs.length;
                                for (const sv of subs) {
                                    if (sv) count += countViews(sv);
                                }
                                return count;
                            };
                            const viewCount = countViews(vp);
                            return (
                                <div className="list-card__item" key={vp.id || vp.name}>
                                    <span className={`list-card__icon list-card__icon--vp-${vpType}`}
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => handleOpenViewpoint(vp)}>V</span>
                                    <div className="list-card__content"
                                         style={{ cursor: 'pointer' }}
                                         onClick={() => handleOpenViewpoint(vp)}>
                                        <div className="list-card__name">
                                            {vp.name || 'Unnamed'}
                                            <span className="vp-type-badge" data-type={vpType}>
                                                {vpType.replace('_', ' ')}
                                            </span>
                                            {!isExclusive && <i className="bi bi-layers vp-mode-icon" title="Overlay viewpoint"></i>}
                                        </div>
                                        <div className="list-card__type">
                                            {viewCount} {viewCount === 1 ? 'view' : 'views'}
                                        </div>
                                    </div>
                                    <div className="list-card__actions">
                                        <button className="icon-btn" title="View"
                                                onClick={() => handleOpenViewpoint(vp)}>
                                            <i className="bi bi-eye" />
                                        </button>
                                        <button
                                            className="icon-btn"
                                            title="Duplicate"
                                            onClick={() => handleDuplicateViewpoint(vp)}
                                        >
                                            <i className="bi bi-copy" />
                                        </button>
                                        {!isDefault && (
                                            <button
                                                className="icon-btn icon-btn--danger"
                                                title="Delete"
                                                onClick={() => handleDeleteViewpoint(vp)}
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Documentation Section */}
            <div id="section-documentation">
                <DocumentationSection project={project} />
            </div>

                </div>{/* end project-editor__main */}
            </div>{/* end project-editor__body */}

            {/* Megamodel Diagram View */}
            {showMegamodelModal && (() => {
                const megamodel = getRuntimeMegamodel(project.id);
                if (!megamodel) return null;

                // Compute artifact stats for rich node cards
                const artifactStats: ArtifactStats[] = [];
                for (const mm of metamodels) {
                    const classes = mm.classes || [];
                    const attrs = mm.attributes || [];
                    const refs = mm.references || [];
                    artifactStats.push({
                        id: mm.id,
                        stats: {
                            classCount: classes.length,
                            attributeCount: attrs.length,
                            referenceCount: refs.length,
                        },
                        status: {
                            type: 'valid',
                            label: `${classes.length} classes`,
                        },
                    });
                }
                for (const m of models) {
                    const objects = m.objects || [];
                    const conformsToName = (m as any).instanceof?.name;
                    artifactStats.push({
                        id: m.id,
                        stats: {
                            objectCount: objects.length,
                            linkCount: objects.reduce((sum: number, o: any) =>
                                sum + (o?.referenceFeatures?.length ?? 0), 0),
                        },
                        status: objects.length === 0
                            ? { type: 'warning', label: 'Empty model' }
                            : { type: 'valid', label: conformsToName ? `Conforms to ${conformsToName}` : `${objects.length} objects` },
                    });
                }
                for (const t of transformations) {
                    const ruleCount = t.ast?.mappings?.length ?? 0;
                    const mappingCount = t.ast?.mappings?.reduce((sum: number, m: any) =>
                        sum + (m.body?.length ?? 0), 0) ?? 0;
                    artifactStats.push({
                        id: t.id,
                        stats: {
                            ruleCount,
                            mappingCount,
                        },
                        status: t.isValid === false
                            ? { type: 'warning', label: `${t.errorCount ?? 0} errors` }
                            : { type: 'info', label: `${ruleCount} rules` },
                    });
                }

                return (
                    <MegamodelView
                        megamodel={megamodel}
                        projectId={project.id}
                        viewpoints={viewpoints.map(vp => ({
                            id: vp.id || vp.name,
                            name: vp.name || 'Unnamed',
                            isOverlay: vp.isOverlay,
                        }))}
                        artifactStats={artifactStats}
                        onClose={() => setShowMegamodelModal(false)}
                        onOpenNode={(nodeId, nodeKind) => {
                            if (nodeKind === 'metamodel' || nodeKind === 'model') {
                                const lModel = metamodels.find(mm => mm.id === nodeId) || models.find(m => m.id === nodeId);
                                if (lModel) DockManager.open2(lModel);
                            } else if (nodeKind === 'transformation') {
                                const t = transformations.find(tr => tr.id === nodeId);
                                if (t) handleOpenTransformation(t);
                            }
                        }}
                        onDeleteNode={(nodeId, nodeKind) => {
                            if (nodeKind === 'metamodel') {
                                const mm = metamodels.find(m => m.id === nodeId);
                                if (mm) handleDeleteMetamodel(mm);
                            } else if (nodeKind === 'model') {
                                const m = models.find(mod => mod.id === nodeId);
                                if (m) handleDeleteModel(m);
                            } else if (nodeKind === 'transformation') {
                                handleDeleteTransformation(nodeId);
                            }
                            setShowMegamodelModal(false);
                        }}
                        onRenameNode={(nodeId, nodeKind, newName) => {
                            if (nodeKind === 'metamodel') {
                                const mm = metamodels.find(m => m.id === nodeId);
                                if (mm && newName !== mm.name) {
                                    mm.name = newName;
                                    markDirty();
                                }
                            } else if (nodeKind === 'model') {
                                const m = models.find(mod => mod.id === nodeId);
                                if (m && newName !== m.name) {
                                    m.name = newName;
                                    markDirty();
                                }
                            } else if (nodeKind === 'transformation') {
                                handleRenameTransformation(nodeId, newName);
                            }
                            // Keep runtime megamodel ArtifactRef names in sync
                            // so that close/reopen rebuilds nodes with the new name
                            const currentMm = getRuntimeMegamodel(project.id);
                            if (currentMm) {
                                for (const edge of currentMm.edges) {
                                    if (edge.source.id === nodeId) edge.source.name = newName;
                                    if (edge.target.id === nodeId) edge.target.name = newName;
                                }
                            }
                        }}
                        onDuplicateNode={(nodeId, nodeKind) => {
                            if (nodeKind === 'transformation') {
                                handleDuplicateTransformation(nodeId);
                            }
                            // TODO: duplicate for metamodels/models
                        }}
                        onRunTransformation={(nodeId) => {
                            const t = transformations.find(tr => tr.id === nodeId);
                            if (t) {
                                setShowMegamodelModal(false);
                                handleOpenTransformation(t);
                            }
                        }}
                        onCreateMetamodel={() => {
                            handleCreateMetamodel();
                            setShowMegamodelModal(false);
                        }}
                        onCreateModel={() => {
                            handleNewModelClick();
                            setShowMegamodelModal(false);
                        }}
                    />
                );
            })()}

            {/* Share Modal */}
            <ShareProjectModal
                project={project}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />

            {/* New Transformation Dialog */}
            <NewTransformationDialog
                isOpen={showNewTransformationDialog}
                onClose={() => setShowNewTransformationDialog(false)}
                onSubmit={(data) => handleCreateTransformation(
                    data.name,
                    data.sourceMetamodelId,
                    data.targetMetamodelId,
                    data.description
                )}
                existingNames={transformations.map(t => t.name)}
                metamodels={metamodels.map(mm => ({ id: mm.id, name: mm.name || 'Unnamed' }))}
            />

            {/* New Viewpoint Dialog */}
            <NewViewpointDialog
                isOpen={showNewViewpointDialog}
                onClose={() => setShowNewViewpointDialog(false)}
                onSubmit={handleCreateViewpoint}
                existingNames={viewpoints.map(vp => vp?.name || '')}
            />

            {/* Environment Generation Wizard */}
            <EnvGenWizardModal
                isOpen={showEnvGenWizard}
                onClose={() => setShowEnvGenWizard(false)}
                metamodels={metamodels.map(mm => ({ id: mm.id, name: mm.name || 'Unnamed' }))}
                existingConfigId={editingEnvGenId}
                onConfigSaved={() => setEnvGenConfigs(EnvGenPersistence.getAll())}
            />

            {/* Unsaved Changes Dialog */}
            <UnsavedChangesDialog
                isOpen={showUnsavedDialog}
                onDontSave={handleDontSave}
                onCancel={handleCancelDialog}
                onSave={handleSaveAndContinue}
                isSaving={isSaving}
            />

            {/* Hidden file inputs for import */}
            <input
                ref={importJmmRef}
                type="file"
                accept=".jmm"
                style={{ display: 'none' }}
                onChange={handleJmmFileChange}
            />
            <input
                ref={importEcoreRef}
                type="file"
                accept=".ecore"
                style={{ display: 'none' }}
                onChange={handleEcoreFileChange}
            />
        </div>
    );
};

export default ProjectEditor;
