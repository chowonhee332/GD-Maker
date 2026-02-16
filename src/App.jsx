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

  // Listen for messages from Visual Studio
  useEffect(() => {
    const handleVisualMessage = (event) => {
      try {
        const data = event.data;
        if (data && data.type === 'ASSET_SELECTED') {
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
          toast.success("슬라이드에 에셋이 추가되었습니다.");
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

    const userMessage = editChatPrompt.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setEditChatPrompt("");
    setIsRefining(true);

    try {
      const updatedSlides = await refinePresentationContent(userMessage, generatedSlides);
      if (updatedSlides) {
        setGeneratedSlides(updatedSlides);
        setChatHistory(prev => [...prev, { role: 'assistant', content: '요청하신 변경 사항을 반영하여 슬라이드를 수정했습니다.' }]);
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
  };

  const FocusedSlide = ({ type }) => {
    const slideData = generatedSlides.find(s => s.type === type) || {};
    const isCover = type === 'cover';
    const isAnalysis = type === 'body2';
    const effectiveRatio = ratio || '16:9';
    const ratioClass = effectiveRatio === '16:9' ? 'aspect-[16/9] w-[800px]' : (effectiveRatio === '4:3' ? 'aspect-[4/3] w-[700px]' : 'aspect-square w-[600px]');

    // AI Design Tokens
    const theme = slideData.theme || { bg: '#ffffff', text: '#0f172a', accent: '#3b82f6' };
    const layoutStyle = slideData.layoutStyle || (slideData.layout === 'split' ? 'split' : 'hero-left');
    const accentShape = slideData.accentShape || 'clean-border';

    const getLayoutClasses = () => {
      switch (layoutStyle) {
        case 'centered': return "items-center justify-center text-center";
        case 'split': return "justify-start text-left";
        case 'hero-right': return "items-end justify-center text-right";
        case 'content-focused': return "justify-start pt-20";
        default: return "justify-start";
      }
    };

    return (
      <div
        ref={el => slideRefs.current[type] = el}
        className="relative shrink-0 snap-center p-4"
      >
        <div
          className={cn(ratioClass, "shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden flex ring-1 ring-slate-200/50 transition-all duration-700 group hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)]")}
          style={{
            background: isCover
              ? `linear-gradient(135deg, ${theme.bg} 0%, ${theme.accent}33 100%)`
              : theme.bg,
            color: theme.text
          }}
        >
          {/* Subtle Grain/Noise Overlay for premium feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
          {/* Accent Shapes with better effects */}
          {accentShape === 'diagonal' && (
            <div className="absolute top-0 right-0 w-2/3 h-full opacity-[0.07] bg-gradient-to-l from-current to-transparent -skew-x-12 translate-x-1/3 pointer-events-none transition-transform duration-1000 group-hover:translate-x-1/4" />
          )}
          {accentShape === 'bottom-bar' && (
            <div className="absolute bottom-0 left-0 w-full h-12 opacity-[0.15] bg-current pointer-events-none" style={{ backgroundColor: theme.accent }} />
          )}
          {accentShape === 'floating-blobs' && (
            <>
              <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-[0.15] pointer-events-none animate-pulse" style={{ backgroundColor: theme.accent }} />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] opacity-[0.1] pointer-events-none" style={{ backgroundColor: theme.accent }} />
            </>
          )}

          <div className={cn("relative flex-1 flex flex-col p-16 overflow-hidden z-10", isAnalysis ? "w-2/3" : "w-full")}>

            {/* Split Layout logic */}
            {layoutStyle === 'split' && (
              <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 bg-current border-l border-current/10" />
            )}

            <div className={cn("h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150", getLayoutClasses())}>
              <div className="flex items-center gap-4 mb-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-[360deg]"
                  style={{ backgroundColor: theme.accent + '15', color: theme.accent, border: `1px solid ${theme.accent}33` }}
                >
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                {!isCover && (
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">
                      {type === 'index' ? '섹션 01' : type === 'divider' ? '전환 슬라이드' : '챕터 인사이트'}
                    </h3>
                    <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: theme.accent }} />
                  </div>
                )}
              </div>

              <h2 className={cn("font-black tracking-tighter leading-[1.05] mb-8 drop-shadow-sm", isCover ? "text-7xl max-w-4xl" : "text-5xl max-w-2xl")}>
                {slideData.title || (isCover ? projectName : (type === 'index' ? 'Index' : (type === 'divider' ? 'Section Divider' : 'Content Slide')))}
              </h2>

              <div
                className={cn(
                  "leading-relaxed whitespace-pre-wrap font-medium opacity-70",
                  isCover ? "text-2xl max-w-2xl" : "text-lg max-w-3xl",
                  layoutStyle === 'hero-right' && "ml-auto"
                )}
              >
                {slideData.content || (isCover ? "Premium presentation generated by AI Agent" : "AI가 생성한 전문적인 콘텐츠가 이곳에 표시됩니다.")}
              </div>

              {/* Enhanced Visual Element / Rationale Box with Glassmorphism */}
              {(slideData.visualElement || slideData.designRationale) && (
                <div
                  className={cn(
                    "mt-auto pt-8 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500",
                    layoutStyle === 'hero-right' && "items-end"
                  )}
                >
                  <div className={cn(
                    "p-6 rounded-2xl border flex flex-col gap-3 max-w-2xl shadow-xl",
                    theme.bg.toLowerCase().includes('ffffff') || theme.bg.toLowerCase().includes('fff') ? "glass" : "glass-dark"
                  )}>
                    <div className="flex items-center gap-3">
                      <div
                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm flex items-center gap-2"
                        style={{ backgroundColor: theme.accent, color: '#fff' }}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI 디자인 인사이트
                      </div>
                      {slideData.visualElement && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-current/5 border border-current/10">
                          <ImageIcon className="w-3 h-3 opacity-40" />
                          <p className="text-[10px] italic opacity-40 font-bold tracking-tight">"{slideData.visualElement}"</p>
                        </div>
                      )}
                    </div>
                    {slideData.designRationale && (
                      <p className="text-[12px] font-semibold opacity-80 leading-relaxed italic">
                        "{slideData.designRationale}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Sidebar (Keep existing logic but apply theme) */}
          {isAnalysis && (
            <div className="w-1/3 border-l border-current/10 flex flex-col items-center justify-center p-12 gap-10 z-10" style={{ backgroundColor: theme.bg + '50' }}>
              <div className="w-full flex items-baseline justify-center gap-3 h-40">
                <div className="w-8 rounded-t-lg transition-all hover:scale-110" style={{ height: '40%', backgroundColor: theme.accent + '30' }} />
                <div className="w-8 rounded-t-lg transition-all hover:scale-110" style={{ height: '70%', backgroundColor: theme.accent + '50' }} />
                <div className="w-8 rounded-t-lg transition-all hover:scale-110" style={{ height: '90%', backgroundColor: theme.accent }} />
                <div className="w-8 rounded-t-lg transition-all hover:scale-110" style={{ height: '55%', backgroundColor: theme.accent + '40' }} />
              </div>
              <div className="w-full space-y-4">
                <div className="h-2 w-full bg-current/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 animate-in slide-in-from-left duration-1000" style={{ backgroundColor: theme.accent }} />
                </div>
                <div className="flex justify-between text-[11px] font-black opacity-40 uppercase tracking-widest">
                  <span>Data Depth</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}

          {/* Simulated Image Overlays */}
          {referenceImages.length > 0 && type === 'body1' && !isAnalysis && (
            <div className="absolute bottom-16 right-16 w-56 h-36 rounded-xl border-4 border-white shadow-2xl overflow-hidden rotate-3 z-20 transition-transform hover:rotate-0 hover:scale-110 duration-500">
              <img
                src={typeof referenceImages[0] === 'string' ? referenceImages[0] : URL.createObjectURL(referenceImages[0])}
                className="w-full h-full object-cover"
                alt="Reference"
              />
            </div>
          )}

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
                <form onSubmit={handleEditChatSubmit} className="relative">
                  <Input
                    placeholder="수정할 내용을 말씀해주세요..."
                    className="pr-12 h-11 text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-primary/20"
                    value={editChatPrompt}
                    onChange={(e) => setEditChatPrompt(e.target.value)}
                    disabled={isRefining}
                  />
                  <Button type="submit" size="icon" className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800" disabled={!editChatPrompt.trim() || isRefining}>
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

              <ScrollArea className="flex-1 h-full" ref={workspaceRef}>
                <div className="flex items-center gap-12 p-20 min-w-max h-full snap-x snap-mandatory">
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
