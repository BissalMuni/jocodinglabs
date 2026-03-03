import Anthropic from '@anthropic-ai/sdk';

export interface EnrichmentResult {
  techItemId: number;
  name: string;
  url: string | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Use Claude to find the official URL for a tech item based on its name and description.
 */
export async function findOfficialUrl(
  name: string,
  description: string,
): Promise<{ url: string | null; confidence: 'high' | 'medium' | 'low' }> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Find the official homepage URL for this AI technology:\n\nName: ${name}\nDescription: ${description}\n\nRespond ONLY with valid JSON:\n{"url": "https://...", "confidence": "high|medium|low"}\n\n- "high": You are very confident this is the correct official URL\n- "medium": Likely correct but could be wrong\n- "low": Uncertain\n- If you don't know, return {"url": null, "confidence": "low"}`,
      },
    ],
    system: 'You are a precise URL lookup assistant. Return only the official homepage/product page URL for the given AI technology. Do not guess — if unsure, return null. Always respond with valid JSON only.',
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return { url: null, confidence: 'low' };
  }

  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { url: null, confidence: 'low' };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      url: typeof parsed.url === 'string' ? parsed.url : null,
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence)
        ? parsed.confidence
        : 'low',
    };
  } catch {
    return { url: null, confidence: 'low' };
  }
}

/**
 * Batch enrich URLs for tech items that have no URL set.
 */
export async function enrichUrlsBatch(
  items: Array<{ id: number; name: string; description: string }>,
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];

  for (const item of items) {
    try {
      const { url, confidence } = await findOfficialUrl(item.name, item.description);
      results.push({
        techItemId: item.id,
        name: item.name,
        url,
        confidence,
      });
    } catch {
      results.push({
        techItemId: item.id,
        name: item.name,
        url: null,
        confidence: 'low',
      });
    }
  }

  return results;
}
