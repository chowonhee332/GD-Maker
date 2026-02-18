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
import SpectacleSlides from "@/components/SpectacleSlides";
import { TEMPLATES } from '@/lib/templates';
import { initGemini, generatePresentationContent, refinePresentationContent } from '@/lib/gemini';

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

const SLIDE_TYPES = ['cover', 'index', 'divider', 'body1', 'body2'];

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
    historyItems, addHistoryItem
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

  // --- Contextual Editing State ---
  const [attachedContext, setAttachedContext] = useState(null); // { type: 'slide' | 'asset', data: ... }

  // --- Refs ---
  const workspaceRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const slideRefs = useRef({});
  const [scale, setScale] = useState(0.8);

  // Initialize scale on mount or view change
  useEffect(() => {
    if (currentView === 'builder') {
      const updateScale = () => {
        if (workspaceRef.current) {
          const { clientWidth, clientHeight } = workspaceRef.current;
          const slideW = 800;
          const slideH = (slideW * 9) / 16;
          // Scale based on available space - reduce if panels are open
          const scaleW = (clientWidth * 0.8) / slideW;
          const scaleH = (clientHeight * 0.8) / slideH;
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

          // NEW: Auto-attach to Chat Context
          setAttachedContext({
            type: 'asset',
            data: { url: data.assetUrl, type: data.assetType || 'image' },
            preview: data.assetUrl
          });
          toast.success("에셋이 채팅에 첨부되었습니다.");
        }
      } catch (e) { }
    };
    window.addEventListener('message', handleVisualMessage);
    return () => window.removeEventListener('message', handleVisualMessage);
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleSelectTemplate = (template) => {
    setProjectName(template.name);
    handleGenerateStart(template.name, 5, null, { domain: template.category, primaryColor: template.mainColor }, template.adminReferences?.images || [], template);
  };

  const handleGenerateStart = async (promptText, targetPageCount, attachedFile = null, brandKit = null, referenceImagesList = [], template = null) => {
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
        tone: 'Professional & Persuasive',
        pageCount: targetPageCount,
        domain: brandKit?.domain,
        subDomain: brandKit?.subDomain,
        primaryColor: brandKit?.primaryColor
      };

      const allVisualAssets = [...(referenceImagesList || [])].filter(img => typeof img !== 'string');
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        allVisualAssets.push(attachedFile);
      }

      // Extract curated prompts from template or brandKit if available
      const curatedGuidance = template?.adminReferences?.prompts?.join('\n') || "";

      const aiContent = await generatePresentationContent(promptText, generationConfig, allVisualAssets, curatedGuidance);

      if (aiContent && aiContent.slides) {
        setGeneratedSlides(aiContent.slides);
        setProjectName(aiContent.title || promptText);
        setDesignStrategy(aiContent.designStrategy || "");

        const newItem = {
          id: Date.now(),
          title: aiContent.title || promptText,
          date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
          type: 'book',
          slides: aiContent.slides,
          designStrategy: aiContent.designStrategy || ""
        };
        addHistoryItem(newItem);
        toast.success("슬라이드 초안이 완성되었습니다!", { id: "generating" });
      }
    } catch (e) {
      toast.error("AI Generation failed. Using premium design placeholders.", { id: "generating" });

      // Fallback stylized data for verification
      const fallbackSlides = [
        {
          type: 'cover', title: promptText, content: 'AI-Enhanced Premium Presentation',
          theme: { bg: '#0f172a', text: '#ffffff', accent: '#3b82f6' },
          layoutStyle: 'centered', accentShape: 'floating-blobs',
          designRationale: '청중의 신뢰를 얻기 위해 신뢰감 있는 딥블루 색상과 중앙 집중형 레이아웃을 사용했습니다.'
        },
        {
          type: 'index', title: '컨텐츠 개요', content: '1. 시장 분석\n2. 전략 수립\n3. 기대 효과',
          theme: { bg: '#ffffff', text: '#0f172a', accent: '#3b82f6' },
          layoutStyle: 'split', accentShape: 'bottom-bar',
          designRationale: '정보의 체계적인 전달을 위해 깔끔한 화이트 배경과 분할 레이아웃을 채택했습니다.'
        }
      ];
      setGeneratedSlides(fallbackSlides);
      setDesignStrategy("전문적인 제안서를 위한 신뢰 중심의 미니멀리즘 디자인 전략");
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

  const handleEditChatSubmit = async (e) => {
    e.preventDefault();
    if (!editChatPrompt.trim() || isRefining) return;

    let userMessage = editChatPrompt.trim();

    // NEW: Inject Context into Message
    if (attachedContext) {
      if (attachedContext.type === 'slide') {
        userMessage = `[TARGET_SLIDE: ${attachedContext.data.type}] ${userMessage}`;
      } else if (attachedContext.type === 'asset') {
        userMessage = `[USE_ASSET: ${attachedContext.data.url}] ${userMessage}`;
      }
    }

    setChatHistory(prev => [...prev, { role: 'user', content: editChatPrompt.trim() }]); // Show original text to user
    setEditChatPrompt("");
    setAttachedContext(null); // Clear context after send
    setIsRefining(true);

    try {
      const response = await refinePresentationContent(userMessage, generatedSlides);
      // Fix: extracted .slides from the response object
      const updatedSlides = response.slides || response;

      if (updatedSlides && Array.isArray(updatedSlides)) {
        setGeneratedSlides(updatedSlides);
        setChatHistory(prev => [...prev, { role: 'assistant', content: 'Changes applied successfully.' }]);
        toast.success("슬라이드가 업데이트되었습니다.");
      }
    } catch (e) {
      toast.error("수정 실패: " + e.message);
    } finally {
      setIsRefining(false);
    }
  };

  const downloadPptxPackage = async () => {
    toast.loading("파워포인트 파일을 생성 중입니다...", { id: 'export' });
    try {
      const PptxGen = await loadPptxGenJS();
      const pptx = new PptxGen();
      pptx.layout = (ratio || '16:9') === '16:9' ? 'LAYOUT_16x9' : 'LAYOUT_WIDE';
      pptx.title = projectName;

      generatedSlides.forEach(slideData => {
        const slide = pptx.addSlide();
        const theme = slideData.theme || { bg: '#ffffff', text: '#000000', accent: '#3b82f6' };

        // Set Slide Background
        slide.background = { fill: theme.bg };

        // Add Title
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: '90%',
          fontSize: 32,
          bold: true,
          color: theme.text.replace('#', '')
        });

        // Add Content (or Chart)
        if (slideData.chartData && slideData.chartData.length > 0) {
          // Add Text Content first
          slide.addText(slideData.content, {
            x: 0.5, y: 1.5, w: '40%',
            fontSize: 14,
            color: theme.text.replace('#', '')
          });

          // Add Native Chart
          const labels = slideData.chartData.map(d => d.name);
          const values = slideData.chartData.map(d => d.value);

          slide.addChart(pptx.ChartType.bar, [
            {
              name: 'Data',
              labels: labels,
              values: values
            }
          ], {
            x: 5, y: 1.5, w: 5, h: 3,
            showTitle: true,
            title: slideData.title,
            barDir: 'col',
            chartColors: [theme.accent.replace('#', '')]
          });
        } else {
          slide.addText(slideData.content, {
            x: 0.5, y: 1.5, w: '90%',
            fontSize: 18,
            color: theme.text.replace('#', '')
          });
        }

        // Add Design Rationale (Small at bottom)
        if (slideData.designRationale) {
          slide.addText(`AI 디자인 의도: ${slideData.designRationale}`, {
            x: 0.5, y: 5.0, w: '90%',
            fontSize: 9,
            italic: true,
            color: '888888'
          });
        }
      });

      await pptx.writeFile({ fileName: `${projectName}.pptx` });
      toast.success("PPTX 저장 완료!", { id: 'export' });
    } catch (e) {
      toast.error("내보내기 실패: " + e.message, { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSlideSelect = (type) => {
    setCurrentSlideType(type);
    const element = slideRefs.current[type];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    // NEW: Auto-attach Slide Context
    setAttachedContext({
      type: 'slide',
      data: { type },
      preview: type // Slide type serves as ID for preview component
    });
  };


  const FocusedSlide = ({ type }) => {
    const slideData = generatedSlides.find(s => s.type === type) || {};
    const isCover = type === 'cover';
    const effectiveRatio = ratio || '16:9';
    const ratioClass = effectiveRatio === '16:9' ? 'aspect-[16/9] w-[800px]' : (effectiveRatio === '4:3' ? 'aspect-[4/3] w-[700px]' : 'aspect-square w-[600px]');

    // Responsive Typography Scale
    const fontScale = effectiveRatio === '16:9' ? 1 : (effectiveRatio === '4:3' ? 0.9 : 0.85);

    // Premium Design Tokens (Fallbacks to ensure no "ugly" defaults)
    const theme = slideData.theme || {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      text: '#0f172a',
      accent: '#3b82f6',
      cardBg: 'rgba(255, 255, 255, 0.8)'
    };

    // Standardize Layouts: Cover, Section, Content
    const layoutStyle = slideData.layoutStyle || (isCover ? 'cover-premium' : 'content-card');

    // Visual Fallback: Abstract Patterns if no image
    const hasImage = referenceImages.length > 0 && type === 'body1';

    return (
      <div
        ref={el => slideRefs.current[type] = el}
        className="relative shrink-0 snap-center p-4"
      >
        <div
          className={cn(ratioClass, "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-xl overflow-hidden flex flex-col relative transition-all duration-700 group ring-1 ring-black/5")}
          style={{
            background: theme.bg, // AI provided gradient or solid
            color: theme.text,
            fontFamily: '"Outfit", "Inter", sans-serif',
            '--font-scale': fontScale
          }}
        >
          {/* 1. Global Background Effects (Noise & Ambient) */}
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cube-coat.png')] pointer-events-none" />
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-30 pointer-events-none animate-pulse" style={{ background: theme.accent }} />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ background: theme.accent }} />

          {/* 2. Content Layer */}
          <div className="relative z-10 w-full h-full flex flex-col p-12">

            {/* --- HEADER (Except Cover) --- */}
            {!isCover && (
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold tracking-tight leading-tight" style={{ color: theme.text, fontSize: 'calc(1.875rem * var(--font-scale))' }}>
                    {slideData.title || (type === 'index' ? 'Index' : 'Key Content')}
                  </h2>
                  <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-current opacity-30">
                    {projectName}
                  </div>
                </div>
                {slideData.subtitle && (
                  <p className="opacity-60 font-medium" style={{ fontSize: 'calc(1.125rem * var(--font-scale))' }}>{slideData.subtitle}</p>
                )}
                <div className="h-[2px] w-full rounded-full opacity-10 bg-current" />
              </div>
            )}

            {/* --- BODY CONTENT --- */}
            <div className="flex-1 min-h-0 relative">

              {/* Layout: Cover Premium */}
              {isCover && (
                <div className="h-full flex flex-col justify-center items-start gap-8 z-10 transition-all duration-700 hover:scale-[1.02]">
                  <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md border border-white/20 shadow-sm"
                    style={{ background: theme.accent + '20', color: theme.accent }}>
                    Premium Report
                  </div>
                  <h1 className="font-black tracking-tighter leading-[1.05] drop-shadow-sm max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-current to-current/70"
                    style={{ backgroundImage: `linear-gradient(to right, ${theme.text}, ${theme.text}90)`, fontSize: 'calc(4.5rem * var(--font-scale))' }}>
                    {slideData.title || projectName}
                  </h1>
                  <p className="font-medium opacity-70 max-w-2xl leading-relaxed" style={{ fontSize: 'calc(1.5rem * var(--font-scale))' }}>
                    {slideData.subtitle || slideData.content || "Premium Presentation by AI Agent"}
                  </p>
                  <div className="mt-auto flex items-center gap-4 opacity-50 text-sm font-medium">
                    <span>{new Date().toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Prepared by AI</span>
                  </div>
                </div>
              )}

              {/* Layout: Content Card (Default Standard) */}
              {!isCover && layoutStyle === 'content-card' && (
                <div className="h-full grid grid-cols-12 gap-8">
                  {/* Text Column */}
                  <div className={cn("flex flex-col gap-6", hasImage ? "col-span-7" : "col-span-12")}>
                    <div className="p-8 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm h-full overflow-y-auto"
                      style={{ background: theme.cardBg || 'rgba(255,255,255,0.4)' }}>
                      <div className="prose prose-lg max-w-none leading-relaxed opacity-90 whitespace-pre-wrap font-medium" style={{ fontSize: 'calc(1.125rem * var(--font-scale))' }}>
                        {slideData.content || "Main content goes here."}
                      </div>
                    </div>
                  </div>
                  {/* Visual Column */}
                  {hasImage && (
                    <div className="col-span-5 h-full relative group">
                      <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg border-4 border-white transform rotate-2 transition-transform group-hover:rotate-0">
                        <img
                          src={typeof referenceImages[0] === 'string' ? referenceImages[0] : URL.createObjectURL(referenceImages[0])}
                          className="w-full h-full object-cover"
                          alt="visual"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback pattern for split/other layouts mapping to standard */}
              {!isCover && layoutStyle !== 'content-card' && layoutStyle !== 'section-glass' && (
                <div className="h-full grid grid-cols-2 gap-12 items-center">
                  <div className="p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm h-full">
                    <div className="prose prose-xl max-w-none leading-relaxed opacity-90 whitespace-pre-wrap font-medium" style={{ fontSize: 'calc(1.25rem * var(--font-scale))' }}>
                      {slideData.content || "Detail content goes here."}
                    </div>
                  </div>
                  <div className="h-full rounded-2xl bg-current/5 border border-current/10 flex items-center justify-center p-12 overflow-hidden relative">
                    {/* Abstract Graphic as Placeholder */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-current to-transparent" />
                    <ImageIcon className="w-24 h-24 opacity-20 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Layout: Section Glass */}
              {!isCover && layoutStyle === 'section-glass' && (
                <div className="h-full flex items-center justify-center">
                  <div className="w-full max-w-3xl p-12 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl text-center flex flex-col gap-6"
                    style={{ background: theme.cardBg || 'rgba(255,255,255,0.1)' }}>
                    <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner" style={{ background: theme.accent + '20' }}>
                      <Sparkles className="w-8 h-8" style={{ color: theme.accent }} />
                    </div>
                    <h2 className="font-bold" style={{ fontSize: 'calc(2.25rem * var(--font-scale))' }}>{slideData.title}</h2>
                    <div className="w-24 h-1 bg-current opacity-20 mx-auto rounded-full" />
                    <p className="opacity-70 leading-relaxed" style={{ fontSize: 'calc(1.25rem * var(--font-scale))' }}>{slideData.content}</p>
                  </div>
                </div>
              )}

            </div>

            {/* --- FOOTER --- */}
            {!isCover && (
              <div className="mt-8 pt-4 border-t border-current/10 flex justify-between items-center opacity-40 text-[10px] font-medium tracking-wider uppercase">
                <span>GD Maker AI</span>
                <span>{projectName}</span>
              </div>
            )}
          </div>

          {/* Interactive Elements / AI Rationale Hint */}
          {slideData.designRationale && (
            <div className="absolute bottom-4 right-4 z-20 group/hint">
              <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-help bg-white/10 backdrop-blur-md border border-white/20 shadow-sm hover:scale-110 transition-all">
                <Info className="w-4 h-4 opacity-50" />
              </div>
              <div className="absolute bottom-full right-0 mb-2 w-64 p-4 rounded-xl bg-slate-900/90 text-white text-xs backdrop-blur-xl opacity-0 group-hover/hint:opacity-100 transition-opacity pointer-events-none translate-y-2 group-hover/hint:translate-y-0">
                <p className="font-bold mb-1 text-emerald-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Insight</p>
                {slideData.designRationale}
              </div>
            </div>
          )}

          {/* Visual Elements positioned absolutely if needed */}
          {canvasAssets.map(asset => (
            <div key={asset.id} className="absolute pointer-events-none z-30" style={{ left: asset.x, top: asset.y, transform: 'translate(-50%, -50%)' }}>
              <img src={asset.url} alt="" className="w-20 h-20 object-contain drop-shadow-2xl" />
            </div>
          ))}

        </div>
      </div>
    );
  };
  const handleScroll = () => {
    // Implement scroll handling if needed
  };

  return (
    <div className={cn("h-screen w-full flex bg-background overflow-hidden font-sans", theme)}>

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
          showHistory ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="w-80 h-full flex flex-col">
          <div className="p-6 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900">작업 목록</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-900 hover:text-slate-600"><RotateCw className="w-4 h-4" /></Button>
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
          <SpectacleSlides slides={generatedSlides} ratio={ratio} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
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
              <Button variant="outline" size="sm" className="h-8 rounded-full border-slate-200 text-xs font-bold" onClick={downloadPptxPackage} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                저장하기
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-100 shadow-sm"><Share2 className="w-4 h-4 text-slate-900" /></Button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* 4. Chat Aside (Left) */}
            <aside className="w-80 border-r bg-card flex flex-col shrink-0 z-10">
              <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-6">
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
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-slate-50/50">
                {/* Context Attachment UI */}
                {attachedContext && (
                  <div className="mb-3 p-2 bg-white rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-24 aspect-video bg-slate-100 rounded-md overflow-hidden relative border border-slate-200 shrink-0">
                      {attachedContext.type === 'slide' ? (
                        <div className="origin-top-left transform scale-[0.12] w-[800px] h-[450px]">
                          <FocusedSlide type={attachedContext.data.type} />
                        </div>
                      ) : (
                        <img src={attachedContext.preview} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        {attachedContext.type === 'slide' ? `Current Slide: ${attachedContext.data.type}` : 'Asset Attached'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {attachedContext.type === 'slide' ? 'Enter instructions to modify this slide...' : 'Modifying slide with this asset...'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-500 rounded-full"
                      onClick={() => setAttachedContext(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <form onSubmit={handleEditChatSubmit} className="relative">
                  <Input
                    placeholder={attachedContext ? "이 슬라이드를 어떻게 수정할까요?" : "수정할 내용을 말씀해주세요..."}
                    className={cn(
                      "pr-12 h-11 text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-primary/20 transition-all",
                      attachedContext && "border-blue-300 ring-4 ring-blue-50"
                    )}
                    value={editChatPrompt}
                    onChange={(e) => setEditChatPrompt(e.target.value)}
                    disabled={isRefining}
                  />
                  <Button type="submit" size="icon" className={cn("absolute right-1.5 top-1.5 h-8 w-8 rounded-lg transition-colors", attachedContext ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800")} disabled={!editChatPrompt.trim() || isRefining}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </aside>

            {/* 5. Main Canvas (Center) */}
            <main className="flex-1 flex flex-col bg-slate-50/50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] relative overflow-hidden transition-all duration-300">

              {/* Context Analysis Strategy Banner */}
              {designStrategy && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[30] w-full max-w-2xl px-6">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-sm rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">AI 디자인 전략</h4>
                      <p className="text-xs font-semibold text-slate-700 truncate">{designStrategy}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 hover:opacity-100" onClick={() => setDesignStrategy("")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading Overlay (Full Screen) */}
              {isGeneratingAI && <LoadingOverlay />}

              <ScrollArea className="flex-1 h-full" ref={workspaceRef}>
                {/* Hide Slides during generation to prevent flickering */}
                <div className={cn("flex items-center gap-12 p-20 min-w-max h-full snap-x snap-mandatory transition-opacity duration-500", isGeneratingAI ? "opacity-0" : "opacity-100")}>
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'left center', display: 'flex', gap: '48px' }}>
                    {SLIDE_TYPES.map(type => (
                      <FocusedSlide key={type} type={type} />
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
                    {type === 'body1' ? '속지 1' : type === 'body2' ? '속지 2' : type === 'divider' ? '간지' : type === 'index' ? '목차' : '표지'}
                  </Button>
                ))}
              </div>
            </main>

            {/* 6. Push-style Visual Asset Panel (Part of Flex Flow) */}
            <div
              className={cn(
                "bg-background z-40 border-l border-border transition-all duration-300 overflow-hidden flex flex-col",
                showVisualPanel ? "w-96" : "w-0"
              )}
            >
              <div className="w-96 h-full relative">
                <iframe src="/creon/index.html" className="w-full h-full border-none" title="Visual Assets" />
              </div>
            </div>

            {/* 7. Asset Strip (Always Far Right) */}
            <div className="w-14 bg-card border-l flex flex-col items-center py-4 gap-6 z-[45] shrink-0">
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
            </div>

          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      <Toaster />
    </div>
  );
};

export default App;
