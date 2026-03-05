import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, LayoutGrid, Layout as LayoutIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-component Layouts ---

const CoverLayout = ({ slide, theme }) => {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-20 overflow-hidden" style={{ backgroundColor: theme.bg, color: theme.text }}>
            {/* Material Design abstract shapes (Flat, no blur) */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-10" style={{ backgroundColor: theme.accent }} />
            <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full opacity-5" style={{ backgroundColor: theme.text }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="z-10 text-center space-y-10 max-w-5xl"
            >
                {slide.icon && (
                    <div className="w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-8 shadow-sm" style={{ backgroundColor: theme.accent }}>
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                )}

                <h1 className="text-7xl md:text-[6rem] font-bold tracking-tight leading-[1.1]">
                    {slide.title}
                </h1>

                {slide.subtitle && (
                    <div className="inline-block px-8 py-3 rounded-full mt-6" style={{ backgroundColor: `${theme.accent}15` }}>
                        <p className="text-2xl md:text-3xl font-medium" style={{ color: theme.accent }}>
                            {slide.subtitle}
                        </p>
                    </div>
                )}

                {slide.content && (
                    <div className="mt-12 text-xl md:text-2xl opacity-75 max-w-3xl mx-auto leading-relaxed">
                        {slide.content}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const BentoGridLayout = ({ slide, theme }) => {
    const bentoItems = slide.chartData || [
        { name: "Growth", value: "145%" },
        { name: "Engagement", value: "2.4M" },
        { name: "Retention", value: "98%" }
    ];

    return (
        <div className="relative w-full h-full p-16 flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12 flex items-center justify-between"
            >
                <h2 className="text-5xl font-bold tracking-tight">{slide.title}</h2>
                <div className="flex items-center gap-3 px-5 py-2 rounded-full" style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>
                    <LayoutGrid className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-widest uppercase">{slide.type === 'index' ? 'Overview' : 'Highlights'}</span>
                </div>
            </motion.div>

            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-8 w-full h-full">
                {/* Main large Material Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-2 row-span-2 rounded-[2.5rem] p-12 relative overflow-hidden shadow-sm"
                    style={{ backgroundColor: theme.cardBg || '#ffffff' }}
                >
                    <h3 className="text-3xl font-bold mb-6 opacity-90">Core Concept</h3>
                    <p className="text-2xl leading-relaxed opacity-75 max-w-2xl">
                        {slide.content}
                    </p>

                    {slide.visualElement && (
                        <div className="absolute bottom-12 right-12 text-right opacity-30 italic max-w-sm font-medium">
                            " {slide.visualElement} "
                        </div>
                    )}
                </motion.div>

                {/* Smaller metric Material Cards */}
                {bentoItems.slice(0, 2).map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="rounded-[2.5rem] p-10 flex flex-col justify-center shadow-sm relative overflow-hidden group"
                        style={{ backgroundColor: theme.cardBg || '#ffffff' }}
                    >
                        <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: theme.accent, opacity: 0.2 }} />
                        <span className="text-xl opacity-60 font-medium mb-2">{item.name}</span>
                        <span className="text-6xl font-bold tracking-tight" style={{ color: theme.accent }}>{item.value || (idx + 1) * 20 + '%'}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const ShowcaseLayout = ({ slide, theme }) => {
    return (
        <div className="relative w-full h-full flex" style={{ backgroundColor: theme.bg, color: theme.text }}>
            {/* Image/Visual Side - Flat */}
            <div className="w-1/2 h-full relative overflow-hidden" style={{ backgroundColor: `${theme.accent}10` }}>
                {slide.backgroundImage ? (
                    <img src={slide.backgroundImage} alt="Slide Visual" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-32 h-32 rounded-full mb-8 flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>
                        <p className="opacity-40 text-xl font-medium">{slide.visualElement || "Visual Asset Area"}</p>
                    </div>
                )}
            </div>

            {/* Content Side */}
            <div className="w-1/2 h-full p-24 flex flex-col justify-center relative">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-5xl md:text-[4rem] font-bold tracking-tight mb-10 leading-tight">
                        {slide.title}
                    </h2>

                    <p className="text-2xl leading-relaxed opacity-75">
                        {slide.content}
                    </p>

                    {slide.subtitle && (
                        <div className="mt-14 inline-block px-6 py-3 rounded-full" style={{ backgroundColor: `${theme.accent}15` }}>
                            <p className="font-bold text-lg" style={{ color: theme.accent }}>{slide.subtitle}</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const IndexLayout = ({ slide, theme }) => {
    const items = slide.content.split('\n').filter(i => i.trim());
    return (
        <div className="relative w-full h-full p-24 flex flex-col justify-center" style={{ backgroundColor: theme.bg, color: theme.text }}>
            {/* Flat large decorative circle */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-5 pointer-events-none" style={{ backgroundColor: theme.text }} />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-20 z-10"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: theme.accent }}>Table of Contents</span>
                </div>
                <h2 className="text-6xl md:text-[5rem] font-bold tracking-tight">{slide.title}</h2>
            </motion.div>

            <div className="grid grid-cols-2 gap-x-24 gap-y-12 z-10 w-4/5">
                {items.map((item, idx) => {
                    const number = item.match(/^(\d+)[.\s]/);
                    const text = item.replace(/^(\d+)[.\s]/, '').trim();
                    const numStr = number ? number[1].padStart(2, '0') : String(idx + 1).padStart(2, '0');
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            className="flex items-center gap-8 group"
                        >
                            <div className="w-20 h-20 flex-shrink-0 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm"
                                style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>
                                {numStr}
                            </div>
                            <div className="pt-2">
                                <h3 className="text-2xl font-bold opacity-90">{text}</h3>
                                <div className="h-1 w-12 mt-4 rounded-full" style={{ backgroundColor: theme.accent, opacity: 0.2 }} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const DividerLayout = ({ slide, theme }) => {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-20 overflow-hidden" style={{ backgroundColor: theme.accent, color: theme.bg }}>
            {/* Pure Material Flat background */}
            <div className="absolute top-0 right-0 w-[80%] h-full rounded-l-[10rem] opacity-10" style={{ backgroundColor: theme.bg }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="z-10 text-center max-w-4xl"
            >
                <div className="inline-block px-8 py-3 rounded-full mb-10 shadow-sm" style={{ backgroundColor: theme.bg, color: theme.text }}>
                    <p className="text-xl font-bold uppercase tracking-widest opacity-80">{slide.subtitle || 'Next Section'}</p>
                </div>
                <h2 className="text-6xl md:text-[6rem] font-bold tracking-tight leading-[1.1] drop-shadow-sm mb-6">
                    {slide.title}
                </h2>
                {slide.content && (
                    <div className="mt-12 text-2xl font-medium opacity-90 leading-relaxed max-w-2xl mx-auto">
                        {slide.content}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// --- Premium Editorial (Spoke) Layouts ---

const PremiumCoverSpoke = ({ slide, theme, projectName }) => {
    return (
        <div className="absolute inset-0 flex flex-col justify-between p-16 z-20 overflow-hidden select-none bg-black text-[#D1D1C4] font-sans">
            <div className="flex justify-between items-start z-10 w-full opacity-60">
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium">{projectName}</span>
            </div>
            <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-[60%] h-[100%] opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-current">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.25" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.25" />
                    <line x1="15" y1="15" x2="85" y2="85" stroke="currentColor" strokeWidth="0.25" />
                    <line x1="85" y1="15" x2="15" y2="85" stroke="currentColor" strokeWidth="0.25" />
                </svg>
            </div>
            <div className="max-w-[80%] z-10 flex flex-col mt-auto mb-4">
                <h1 className="font-bold tracking-[-0.05em] leading-[1.05] uppercase text-[#D1D1C4]" style={{ fontSize: '3.25rem' }}>
                    {(slide.title || "STRATEGY PROPOSAL").split(' ').map((word, i) => (
                        <div key={i} className="whitespace-nowrap">{word}</div>
                    ))}
                </h1>
            </div>
            <div className="flex justify-between items-end z-10 w-full opacity-60">
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium">{slide.subtitle || "CONFIDENTIAL"}</span>
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium text-right">
                    {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                </span>
            </div>
        </div>
    );
};

const PremiumAgendaSpoke = ({ slide, projectName }) => {
    const items = slide.content ? slide.content.split('\n').filter(l => l.trim()) : [];
    return (
        <div className="absolute inset-0 flex flex-col justify-between p-16 z-20 overflow-hidden select-none bg-white text-black font-sans">
            <div className="flex justify-between items-start z-10 w-full opacity-60">
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium">{projectName}</span>
            </div>
            <div className="absolute top-4 -right-20 w-[45%] h-[45%] opacity-90 pointer-events-none text-black">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <line
                            key={i}
                            x1="50" y1="50"
                            x2={50 + 45 * Math.cos((i * 22.5) * Math.PI / 180)}
                            y2={50 + 45 * Math.sin((i * 22.5) * Math.PI / 180)}
                            stroke="currentColor"
                            strokeWidth="0.5"
                        />
                    ))}
                </svg>
            </div>
            <div className="z-10 mt-4">
                <h1 className="text-[4rem] font-bold tracking-tight uppercase">AGENDA</h1>
            </div>
            <div className="max-w-[85%] z-10 flex flex-col gap-2 mt-auto mb-16">
                {items.map((item, i) => (
                    <div key={i} className="text-[1.25rem] font-medium tracking-tight whitespace-nowrap">{item}</div>
                ))}
            </div>
            <div className="flex justify-between items-end z-10 w-full opacity-60">
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium">{slide.subtitle || "CONTENTS"}</span>
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium text-right">
                    {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                </span>
            </div>
        </div>
    );
};

const PremiumSectionSpoke = ({ slide, projectName }) => {
    return (
        <div className="absolute inset-0 flex flex-col justify-between p-16 z-20 overflow-hidden select-none bg-[#DBD7CA] text-black font-sans">
            <div className="flex justify-between items-start z-10 w-full opacity-60">
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium">{projectName}</span>
            </div>
            <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-[60%] h-[90%] opacity-100 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.25" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.25" />
                    <line x1="15" y1="15" x2="85" y2="85" stroke="currentColor" strokeWidth="0.25" />
                    <line x1="85" y1="15" x2="15" y2="85" stroke="currentColor" strokeWidth="0.25" />
                </svg>
            </div>
            <div className="max-w-[85%] z-10 flex flex-col mt-auto mb-4">
                <h1 className="font-bold tracking-[-0.05em] leading-[1.0] uppercase text-black" style={{ fontSize: '3.25rem' }}>
                    {(slide.title || "NEW SECTION").split(' ').map((word, i) => (
                        <div key={i} className="whitespace-nowrap">{word}</div>
                    ))}
                </h1>
            </div>
            <div className="flex justify-between items-end z-10 w-full opacity-60">
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium">{slide.subtitle || "SECTION BREAK"}</span>
                <span className="text-[11px] font-mono tracking-[0.4em] uppercase font-medium text-right">
                    {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                </span>
            </div>
        </div>
    );
};

const ModernEditorialLayout = ({ slide, theme, slideImage }) => {
    const contentParts = slide.content ? slide.content.split('\n\n') : [];
    const parts = contentParts.length >= 2 ? contentParts : [
        contentParts[0] || "Discovering strategic insights and market opportunities to drive sustainable growth.",
        "Our approach ensures high-density, professional content tailored to your specific goals."
    ];
    const layoutProps = slide.layoutProps || {};

    return (
        <div className="relative w-full h-full flex flex-col p-16" style={{ backgroundColor: theme.bg, color: theme.text }}>
            <div className="flex flex-col gap-4 mb-4">
                <h2 className="text-[2rem] font-bold tracking-tight leading-tight">{slide.title}</h2>
                {slide.subtitle && <p className="text-[1.25rem] opacity-60 font-medium">{slide.subtitle}</p>}
                <div className="h-[2px] w-full rounded-full opacity-10 bg-current mt-2" />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-16 pt-8">
                <div className="flex flex-col gap-5">
                    <p className="opacity-95 text-[1rem] leading-[1.8]">{parts[0]}</p>
                    <p className="opacity-70 text-[0.875rem] leading-[1.7]">{parts[1]}</p>
                    {layoutProps.accentNote && (
                        <div className="mt-auto pt-6 border-t border-current/10">
                            <p className="font-bold text-[0.875rem]" style={{ color: theme.accent }}>{layoutProps.accentNote}</p>
                        </div>
                    )}
                </div>
                <div className="h-full rounded-3xl relative overflow-hidden flex items-center justify-center bg-current/5 border border-current/10">
                    {slideImage ? (
                        <img src={slideImage} className="w-full h-full object-cover" alt="Slide Visual" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-20">
                            <LayoutIcon className="w-12 h-12" />
                            <p className="text-[10px] italic">Visual Asset Area</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main component ---

const PremiumSlideCanvas = ({ slides, ratio = '16:9', previewMode = false, slideImages = {}, projectName = "PROJECT" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const nextSlide = () => setCurrentIndex(p => Math.min((slides?.length || 1) - 1, p + 1));
    const prevSlide = () => setCurrentIndex(p => Math.max(0, p - 1));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides]);

    if (!slides || slides.length === 0) return null;

    const currentSlide = slides[currentIndex];
    const theme = currentSlide?.theme || {
        bg: '#FEFBFA',
        text: '#1C1B1F',
        accent: '#0B57D0',
        cardBg: '#FFFFFF'
    };

    const renderSlideContent = () => {
        // [FULL IMAGE OVERRIDE] If we have a fully pre-rendered image for this slide, show it edge-to-edge
        if (slideImages[currentSlide.type]) {
            return (
                <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                    <img src={slideImages[currentSlide.type]} className="w-full h-full object-contain" alt="AI Generated Slide" />
                </div>
            );
        }

        const layout = currentSlide.layoutStyle || 'modern-editorial';

        // Custom Layout Mapping
        if (layout === 'premium-cover-spoke') return <PremiumCoverSpoke slide={currentSlide} theme={theme} projectName={projectName} />;
        if (layout === 'premium-agenda-spoke') return <PremiumAgendaSpoke slide={currentSlide} projectName={projectName} />;
        if (layout === 'premium-section-spoke') return <PremiumSectionSpoke slide={currentSlide} projectName={projectName} />;
        if (layout === 'modern-editorial') return <ModernEditorialLayout slide={currentSlide} theme={theme} slideImage={null} />;

        // Existing Fallbacks
        if (currentSlide.type === 'cover') return <CoverLayout slide={currentSlide} theme={theme} />;
        if (currentSlide.type === 'index') return <IndexLayout slide={currentSlide} theme={theme} />;
        if (currentSlide.type === 'divider') return <DividerLayout slide={currentSlide} theme={theme} />;

        switch (layout) {
            case 'cover-premium': return <CoverLayout slide={currentSlide} theme={theme} />;
            case 'showcase': return <ShowcaseLayout slide={currentSlide} theme={theme} />;
            case 'bento':
            default:
                return <BentoGridLayout slide={currentSlide} theme={theme} />;
        }
    };

    return (
        <div
            className={cn(
                "relative flex items-center justify-center overflow-hidden",
                isFullscreen ? "fixed inset-0 z-[100] bg-zinc-950" : "w-full h-full rounded-2xl border border-white/10 shadow-2xl bg-zinc-950"
            )}
        >
            <div
                className="relative bg-white overflow-hidden shadow-2xl transition-all duration-500 ease-out"
                style={{
                    aspectRatio: ratio.replace(':', '/'),
                    height: isFullscreen ? '100vh' : '100%',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={previewMode ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={previewMode ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="w-full h-full"
                    >
                        {renderSlideContent()}
                    </motion.div>
                </AnimatePresence>

                {!previewMode && (
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10 z-50">
                        <motion.div
                            className="h-full bg-current opacity-50"
                            style={{ color: theme.accent }}
                            animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}
            </div>

            {!previewMode && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-50 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                        onClick={prevSlide}
                        disabled={currentIndex === 0}
                        className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center pointer-events-auto disabled:opacity-30 hover:bg-black/70 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        disabled={currentIndex === slides.length - 1}
                        className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center pointer-events-auto disabled:opacity-30 hover:bg-black/70 transition-all"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default PremiumSlideCanvas;
