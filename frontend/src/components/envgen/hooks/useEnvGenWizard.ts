import { useState, useCallback, useMemo } from 'react';
import {
    EnvGenStepId,
    STEP_ORDER,
    EnvGenGeneral,
    EnvGenTechStack,
    EnvGenDesign,
    EnvGenFeatures,
    EnvGenOutput,
    ConcreteSyntaxEntry,
    EnvGenConfig,
    MetamodelInfo,
    DEFAULT_GENERAL,
    DEFAULT_TECH_STACK,
    DEFAULT_DESIGN,
    DEFAULT_FEATURES,
    DEFAULT_OUTPUT,
} from '../types';
import { EnvGenPersistence } from '../services/EnvGenPersistence';
import { buildPrompt } from '../services/EnvGenPromptBuilder';
import { extractMetamodelInfo, extractMetamodelMarkdown } from '../services/EnvGenMetamodelExtractor';

function generateId(): string {
    return 'envgen_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export interface MetamodelOption {
    id: string;
    name: string;
}

export function useEnvGenWizard(
    metamodels: MetamodelOption[],
    existingConfigId?: string
) {
    // Load existing config if editing
    const existingConfig = existingConfigId ? EnvGenPersistence.getById(existingConfigId) : null;

    const [configId] = useState(() => existingConfig?.id || generateId());
    const [currentStep, setCurrentStep] = useState<EnvGenStepId>('general');

    // Step data
    const [general, setGeneralState] = useState<EnvGenGeneral>(existingConfig?.general || { ...DEFAULT_GENERAL });
    const [techStack, setTechStackState] = useState<EnvGenTechStack>(existingConfig?.techStack || { ...DEFAULT_TECH_STACK });
    const [design, setDesignState] = useState<EnvGenDesign>(existingConfig?.design || { ...DEFAULT_DESIGN });
    const [features, setFeaturesState] = useState<EnvGenFeatures>(existingConfig?.features || { ...DEFAULT_FEATURES });
    const [concreteSyntax, setConcreteSyntax] = useState<ConcreteSyntaxEntry[]>(existingConfig?.concreteSyntax || [
        { id: 'default', name: 'Default', isDefault: true, preset: 'uml', description: '', imageDataUrl: null },
    ]);
    const [output, setOutputState] = useState<EnvGenOutput>(existingConfig?.output || { ...DEFAULT_OUTPUT });

    const currentStepIndex = STEP_ORDER.indexOf(currentStep);
    const canGoBack = currentStepIndex > 0;
    const canGoNext = currentStepIndex < STEP_ORDER.length - 1;
    const isLastStep = currentStepIndex === STEP_ORDER.length - 1;

    const goNext = useCallback(() => {
        if (canGoNext) setCurrentStep(STEP_ORDER[currentStepIndex + 1]);
    }, [canGoNext, currentStepIndex]);

    const goBack = useCallback(() => {
        if (canGoBack) setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    }, [canGoBack, currentStepIndex]);

    const setStep = useCallback((step: EnvGenStepId) => {
        setCurrentStep(step);
    }, []);

    const setGeneral = useCallback((patch: Partial<EnvGenGeneral>) => {
        setGeneralState(prev => ({ ...prev, ...patch }));
    }, []);

    const setTechStack = useCallback((patch: Partial<EnvGenTechStack>) => {
        setTechStackState(prev => ({ ...prev, ...patch }));
    }, []);

    const setDesign = useCallback((patch: Partial<EnvGenDesign>) => {
        setDesignState(prev => ({ ...prev, ...patch }));
    }, []);

    const setFeatures = useCallback((patch: Partial<EnvGenFeatures>) => {
        setFeaturesState(prev => ({ ...prev, ...patch }));
    }, []);

    const setOutput = useCallback((patch: Partial<EnvGenOutput>) => {
        setOutputState(prev => ({ ...prev, ...patch }));
    }, []);

    // Metamodel info (for info box in General step)
    const metamodelInfo: MetamodelInfo | null = useMemo(() => {
        if (!general.metamodelId) return null;
        try {
            return extractMetamodelInfo(general.metamodelId);
        } catch {
            return null;
        }
    }, [general.metamodelId]);

    // Validation
    const stepErrors = useMemo((): Record<EnvGenStepId, string[]> => {
        const errors: Record<EnvGenStepId, string[]> = {
            'general': [],
            'tech-stack': [],
            'design': [],
            'features': [],
            'concrete-syntax': [],
            'output': [],
        };
        if (!general.name.trim()) errors['general'].push('Environment name is required');
        if (!general.metamodelId) errors['general'].push('Source metamodel is required');
        return errors;
    }, [general]);

    const validateCurrentStep = useCallback((): boolean => {
        return stepErrors[currentStep].length === 0;
    }, [stepErrors, currentStep]);

    // Build config object
    const buildConfig = useCallback((): EnvGenConfig => ({
        id: configId,
        general,
        techStack,
        design,
        features,
        concreteSyntax,
        output,
        status: 'draft',
        createdAt: existingConfig?.createdAt || Date.now(),
        updatedAt: Date.now(),
    }), [configId, general, techStack, design, features, concreteSyntax, output, existingConfig]);

    // Save
    const saveConfig = useCallback(() => {
        const config = buildConfig();
        EnvGenPersistence.save(config);
        return config;
    }, [buildConfig]);

    // Generate prompt text
    const generatePrompt = useCallback((): string => {
        const config = buildConfig();
        const mmMarkdown = general.metamodelId ? extractMetamodelMarkdown(general.metamodelId) : '';
        return buildPrompt(config, mmMarkdown);
    }, [buildConfig, general.metamodelId]);

    // Export prompt as .md file
    const exportPromptFile = useCallback(() => {
        const promptText = generatePrompt();
        const blob = new Blob([promptText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${general.name || 'environment'}-prompt.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update status to ready and save
        const config = buildConfig();
        config.status = 'ready';
        EnvGenPersistence.save(config);
    }, [generatePrompt, general.name, buildConfig]);

    // Prompt preview (for Output step)
    const promptPreview = useMemo((): string => {
        const enabledCount = Object.values(features).filter(Boolean).length;
        const frameworkLabel = general.name || 'Untitled';
        const mmName = metamodels.find(m => m.id === general.metamodelId)?.name || 'None';
        const syntaxCount = concreteSyntax.length;

        const techLabel = [
            techStack.framework, techStack.uiLibrary, techStack.buildTool,
        ].filter(Boolean).join(' · ');

        return [
            '## LAYER 1: General Architecture',
            `Technology: ${techLabel}`,
            `Theme: ${design.theme} · Accent: ${design.accentColor}`,
            `Features: ${enabledCount} enabled`,
            '',
            '## LAYER 2: Domain-Specific',
            `Metamodel: ${mmName}`,
            `Syntaxes: ${syntaxCount} defined`,
            '',
            '## LAYER 3: Adjustments',
            'No adjustments yet.',
        ].join('\n');
    }, [general, techStack, design, features, concreteSyntax, metamodels]);

    const reset = useCallback(() => {
        setGeneralState({ ...DEFAULT_GENERAL });
        setTechStackState({ ...DEFAULT_TECH_STACK });
        setDesignState({ ...DEFAULT_DESIGN });
        setFeaturesState({ ...DEFAULT_FEATURES });
        setConcreteSyntax([
            { id: 'default', name: 'Default', isDefault: true, preset: 'uml', description: '', imageDataUrl: null },
        ]);
        setOutputState({ ...DEFAULT_OUTPUT });
        setCurrentStep('general');
    }, []);

    return {
        currentStep,
        currentStepIndex,
        setStep,
        goNext,
        goBack,
        canGoNext,
        canGoBack,
        isLastStep,
        general,
        setGeneral,
        techStack,
        setTechStack,
        design,
        setDesign,
        features,
        setFeatures,
        concreteSyntax,
        setConcreteSyntax,
        output,
        setOutput,
        metamodelInfo,
        stepErrors,
        validateCurrentStep,
        saveConfig,
        generatePrompt,
        exportPromptFile,
        promptPreview,
        reset,
    };
}
