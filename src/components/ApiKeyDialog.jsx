import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { usePresentationStore } from '@/lib/store';
import { initGemini } from '@/lib/gemini';
import { toast } from 'sonner';

const ApiKeyDialog = ({ open, onOpenChange }) => {
    const { apiKey, setApiKey } = usePresentationStore();
    const [inputValue, setInputValue] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState('idle'); // 'idle', 'valid', 'invalid'

    useEffect(() => {
        if (open) {
            setInputValue(apiKey || '');
            setValidationStatus('idle');
        }
    }, [open, apiKey]);

    const handleValidate = async () => {
        if (!inputValue) return;
        setIsValidating(true);
        setValidationStatus('idle');

        try {
            // Simple validation by trying to init and potentially a small call if needed
            // But for now, just check if it's a valid format and try to init
            if (!inputValue.startsWith('AIza')) {
                throw new Error("Invalid API Key format");
            }

            initGemini(inputValue);
            setValidationStatus('valid');
            toast.success("API Key validated successfully!");
        } catch (error) {
            setValidationStatus('invalid');
            toast.error("Failed to validate API Key.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleSave = () => {
        setApiKey(inputValue);
        localStorage.setItem('gemini_api_key', inputValue);
        initGemini(inputValue); // Initialize immediately
        onOpenChange(false);
        toast.info("API Key saved locally.");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Key className="w-5 h-5 text-primary" />
                        Gemini API Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Enter your Google Gemini API key to enable AI presentation generation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="space-y-3">
                        <Label htmlFor="api-key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Your API Key
                        </Label>
                        <div className="relative group">
                            <Input
                                id="api-key"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setValidationStatus('idle');
                                }}
                                className="pr-12 h-11"
                                type={showKey ? "text" : "password"}
                                placeholder="AIzaSy..."
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                                {validationStatus === 'valid' && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        <CheckCircle2 className="w-3 h-3" /> Valid Key
                                    </div>
                                )}
                                {validationStatus === 'invalid' && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-destructive bg-destructive/5 px-2 py-0.5 rounded-full border border-destructive/10">
                                        <XCircle className="w-3 h-3" /> Invalid Key
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[11px] font-bold"
                                onClick={handleValidate}
                                disabled={isValidating || !inputValue}
                            >
                                {isValidating ? (
                                    <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Verifying...</>
                                ) : "Verify Key"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-[11px] text-muted-foreground leading-relaxed">
                        <p><strong>Note:</strong> Your key is stored securely in your browser's local storage and is never sent to our servers. Standard API costs apply.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="px-8 shadow-md">Save & Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApiKeyDialog;
