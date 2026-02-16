import { z } from 'zod';

export const ThemeSchema = z.object({
    bg: z.string().describe("Background color hex code"),
    text: z.string().describe("Text color hex code"),
    accent: z.string().describe("Accent color hex code"),
});

export const SlideSchema = z.object({
    id: z.string().optional(),
    type: z.enum(['cover', 'index', 'divider', 'body1', 'body2']).describe("Slide template type"),
    title: z.string().describe("Slide title"),
    content: z.string().describe("Slide main content"),
    theme: ThemeSchema,
    layoutStyle: z.enum(['centered', 'split', 'hero-left', 'hero-right', 'content-focused']).describe("Visual layout style"),
    accentShape: z.enum(['clean-border', 'diagonal', 'bottom-bar', 'floating-blobs']).describe("Accent shape style"),
    visualElement: z.string().optional().describe("Prompt for AI image or icon generation"),
    designRationale: z.string().describe("AI justification for design choices"),
    chartData: z.array(z.object({
        name: z.string(),
        value: z.number()
    })).optional().describe("Optional data for chart rendering"),
});

export const PresentationSchema = z.object({
    title: z.string().describe("Main presentation title"),
    subtitle: z.string().optional().describe("Main presentation subtitle"),
    designStrategy: z.string().describe("Overall visual strategy for the presentation"),
    slides: z.array(SlideSchema).min(1).describe("List of slides"),
});
