import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePresentationStore = create(
    persist(
        (set) => ({
            // --- Data State ---
            projectName: "New Presentation",
            generatedSlides: [],
            designStrategy: "",
            apiKey: "",

            // --- UI State ---
            currentView: 'dashboard', // 'dashboard', 'builder', 'presenter'
            theme: 'light',
            ratio: '16:9',
            currentSlideType: 'cover',
            isGeneratingAI: false,

            // --- History ---
            historyItems: [],

            // --- Actions ---
            setApiKey: (key) => set({ apiKey: key }),
            setProjectName: (name) => set({ projectName: name }),
            setGeneratedSlides: (slides) => set({ generatedSlides: slides }),
            setDesignStrategy: (strategy) => set({ designStrategy: strategy }),
            setCurrentView: (view) => set({ currentView: view }),
            setTheme: (theme) => set({ theme }),
            setRatio: (ratio) => set({ ratio }),
            setCurrentSlideType: (type) => set({ currentSlideType: type }),
            setIsGeneratingAI: (status) => set({ isGeneratingAI: status }),

            addHistoryItem: (item) => set((state) => ({
                historyItems: [item, ...state.historyItems]
            })),

            resetPresentation: () => set({
                generatedSlides: [],
                projectName: "New Presentation",
                designStrategy: ""
            }),
        }),
        {
            name: 'gd-maker-storage',
            partialize: (state) => ({
                apiKey: state.apiKey,
                historyItems: state.historyItems,
                theme: state.theme
            }),
        }
    )
);
