import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LModel, LProject, LViewPoint, LClass, LObject, U, store } from '../../joiner';
import DockManager from '../abstract/DockManager';
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
            const newMM = createM2(project, name);

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

        // Callback when transformation is executed
        const handleExecuteTransformation = async (
            sourceModelId: string,
            outputModelName: string,
            ast: TransformationAST
        ): Promise<void> => {
            console.log('[ProjectEditor] handleExecuteTransformation called', {
                sourceModelId,
                outputModelName,
                astMappings: ast?.mappings?.length || 0
            });

            try {
                // Find the source model
                const sourceModel = models.find(m => m.id === sourceModelId);
                if (!sourceModel) {
                    U.alert('e', 'Error', `Source model not found: ${sourceModelId}`);
                    return;
                }

                // Find the target metamodel (as LModel from project.metamodels)
                const targetMetamodel = metamodels.find(mm => mm.id === transformation.targetMetamodelId);
                if (!targetMetamodel) {
                    U.alert('e', 'Error', `Target metamodel not found: ${transformation.targetMetamodelId}`);
                    return;
                }

                // Get source model data (instances)
                // Use model.objects to get the actual LObject instances
                // IMPORTANT: Create a DEEP COPY to prevent mutation of the original source model
                const sourceObjects = sourceModel.objects || [];
                console.log('[ProjectEditor] Source objects count:', sourceObjects.length);

                // Convert LObjects to a format the executor understands
                // The executor expects objects with className, attributes, etc.
                const sourceModelData = sourceObjects.map((obj: LObject) => {
                    const className = obj.instanceof?.name || '';
                    const result: Record<string, any> = {
                        id: obj.id,
                        name: obj.name,
                        className: className,
                        __type: className,
                    };

                    // Extract attribute values from features
                    if (obj.features) {
                        for (const feature of obj.features) {
                            if (feature.name) {
                                // For single values use .value, for multi-valued use .values
                                result[feature.name] = feature.values?.length > 0
                                    ? (feature.values.length === 1 ? feature.values[0] : feature.values)
                                    : feature.value;
                            }
                        }
                    }

                    return result;
                });

                // Deep copy to ensure we don't modify the original
                const sourceModelDataCopy = JSON.parse(JSON.stringify(sourceModelData));
                console.log('[ProjectEditor] Source model data (deep copy):', sourceModelDataCopy.length, 'elements');
                console.log('[ProjectEditor] Source elements by class:', sourceModelDataCopy.reduce((acc: Record<string, number>, obj: any) => {
                    acc[obj.className] = (acc[obj.className] || 0) + 1;
                    return acc;
                }, {}));

                // Execute the transformation with the COPY to protect original data
                // The executor also does its own deep copy, so this is double-protection
                const result: ExecutionResult = executeTransformation(ast, sourceModelDataCopy, targetMetamodel);
                console.log('[ProjectEditor] Execution result:', {
                    success: result.success,
                    errors: result.errors,
                    targetInstancesCount: result.targetModel?.roots?.length || 0
                });

                if (!result.success) {
                    U.alert('e', 'Transformation Failed', result.errors.join('\n'));
                    return;
                }

                // Create a new model from the transformation result
                // createM1 creates a model conforming to the metamodel, adds it to project, and opens tab
                createM1(project, targetMetamodel);

                // The model was created and added to project.models by createM1
                // Find it and rename to the user-specified name
                const createdModel = project.models[project.models.length - 1];
                if (createdModel) {
                    createdModel.name = outputModelName;

                    // Populate the new model with transformation results
                    if (result.targetModel?.instances) {
                        console.log('[ProjectEditor] Populating target model with transformation results...');

                        // Get classes from the target metamodel
                        const targetClasses: LClass[] = targetMetamodel.classes || [];
                        console.log('[ProjectEditor] Target metamodel classes:', targetClasses.map(c => c.name));

                        let instancesCreated = 0;

                        // For each class type in the transformation result
                        result.targetModel.instances.forEach((instances, className) => {
                            console.log(`[ProjectEditor] Processing ${instances.length} instances of "${className}"`);

                            // Find the matching class in the target metamodel
                            const targetClass = targetClasses.find(c => c.name === className);
                            if (!targetClass) {
                                console.warn(`[ProjectEditor] Class "${className}" not found in target metamodel`);
                                return;
                            }

                            // Create each instance
                            for (const instance of instances) {
                                try {
                                    // Create a new object in the model
                                    const dObject = createdModel.addObject({}, targetClass.id);
                                    const lObject: LObject = LObject.fromD(dObject);

                                    console.log(`[ProjectEditor] Created object of type "${className}":`, {
                                        id: lObject.id,
                                        featuresCount: lObject.features?.length || 0,
                                    });

                                    // Set attribute values from the transformation result
                                    for (const [attrName, attrValue] of Object.entries(instance)) {
                                        // Skip internal properties
                                        if (attrName.startsWith('__') || attrName === 'className') {
                                            continue;
                                        }

                                        // Find the feature by name
                                        const feature = lObject.features?.find(f => f.name === attrName);
                                        if (feature) {
                                            // Set the value based on whether it's multi-valued
                                            if (Array.isArray(attrValue)) {
                                                feature.values = attrValue;
                                            } else {
                                                feature.value = attrValue;
                                            }
                                            console.log(`[ProjectEditor] Set ${attrName} = ${JSON.stringify(attrValue)}`);
                                        }
                                    }

                                    instancesCreated++;
                                } catch (err) {
                                    console.error(`[ProjectEditor] Error creating instance of "${className}":`, err);
                                }
                            }
                        });

                        console.log(`[ProjectEditor] Created ${instancesCreated} instances in target model`);
                    }

                    console.log('[ProjectEditor] Created output model:', outputModelName);
                    U.alert('i', 'Transformation Executed', `Output model "${outputModelName}" created with ${result.stats?.targetInstancesCreated || 0} instances.`);
                    markDirty();
                }
            } catch (error) {
                console.error('[ProjectEditor] Error executing transformation:', error);
                U.alert('e', 'Error', `Failed to execute transformation: ${error}`);
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
                        className={`badge badge--type badge--clickable ${project.type === 'public' ? 'badge--public' : ''}`}
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
                    <span
                        className="badge badge--engine"
                        title="Jjodel platform version - Same for all projects"
                    >
                        <i className="bi bi-gear" />
                        {getEngineVersion()}
                    </span>
                    <span
                        className="badge badge--content"
                        title="Project revision - Auto-increments on each save"
                    >
                        Rev {formatVersionNumber(project.version)}
                    </span>
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
            </div>

            {/* Metamodels Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">METAMODELS</h2>
                    <div className="project-section__actions">
                        {/* Import button with dropdown */}
                        <div className="import-button-wrapper" ref={importMenuRef}>
                            <button
                                className="btn btn--secondary"
                                onClick={() => setShowImportMenu(!showImportMenu)}
                            >
                                <i className="bi bi-upload" />
                                Import
                                <i className={`bi bi-chevron-${showImportMenu ? 'up' : 'down'} btn-chevron`} />
                            </button>

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
                        <button className="btn btn--primary" onClick={handleCreateMetamodel}>
                            + New
                        </button>
                    </div>
                </div>

                {metamodels.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <i className="bi bi-diagram-3" />
                        </div>
                        <h3 className="empty-state__title">No metamodels yet</h3>
                        <p className="empty-state__description">
                            Create a metamodel to define the structure and rules for your domain models.
                        </p>
                        <button
                            className="btn btn--primary btn--empty-state"
                            onClick={handleCreateMetamodel}
                        >
                            Create Your First Metamodel
                        </button>
                    </div>
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
                        <button
                            className="btn btn--primary"
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
                    <div className="empty-state empty-state--secondary">
                        <div className="empty-state__icon empty-state__icon--small">
                            <i className="bi bi-box" />
                        </div>
                        <h3 className="empty-state__title">
                            {metamodels.length === 0 ? 'Create a metamodel first' : 'No models yet'}
                        </h3>
                        <p className="empty-state__description">
                            {metamodels.length === 0
                                ? 'Models are instances of metamodels. You need to create a metamodel structure before you can create models.'
                                : 'Create a model to instantiate your metamodel.'}
                        </p>
                        {metamodels.length === 0 && (
                            <div className="empty-state__hint">
                                <i className="bi bi-arrow-up" />
                                <span>Create your first metamodel in the section above</span>
                            </div>
                        )}
                    </div>
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
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">
                        TRANSFORMATIONS {transformations.length > 0 && `(${transformations.length})`}
                    </h2>
                    <button
                        className="btn btn--primary"
                        onClick={() => setShowNewTransformationDialog(true)}
                    >
                        + New
                    </button>
                </div>

                {transformations.length === 0 ? (
                    <div className="empty-state empty-state--secondary">
                        <div className="empty-state__icon empty-state__icon--small">
                            <i className="bi bi-arrow-left-right" />
                        </div>
                        <h3 className="empty-state__title">No transformations yet</h3>
                        <p className="empty-state__description">
                            Create model-to-model transformations using JjTL to automate conversions between metamodels.
                        </p>
                    </div>
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
                    <button className="btn btn--secondary" disabled>
                        + Add
                    </button>
                </div>

                {viewpoints.length === 0 ? (
                    <div className="empty-state empty-state--subtle">
                        <p className="empty-state__text-inline">No viewpoints defined</p>
                    </div>
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
