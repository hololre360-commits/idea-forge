import type { Report } from '@/types';
import { z } from 'zod';

const reportSchema = z.object({
  summary: z.string().min(10),
  score: z.number().min(0).max(100),
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  targetAudience: z.string().min(5),
  monetization: z.string().min(5),
  risks: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1),
});

export function parseAIResponse(text: string): Report | null {
  // Try plain-text protocol first (SUMMARY:, SCORE: etc)
  const tryPlainText = (): Report | null => {
    const getSection = (label: string): string => {
      const regex = new RegExp(`${label}:\s*([\s\S]*?)(?=\n[A-Z_]+:|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    const summary = getSection('SUMMARY');
    const scoreStr = getSection('SCORE') || getSection('SCORES');
    const prosText = getSection('PROS');
    const consText = getSection('CONS');
    const audience = getSection('TARGET_AUDIENCE') || getSection('AUDIENCE');
    const monetization = getSection('MONETIZATION');
    const risksText = getSection('RISKS');
    const nextStepsText = getSection('NEXT_STEPS') || getSection('NEXTSTEPS');

    if (!summary || !scoreStr) return null;

    const score = parseInt(scoreStr.match(/\d+/)?.[0] || '50', 10);

    const parseList = (txt: string): string[] => 
      txt.split(/\n|•|-|\d+\./).map(s => s.trim()).filter(Boolean).slice(0, 8);

    const report: Report = {
      summary,
      score: Math.min(100, Math.max(0, score)),
      pros: parseList(prosText),
      cons: parseList(consText),
      targetAudience: audience || 'General consumers and early adopters in tech.',
      monetization,
      risks: parseList(risksText),
      nextSteps: parseList(nextStepsText),
    };

    // Validate with zod
    const parsed = reportSchema.safeParse(report);
    return parsed.success ? parsed.data : null;
  };

  // Fallback: try to extract JSON (with repair for truncated)
  const tryJSON = (): Report | null => {
    try {
      // Find JSON object in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      let jsonStr = jsonMatch[0];
      
      // Repair common truncation issues
      if (!jsonStr.endsWith('}')) {
        jsonStr += '"}';
        // Try to close arrays/objects
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) {
          jsonStr += '}';
        }
      }

      const parsed = JSON.parse(jsonStr);
      
      // Normalize keys (case insensitive, snake to camel if needed)
      const normalized: any = {
        summary: parsed.summary || parsed.SUMMARY || '',
        score: Number(parsed.score || parsed.SCORE || 50),
        pros: Array.isArray(parsed.pros) ? parsed.pros : (parsed.PROS ? String(parsed.PROS).split('\n') : []),
        cons: Array.isArray(parsed.cons) ? parsed.cons : (parsed.CONS ? String(parsed.CONS).split('\n') : []),
        targetAudience: parsed.targetAudience || parsed.TARGET_AUDIENCE || parsed.audience || '',
        monetization: parsed.monetization || parsed.MONETIZATION || '',
        risks: Array.isArray(parsed.risks) ? parsed.risks : (parsed.RISKS ? String(parsed.RISKS).split('\n') : []),
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : (parsed.NEXT_STEPS ? String(parsed.NEXT_STEPS).split('\n') : []),
      };

      const validated = reportSchema.safeParse(normalized);
      return validated.success ? validated.data : null;
    } catch {
      return null;
    }
  };

  return tryPlainText() || tryJSON();
}

export function createSystemPrompt(mode: 'quick' | 'forge', idea: string): string {
  const base = `You are an expert startup validator and investor with 15+ years experience. 
Analyze the following startup idea objectively and provide a structured validation report.

Startup Idea:
"""
${idea}
"""

Respond ONLY in the following exact format (use the delimiters exactly):

SUMMARY: [2-4 sentence executive summary of the idea's core value prop and viability]

SCORE: [integer 0-100] 

PROS:
- [strength 1]
- [strength 2]
...

CONS:
- [weakness 1]
- [weakness 2]
...

TARGET_AUDIENCE: [1-2 sentences describing primary users/customers]

MONETIZATION: [1-2 sentences on realistic revenue model(s)]

RISKS:
- [risk 1]
- [risk 2]
...

NEXT_STEPS:
- [actionable step 1]
- [actionable step 2]
...

Be concise, specific, and honest. Avoid generic advice. Focus on this exact idea.`;

  if (mode === 'forge') {
    return base + `\n\nThis is part of a multi-model Forge research pipeline. Provide deep, critical analysis suitable for cross-validation with other LLMs.`;
  }
  return base;
}