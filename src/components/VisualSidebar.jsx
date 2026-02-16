import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sparkles, Image as ImageIcon, Box, Layers, Download, Loader2 } from 'lucide-react';
import { generateVisualAsset } from '@/lib/gemini';
import { toast } from "sonner";

const VisualSidebar = ({ apiKey }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAssets, setGeneratedAssets] = useState([]); // Array of { type, url, prompt }

    const handleGenerate = async (type) => {
        if (!apiKey) {
            toast.error("Please set your API Key first.");
            return;
        }
        if (!prompt) {
            toast.error("Please enter a prompt.");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateVisualAsset(prompt, type);
            if (result.success) {
                setGeneratedAssets(prev => [{ ...result, type, id: Date.now() }, ...prev]);
                toast.success(`${type.toUpperCase()} Asset Generated!`);
            }
        } catch (error) {
            toast.error("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card border-l w-80">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                    <img src="/creon-logo.png" alt="" className="w-5 h-5 rounded-full bg-primary/10" onError={(e) => e.target.style.display = 'none'} />
                    Visual Assets Studio
                </h2>
                {/* Optional: Add history button or settings here */}
            </div>

            <Tabs defaultValue="3d" className="flex-1 flex flex-col">
                <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="2d" className="text-xs">2D</TabsTrigger>
                        <TabsTrigger value="3d" className="text-xs">3D</TabsTrigger>
                        <TabsTrigger value="image" className="text-xs">Image</TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-4 flex-1 flex flex-col min-h-0">

                    <TabsContent value="2d" className="mt-0 space-y-4 flex-col flex h-full">
                        <div className="space-y-4">
                            <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                                <Layers className="w-10 h-10 mx-auto text-primary/50 mb-2" />
                                <p className="text-xs text-muted-foreground">Generate flat, vector-style icons for your slides.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Prompt</Label>
                                <Input
                                    placeholder="e.g. Rocket ship taking off"
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => handleGenerate('2d')}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Generate 2D Icon
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="3d" className="mt-0 space-y-4 flex-col flex h-full">
                        <div className="space-y-4">
                            <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                                <Box className="w-10 h-10 mx-auto text-primary/50 mb-2" />
                                <p className="text-xs text-muted-foreground">Create stunning 3D rendered assets.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Prompt</Label>
                                <Input
                                    placeholder="e.g. Glossy toolbox with gears"
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => handleGenerate('3d')}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Generate 3D Asset
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="image" className="mt-0 space-y-4 flex-col flex h-full">
                        <div className="space-y-4">
                            <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                                <ImageIcon className="w-10 h-10 mx-auto text-primary/50 mb-2" />
                                <p className="text-xs text-muted-foreground">Generate photorealistic images or illustrations.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Prompt</Label>
                                <Input
                                    placeholder="e.g. Office meeting in a modern glass building"
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => handleGenerate('image')}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Generate Image
                            </Button>
                        </div>
                    </TabsContent>

                    <div className="mt-6 flex-1 min-h-0 flex flex-col">
                        <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-3">Recently Generated</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {generatedAssets.length === 0 ? (
                                <div className="text-xs text-center py-10 text-muted-foreground">No assets generated yet.</div>
                            ) : (
                                generatedAssets.map(asset => (
                                    <Card key={asset.id} className="p-2 overflow-hidden group relative">
                                        <img src={asset.imageUrl} alt={asset.prompt} className="w-full h-32 object-cover rounded-md bg-muted" />
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{asset.prompt}</div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <Download className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm uppercase">
                                            {asset.type}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </Tabs>
        </div>
    );
};

export default VisualSidebar;
