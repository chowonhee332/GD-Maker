import React, { useState, useRef, useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Monitor,
  Square,
  Palette,
  Upload,
  Download,
  Layout as LayoutIcon,
  FileText,
  ChevronRight,
  Settings,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Undo2,
  Redo2,
  HelpCircle,
  MoreVertical,
  Share2,
  Info,
  Users,
  Target,
  MessageSquare,
  Clock,
  ChevronDown,
  Key,
  Sun,
  Moon,
  X,
  TrendingUp,
  Plus,
  Home,
  Wand2,
  Send,
  Search,
  MessageCircle,
  Star,
  ChevronLeft,
  RotateCw,
  Menu,
  LayoutGrid,
  Library,
  Play
} from 'lucide-react';

import { usePresentationStore } from '@/lib/store';

import Dashboard from "@/components/Dashboard";
import ApiKeyDialog from "@/components/ApiKeyDialog";
import VisualSidebar from "@/components/VisualSidebar";
import PremiumSlideCanvas from "@/components/PremiumSlideCanvas";
import { TEMPLATES } from '@/lib/templates';
import { initGemini, generatePresentationContent, refinePresentationContent, editVisualAsset, generateVisualAsset, generateSlideImage } from '@/lib/gemini';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

/**
 * --- External Library: PptxGenJS Loader ---
 */
