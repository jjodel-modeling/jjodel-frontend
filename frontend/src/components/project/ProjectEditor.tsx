import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    TRANSACTION
} from '../../joiner';
import DockManager from '../abstract/DockManager';
import TabDataMaker from '../abstract/tabs/TabDataMaker';
import { createM2, createM1 } from '../../pages/components/Navbar';
import { formatVersionNumber } from '../../utils/versionUtils';
import ShareProjectModal from './ShareProjectModal';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import DocumentationSection from './DocumentationSection';
import { EcoreService, XMIService } from '../../services/export';
import { NewTransformationDialog, TransformationsList } from '../../jjtl/components';
import { JjtlTransformation, createTransformation, TransformationAST } from '../../jjtl/types';
import { execute as executeTransformation, ExecutionResult } from '../../jjtl/executor';
import { convertMetamodelToJjtl, findMetamodelById } from '../../jjtl/utils/metamodelConverter';
import { EnvGenWizardModal, EnvGenPersistence, ENVGEN_CHANGE_EVENT, ENVGEN_OPEN_WIZARD_EVENT } from '../envgen';
import type { EnvGenConfigSummary } from '../envgen';
import { loadMegamodel, getSerializedMegamodel } from '../../model/megamodelPersistence';
import { setRuntimeMegamodel, clearRuntimeMegamodel, getRuntimeMegamodel } from '../../model/megamodelRuntime';
import MegamodelView, { type ArtifactStats } from '../megamodel/MegamodelView';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../ui/EmptyState';
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
    const metamodels = project.metamodels || [];
    const models = project.models || [];
    const viewpoints = project.viewpoints || [];
    const tags = project.tags || [];

    // Transformations state (in-memory for now)
    const [transformations, setTransformations] = useState<JjtlTransformation[]>([]);
    const [showNewTransformationDialog, setShowNewTransformationDialog] = useState(false);

    // Editing states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedName, setEditedName] = useState(project.name || '');
    const [editedDescription, setEditedDescription] = useState(project.description || '');
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
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
        window.addEventListener(ENVGEN_CHANGE_EVENT, handler);
        return () => window.removeEventListener(ENVGEN_CHANGE_EVENT, handler);
    }, []);

    // Environment Generation: listen for open-wizard event from Navbar
    useEffect(() => {
        const handler = () => {
            setEditingEnvGenId(undefined);
            setShowEnvGenWizard(true);
        };
        window.addEventListener(ENVGEN_OPEN_WIZARD_EVENT, handler);
        return () => window.removeEventListener(ENVGEN_OPEN_WIZARD_EVENT, handler);
    }, []);

    // Open megamodel modal when TreeView entry is clicked
    useEffect(() => {
        const handler = () => setShowMegamodelModal(true);
        window.addEventListener('jjodel:openMegamodel', handler);
        return () => window.removeEventListener('jjodel:openMegamodel', handler);
    }, []);

    // Broadcast transformations to TreeView via CustomEvent
    useEffect(() => {
        const detail = transformations.map(t => ({
            id: t.id,
            name: t.name,
            sourceMMName: t.sourceMetamodelName,
            targetMMName: t.targetMetamodelName,
        }));
        window.dispatchEvent(new CustomEvent('jjodel:transformations', { detail }));
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
                project.tags = [...tags, ...newTags];
                markDirty();
            }
            setNewTag('');
        }
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        project.tags = tags.filter(t => t !== tagToRemove);
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

    const handleDuplicateViewpoint = (vp: LViewPoint) => {
        vp.duplicate();
    };

    const handleDeleteViewpoint = (vp: LViewPoint) => {
        vp.delete();
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
        console.log('[ProjectEditor] DEBUG - Raw data:', {
            modelsCount: models?.length || 0,
            metamodelsCount: metamodels?.length || 0,
            metamodelIds: metamodels?.map(m => ({ id: m.id, name: m.name })),
            sourceMetamodelName: transformation.sourceMetamodelName,
            firstModel: models?.[0] ? {
                id: models[0].id,
                name: models[0].name,
                instanceof: models[0].instanceof,
                instanceofType: typeof models[0].instanceof,
                // Also try to access as proxy
                instanceofId: (models[0].instanceof as any)?.id,
                instanceofName: (models[0].instanceof as any)?.name,
            } : null,
        });

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

            console.log('[ProjectEditor] DEBUG - Model mapping:', {
                modelName: model.name,
                instanceofRaw: instanceOf,
                instanceofType: typeof instanceOf,
                extractedMmId: mmId,
                extractedMmName: mmName,
            });

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

        console.log('[ProjectEditor] Opening transformation', {
            name: transformation.name,
            sourceMetamodelId: transformation.sourceMetamodelId,
            sourceMetamodelName: transformation.sourceMetamodelName,
            sourceElements: sourceMetamodelElements.length,
            targetElements: targetMetamodelElements.length,
            modelsInProject: models?.length || 0,
            availableModels: availableModels.map(m => ({
                id: m.id,
                name: m.name,
                metamodelId: m.metamodelId,
                metamodelName: m.metamodelName
            }))
        });

        // Create getter functions that fetch FRESH metamodel data on demand
        // These are called when user clicks "Analyze" in Suggested Mappings panel
        const getSourceMetamodel = () => {
            const freshMM = findMetamodelById(project.metamodels || [], transformation.sourceMetamodelId);
            const result = freshMM ? convertMetamodelToJjtl(freshMM) : [];
            console.log('[ProjectEditor] getSourceMetamodel called, classes:', result.filter(e => e.type === 'class').length);
            return result;
        };

        const getTargetMetamodel = () => {
            const freshMM = findMetamodelById(project.metamodels || [], transformation.targetMetamodelId);
            const result = freshMM ? convertMetamodelToJjtl(freshMM) : [];
            console.log('[ProjectEditor] getTargetMetamodel called, classes:', result.filter(e => e.type === 'class').length);
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

            console.log('[ProjectEditor] handleExecuteTransformation called', {
                sourceModelId,
                outputModelName,
                astMappings: ast?.mappings?.length || 0
            });

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
                const sourceObjects = sourceModel.objects || [];
                console.log('[ProjectEditor] Source objects count:', sourceObjects.length);

                const sourceModelData = sourceObjects.map((obj: LObject) => {
                    // Resolve className with multiple fallback paths
                    let className = '';

                    // Method 1: Direct instanceof.name (standard path)
                    if (obj.instanceof && obj.instanceof.name) {
                        className = obj.instanceof.name;
                        console.log(`[ProjectEditor] className from instanceof.name: "${className}"`);
                    }

                    // Method 2: Check __raw.instanceof and resolve via Redux state
                    if (!className && (obj as any).__raw?.instanceof) {
                        const classPointer = (obj as any).__raw.instanceof;
                        const state = store.getState() as any;
                        const classData = state[classPointer];
                        if (classData && classData.name) {
                            className = classData.name;
                            console.log(`[ProjectEditor] className from __raw.instanceof lookup: "${className}"`);
                        }
                    }

                    // Method 3: Check features for __class or type indicator
                    if (!className && obj.features) {
                        for (const feature of obj.features) {
                            if (feature.name === '__class' || feature.name === '__type') {
                                const val = feature.values?.length > 0 ? feature.values[0] : feature.value;
                                if (typeof val === 'string') {
                                    className = val;
                                    console.log(`[ProjectEditor] className from feature "${feature.name}": "${className}"`);
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
                            console.log(`[ProjectEditor] className extracted from name pattern "${obj.name}": "${className}"`);
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
                            if (feature.name) {
                                result[feature.name] = feature.values?.length > 0
                                    ? (feature.values.length === 1 ? feature.values[0] : feature.values)
                                    : feature.value;
                            }
                        }
                    }

                    console.log(`[ProjectEditor] Source object mapped:`, {
                        id: obj.id,
                        name: obj.name,
                        resolvedClassName: className,
                        featureCount: obj.features?.length || 0
                    });

                    return result;
                });

                const sourceModelDataCopy = JSON.parse(JSON.stringify(sourceModelData));
                // Execute transformation
                const result: ExecutionResult = await executeTransformation(ast, sourceModelDataCopy, targetMetamodel);

                if (!result.success) {
                    U.alert('e', 'Transformation Failed', result.errors.join('\n'));
                    isExecutingTransformation = false;
                    return result;
                }

                // ============================================
                // CREAZIONE MODELLO - NON USARE createM1!
                // ============================================

                // CRITICAL: Get fresh model names from Redux store, NOT from stale component state
                // This ensures we catch recently created models that haven't triggered a re-render yet
                const freshState = store.getState() as any;
                const freshExistingNames: string[] = [];

                // Iterate through state and collect all model/metamodel names
                for (const key in freshState) {
                    const item = freshState[key];
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

                console.log('[ProjectEditor] Output model name:', {
                    requested: outputModelName,
                    unique: uniqueOutputName,
                    existingNames: existingNames,
                    freshNamesCount: freshExistingNames.length
                });

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

                // Collect object IDs + positions for DVertex creation AFTER the TRANSACTION
                // (DVertex.new has its own internal TRANSACTION — nesting causes coordinates to be lost)
                const pendingVertices: Array<{
                    objectId: string;
                    posX: number;
                    posY: number;
                }> = [];

                TRANSACTION('Execute Transformation: Create Target Model', () => {
                    // STEP 1: Crea DModel con il nome UNICO
                    const dModel: DModel = DModel.new(
                        uniqueOutputName,       // ← USA IL NOME UNICO!
                        targetMetamodel.id,     // instanceof = target metamodel
                        false,                  // isMetamodel = false
                        true                    // persist = true
                    );
                    createdDModel = dModel;
                    createdModelId = dModel.id;
                    console.log('[ProjectEditor] Created DModel with UNIQUE name:', {
                        id: dModel.id,
                        name: uniqueOutputName
                    });

                    // STEP 2: Crea DGraph
                    const graphId = Constructors.DGraph_makeID(dModel.id);
                    const dGraph: DGraph = DGraph.new(0, dModel.id, undefined, undefined, graphId);
                    createdDGraph = dGraph;
                    createdGraphId = dGraph.id;
                    console.log('[ProjectEditor] Created DGraph:', { id: dGraph.id });

                    // Tag graph as v2-flow so EditorV2/useJjomSync can find it
                    SetFieldAction.new(dGraph.id, 'graphStyle', 'v2-flow', '', false);

                    // STEP 3: Aggiungi model a project.models
                    SetFieldAction.new(project.id, 'models', dModel.id, '+=', true);
                    console.log('[ProjectEditor] Added model to project.models');

                    // STEP 4: Aggiungi graph a state.graphs (ROOT!) - per ModelTab
                    SetRootFieldAction.new('graphs', dGraph.id, '+=', true);
                    console.log('[ProjectEditor] Added graph to state.graphs (ROOT)');

                    // STEP 5: Aggiungi graph a project.graphs - per persistenza
                    SetFieldAction.new(project.id, 'graphs', dGraph.id, '+=', true);
                    console.log('[ProjectEditor] Added graph to project.graphs');

                    // STEP 5b: Tag model as generated by transformation
                    SetFieldAction.new(dModel.id, '_state', {
                        generatedBy: {
                            transformationId: transformation.id,
                            sourceModelId: sourceModelId,
                            timestamp: Date.now(),
                        }
                    }, '', false);

                    // STEP 6: Crea istanze
                    if (result.targetModel?.instances) {
                        const targetClasses: LClass[] = targetMetamodel.classes || [];
                        console.log('[ProjectEditor] Target classes:', targetClasses.map(c => c.name));

                        result.targetModel.instances.forEach((instances: any[], className: string) => {
                            console.log(`[ProjectEditor] Creating ${instances.length} instances of "${className}"`);

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
                                console.log(`[ProjectEditor] instanceData from executor:`, instanceData);

                                const objectName = instanceData.name || `${className}_${instancesCreated}`;
                                const dObject = DObject.new(targetClass.id, dModel.id, DModel, objectName, true);
                                console.log(`[ProjectEditor] Created instance:`, { name: objectName, class: className });

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
                                    console.log(`[ProjectEditor] Queued attributes for "${objectName}":`, attrs);
                                }

                                instancesCreated++;
                            }
                        });
                    }

                    console.log(`[ProjectEditor] Total instances created: ${instancesCreated}`);
                });

                // STEP 7: Open tab AFTER a delay for Redux (fire-and-forget)
                // Schedule this FIRST so tab opens even if DVertex/attribute steps fail.
                if (createdDModel) {
                    const modelToOpen = createdDModel;
                    const modelName = uniqueOutputName;
                    const count = instancesCreated;

                    setTimeout(() => {
                        try {
                            const tab = TabDataMaker.model(modelToOpen);
                            DockManager.open('models', tab);
                            U.alert('i', 'Transformation Executed',
                                `Created model "${modelName}" with ${count} instances.`);
                            markDirty();
                        } catch (e) {
                            console.error('[ProjectEditor] Error opening tab:', e);
                        }
                    }, 200);
                }

                // STEP 6b: Create DVertices OUTSIDE the TRANSACTION.
                // DVertex.new has its own internal TRANSACTION — calling it inside
                // another TRANSACTION causes nested transactions that lose coordinates.
                // Same pattern as useJjomSync's auto-population.
                // Wrapped in try-catch so vertex creation failures don't prevent tab opening.
                if (pendingVertices.length > 0 && createdGraphId) {
                    const gid = createdGraphId;
                    const NODE_W = 200;
                    const NODE_H = 80;
                    try {
                        for (const pv of pendingVertices) {
                            const size = new GraphSize(pv.posX, pv.posY, NODE_W, NODE_H);
                            DVertex.new(0, pv.objectId, gid, gid, undefined, size);
                            console.log(`[ProjectEditor] Created DVertex for object at (${pv.posX}, ${pv.posY})`);
                        }
                    } catch (e) {
                        console.error('[ProjectEditor] Error creating DVertices (non-fatal):', e);
                    }
                }

                // STEP 8: Set attributes after delay — use LModel proxy to find objects by name
                if (pendingAttributeSets.length > 0 && createdModelId) {
                    const modelId = createdModelId;
                    console.log(`[ProjectEditor] STEP 8: Will set attributes for ${pendingAttributeSets.length} objects via LModel proxy`);

                    // Use setTimeout to wait for Redux propagation and rendering
                    setTimeout(() => {
                        try {
                            const lModel = LPointerTargetable.fromD(modelId) as LModel;
                            if (!lModel) {
                                console.error(`[ProjectEditor] Could not get LModel for ${modelId}`);
                                return;
                            }

                            const objects = lModel.objects || [];
                            console.log(`[ProjectEditor] LModel has ${objects.length} objects:`, objects.map((o: LObject) => o.name));

                            for (const pending of pendingAttributeSets) {
                                // Find object by name
                                const lObject = objects.find((o: LObject) => o.name === pending.objectName);
                                if (!lObject) {
                                    console.warn(`[ProjectEditor] Object "${pending.objectName}" not found in model`);
                                    continue;
                                }

                                console.log(`[ProjectEditor] Found "${pending.objectName}", setting attributes...`);

                                for (const [attrName, attrValue] of Object.entries(pending.attributes)) {
                                    try {
                                        const feature = (lObject as any)['$' + attrName];
                                        if (feature) {
                                            feature.value = attrValue;
                                            console.log(`[ProjectEditor] ✅ Set ${pending.objectName}.${attrName} = ${JSON.stringify(attrValue)}`);
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
                        } catch (e) {
                            console.error(`[ProjectEditor] Error in STEP 8:`, e);
                        }
                    }, 1000); // 1 second delay — generous, ensures everything is propagated
                }

                // Return the execution result IMMEDIATELY so JjtlDevelopmentEnv can update trace display
                // Tab opening and attribute setting happen in the background (fire-and-forget)
                // Broadcast execution result via custom event (for JjtlDevelopmentEnv trace display)
                window.dispatchEvent(new CustomEvent('jjtl-execution-result', { detail: result }));

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

    return (
        <div className="project-editor">
            {/* Header */}
            <div className="project-header">
                <div className="project-header__badges">
                    <button
                        className="jj-badge jj-badge--state badge--clickable"
                        onClick={handleVisibilityBadgeClick}
                        title={project.type === 'public' ? 'Click to get share link' : 'Click to make public'}
                    >
                        {project.type || 'private'}
                        {project.type === 'public' ? (
                            <i className="bi bi-link-45deg" />
                        ) : (
                            <i className="bi bi-arrow-left-right" />
                        )}
                    </button>
                    {project.type === 'public' && (
                        <button
                            className="badge-toggle-btn"
                            onClick={handleToggleType}
                            title="Make private"
                        >
                            <i className="bi bi-lock" />
                        </button>
                    )}
                    <Badge category="version" className="badge--engine">
                        <i className="bi bi-gear" />
                        {getEngineVersion()}
                    </Badge>
                    <Badge category="version">
                        Rev {formatVersionNumber(project.version)}
                    </Badge>
                </div>

                {/* Editable Name */}
                <div className="project-header__title-row">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            className="project-header__title-input"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={handleNameKeyDown}
                        />
                    ) : (
                        <h1
                            className="project-header__title"
                            onClick={handleStartEditName}
                        >
                            {project.name || 'Unnamed Project'}
                            <button className="edit-btn" title="Edit name">
                                <i className="bi bi-pencil" />
                            </button>
                        </h1>
                    )}
                </div>

                {/* Editable Description */}
                <div className="project-header__description-row">
                    {isEditingDescription ? (
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
                    ) : (
                        <p
                            className="project-header__description"
                            onClick={handleStartEditDescription}
                        >
                            {project.description || 'Click to add a description...'}
                            <button className="edit-btn" title="Edit description">
                                <i className="bi bi-pencil" />
                            </button>
                        </p>
                    )}
                </div>

                {/* Tags */}
                <div className="project-tags">
                    {tags.map((tag) => (
                        <span key={tag} className="project-tag">
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
                    {isAddingTag ? (
                        <div className="project-tag__input-wrapper">
                            <input
                                ref={tagInputRef}
                                type="text"
                                className="project-tag__input"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onBlur={handleAddTag}
                                onKeyDown={handleTagKeyDown}
                                placeholder="e.g. client, server, api"
                            />
                            <span className="project-tag__hint">
                                Use commas to add multiple tags
                            </span>
                        </div>
                    ) : (
                        <button
                            className="project-tag project-tag--add"
                            onClick={() => setIsAddingTag(true)}
                        >
                            + Add tags
                        </button>
                    )}
                </div>

                {/* Dates */}
                <div className="project-dates">
                    <span>Created: {formatDate(project.creation)}</span>
                    <span className="project-dates__separator">·</span>
                    <span>Modified: {formatDate(project.lastModified)}</span>
                </div>

                {/* Quick actions */}
                <div className="project-quickactions">
                    <Button
                        variant="secondary"
                        className="megamodel-btn"
                        onClick={() => setShowMegamodelModal(true)}
                        title="View relationships between project artifacts"
                    >
                        <i className="bi bi-diagram-3" />
                        View Megamodel
                    </Button>
                </div>
            </div>

            {/* Metamodels Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">METAMODELS</h2>
                    <div className="project-section__actions">
                        {/* Import button with dropdown */}
                        <div className="import-button-wrapper" ref={importMenuRef}>
                            <Button
                                variant="secondary"
                                onClick={() => setShowImportMenu(!showImportMenu)}
                            >
                                <i className="bi bi-upload" />
                                Import
                                <i className={`bi bi-chevron-${showImportMenu ? 'up' : 'down'} btn-chevron`} />
                            </Button>

                            {showImportMenu && (
                                <div className="import-select-menu">
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
                        </div>

                        {/* New button */}
                        <Button variant="primary" onClick={handleCreateMetamodel}>
                            + New
                        </Button>
                    </div>
                </div>

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
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">MODELS</h2>
                    <div className="new-model-button-wrapper" ref={metamodelMenuRef}>
                        <Button
                            variant="primary"
                            disabled={metamodels.length === 0}
                            title={metamodels.length === 0 ? 'Create a metamodel first' : 'Create new model'}
                            onClick={handleNewModelClick}
                        >
                            + New
                            {metamodels.length > 1 && (
                                <i className={`bi bi-chevron-${showMetamodelMenu ? 'up' : 'down'} btn-chevron`} />
                            )}
                        </Button>

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

            {/* Environment Generation Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">
                        ENVIRONMENT GENERATION {envGenConfigs.length > 0 && `(${envGenConfigs.length})`}
                    </h2>
                    <Button
                        variant="primary"
                        disabled={metamodels.length === 0}
                        title={metamodels.length === 0 ? 'Create a metamodel first' : 'Generate new environment'}
                        onClick={() => { setEditingEnvGenId(undefined); setShowEnvGenWizard(true); }}
                    >
                        + New
                    </Button>
                </div>

                {envGenConfigs.length === 0 ? (
                    <EmptyState
                        icon="bi-box-seam"
                        title="No environments generated yet"
                        description="Generate standalone modeling environments from your metamodels with AI-assisted prompt generation."
                    />
                ) : (
                    <div className="list-card">
                        {envGenConfigs.map((cfg) => (
                            <div
                                className="list-card__item"
                                key={cfg.id}
                                onClick={() => { setEditingEnvGenId(cfg.id); setShowEnvGenWizard(true); }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setEditingEnvGenId(cfg.id);
                                        setShowEnvGenWizard(true);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="list-card__icon list-card__icon--envgen">
                                    <i className="bi bi-box-seam" />
                                </span>
                                <div className="list-card__content">
                                    <div className="list-card__name">{cfg.name || 'Untitled'}</div>
                                    <div className="list-card__type">
                                        {cfg.techStackSummary} {cfg.metamodelName ? `· ${cfg.metamodelName}` : ''}
                                    </div>
                                </div>
                                <Badge category={cfg.status === 'ready' ? 'version' : 'state'} className={cfg.status === 'generating' ? 'envgen-pulse' : ''}>
                                    {cfg.status === 'ready' ? 'Ready' : cfg.status === 'generating' ? 'Generating...' : 'Draft'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transformations Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">
                        TRANSFORMATIONS {transformations.length > 0 && `(${transformations.length})`}
                    </h2>
                    <Button
                        variant="primary"
                        onClick={() => setShowNewTransformationDialog(true)}
                    >
                        + New
                    </Button>
                </div>

                {transformations.length === 0 ? (
                    <EmptyState
                        icon="bi-arrow-left-right"
                        title="No transformations yet"
                        description="Create model-to-model transformations using JjTL to automate conversions between metamodels."
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
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">
                        VIEWPOINTS {viewpoints.length > 0 && `(${viewpoints.length})`}
                    </h2>
                    <Button variant="secondary" disabled>
                        + Add
                    </Button>
                </div>

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
                            return (
                                <div className="list-card__item" key={vp.id || vp.name}>
                                    <span className="list-card__icon list-card__icon--vp">V</span>
                                    <div className="list-card__content">
                                        <div className="list-card__name">{vp.name || 'Unnamed'}</div>
                                        <div className="list-card__type">
                                            {vp.isOverlay ? 'Overlay Viewpoint' : 'Viewpoint'}
                                        </div>
                                    </div>
                                    <div className="list-card__actions">
                                        <button className="icon-btn" title="View" disabled>
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
            <DocumentationSection project={project} />

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
                                sum + (o.referenceFeatures?.length ?? 0), 0),
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
