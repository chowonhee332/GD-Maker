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
  LayoutGrid
} from 'lucide-react';

import Dashboard from "@/components/Dashboard";
import ApiKeyDialog from "@/components/ApiKeyDialog";
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
  // --- UI State ---
  const [currentPreviewType, setCurrentPreviewType] = useState('cover');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showCreonPanel, setShowCreonPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Actual Data History State
  const [historyItems, setHistoryItems] = useState(() => {
    const saved = localStorage.getItem('gd-maker-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('gd-maker-history', JSON.stringify(historyItems));
  }, [historyItems]);

  const [apiKey, setApiKey] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'builder'
  const [theme, setTheme] = useState('light');
  const [projectName, setProjectName] = useState("New Presentation");
  const [ratio, setRatio] = useState('16:9');

  // --- Builder Sidebars/Assets ---
  const [canvasAssets, setCanvasAssets] = useState([]);

  // --- Generation Logic ---
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState([]);
  const [isRefining, setIsRefining] = useState(false);
  const [editChatPrompt, setEditChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: '안녕하세요! 발표 자료 생성을 도와드릴 Gemini 기반 에이전트입니다. 어떤 대화를 나눠볼까요?' }
  ]);

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
  }, [currentView, showHistory, showCreonPanel]); // Also update scale when panels toggle

  // Listen for messages from Creon Studio
  useEffect(() => {
    const handleCreonMessage = (event) => {
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
    window.addEventListener('message', handleCreonMessage);
    return () => window.removeEventListener('message', handleCreonMessage);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleSelectTemplate = (template) => {
    setProjectName(template.name);
    handleGenerateStart(template.name, 5, null, { domain: template.category, primaryColor: template.mainColor });
  };

  const handleGenerateStart = async (promptText, targetPageCount, attachedFile = null, brandKit = null, referenceImages = []) => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
      toast.error("Please set your Gemini API Key first");
      return;
    }

    setProjectName(promptText || "New Presentation");
    setIsGeneratingAI(true);
    setCurrentView('builder');

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

      const allVisualAssets = [...(referenceImages || [])];
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        allVisualAssets.push(attachedFile);
      }

      const aiContent = await generatePresentationContent(promptText, generationConfig, allVisualAssets);

      if (aiContent && aiContent.slides) {
        setGeneratedSlides(aiContent.slides);
        setProjectName(aiContent.title || promptText);

        const newItem = {
          id: Date.now(),
          title: aiContent.title || promptText,
          date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
          type: 'book',
          slides: aiContent.slides
        };
        setHistoryItems(prev => [newItem, ...prev]);
        toast.success("슬라이드 초안이 완성되었습니다!", { id: "generating" });
      }
    } catch (e) {
      toast.error("AI Generation failed: " + e.message, { id: "generating" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleHistoryItemClick = (item) => {
    if (item.slides) {
      setGeneratedSlides(item.slides);
      setProjectName(item.title);
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
    setIsExporting(true);
    toast.loading("저장 중...", { id: 'export' });
    try {
      const PptxGen = await loadPptxGenJS();
      const pptx = new PptxGen();
      pptx.layout = ratio === '16:9' ? 'LAYOUT_16x9' : 'LAYOUT_WIDE';
      pptx.title = projectName;
      generatedSlides.forEach(slideData => {
        const slide = pptx.addSlide();
        slide.addText(slideData.title, { x: 1, y: 1, fontSize: 32, bold: true });
        slide.addText(slideData.content, { x: 1, y: 2, fontSize: 18 });
      });
      await pptx.writeFile({ fileName: `${projectName}.pptx` });
      toast.success("PPTX 저장 완료!", { id: 'export' });
    } catch (e) {
      toast.error("Export failed: " + e.message, { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSlideSelect = (type) => {
    setCurrentPreviewType(type);
    const element = slideRefs.current[type];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const FocusedSlide = ({ type }) => {
    const isCover = type === 'cover';
    const ratioClass = ratio === '16:9' ? 'aspect-[16/9] w-[800px]' : (ratio === '4:3' ? 'aspect-[4/3] w-[700px]' : 'aspect-square w-[600px]');

    return (
      <div
        ref={el => slideRefs.current[type] = el}
        className="relative shrink-0 snap-center"
      >
        <div className={cn(ratioClass, "bg-white shadow-xl rounded-sm overflow-hidden flex flex-col ring-1 ring-slate-200")}>
          <div className="flex-1 relative overflow-hidden flex flex-col p-12">
            <div className={cn("z-10", isCover ? "flex flex-col items-center justify-center h-full text-center" : "")}>
              <h2 className={cn("font-bold tracking-tight text-slate-900", isCover ? "text-4xl mb-4" : "text-2xl mb-6")}>
                {isCover ? projectName : (type === 'index' ? 'Index' : (type === 'divider' ? 'Section Divider' : 'Content Slide'))}
              </h2>
              <div className="text-slate-500 max-w-lg leading-relaxed">
                {isCover ? "Premium presentation generated by AI Agent" : "AI가 생성한 전문적인 콘텐츠가 이곳에 표시됩니다."}
              </div>
            </div>
            {canvasAssets.map(asset => (
              <div key={asset.id} className="absolute pointer-events-none" style={{ left: asset.x, top: asset.y, transform: 'translate(-50%, -50%)' }}>
                <img src={asset.url} alt="" className="w-16 h-16 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
                <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest px-2 py-0 border-slate-200 text-slate-400">{currentPreviewType}</Badge>
              </div>
            </div>

            <div className="flex items-center px-4 gap-3">
              <Button variant="outline" size="sm" className="h-8 rounded-full border-slate-200 text-xs font-bold" onClick={downloadPptxPackage} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                Export
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
                    variant={currentPreviewType === type ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleSlideSelect(type)}
                    className={cn(
                      "rounded-full px-5 text-[10px] font-bold capitalize transition-all",
                      currentPreviewType === type ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {type === 'body1' ? '속지 1' : type === 'body2' ? '속지 2' : type === 'divider' ? '간지' : type === 'index' ? '목차' : '표지'}
                  </Button>
                ))}
              </div>
            </main>

            {/* 6. Push-style Creon Asset Panel (Part of Flex Flow) */}
            <div
              className={cn(
                "bg-background z-40 border-l border-border transition-all duration-300 overflow-hidden flex flex-col",
                showCreonPanel ? "w-96" : "w-0"
              )}
            >
              <div className="w-96 h-full relative">
                <iframe src="/creon/index.html" className="w-full h-full border-none" title="Creon Assets" />
              </div>
            </div>

            {/* 7. Asset Strip (Always Far Right) */}
            <div className="w-14 bg-card border-l flex flex-col items-center py-4 gap-6 z-[45] shrink-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 overflow-hidden",
                  showCreonPanel ? "bg-slate-900 shadow-lg shadow-slate-900/20" : "bg-slate-50"
                )}
                onClick={() => setShowCreonPanel(!showCreonPanel)}
              >
                <img src="/creon/logo.png" alt="Creon" className={cn("w-5 h-5 object-contain", showCreonPanel && "brightness-0 invert")} />
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
      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} apiKey={apiKey} setApiKey={setApiKey} />
      <Toaster />
    </div>
  );
};

export default App;