const loadPptxGenJS = () => {
  return new Promise((resolve, reject) => {
    if (window.PptxGenJS) return resolve(window.PptxGenJS);
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
    script.onload = () => resolve(window.PptxGenJS);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

import html2canvas from 'html2canvas';

const SLIDE_TYPES = ['cover', 'index', 'divider', 'body1', 'body2', 'icons', 'resources'];

const LoadingOverlay = () => (
  <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
    <div className="flex flex-col items-center gap-6 p-12 bg-card border rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 pointer-events-none" />
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-xl font-bold tracking-tight">AI가 슬라이드를 생성하고 있습니다</h3>
        <p className="text-sm text-muted-foreground font-medium">
          프리미엄 디자인을 적용하고 내용을 구성 중입니다.<br />
          잠시만 기다려주세요...
        </p>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-progress origin-left" style={{ width: '100%', animation: 'progress 2s ease-in-out infinite' }} />
      </div>
    </div>
  </div>
);

const App = () => {
  const {
    projectName, setProjectName,
    generatedSlides, setGeneratedSlides,
    designStrategy, setDesignStrategy,
    apiKey, setApiKey,
    currentView, setCurrentView,
    theme, setTheme,
    ratio, setRatio,
    currentSlideType, setCurrentSlideType,
    isGeneratingAI, setIsGeneratingAI,
    historyItems, addHistoryItem, clearHistory
  } = usePresentationStore();

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showVisualPanel, setShowVisualPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [editChatPrompt, setEditChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: '안녕하세요! 발표 자료 생성을 도와드릴 Gemini 기반 에이전트입니다. 어떤 대화를 나눠볼까요?' }
  ]);
  const [referenceImages, setReferenceImages] = useState([]);
  const [canvasAssets, setCanvasAssets] = useState([]);

  // --- Brand & Character Assets ---
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [clientLogoFile, setClientLogoFile] = useState(null);
  const [clientLogoPreview, setClientLogoPreview] = useState(null);
  const [characterFile, setCharacterFile] = useState(null);
  const [characterPreview, setCharacterPreview] = useState(null);
  const [slideImages, setSlideImages] = useState({
    cover: null,
    index: null,
    divider: null,
    body1: null,
    body2: null
  });
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(true); // Default open for visibility

  // --- Contextual Editing State ---
  const [attachedAssets, setAttachedAssets] = useState([]); // Array of { type: 'slide' | 'asset', data: ..., preview: ... }
  const [pendingAutoRefineAsset, setPendingAutoRefineAsset] = useState(null);

  // --- Creon Panel State ---
  const [panelWidth, setPanelWidth] = useState(384); // Default 96 * 4 = 384px
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  // --- Refs ---
  const workspaceRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const slideRefs = useRef({});
  const logoInputRef = useRef(null);
  const clientLogoInputRef = useRef(null);
  const charInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [scale, setScale] = useState(0.8);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isRefining]);

  // Initial Dummy Data Load if empty
  useEffect(() => {
    if (generatedSlides.length === 0) {
      const initialSlides = [
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
      setGeneratedSlides(initialSlides);
    }
  }, []);

  // Initialize scale on mount or view change
  useEffect(() => {
    if (currentView === 'builder') {
      const updateScale = () => {
        if (workspaceRef.current) {
          const { clientWidth, clientHeight } = workspaceRef.current;
          const slideW = 800;
          const slideH = (slideW * 9) / 16;
          // Scale based on available space - reduce if panels are open
          const scaleW = (clientWidth * 0.85) / slideW;
          const scaleH = (clientHeight * 0.75) / slideH;
          setScale(Math.min(scaleW, scaleH, 1));
        }
      };
      window.addEventListener('resize', updateScale);
      setTimeout(updateScale, 100);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [currentView, showHistory, showVisualPanel]); // Also update scale when panels toggle

  // Listen for messages from Visual Studio (Creon)
  useEffect(() => {
    const handleVisualMessage = (event) => {
      try {
        const data = event.data;
        if (data && data.type === 'ASSET_SELECTED') {
          // Add to Canvas (Existing Logic)
          const newAsset = {
            id: Date.now(),
            type: data.assetType || 'image',
            url: data.assetUrl,
            x: '50%',
            y: '50%',
            width: data.assetType === 'icon' ? 60 : 200,
            height: data.assetType === 'icon' ? 60 : 150
          };
          setCanvasAssets(prev => [...prev, newAsset]);

          // NEW: Append to Chat Context (Multiple Assets)
          const contextItem = {
            id: Date.now(),
            type: 'asset',
            data: { url: data.assetUrl, type: data.assetType || 'image' },
            preview: data.assetUrl
          };
          setAttachedAssets(prev => [...prev, contextItem]);

          // Trigger Auto-Regeneration
          setPendingAutoRefineAsset(contextItem.data);

          toast.success("에셋이 첨부되었습니다.", {
            description: "새로운 이미지의 분위기를 읽어 레이아웃과 내용을 자동 최적화합니다.",
            duration: 3000
          });
        }
      } catch (e) { }
    };
    window.addEventListener('message', handleVisualMessage);
    return () => window.removeEventListener('message', handleVisualMessage);
  }, []);

  // --- Auto-Regenerate Slide upon Asset Drop ---
  useEffect(() => {
    if (pendingAutoRefineAsset && !isRefining && generatedSlides.length > 0) {
      const autoRefine = async () => {
        const asset = pendingAutoRefineAsset;
        setPendingAutoRefineAsset(null); // Clear it

        const targetSlide = currentSlideType || 'cover';

        toast.info("✨ 새로운 에셋 감지! 레이아웃과 내용을 최적화합니다...", { id: "auto-refine", duration: 10000 });
        setIsRefining(true);

        const instructions = `[TARGET_SLIDE: ${targetSlide}]
[AUTO-REGENERATE] A new visual asset has just been dropped onto the current slide.
Please analyze this new image. Rewrite the slide's content, title, and adjust the layout so it perfectly aligns with the new visual context. Make sure it feels like the image and text were designed together.`;

        const visualAssets = [asset];

        try {
          const response = await refinePresentationContent(generatedSlides, instructions, visualAssets);

          let action = 'chat';
          let presentationData = null;

          if (response && response.action) {
            action = response.action;
            presentationData = response.presentation;
          } else if (Array.isArray(response)) {
            action = 'refine';
            presentationData = { slides: response };
          }

          if (action === 'refine' && presentationData) {
            const updatedSlides = presentationData.slides || presentationData;
            if (Array.isArray(updatedSlides)) {
              setGeneratedSlides(updatedSlides);
              toast.success("✨ 슬라이드 자동 최적화 완료!", { id: "auto-refine" });
            }
          } else {
            toast.dismiss("auto-refine");
          }
        } catch (error) {
          console.error("Auto Refine Error:", error);
          toast.error("슬라이드 자동 최적화에 실패했습니다.", { id: "auto-refine" });
        } finally {
          setIsRefining(false);
          // Also clear the attachedAssets array if it was just auto-refined, to avoid polluting future manual chats
          setAttachedAssets(prev => prev.filter(a => a.data.url !== asset.url));
        }
      };

      autoRefine();
    }
  }, [pendingAutoRefineAsset]);

  // --- Resizable Creon Panel Logic ---
  const handlePanelMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingPanel(true);
  };

  useEffect(() => {
    if (!isDraggingPanel) return;

    const handleMouseMove = (e) => {
      // The panel is on the right side. The right menu strip is w-14 (56px).
      // Width = Screen Width - Mouse X - Strip Width
      let newWidth = window.innerWidth - e.clientX - 56;

      // Clamp the width to logical boundaries
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 1200) newWidth = 1200;

      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingPanel(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      toast.success("제안사 로고가 등록되었습니다.");
    }
  };

  const handleClientLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClientLogoFile(file);
      setClientLogoPreview(URL.createObjectURL(file));
      toast.success("고객사 로고가 등록되었습니다.");
    }
  };

  const handleCharUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCharacterFile(file);
      setCharacterPreview(URL.createObjectURL(file));
      toast.success("브랜드 캐릭터가 등록되었습니다.");
    }
  };

  const handleSelectTemplate = (template) => {
    setProjectName(template.name);
    handleGenerateStart(template.name, 5, null, { domain: template.category, primaryColor: template.mainColor }, template.adminReferences?.images || [], template);
  };

  const handleGenerateStart = async (promptText, targetPageCount, attachedFile = null, brandKit = null, referenceImagesList = [], template = null, slidePrompts = null, attachedPdf = null, slideImages = null) => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
      toast.error("Please set your Gemini API Key first");
      return;
    }

    setProjectName(promptText || "New Presentation");
    setIsGeneratingAI(true);
    setCurrentView('builder');
    setReferenceImages(referenceImagesList || []);

    try {
      toast.loading("AI가 프리미엄 슬라이드를 구성하고 있습니다...", { id: "generating" });
      initGemini(apiKey);

      const generationConfig = {
        audience: 'Target Client / Investors',
        purpose: 'Proposal (제안서)',
        tone: brandKit?.style || 'Professional & Persuasive',
        pageCount: targetPageCount,
        industry: brandKit?.industry || brandKit?.domain || 'General',
        subDomain: brandKit?.subDomain,
        primaryColor: brandKit?.primaryColor || '#3b82f6',
        style: brandKit?.style || 'Minimalist',
        logo: brandKit?.logo,
        clientLogo: brandKit?.clientLogo,
        character: brandKit?.character
      };

      const allVisualAssets = [...(referenceImagesList || [])].filter(img => typeof img !== 'string');
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        allVisualAssets.push(attachedFile);
      }
      if (attachedPdf) {
        allVisualAssets.push(attachedPdf);
      }

      // Include slide-specific images with identification
      if (slideImages) {
        for (const [slideId, item] of Object.entries(slideImages)) {
          if (item) {
            if (item instanceof File) {
              item.slideId = slideId;
              allVisualAssets.push(item);
            } else if (typeof item === 'string') {
              // Fetch static template from public/templates/
              try {
                const response = await fetch(item);
                if (response.ok) {
                  const blob = await response.blob();
                  const fileName = item.split('/').pop() || `${slideId}.png`;
                  const file = new File([blob], fileName, { type: blob.type || 'image/png' });
                  file.slideId = slideId;
                  allVisualAssets.push(file);
                }
              } catch (err) {
                console.warn(`[App] Failed to pre-load default template for ${slideId}:`, err);
              }
            }
          }
        }
      }

      // Include uploaded logos as a reference if they exist
      if (logoFile) {
        allVisualAssets.push(logoFile);
      }
      if (clientLogoFile) {
        allVisualAssets.push(clientLogoFile);
      }

      // Include uploaded character as a reference if it exists
      if (characterFile) {
        allVisualAssets.push(characterFile);
      }

      // Extract curated prompts from template or brandKit if available
      const curatedGuidance = template?.adminReferences?.prompts?.join('\n') || "";

      const aiContent = await generatePresentationContent(promptText, generationConfig, allVisualAssets, curatedGuidance, slidePrompts, slideImages);

      if (aiContent && aiContent.slides) {
        // --- NEW: GENERATE FULL SLIDE IMAGES (with TEXT) VIA NANO BANANA ---
        const newImageMap = {};
        toast.loading("Nano Banana Pro가 슬라이드에 텍스트와 디자인을 직접 렌더링하고 있습니다...", { id: "generating" });

        const isDark = theme === 'dark' || aiContent.slides[0]?.layoutProps?.themeMode === 'dark';
        const accent = aiContent.slides[0]?.theme?.accent || '#3B82F6';
        const themeParams = {
          themeMode: isDark ? 'dark' : 'light',
          accentColor: accent
        };

        // Promise.all for parallel generation of all 5 slides
        const generatePromises = aiContent.slides.map(async (slide) => {
          try {
            const refImg = allVisualAssets.find(f => f.slideId === slide.type);
            const asset = await generateSlideImage(slide, themeParams, refImg);

            if (asset && asset.success) {
              newImageMap[slide.type] = asset.dataUrl;
            }
          } catch (err) {
            console.warn(`[App] Full Slide Image generation failed for slide ${slide.type}:`, err);
            toast.error(`Nano Banana Pro 이미지 생성 실패 (${slide.type}): ${err.message}`, { id: `err-${slide.type}` });
          }
        });

        await Promise.all(generatePromises);

        // Global background generation is removed since each slide is now fully rendered.

        // --- FINAL SLIDE ASSEMBLY ---
        const themeToUse = aiContent.slides[0]?.theme || { bg: '#ffffff', text: '#000000', accent: '#3B82F6' };

        const finalSlides = [
          ...aiContent.slides,
          {
            type: 'icons',
            title: 'Use our editable graphic resources...',
            subtitle: 'You can easily resize these resources without losing quality. To change the color, just ungroup the resource.',
            theme: { bg: '#FDFBF4', text: '#1E1B4B', accent: '#7C3AED' },
            layoutStyle: 'resource-icons'
          },
          {
            type: 'resources',
            title: 'Use our editable graphic resources...',
            subtitle: 'You can easily resize these resources without losing quality. To change the color, just ungroup the resource.',
            theme: { bg: '#FDFBF4', text: '#1E1B4B', accent: '#7C3AED' },
            layoutStyle: 'resource-graphics'
          }
        ];

        setSlideImages(newImageMap);
        setGeneratedSlides(finalSlides);
        setProjectName(aiContent.title || promptText);
        setDesignStrategy(aiContent.designStrategy || "");

        const newItem = {
          id: Date.now(),
          title: aiContent.title || promptText,
          date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
          type: 'book',
          slides: finalSlides,
          designStrategy: aiContent.designStrategy || ""
        };
        addHistoryItem(newItem);
        toast.success("슬라이드가 컨셉에 맞춰 완성되었습니다!", { id: "generating" });
      }
    } catch (e) {
      toast.error("AI Generation failed. Using premium design placeholders.", { id: "generating" });

      // Fallback stylized data for verification - Matching Premium Editorial Strategy
      const fallbackSlides = [
        {
          type: 'cover',
          title: promptText || "NEXT-GEN INNOVATION STRATEGY",
          subtitle: "Premium Design Framework for Modern Business Systems & Scalable Architecture",
          theme: { bg: '#0f172a', text: '#ffffff', accent: '#3b82f6' },
          layoutStyle: 'premium-cover-spoke',
          layoutProps: { headerBadge: 'CONFIDENTIAL' },
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
          content: 'We provide a comprehensive end-to-end solution that bridges the gap between technical complexity and business value. Our unique approach utilizes adaptive machine learning models that evolve with your data.\n\nKey features include real-time sentiment analysis, predictive maintenance modules, and a fully customizable dashboard. This ensures that stakeholders have visibility into every stage of the project lifecycle, from initial research to final deployment.',
          theme: { bg: '#ffffff', text: '#000000', accent: '#10b981' },
          layoutStyle: 'modern-editorial',
          layoutProps: { headerBadge: 'SOLUTION OVERVIEW', accentNote: 'Seamless Integration & Scalability' },
          designRationale: '비즈니스 가치를 강조하기 위해 차분한 배경과 고대비 타이포그래피를 활용했습니다.'
        },
        {
          type: 'icons',
          title: 'Use our editable graphic resources...',
          subtitle: 'You can easily resize these resources without losing quality. To change the color, just ungroup the resource.',
          theme: { bg: '#FDFBF4', text: '#1E1B4B', accent: '#7C3AED' },
          layoutStyle: 'resource-icons'
        },
        {
          type: 'resources',
          title: 'Use our editable graphic resources...',
          subtitle: 'You can easily resize these resources without losing quality. To change the color, just ungroup the resource.',
          theme: { bg: '#FDFBF4', text: '#1E1B4B', accent: '#7C3AED' },
          layoutStyle: 'resource-graphics'
        }
      ];
      setGeneratedSlides(fallbackSlides);
      setDesignStrategy("Clean, accessible, and vibrant Material Design 3 styling utilizing dynamic pastel backgrounds and pill-shaped elements.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleHistoryItemClick = (item) => {
    if (item.slides) {
      setGeneratedSlides(item.slides);
      setProjectName(item.title);
      setDesignStrategy(item.designStrategy || "");
      setCurrentView('builder');
      setShowHistory(false);
      toast.info(`'${item.title}' 작업을 불러왔습니다.`);
    }
  };

  const handleClearHistory = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    toast("모든 작업 내역을 삭제하시겠습니까?", {
      description: "이 작업은 되돌릴 수 없습니다.",
      action: {
        label: "전체 삭제",
        onClick: () => {
          clearHistory();
          toast.success("작업 내역이 모두 삭제되었습니다.");
        },
      },
      cancel: {
        label: "취소",
        onClick: () => { }
      }
    });
  };

  const handleEditChatSubmit = async (e) => {
    e.preventDefault();
    if (!editChatPrompt.trim() || isRefining) return;

    let userMessage = editChatPrompt.trim();

    // NEW: Inject Targeted Slide Context & Multiple Assets
    // Prepend targeting instruction so AI knows which slide to focus on
    const targetSlide = currentSlideType || (attachedAssets.find(a => a.type === 'slide')?.data?.type) || 'current';

    let instructions = `[TARGET_SLIDE: ${targetSlide}] `;
    attachedAssets.filter(a => a.type === 'asset').forEach(asset => {
      instructions += `[USE_ASSET: ${asset.data.url}] `;
    });

    userMessage = instructions + userMessage;

    setChatHistory(prev => [...prev, { role: 'user', content: editChatPrompt.trim() }]);
    setEditChatPrompt("");
    setAttachedAssets([]); // Clear attachments after send
    setIsRefining(true);

    try {
      const visualAssets = [
        ...attachedAssets.filter(a => a.type === 'asset').map(a => a.data),
        ...(logoFile ? [logoFile] : []),
        ...(clientLogoFile ? [clientLogoFile] : []),
        ...(characterFile ? [characterFile] : [])
      ];

      // [NEW] True Background Removal Interceptor
      let finalVisualAssets = visualAssets;
      let preComputedImageState = null;
      const isEditingRequest = /배경\s*(제거|없애|지워)|누끼|투명/i.test(userMessage);

      if (isEditingRequest && visualAssets.length > 0) {
        toast.info("✨ AI가 이미지 배경 보정 및 합성을 수행 중입니다...", { id: "bg-removal" });
        try {
          const targetSlideData = generatedSlides.find(s => s.type === targetSlide) || generatedSlides[0];
          const themeParams = {
            themeMode: targetSlideData.layoutProps?.themeMode || 'dark',
            accentColor: targetSlideData.theme?.accent || '#D1D1C4'
          };

          const editedAsset = await editVisualAsset(visualAssets[0], userMessage, themeParams);

          if (editedAsset.success) {
            preComputedImageState = { [targetSlide]: editedAsset.dataUrl };
            // Pass the newly edited image to the refinement pipeline so it knows the new context
            finalVisualAssets = [{ url: editedAsset.dataUrl }, ...visualAssets.slice(1)];
            toast.success("✨ 배경 제거 및 합성 완료!", { id: "bg-removal" });
          }
        } catch (editErr) {
          console.error("True Editing failed, falling back to layout engine:", editErr);
          toast.error("배경 보정 실패. 일반 모델 레이아웃으로 시도합니다.", { id: "bg-removal" });
        }
      }

      const response = await refinePresentationContent(generatedSlides, userMessage, finalVisualAssets);

      // 방어 코드: 응답이 배열이거나 비어있을 경우에 대한 처리
      let action = 'chat';
      let assistantMessage = '';
      let presentationData = null;

      if (response && response.action) {
        action = response.action;
        assistantMessage = response.assistantMessage;
        presentationData = response.presentation;
      } else if (Array.isArray(response)) {
        // 하위 호환성: AI가 이전처럼 배열만 보낸 경우
        action = 'refine';
        presentationData = { slides: response };
        assistantMessage = "요청하신 대로 슬라이드를 수정했습니다.";
      }

      // 1. AI의 실제 답변을 채팅 기록에 추가
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage || (action === 'refine' ? "슬라이드가 수정되었습니다." : "궁금하신 점이 있으면 말씀해주세요.")
      }]);

      // 2. 액션 타입에 따라 슬라이드 업데이트
      if (action === 'refine' && presentationData) {
        const updatedSlides = presentationData.slides || presentationData;
        if (Array.isArray(updatedSlides)) {
          setGeneratedSlides(updatedSlides);

          // NEW: Auto-map 'visualElement' URLs to slideImages
          updatedSlides.forEach(slide => {
            if (slide.visualElement && slide.visualElement.startsWith('http')) {
              setSlideImages(prev => ({ ...prev, [slide.type]: slide.visualElement }));
            }
          });

          // Apply pre-computed true background removal if existed
          if (preComputedImageState) {
            setSlideImages(prev => ({ ...prev, ...preComputedImageState }));
          }

          // NEW: Clear dragged floating assets since the AI has structurally consumed them
          if (visualAssets.length > 0) {
            setCanvasAssets([]);
          }

          if (presentationData.title) setProjectName(presentationData.title);
          if (presentationData.designStrategy) setDesignStrategy(presentationData.designStrategy);
          toast.success("슬라이드가 업데이트되었습니다.");
        }
      }
    } catch (e) {
      toast.error("수정 실패: " + e.message);
    } finally {
      setIsRefining(false);
    }
  };

  // --- Native PPTX Export Logic (Direct Nano Banana Image Map) ---
  const downloadPptxPackage = async () => {
    toast.loading("완성된 AI 슬라이드를 파워포인트로 내보내는 중입니다...", { id: 'export' });
    setIsExporting(true);

    try {
      const PptxGen = await loadPptxGenJS();
      const pptx = new PptxGen();

      const effectiveRatio = ratio || '16:9';
      pptx.layout = effectiveRatio === '16:9' ? 'LAYOUT_16x9' : (effectiveRatio === '4:3' ? 'LAYOUT_4x3' : 'LAYOUT_WIDE');
      pptx.title = projectName;

      // Extract generated Nano Banana Full-Slide images from store
      generatedSlides.forEach((slideData) => {
        const slide = pptx.addSlide();
        const base64Img = slideImages[slideData.type];

        if (base64Img) {
          // Put the AI-generated (text+design) image directly into the PPTX slide
          slide.addImage({ data: base64Img, x: 0, y: 0, w: '100%', h: '100%' });
        } else {
          // Fallback just in case generation failed for a specific slide
          const isDark = slideData.layoutProps?.themeMode === 'dark';
          slide.background = { color: slideData.styleTokens?.bgBase?.replace('#', '') || (isDark ? '0A0A0B' : 'FFFFFF') };
          slide.addText("Image Generation Failed", { x: '10%', y: '40%', w: '80%', color: 'ff0000', align: 'center' });
        }
      });

      await pptx.writeFile({ fileName: `${projectName}.pptx` });
      toast.success("PPTX 저장 완료!", { id: 'export' });
    } catch (e) {
      console.error(e);
      toast.error("다운로드 실패: " + e.message, { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  // --- [NEW] Global Background Generation Logic (Nano Banana) ---
  const generateGlobalBackground = async () => {
    toast.loading("Nano Banana 에이전트가 전체 슬라이드 전용 배경을 디자인하고 있습니다...", { id: 'global-bg' });
    try {
      // 1. Theme Context Extraction
      const isDark = theme === 'dark' || generatedSlides[0]?.layoutProps?.themeMode === 'dark';
      const accent = generatedSlides[0]?.theme?.accent || '#3B82F6';

      const themeParams = {
        themeMode: isDark ? 'dark' : 'light',
        accentColor: accent
      };

      const prompt = `Create a stunning, high-quality unified presentation background image for the topic: "${projectName}" and strategy: "${designStrategy}". It should have plenty of negative space in the center for text, with abstract, elegant, and professional visual elements around the edges (like soft gradients, geometric shapes, or light leaks). Make it suitable for a ${themeParams.themeMode} theme presentation. Minimalist and corporate style. No text in the image.`;

      const response = await editVisualAsset(null, prompt, themeParams);

      if (response && response.success) {
        // Apply this single global background to ALL slide types
        const newBgState = {};
        generatedSlides.forEach(slide => {
          newBgState[slide.type] = response.dataUrl;
        });
        setSlideImages(prev => ({ ...prev, ...newBgState }));
        toast.success("전체 배경 생성 및 적용 완료!", { id: 'global-bg' });
      } else {
        throw new Error("이미지 생성 결과가 없습니다.");
      }
    } catch (e) {
      console.error(e);
      toast.error("배경 생성 실패: " + e.message, { id: 'global-bg' });
    }
  };

  const handleSlideSelect = (type) => {
    setCurrentSlideType(type);
    const element = slideRefs.current[type];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    // Auto-attach slide context removed to clean up UI
  };


  const FocusedSlide = ({ type }) => {
    const slideData = generatedSlides.find(s => s.type === type) || {};
    const effectiveRatio = ratio || '16:9';
    const ratioClass = effectiveRatio === '16:9' ? 'aspect-[16/9] w-[800px]' : (effectiveRatio === '4:3' ? 'aspect-[4/3] w-[700px]' : 'aspect-square w-[600px]');

    return (
      <div
        ref={el => slideRefs.current[type] = el}
        className={cn("relative shrink-0 snap-center p-4 group", ratioClass)}
      >
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 relative transition-all duration-700 hover:ring-primary/30">
          <PremiumSlideCanvas
            slides={[slideData]}
            ratio={effectiveRatio}
            previewMode={true}
            slideImages={slideImages}
            projectName={projectName}
          />
        </div>
      </div>
    );
  };
  const handleScroll = () => {
    // Implement scroll handling if needed
  };

  return (
    <div className={cn("h-screen w-full flex bg-background overflow-hidden font-sans fixed inset-0", theme)}>

      {/* 1. Global Icon Sidebar (LNB) */}
      <aside className="w-[72px] border-r bg-card flex flex-col items-center py-4 z-[70] shrink-0 h-full backdrop-blur-sm">
        <div className="w-full flex items-center justify-center mb-6 mt-4">
          <div className="w-10 h-10 flex items-center justify-center bg-slate-900 dark:bg-white rounded-xl transition-transform hover:scale-105 cursor-pointer">
            <Star className="w-5 h-5 text-white dark:text-slate-900 fill-current" />
          </div>
        </div>
        <div className="w-8 h-[1px] bg-border mb-6" />
        <div className="flex flex-col items-center gap-6 w-full px-2">
          <Button variant={currentView === 'dashboard' ? "secondary" : "ghost"} size="icon" className="w-10 h-10 rounded-xl" onClick={() => setCurrentView('dashboard')}>
            <Home className="w-5 h-5" />
          </Button>
          <Button variant={currentView === 'builder' ? "secondary" : "ghost"} size="icon" className="w-10 h-10 rounded-xl" onClick={() => setCurrentView('builder')}>
            <Sparkles className="w-5 h-5" />
          </Button>
        </div>
        <div className="mt-auto flex flex-col gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setShowApiKeyDialog(true)} className={apiKey ? "text-primary" : "text-destructive"}><Key className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</Button>
          <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
        </div>
      </aside>

      {/* 2. History Panel Overlay (Slide-out from LEFT - OVERLAY style) */}
      <div
        className={cn(
          "absolute inset-y-0 left-[72px] w-80 bg-background z-[60] transition-transform duration-300 border-r border-border flex flex-col",
          showHistory ? "translate-x-0" : "-translate-x-full invisible pointer-events-none"
        )}
      >
        <div className="w-80 h-full flex flex-col">
          <div className="p-6 flex items-center justify-between shrink-0">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold tracking-tight text-slate-900">작업 목록</h2>
              <span className="text-[10px] text-slate-400 font-medium">총 {historyItems.length}개의 저장된 작업</span>
            </div>
            <div className="flex items-center gap-1">
              {historyItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-[11px] font-bold text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={handleClearHistory}
                >
                  전체 삭제
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-900 hover:text-slate-600" onClick={() => setShowHistory(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <Separator className="mx-6 w-auto opacity-10" />
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {historyItems.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-40">
                  <div className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                  <p className="text-[11px] font-medium">생성된 작업 내역이 없습니다</p>
                </div>
              ) : (
                historyItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn("p-4 rounded-xl transition-all cursor-pointer group border border-transparent", idx === 0 ? "bg-slate-50 border-slate-200" : "hover:bg-slate-50 hover:border-slate-100")}
                    onClick={() => handleHistoryItemClick(item)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 group-hover:text-primary transition-colors">
                        {item.type === 'book' ? <FileText className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-semibold text-slate-700 truncate mb-1" title={item.title}>{item.title}</h3>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{item.date}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {currentView === 'dashboard' ? (
        <Dashboard
          onSelectTemplate={handleSelectTemplate}
          onGenerateStart={handleGenerateStart}
          theme={theme}
          ratio={ratio}
          setRatio={setRatio}
        />
      ) : currentView === 'presenter' ? (
        <div className="flex-1 relative bg-black">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-[100] text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentView('builder')}
          >
            <X className="w-6 h-6" />
          </Button>
          <PremiumSlideCanvas
            slides={generatedSlides}
            ratio={ratio}
            slideImages={slideImages}
            projectName={projectName}
          />
        </div >
      ) : (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          {/* 3. Header */}
          <header className="h-14 border-b bg-card flex items-center z-10 shrink-0">
            <div className="flex items-center h-full px-4 gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-900 hover:text-foreground" onClick={() => setCurrentView('dashboard')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 transition-colors", showHistory ? "text-primary bg-primary/5" : "text-slate-900 hover:text-foreground")}
                onClick={() => setShowHistory(!showHistory)}
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="w-4 h-[2px] bg-current rounded-full" />
                  <div className="w-3 h-[2px] bg-current rounded-full" />
                </div>
              </Button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900 tracking-tight">{projectName}</span>
                <Separator orientation="vertical" className="h-3" />
                <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest px-2 py-0 border-slate-200 text-slate-400">{currentSlideType}</Badge>
              </div>
            </div>

            <div className="flex items-center px-4 gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-900" onClick={() => setCurrentView('presenter')}>
                <Play className="w-5 h-5" />
              </Button>

              <Button variant="outline" size="sm" className="h-8 rounded-full border-slate-200 text-xs font-bold bg-[#0F9D58] hover:bg-[#0b8043] text-white hover:text-white" onClick={downloadPptxPackage} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                고해상도 PPT 다운로드
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-100 shadow-sm"><Share2 className="w-4 h-4 text-slate-900" /></Button>
            </div>
          </header>

          <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
            {/* 4. Chat Aside (Left) */}
            <aside className="w-80 border-r bg-card flex flex-col shrink-0 z-10 overflow-hidden relative">
              {/* Brand Kit Accordion */}
              <div className="border-b bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setIsBrandKitOpen(!isBrandKitOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-slate-700">브랜드 자산 관리</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isBrandKitOpen && "rotate-180")} />
                </button>

                <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isBrandKitOpen ? "max-h-[500px] opacity-100 p-6 pt-0" : "max-h-0 opacity-0")}>
                  {/* Logo Assets Group */}
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">로고 및 캐릭터</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        className="flex flex-col gap-1.5 cursor-pointer group"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <div className="aspect-square bg-white border border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all shadow-sm">
                          {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-2" /> : <Upload className="w-4 h-4 text-slate-300" />}
                        </div>
                        <span className="text-[9px] text-center font-bold text-slate-400">제안사</span>
                      </div>

                      <div
                        className="flex flex-col gap-1.5 cursor-pointer group"
                        onClick={() => clientLogoInputRef.current?.click()}
                      >
                        <div className="aspect-square bg-white border border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all shadow-sm">
                          {clientLogoPreview ? <img src={clientLogoPreview} className="w-full h-full object-contain p-2" /> : <Upload className="w-4 h-4 text-slate-300" />}
                        </div>
                        <span className="text-[9px] text-center font-bold text-slate-400">고객사</span>
                      </div>

                      <div
                        className="flex flex-col gap-1.5 cursor-pointer group"
                        onClick={() => charInputRef.current?.click()}
                      >
                        <div className="aspect-square bg-white border border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all shadow-sm">
                          {characterPreview ? <img src={characterPreview} className="w-full h-full object-contain p-2" /> : <Upload className="w-4 h-4 text-slate-300" />}
                        </div>
                        <span className="text-[9px] text-center font-bold text-slate-400">캐릭터</span>
                      </div>
                    </div>
                  </div>

                  {/* Slide Settings Group */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">슬라이드 설정</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 px-1">
                        <span>화면 비율</span>
                        <span className="text-primary font-bold">{ratio}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['16:9', '4:3', '1:1'].map((r) => (
                          <Button
                            key={r}
                            variant={ratio === r ? "default" : "outline"}
                            size="sm"
                            className={cn("h-8 text-[10px] font-bold rounded-lg", ratio === r ? "bg-primary shadow-sm" : "bg-white border-slate-200")}
                            onClick={() => setRatio(r)}
                          >
                            {r}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 px-6 py-2">
                <div className="flex flex-col gap-6 py-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                        msg.role === 'user' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isRefining && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] animate-pulse">
                      <Sparkles className="w-3 h-3 h-animate-spin" />
                      AI가 수정 중입니다...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-slate-50/50">
                {/* Multiple Context Attachment UI - Hidden if empty to prevent layout gaps */}
                {attachedAssets.length > 0 && (
                  <div className="mb-3 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar animate-in fade-in slide-in-from-bottom-2">
                    {attachedAssets.map((asset, idx) => (
                      <div key={asset.id || idx} className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-16 aspect-video bg-slate-100 rounded-md overflow-hidden relative border border-slate-200 shrink-0">
                          {asset.type === 'slide' ? (
                            <div className="origin-top-left transform scale-[0.08] w-[800px] h-[450px]">
                              <FocusedSlide type={asset.data.type} />
                            </div>
                          ) : (
                            <img src={asset.preview} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">
                            {asset.type === 'slide' ? `Slide: ${asset.data.type}` : `Asset: ${asset.data.type || 'Image'}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-500 rounded-full"
                          onClick={() => setAttachedAssets(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleEditChatSubmit} className="relative">
                  <Input
                    placeholder={attachedAssets.length > 0 ? "이 에셋들을 어떻게 활용할까요?" : "수정할 내용을 말씀해주세요..."}
                    className={cn(
                      "pr-12 h-11 text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-primary/20 transition-all",
                      attachedAssets.length > 0 && "border-blue-300 ring-4 ring-blue-50"
                    )}
                    value={editChatPrompt}
                    onChange={(e) => setEditChatPrompt(e.target.value)}
                    disabled={isRefining}
                  />
                  <Button type="submit" size="icon" className={cn("absolute right-1.5 top-1.5 h-8 w-8 rounded-lg transition-colors", attachedAssets.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800")} disabled={!editChatPrompt.trim() || isRefining}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </aside>

            {/* 5. Main Canvas (Center) */}
            <main className="flex-1 flex flex-col bg-slate-50/50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] relative overflow-hidden transition-all duration-300 min-w-0 min-h-0">

              {/* Context Analysis Strategy Banner Removed */}

              {/* Loading Overlay (Full Screen) */}
              {isGeneratingAI && <LoadingOverlay />}

              <ScrollArea className="flex-1 min-h-0 h-full" ref={workspaceRef}>
                {/* Hide Slides during generation to prevent flickering */}
                <div className={cn("flex items-center gap-12 p-20 min-w-max h-full snap-x snap-mandatory transition-opacity duration-500", isGeneratingAI ? "opacity-0" : "opacity-100")}>
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'left center', display: 'flex', gap: '48px', height: '100%' }}>
                    {generatedSlides.map((slide, idx) => (
                      <FocusedSlide key={idx} type={slide.type} slideData={slide} />
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Preview Switcher */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-full shadow-2xl p-1.5 flex gap-1.5 z-20">
                {SLIDE_TYPES.map(type => (
                  <Button
                    key={type}
                    variant={currentSlideType === type ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleSlideSelect(type)}
                    className={cn(
                      "rounded-full px-5 text-[10px] font-bold capitalize transition-all",
                      currentSlideType === type ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {type === 'body1' ? '속지 1' : type === 'body2' ? '속지 2' : type === 'divider' ? '간지' : type === 'index' ? '목차' : type === 'icons' ? '아이콘 리소스' : type === 'resources' ? '그래픽 리소스' : '표지'}
                  </Button>
                ))}
              </div>
            </main >

            {/* 6. Push-style Visual Asset Panel (Part of Flex Flow) */}
            < div
              className={
                cn(
                  "bg-background z-40 border-l border-border flex flex-col relative",
                  !isDraggingPanel && "transition-all duration-300"
                )}
              style={{
                width: showVisualPanel ? panelWidth : 0
              }}
            >
              {showVisualPanel && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 z-50 transition-colors"
                  onMouseDown={handlePanelMouseDown}
                  title="드래그하여 패널 너비 조절"
                />
              )}
              <div className="h-full relative shrink-0 overflow-hidden" style={{ width: panelWidth }}>
                <iframe src="/creon/index.html" className="w-full h-full border-none" title="Visual Assets" />
              </div>
            </div >

            {/* 7. Asset Strip (Always Far Right) */}
            < div className="w-14 bg-card border-l flex flex-col items-center py-4 gap-6 z-[45] shrink-0" >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 overflow-hidden",
                  showVisualPanel ? "bg-slate-900 shadow-lg shadow-slate-900/20" : "bg-slate-50"
                )}
                onClick={() => setShowVisualPanel(!showVisualPanel)}
              >
                <img src="/creon/logo.png" alt="Visual" className={cn("w-5 h-5 object-contain", showVisualPanel && "brightness-0 invert")} />
              </div>
              <Separator className="w-8" />
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl border border-dashed border-slate-200 text-slate-300 hover:text-primary hover:border-primary/30 transition-all">
                <Plus className="w-5 h-5" />
              </Button>
            </div >

          </div >
        </div >
      )}

      {/* Modals & Dialogs */}
      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      <Toaster />

      {/* Hidden Inputs */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e)} />
      <input type="file" ref={clientLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleClientLogoUpload(e)} />
      <input type="file" ref={charInputRef} className="hidden" accept="image/*" onChange={(e) => handleCharUpload(e)} />
    </div >
  );
};

export default App;
