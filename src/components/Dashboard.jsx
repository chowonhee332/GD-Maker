import React, { useState, useRef, useMemo } from 'react';
import {
    Plus,
    Sparkles,
    ArrowUp,
    Upload,
    ImageIcon,
    Settings2,
    Palette,
    Globe,
    FileImage,
    Monitor,
    Library,
    ImagePlus,
    Trash2,
    X,
    Search,
    ChevronRight,
    LayoutGrid
} from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { TEMPLATES } from '@/lib/templates';
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogFooter,
    DialogClose,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";
import { toast } from "sonner";
import { Badge } from "./ui/badge";

const Dashboard = ({ onSelectTemplate, onGenerateStart, theme = 'light', ratio = '16:9', setRatio }) => {
    const isDark = theme === 'dark';
    const [prompt, setPrompt] = useState("");
    const [slideCount, setSlideCount] = useState("8");
    const [attachedFile, setAttachedFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");
    const [domain, setDomain] = useState(null);
    const [subDomain, setSubDomain] = useState(null);
    const [style, setStyle] = useState(null);
    const [activeCategory, setActiveCategory] = useState("basic");
    const [showRefPanel, setShowRefPanel] = useState(false);
    const [referenceImages, setReferenceImages] = useState([]);

    // Template filtering
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const fileInputRef = useRef(null);
    const templateInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const refInputRef = useRef(null);

    const CATEGORIES = ["All", ...new Set(TEMPLATES.filter(t => t.category).map(t => t.category))];

    const filteredTemplates = useMemo(() => {
        return TEMPLATES.filter(t => {
            if (t.type === 'action') return false; // Hide special actions from general grid
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    const RATIO_OPTIONS = [
        { value: '16:9', label: '16:9', desc: '프레젠테이션 & 최신 스크린' },
        { value: '4:3', label: '4:3', desc: '지식 카드 & 클래식 슬라이드' },
        { value: '1:1', label: '1:1', desc: '소셜 포스트 & 온라인 광고' },
    ];

    const DOMAIN_OPTIONS = [
        { value: 'Public', label: '공공 (Public)' },
        { value: 'Finance', label: '금융 (Finance)' },
        { value: 'Manufacturing', label: '제조 (Manufacturing)' },
        { value: 'Service', label: '서비스/유통 (Service)' },
        { value: 'Telco', label: '통신/미디어 (Telco)' },
        { value: 'Construction', label: '건설/엔지니어링 (Construction)' },
        { value: 'Healthcare', label: '의료/바이오 (Healthcare)' },
    ];

    const SUB_DOMAIN_OPTIONS = {
        'Public': [
            { value: 'General', label: '일반 행정' },
            { value: 'SmartCity', label: '스마트 시티' },
            { value: 'Defense', label: '국방/안보' },
            { value: 'Education', label: '교육 행정' },
            { value: 'Welfare', label: '보건 복지' }
        ],
        'Finance': [
            { value: 'General', label: '금융 일반' },
            { value: 'Banking', label: '은행/여신' },
            { value: 'Insurance', label: '보험' },
            { value: 'Securities', label: '증권/자산운용' },
            { value: 'Fintech', label: '핀테크/마이데이터' }
        ],
        'Manufacturing': [
            { value: 'General', label: '제조 일반' },
            { value: 'Automotive', label: '자동차/모빌리티' },
            { value: 'Semiconductor', label: '반도체/디스플레이' },
            { value: 'Chemical', label: '화학/에너지' },
            { value: 'Food', label: '식품/소비재' }
        ],
        'Service': [
            { value: 'General', label: '서비스 일반' },
            { value: 'Retail', label: '유통/이커머스' },
            { value: 'Logistics', label: '물류/운송' },
            { value: 'Travel', label: '여행/숙박' },
            { value: 'F&B', label: '식음료/프랜차이즈' }
        ],
        'Telco': [
            { value: 'General', label: '통신 일반' },
            { value: 'Mobile', label: '이동통신/5G' },
            { value: 'Media', label: '방송/미디어' },
            { value: 'Network', label: '네트워크 인프라' }
        ],
        'Construction': [
            { value: 'General', label: '건설 일반' },
            { value: 'Architecture', label: '건축/설계' },
            { value: 'Civil', label: '토목/플랜트' },
            { value: 'Safety', label: '안전/환경' }
        ],
        'Healthcare': [
            { value: 'General', label: '의료 일반' },
            { value: 'Hospital', label: '병원 정보 시스템 (HIS)' },
            { value: 'Pharma', label: '제약/신약 개발' },
            { value: 'Bio', label: '바이오 테크' }
        ]
    };

    const STYLE_OPTIONS = [
        { value: 'Minimalist', label: '미니멀 (깔끔함)' },
        { value: 'Bold', label: '볼드 (강렬함)' },
        { value: 'Corporate', label: '코퍼레이트 (신뢰감)' },
        { value: 'Creative', label: '크리에이티브 (트렌디)' },
        { value: 'Playful', label: '플레이풀 (친근함)' },
    ];

    const OPTION_CATEGORIES = [
        { id: 'basic', label: '제안 분야', icon: Globe },
        { id: 'brand', label: '브랜드', icon: Palette },
        { id: 'style', label: '스타일', icon: Sparkles },
        { id: 'layout', label: '규격', icon: Monitor },
    ];

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setAttachedFile(file);
                toast.success(`이미지가 첨부되었습니다: ${file.name}`);
            } else {
                toast.error("이미지 파일만 첨부할 수 있습니다.");
            }
        }
        e.target.value = '';
    };

    const handleLogoSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setLogoFile(file);
                toast.success(`로고가 등록되었습니다: ${file.name}`);
            } else {
                toast.error("이미지 파일만 로고로 사용할 수 있습니다.");
            }
        }
        e.target.value = '';
    };

    const handleReferenceSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const validImages = files.filter(f => f.type.startsWith('image/'));

        if (validImages.length > 0) {
            setReferenceImages(prev => [...prev, ...validImages]);
            toast.success(`${validImages.length}개의 참고 이미지가 추가되었습니다.`);
        }
        e.target.value = '';
    };

    const removeReferenceImage = (index) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleTemplateImport = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.info("템플릿 가져오기 기능은 준비 중입니다. (JSON/PPTX 지원 예정)");
        }
        e.target.value = '';
    };

    const removeAttachedFile = () => {
        setAttachedFile(null);
    };

    const removeLogoFile = () => {
        setLogoFile(null);
    };

    const getSubDomains = () => {
        return SUB_DOMAIN_OPTIONS[domain] || [{ value: 'General', label: '일반' }];
    };

    const ActiveFilterChips = (
        <>
            {logoFile && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/50 text-blue-700 text-[11px] font-medium border border-blue-100 hover:bg-blue-50 transition-colors cursor-default animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-white">
                        <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover" />
                    </div>
                    <span>Logo</span>
                    <button onClick={(e) => { e.stopPropagation(); removeLogoFile(); }} className="text-blue-400 hover:text-blue-600 ml-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}

            {primaryColor !== '#3b82f6' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50/50 text-indigo-700 text-[11px] font-medium border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-default animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: primaryColor }} />
                    <span className="font-mono uppercase">{primaryColor}</span>
                    <button onClick={(e) => { e.stopPropagation(); setPrimaryColor('#3b82f6'); }} className="text-indigo-400 hover:text-indigo-600 ml-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}

            {domain && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/50 text-emerald-700 text-[11px] font-medium border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-default animate-in fade-in zoom-in-95 duration-300">
                    <Globe className="w-3 h-3" />
                    <span>{domain}</span>
                    <button onClick={(e) => { e.stopPropagation(); setDomain(null); setSubDomain(null); }} className="text-emerald-400 hover:text-emerald-600 ml-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}

            {subDomain && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50/50 text-purple-700 text-[11px] font-medium border border-purple-100 hover:bg-purple-50 transition-colors cursor-default animate-in fade-in zoom-in-95 duration-300">
                    <ArrowUp className="w-3 h-3" />
                    <span>{subDomain}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSubDomain(null); }} className="text-purple-400 hover:text-purple-600 ml-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}

            {style && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50/50 text-amber-700 text-[11px] font-medium border border-amber-100 hover:bg-amber-50 transition-colors cursor-default animate-in fade-in zoom-in-95 duration-300">
                    <Palette className="w-3 h-3" />
                    <span>{style}</span>
                    <button onClick={(e) => { e.stopPropagation(); setStyle(null); }} className="text-amber-400 hover:text-amber-600 ml-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}

            {ratio && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50/50 text-rose-700 text-[11px] font-medium border border-rose-100 hover:bg-rose-50 transition-colors cursor-default animate-in fade-in zoom-in-95 duration-300">
                    <Monitor className="w-3 h-3" />
                    <span>{ratio}</span>
                    <button onClick={(e) => { e.stopPropagation(); setRatio(null); }} className="text-rose-400 hover:text-rose-600 ml-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}
        </>
    );

    const OptionContent = () => {
        switch (activeCategory) {
            case 'basic':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">제안 분야 설정</h3>
                            <p className="text-sm text-muted-foreground">제안서를 제출할 산업군과 세부 분야를 선택하세요.</p>
                        </div>
                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">메인 도메인 (Industry)</Label>
                                <Select value={domain || ""} onValueChange={(val) => { setDomain(val); setSubDomain(SUB_DOMAIN_OPTIONS[val]?.[0]?.value || 'General'); }}>
                                    <SelectTrigger className="h-10 w-full"><SelectValue placeholder="도메인 선택" /></SelectTrigger>
                                    <SelectContent className="z-[1100]">
                                        {DOMAIN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">상세 분야 (Sector)</Label>
                                <Select value={subDomain || ""} onValueChange={setSubDomain}>
                                    <SelectTrigger className="h-10 w-full"><SelectValue placeholder="상세 분야 선택" /></SelectTrigger>
                                    <SelectContent className="z-[1100]">
                                        {getSubDomains().map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            case 'brand':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">브랜드 아이덴티티</h3>
                            <p className="text-sm text-muted-foreground">로고와 메인 컬러를 설정하여 통일감을 줍니다.</p>
                        </div>
                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">로고 이미지</Label>
                                <div
                                    className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors h-32 bg-muted/10"
                                    onClick={() => logoInputRef.current?.click()}
                                >
                                    {logoFile ? (
                                        <div className="relative group w-full h-full flex items-center justify-center">
                                            <img src={URL.createObjectURL(logoFile)} alt="Logo" className="max-h-full max-w-full object-contain" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeLogoFile(); }}
                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="p-2 bg-background rounded-full shadow-sm">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-medium">로고 업로드</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">메인 컬러</Label>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full border-2 shadow-sm overflow-hidden relative cursor-pointer ring-offset-2 hover:ring-2 transition-all">
                                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 p-0 border-none cursor-pointer" />
                                    </div>
                                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 font-mono text-sm flex-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'style':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">비주얼 스타일</h3>
                            <p className="text-sm text-muted-foreground">슬라이드의 전체적인 분위기를 결정합니다.</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">디자인 테마</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {STYLE_OPTIONS.map(opt => (
                                    <div
                                        key={opt.value}
                                        onClick={() => setStyle(opt.value)}
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 flex items-center justify-between hover:border-primary/50 transition-all",
                                            style === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/40"
                                        )}
                                    >
                                        <span className="text-sm font-medium">{opt.label}</span>
                                        {style === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'layout':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">규격 설정</h3>
                            <p className="text-sm text-muted-foreground">슬라이드의 화면 비율을 선택합니다.</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">화면 비율</Label>
                            <div className="grid gap-3">
                                {RATIO_OPTIONS.map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => setRatio(opt.value)}
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 flex items-center gap-4 hover:border-primary/50 transition-all",
                                            ratio === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/40"
                                        )}
                                    >
                                        <div className={cn("border-2 border-foreground/20 rounded bg-background",
                                            opt.value === '16:9' ? "w-12 h-[27px]" :
                                                opt.value === '4:3' ? "w-10 h-[30px]" : "w-8 h-8"
                                        )} />
                                        <div>
                                            <div className="font-medium text-sm">{opt.label}</div>
                                            <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                        </div>
                                        {ratio === opt.value && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-background text-foreground transition-colors duration-500">
            {/* Hidden Inputs */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            <input type="file" ref={templateInputRef} className="hidden" accept=".json,.pptx" onChange={handleTemplateImport} />
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoSelect} />
            <input type="file" ref={refInputRef} multiple className="hidden" accept="image/*" onChange={handleReferenceSelect} />

            {/* Reference Side Panel (Sheet-like) */}
            {showRefPanel && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity" onClick={() => setShowRefPanel(false)} />
            )}

            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background shadow-2xl transition-transform duration-300 ease-in-out border-l flex flex-col",
                showRefPanel ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
                    <div className="space-y-0.5">
                        <h2 className="font-semibold text-lg">프롬프트 (참고 자료)</h2>
                        <p className="text-xs text-muted-foreground">슬라이드 생성에 반영할 이미지들을 추가하세요.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowRefPanel(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload Area */}
                    <div
                        className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/10 group"
                        onClick={() => refInputRef.current?.click()}
                    >
                        <div className="p-3 bg-background rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <ImagePlus className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">참고 이미지 업로드</h3>
                        <p className="text-sm text-muted-foreground">클릭하여 여러 장의 이미지를 선택하세요</p>
                    </div>

                    {/* Admin Curated Prompts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Admin Prompts</span>
                        </div>
                        <div className="space-y-3">
                            {(TEMPLATES.find(t => t.adminReferences)?.adminReferences?.prompts || [
                                "Keep layouts high-impact and editorial.",
                                "Prioritize legibility with chunky typography.",
                                "Use vibrant gradients for a modern tech vibe."
                            ]).map((p, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-all" />
                                    "{p}"
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mood Board Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ImageIcon className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Mood Board</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {(TEMPLATES.find(t => t.adminReferences)?.adminReferences?.images || [
                                "/ref_minimalist_aesthetic.png",
                                "/ref_vibrant_gradient.png",
                                "/ref_dark_premium.png"
                            ]).map((img, i) => (
                                <div key={i} className="group relative aspect-[16/9] rounded-xl overflow-hidden border bg-slate-50 shadow-sm">
                                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Reference" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-muted/50">
                    <Button className="w-full h-11 rounded-xl text-sm font-semibold" onClick={() => setShowRefPanel(false)}>
                        반영하기
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <section className="pt-32 pb-20 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-2xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Header */}
                    <div className="text-center mb-8 space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border bg-muted/50 text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 fill-current" />
                            <span>Gemini 3.0 Engine</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            What will you create?
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Generate beautiful presentations in seconds.
                        </p>
                    </div>

                    {/* The Input Box (Card Style) */}
                    <div className="relative bg-background border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all">

                        {/* TextArea */}
                        <textarea
                            placeholder="Describe your presentation topic..."
                            className="w-full bg-transparent border-none outline-none text-base p-4 min-h-[80px] resize-none placeholder:text-muted-foreground/60 scrollbar-hide"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />

                        {/* Combined Active Chips & File Preview Area */}
                        {(attachedFile || logoFile || primaryColor !== '#3b82f6' || domain || subDomain || style || ratio) && (
                            <div className="px-4 pb-3 flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-200">
                                {attachedFile && (
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted/80 rounded-md text-xs font-medium border">
                                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="max-w-[150px] truncate leading-none">{attachedFile.name}</span>
                                        <button onClick={removeAttachedFile} className="hover:text-destructive ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                {ActiveFilterChips}
                            </div>
                        )}

                        {/* Toolbar (Bottom of Input) */}
                        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 rounded-b-xl">
                            <div className="flex items-center gap-2">
                                {/* 1. Attachment Button (Left) */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>

                                <div className="h-4 w-[1px] bg-border mx-1" />

                                {/* 2. Option Button (Dialog Trigger) */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className={cn("h-8 gap-2 text-xs font-medium", (logoFile || domain || subDomain || primaryColor !== '#3b82f6' || style || ratio) && "border-primary text-primary bg-primary/5")}>
                                            <Settings2 className="w-3.5 h-3.5" />
                                            <span>Option</span>
                                            {(logoFile || domain || subDomain || primaryColor !== '#3b82f6' || style || ratio) && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px] h-[500px] p-0 flex flex-col gap-0 overflow-hidden">
                                        <div className="h-14 flex items-center px-6 border-b shrink-0 bg-background/50 backdrop-blur-sm z-10">
                                            <DialogTitle className="font-semibold">프레젠테이션 옵션</DialogTitle>
                                            <DialogDescription className="sr-only">Presentation options settings</DialogDescription>
                                        </div>

                                        <div className="flex-1 flex overflow-hidden">
                                            {/* Sidebar */}
                                            <div className="w-48 border-r bg-muted/20 flex flex-col gap-1 p-2">
                                                {OPTION_CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setActiveCategory(cat.id)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                                                            activeCategory === cat.id
                                                                ? "bg-background shadow-sm text-foreground"
                                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        {cat.icon && <cat.icon className="w-4 h-4" />}
                                                        {cat.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Main Content Pane */}
                                            <div className="flex-1 overflow-y-auto p-6 bg-background">
                                                <OptionContent />
                                            </div>
                                        </div>

                                        {/* Footer Pane */}
                                        <div className="h-16 border-t bg-muted/10 flex items-center justify-between px-6 shrink-0">
                                            <div className="flex flex-wrap gap-2 max-w-[70%] overflow-hidden h-8">
                                                {ActiveFilterChips}
                                            </div>
                                            <DialogClose asChild>
                                                <Button className="rounded-lg px-6">적용하기</Button>
                                            </DialogClose>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                {/* 3. Prompt (Reference) Button */}
                                <Button
                                    variant={referenceImages.length > 0 ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn("h-8 gap-2 text-xs font-medium", referenceImages.length > 0 && "text-primary bg-primary/10")}
                                    onClick={() => setShowRefPanel(true)}
                                >
                                    <Library className="w-3.5 h-3.5" />
                                    <span>프롬프트</span>
                                    {referenceImages.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{referenceImages.length}</span>}
                                </Button>
                            </div>

                            {/* Right Side: Generate Button (Modified Payload) */}
                            <div className="ml-auto">
                                <Button
                                    className="rounded-xl px-4 h-9 font-semibold text-xs shadow-md transition-all hover:scale-105 active:scale-95 bg-foreground text-background hover:bg-foreground/90"
                                    onClick={() => prompt && onGenerateStart(prompt, parseInt(slideCount), attachedFile, { logo: logoFile, primaryColor, domain: domain || 'Public', subDomain: subDomain || 'General', style: style || 'Minimalist', ratio: ratio || '16:9' }, referenceImages)}
                                    disabled={!prompt}
                                >
                                    <Sparkles className="w-3.5 h-3.5 mr-2 fill-current" />
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Template Gallery Section (Pinterest Inspired) */}
            <section className="px-8 pb-24 max-w-7xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">

                        <h2 className="text-[20px] font-medium tracking-tight">Slide Template</h2>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative w-48 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="템플릿 검색..."
                                className="pl-9 h-9 rounded-full bg-muted/50 border-none text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-muted/50 p-1 rounded-full border border-slate-100">
                            {CATEGORIES.slice(0, 4).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
                                        selectedCategory === cat ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {cat === 'All' ? '전체' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* The Template Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {/* Special Action: Custom Import */}
                    <div
                        className="group flex flex-col gap-4 cursor-pointer"
                        onClick={() => templateInputRef.current?.click()}
                    >
                        <div className="aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3 transition-all group-hover:bg-slate-50 group-hover:border-primary/30 group-hover:scale-[1.02]">
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <span className="text-[13px] font-bold text-slate-600 block">내 템플릿 추가</span>
                                <span className="text-[10px] text-slate-400">PPTX 또는 JSON 가져오기</span>
                            </div>
                        </div>
                    </div>

                    {filteredTemplates.map(t => (
                        <div
                            key={t.id}
                            className="group flex flex-col gap-4 cursor-pointer animate-in fade-in zoom-in-95 duration-500"
                            onClick={() => onSelectTemplate(t)}
                        >
                            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                                {t.previewUrl ? (
                                    <img src={t.previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={t.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[10px] text-muted-foreground font-medium uppercase tracking-widest bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                                        {t.name}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2">
                                        템플릿 사용하기
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {t.category && (
                                    <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 border-none text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                        {t.category}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1.5 px-1">
                                <h3 className="font-bold text-[14px] text-slate-900 leading-tight flex items-center justify-between">
                                    {t.name}
                                    {t.adminReferences && <Sparkles className="w-3 h-3 text-amber-400 fill-current" />}
                                </h3>
                                <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
