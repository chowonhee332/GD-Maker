import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Material 3 Demo Fallback Data for Presentation
const defaultPremiumSlides = [
    {
        type: 'cover',
        title: 'Project Ignite: Q3 Strategy',
        subtitle: 'Accelerating Growth with Material You',
        content: 'A comprehensive overview of our product roadmap, design integration, and business milestones for the upcoming quarter.',
        theme: { bg: '#EADDFF', text: '#21005D', accent: '#6750A4', cardBg: '#FFFFFF' },
        layoutStyle: 'cover-premium',
        icon: 'sparkles',
        designRationale: 'Using Google Material 3 (M3) Primary Purple container with dark text for a friendly, modern, and accessible introduction.'
    },
    {
        type: 'index',
        title: 'Agenda',
        content: '1. Executive Summary\n2. User Experience Updates\n3. Core Technology Stack\n4. Strategic Roadmap\n5. Investment Opportunities',
        theme: { bg: '#FEFBFA', text: '#1C1B1F', accent: '#0B57D0', cardBg: '#FFFFFF' },
        designRationale: 'M3 Surface colors (Light/Neutral) combined with the primary Google Blue to maintain high contrast and clear information hierarchy.'
    },
    {
        type: 'divider',
        title: 'Part 1',
        subtitle: 'User Experience & Research',
        theme: { bg: '#FEFBFA', text: '#FFFFFF', accent: '#0B57D0', cardBg: '#FFFFFF' },
        designRationale: 'Solid Blue (M3 Primary) background provides a strong visual break to refocus audience attention before diving into details.'
    },
    {
        type: 'body1',
        title: 'Growth Trajectory',
        content: 'Our new design system has demonstrated a sustained engagement increase of 75% across all platforms. The resulting user satisfaction allows us to scale operations dramatically.',
        theme: { bg: '#F3F4F9', text: '#1C1B1F', accent: '#0B57D0', cardBg: '#FFFFFF' },
        layoutStyle: 'bento',
        chartData: [
            { name: "Engagement", value: "+75%" },
            { name: "Task Success", value: "94%" },
            { name: "Bounce Rate", value: "-22%" }
        ],
        designRationale: 'M3 elevated cards (Surface Container Lowest) on a slightly darker background (Surface Container Low) create a clean Bento Grid.'
    },
    {
        type: 'body2',
        title: 'Modern Architecture',
        content: 'Integrating Material You dynamic colors reduces design debt by a factor of 10. Our new UI components perfectly adapt to user preferences and accessibility needs.',
        theme: { bg: '#C2E7FF', text: '#001D35', accent: '#00639B', cardBg: '#FFFFFF' },
        layoutStyle: 'showcase',
        visualElement: 'A clean, abstract geometric composition representing interconnected components.',
        backgroundImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        designRationale: 'Split showcase layout combines high-fidelity imagery with M3 Secondary/Tertiary color palettes for a vibrant finish.'
    }
];

export const usePresentationStore = create(
    persist(
        (set) => ({
            // --- Data State ---
            projectName: "Project Ignite",
            generatedSlides: defaultPremiumSlides,
            designStrategy: "Clean, accessible, and vibrant Material Design 3 styling utilizing dynamic pastel backgrounds and pill-shaped elements.",
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
                generatedSlides: defaultPremiumSlides,
                projectName: "Project Ignite",
                designStrategy: "Clean, accessible, and vibrant Material Design 3 styling utilizing dynamic pastel backgrounds and pill-shaped elements."
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
