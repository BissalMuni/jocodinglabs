import Anthropic from '@anthropic-ai/sdk';

export interface AnalyzedTech {
  name: string;
  description: string;
  url: string;
  suggestedCategory: string;
}

export interface AnalyzerResult {
  videoTitle: string;
  items: AnalyzedTech[];
}

export async function analyzeTranscript(
  transcript: string,
  videoUrl: string,
  existingCategories: string[] = [],
  videoDescription?: string | null,
): Promise<AnalyzerResult> {
  const client = new Anthropic();

  const categoryInstruction = existingCategories.length > 0
    ? `Use one of these existing categories if applicable: ${existingCategories.join(', ')}. If none of them fit well, suggest a new short category name in Korean (e.g. "로봇/하드웨어", "검색 엔진", "3D 생성" etc).`
    : `Suggest an appropriate short category name in Korean (e.g. "이미지 생성", "영상 생성", "코딩 도구", "챗봇/에이전트" etc).`;

  const systemPrompt = `You are an AI technology analyst. Analyze the following YouTube video transcript and extract all AI technologies, tools, and services mentioned.

You will receive:
1. The video transcript (자막)
2. The video description table of contents (영상 목차) if available — use this to identify which technologies are covered and cross-reference with the transcript for accurate extraction.

For each technology, provide:
1. name: The official name of the technology/tool
2. description: A brief description in Korean (1-2 sentences)
3. url: The official homepage or product page URL. Do NOT extract URLs from the transcript. Instead, use your own knowledge to look up the correct official URL for each technology (e.g. "https://openai.com/chatgpt", "https://claude.ai", "https://gemini.google.com", "https://github.com/features/copilot", "https://www.midjourney.com"). Only return "" if you truly do not know the official URL.
4. suggestedCategory: ${categoryInstruction}

IMPORTANT: Use the table of contents (목차) as a guide to ensure you don't miss any technologies mentioned in the video. Each timestamp entry typically corresponds to a technology or topic discussed.

Respond ONLY with valid JSON in this format:
{
  "videoTitle": "Video title inferred from content",
  "items": [
    { "name": "...", "description": "...", "url": "...", "suggestedCategory": "..." }
  ]
}

If no AI technologies are found, return {"videoTitle": "...", "items": []}`;

  // Build user message with transcript + description
  let userContent = `다음 YouTube 영상의 자막을 분석하여 소개된 AI 기술들을 추출해주세요.\n\n영상 URL: ${videoUrl}`;

  if (videoDescription) {
    userContent += `\n\n${videoDescription}`;
  }

  userContent += `\n\n자막:\n${transcript.slice(0, 30000)}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: userContent,
      },
    ],
    system: systemPrompt,
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('LLM 응답에서 텍스트를 찾을 수 없습니다');
  }

  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found in response');
    return JSON.parse(jsonMatch[0]) as AnalyzerResult;
  } catch {
    throw new Error('LLM 응답을 파싱할 수 없습니다');
  }
}
