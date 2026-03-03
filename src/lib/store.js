import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultInitialSlides = [
    {
        type: 'cover',
        title: "NEXT-GEN INNOVATION STRATEGY",
        subtitle: "Premium Design Framework for Modern Business Systems & Scalable Architecture",
        theme: { bg: '#0f172a', text: '#ffffff', accent: '#3b82f6' },
        layoutStyle: 'premium-cover-spoke',
        layoutProps: { headerBadge: 'CONFIDENTIAL', themeMode: 'dark' },
        designRationale: '청중의 신뢰를 얻기 위해 신뢰감 있는 딥블루 색상과 엣지 있는 스포크 그래픽을 사용했습니다.'
    },
    {
        type: 'index',
        title: 'STRATEGIC CONTENTS',
        content: '01. Executive Summary & Core Objectives\n02. Global Market Landscape Analysis (2024-2025)\n03. Strategic Growth Roadmap & Implementation\n04. Resource Optimization & Budget Allocation\n05. Expected Outcome, Risk Mitigation & KPIs',
        theme: { bg: '#ffffff', text: '#000000', accent: '#000000' },
        layoutStyle: 'premium-agenda-spoke',
        designRationale: '정보의 체계적인 전달을 위해 깔끔한 화이트 배경과 타이포그래피 중심의 레이아웃을 채택했습니다.'
    },
    {
        type: 'divider',
        title: '01. MARKET VISION',
        subtitle: "Defining the Future of Digital Innovation",
        theme: { bg: '#DBD7CA', text: '#000000', accent: '#000000' },
        layoutStyle: 'premium-section-spoke',
        designRationale: '섹션의 시작을 알리는 강렬한 베이지톤 배경과 정갈한 스포크 그래픽을 적용했습니다.'
    },
    {
        type: 'body1',
        title: 'GLOBAL MARKET TREND ANALYSIS',
        content: 'The global digital landscape is shifting towards data-driven AI integration. Companies that adopt early benefit from 30% higher productivity. \n\nOur proposal focuses on maximizing this transition through localized strategies and robust implementation frameworks that ensure long-term scalability and market dominance. Key metrics include user engagement growth of 45% and reduced operational overhead by 20% through automated workflows.',
        theme: { bg: '#ffffff', text: '#000000', accent: '#3b82f6' },
        layoutStyle: 'modern-editorial',
        layoutProps: { headerBadge: 'MARKET ANALYSIS', accentNote: 'Competitive Advantage through AI Persistence' },
        designRationale: '고밀도 텍스트를 담아내기 위해 고안된 잡지 스타일의 에디토리얼 레이아웃입니다.'
    },
    {
        type: 'body2',
        title: 'CORE COMPETENCY & SOLUTION',
        content: 'We provide a comprehensive end-to-end solution that bridges the gap between technical complexity and business value. Our unique approach utilizes adaptive machine learning models that evolve with your data.\n\nKey features include real-time sentiment analysis, predictive predictive maintenance modules, and a fully customizable dashboard. This ensures that stakeholders have visibility into every stage of the project lifecycle, from initial research to final deployment.',
        theme: { bg: '#ffffff', text: '#000000', accent: '#10b981' },
        layoutStyle: 'modern-editorial',
        layoutProps: { headerBadge: 'SOLUTION OVERVIEW', accentNote: 'Seamless Integration & Scalability' },
        designRationale: '비즈니스 가치를 강조하기 위해 차분한 배경과 고대비 타이포그래피를 활용했습니다.'
    }
];

export const usePresentationStore = create(
    persist(
        (set) => ({
            // --- Data State ---
            projectName: "New Presentation",
            generatedSlides: defaultInitialSlides,
            designStrategy: "전문적인 제안서를 위한 프리미엄 에디토리얼 디자인 전략",
            apiKey: "",
            googleAccessToken: null, // Google OAuth Token

            // --- Collaboration & Agent State (Firebase/Antigravity) ---
            isSyncing: false,
            activeAgentRole: null, // 'planner' (Pro) | 'refiner' (Flash) | 'designer' (Nano-Banana)

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
            setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
            setProjectName: (name) => set({ projectName: name }),
            setGeneratedSlides: (slides) => set({ generatedSlides: slides }),
            setDesignStrategy: (strategy) => set({ designStrategy: strategy }),
            setActiveAgentRole: (role) => set({ activeAgentRole: role }),
            setCurrentView: (view) => set({ currentView: view }),
            setTheme: (theme) => set({ theme }),
            setRatio: (ratio) => set({ ratio }),
            setCurrentSlideType: (type) => set({ currentSlideType: type }),
            setIsGeneratingAI: (status) => set({ isGeneratingAI: status }),

            addHistoryItem: (item) => set((state) => ({
                historyItems: [item, ...state.historyItems]
            })),

            clearHistory: () => set({ historyItems: [] }),

            resetPresentation: () => set({
                generatedSlides: defaultInitialSlides,
                projectName: "New Presentation",
                designStrategy: "전문적인 제안서를 위한 프리미엄 에디토리얼 디자인 전략"
            }),
        }),
        {
            name: 'gd-maker-storage',
            partialize: (state) => ({
                apiKey: state.apiKey,
                googleAccessToken: state.googleAccessToken,
                historyItems: state.historyItems,
                theme: state.theme
            }),
        }
    )
);
