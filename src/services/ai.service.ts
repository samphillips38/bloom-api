import OpenAI from 'openai';
import type { ContentData, ContentBlock, TextSegment } from '../db/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// ═══════════════════════════════════════════════════════
//  JSON Schema for Structured Outputs
// ═══════════════════════════════════════════════════════
// OpenAI's Structured Outputs use constrained decoding to GUARANTEE
// the response matches this schema exactly — no parsing failures possible.
// Rules for strict mode:
//   - Every object must have "additionalProperties": false
//   - All properties must be listed in "required"
//   - Optional fields use { "type": ["string", "null"] } instead of omitting

const TEXT_SEGMENT_SCHEMA = {
  type: 'object' as const,
  properties: {
    text: { type: 'string' as const },
    bold: { type: ['boolean', 'null'] as const },
    italic: { type: ['boolean', 'null'] as const },
    color: {
      type: ['string', 'null'] as const,
      enum: ['accent', 'secondary', 'success', 'warning', 'blue', 'purple', null],
    },
    definition: { type: ['string', 'null'] as const },
  },
  required: ['text', 'bold', 'italic', 'color', 'definition'],
  additionalProperties: false,
};

const CONTENT_BLOCK_SCHEMA = {
  type: 'object' as const,
  properties: {
    type: {
      type: 'string' as const,
      enum: ['heading', 'paragraph', 'image', 'math', 'callout', 'bulletList', 'spacer', 'divider'],
    },
    // heading / paragraph / callout
    segments: {
      type: ['array', 'null'] as const,
      items: TEXT_SEGMENT_SCHEMA,
    },
    // heading
    level: { type: ['integer', 'null'] as const, enum: [1, 2, 3, null] },
    // image
    src: { type: ['string', 'null'] as const },
    caption: { type: ['string', 'null'] as const },
    // math
    latex: { type: ['string', 'null'] as const },
    // callout
    style: {
      type: ['string', 'null'] as const,
      enum: ['info', 'tip', 'warning', 'example', null],
    },
    title: { type: ['string', 'null'] as const },
    // bulletList
    items: {
      type: ['array', 'null'] as const,
      items: {
        type: 'array' as const,
        items: TEXT_SEGMENT_SCHEMA,
      },
    },
    // spacer
    size: {
      type: ['string', 'null'] as const,
      enum: ['sm', 'md', 'lg', null],
    },
  },
  required: ['type', 'segments', 'level', 'src', 'caption', 'latex', 'style', 'title', 'items', 'size'],
  additionalProperties: false,
};

const LESSON_PAGE_SCHEMA = {
  type: 'object' as const,
  properties: {
    type: { type: 'string' as const, enum: ['page', 'question'] },
    // page fields
    blocks: {
      type: ['array', 'null'] as const,
      items: CONTENT_BLOCK_SCHEMA,
    },
    // question fields
    question: { type: ['string', 'null'] as const },
    questionSegments: {
      type: ['array', 'null'] as const,
      items: TEXT_SEGMENT_SCHEMA,
    },
    options: {
      type: ['array', 'null'] as const,
      items: { type: 'string' as const },
    },
    correctIndex: { type: ['integer', 'null'] as const },
    explanation: { type: ['string', 'null'] as const },
    explanationSegments: {
      type: ['array', 'null'] as const,
      items: TEXT_SEGMENT_SCHEMA,
    },
  },
  required: ['type', 'blocks', 'question', 'questionSegments', 'options', 'correctIndex', 'explanation', 'explanationSegments'],
  additionalProperties: false,
};

// ═══════════════════════════════════════════════════════
//  Phase 1 Schema: Lesson Plan (modules outline)
// ═══════════════════════════════════════════════════════

const LESSON_PLAN_SCHEMA = {
  name: 'lesson_plan',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' as const },
      description: { type: 'string' as const },
      tags: {
        type: 'array' as const,
        items: { type: 'string' as const },
      },
      modules: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            description: { type: 'string' as const },
            pageCount: { type: 'integer' as const },
            outline: { type: 'string' as const },
          },
          required: ['title', 'description', 'pageCount', 'outline'],
          additionalProperties: false,
        },
      },
    },
    required: ['title', 'description', 'tags', 'modules'],
    additionalProperties: false,
  },
};

// ═══════════════════════════════════════════════════════
//  Phase 2 Schema: Module Content (pages for one module)
// ═══════════════════════════════════════════════════════

const MODULE_CONTENT_SCHEMA = {
  name: 'module_content',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      pages: {
        type: 'array' as const,
        items: LESSON_PAGE_SCHEMA,
      },
    },
    required: ['pages'],
    additionalProperties: false,
  },
};

// Legacy schema (kept for backward compat if needed)
const LESSON_RESPONSE_SCHEMA = {
  name: 'lesson_plan',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      pages: {
        type: 'array' as const,
        items: LESSON_PAGE_SCHEMA,
      },
      tags: {
        type: 'array' as const,
        items: { type: 'string' as const },
      },
    },
    required: ['pages', 'tags'],
    additionalProperties: false,
  },
};

// ═══════════════════════════════════════════════════════
//  System Prompts
// ═══════════════════════════════════════════════════════

const PLAN_SYSTEM_PROMPT = `You are an expert educational content planner for the Bloom learning platform. Your job is to plan the structure of an engaging, well-organized lesson.

Given a topic, create a lesson plan with:
1. A compelling title for the lesson
2. A brief description (1-2 sentences)
3. Relevant topic tags (2-5 short, lowercase labels)
4. A list of modules that break the lesson into logical sections

Each module should have:
- A clear title
- A brief description (what the module covers)
- A recommended page count (mix of teaching pages and questions)
- An outline describing what should be covered, key points, and suggested question topics

Guidelines:
- Create the number of modules requested by the user
- Each module should have 3-6 pages
- Modules should build progressively on each other
- The first module should introduce the topic
- The last module should wrap up with summary/review
- Include question suggestions in each module outline`;

const MODULE_SYSTEM_PROMPT = `You are an expert educational content creator for the Bloom learning platform. You create engaging, interactive lesson content for a single module within a larger lesson.

Your output must be a JSON object with a "pages" array. Each page is either a "page" (teaching content) or a "question" (quiz).

PAGE format:
{
  "type": "page",
  "blocks": [
    { "type": "heading", "segments": [{ "text": "Title", "bold": null, "italic": null, "color": null, "definition": null }], "level": 1, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "paragraph", "segments": [{ "text": "Normal text", "bold": null, "italic": null, "color": null, "definition": null }, { "text": "bold text", "bold": true, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "image", "segments": null, "level": null, "src": "emoji:🧠", "caption": "Optional caption", "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "callout", "segments": [{ "text": "Helpful info", "bold": null, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": "tip", "title": "Pro Tip", "items": null, "size": null },
    { "type": "bulletList", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": [[{ "text": "Item 1", "bold": null, "italic": null, "color": null, "definition": null }]], "size": null },
    { "type": "math", "segments": null, "level": null, "src": null, "caption": "Einstein's equation", "latex": "E = mc^2", "style": null, "title": null, "items": null, "size": null },
    { "type": "divider", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "spacer", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": "md" }
  ],
  "question": null, "questionSegments": null, "options": null, "correctIndex": null, "explanation": null, "explanationSegments": null
}

QUESTION format:
{
  "type": "question",
  "blocks": null,
  "question": "What is X?",
  "questionSegments": [{ "text": "What is ", "bold": null, "italic": null, "color": null, "definition": null }, { "text": "X", "bold": true, "italic": null, "color": null, "definition": null }, { "text": "?", "bold": null, "italic": null, "color": null, "definition": null }],
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Because...",
  "explanationSegments": [{ "text": "Because...", "bold": null, "italic": null, "color": null, "definition": null }]
}

Guidelines:
- Use rich formatting: bold for key terms, colors for emphasis, callouts for tips
- Include at least 1 question per module
- Use emojis for images (format: "emoji:🎯")
- Use LaTeX for any math equations
- Add definition terms where appropriate using the "definition" property on text segments
- Keep paragraphs concise and mobile-friendly
- Colors available: "accent" (orange), "secondary" (gray), "success" (green), "warning" (amber), "blue", "purple"
- Callout styles: "info", "tip", "warning", "example"
- For unused/optional fields, always provide null (never omit a field)`;

// ═══════════════════════════════════════════════════════
//  Sanitize helpers — strip nulls from AI output
// ═══════════════════════════════════════════════════════

function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}

function cleanSegments(segments: any[] | null): TextSegment[] | undefined {
  if (!segments) return undefined;
  return segments.map((s: any) => stripNulls(s) as TextSegment);
}

function cleanBlock(block: any): ContentBlock {
  const base = stripNulls(block) as any;

  // Clean nested segments
  if (base.segments) base.segments = cleanSegments(base.segments);
  if (base.items && Array.isArray(base.items)) {
    base.items = base.items.map((item: any[]) => cleanSegments(item) || []);
  }

  return base as ContentBlock;
}

function cleanPages(pages: any[]): ContentData[] {
  return pages.map((page: any): ContentData => {
    if (page.type === 'question') {
      return {
        type: 'question' as const,
        question: page.question || 'Question',
        questionSegments: cleanSegments(page.questionSegments) || [{ text: page.question || 'Question' }],
        options: page.options || ['A', 'B', 'C', 'D'],
        correctIndex: typeof page.correctIndex === 'number' ? page.correctIndex : 0,
        explanation: page.explanation || undefined,
        explanationSegments: cleanSegments(page.explanationSegments),
      };
    }

    // Default to page type
    return {
      type: 'page' as const,
      blocks: Array.isArray(page.blocks) ? page.blocks.map(cleanBlock) : [],
    };
  });
}

// ═══════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════

export interface LessonPlan {
  title: string;
  description: string;
  tags: string[];
  modules: ModulePlan[];
}

export interface ModulePlan {
  title: string;
  description: string;
  pageCount: number;
  outline: string;
}

export interface GeneratedModule {
  title: string;
  description: string;
  pages: ContentData[];
}

export interface GeneratedLesson {
  title: string;
  description: string;
  tags: string[];
  modules: GeneratedModule[];
}

// ═══════════════════════════════════════════════════════
//  Phase 1: Plan the lesson structure
// ═══════════════════════════════════════════════════════

export async function generateLessonPlan(
  topic: string,
  moduleCount: number = 3
): Promise<LessonPlan> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const userPrompt = `Plan a comprehensive lesson about: "${topic}"

The lesson should:
- Have approximately ${moduleCount} modules
- Be suitable for someone learning this topic for the first time
- Progress from fundamentals to more advanced concepts
- Include questions in each module to reinforce learning

Return the lesson plan with title, description, tags, and module outlines.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: PLAN_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: {
      type: 'json_schema',
      json_schema: LESSON_PLAN_SCHEMA,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI during lesson planning');
  }

  const parsed = JSON.parse(content);
  return {
    title: parsed.title,
    description: parsed.description,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean) : [],
    modules: parsed.modules,
  };
}

// ═══════════════════════════════════════════════════════
//  Phase 2: Generate content for a single module
// ═══════════════════════════════════════════════════════

export async function generateModuleContent(
  lessonTitle: string,
  lessonDescription: string,
  modulePlan: ModulePlan,
  moduleIndex: number,
  totalModules: number
): Promise<ContentData[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const isFirst = moduleIndex === 0;
  const isLast = moduleIndex === totalModules - 1;

  let contextInstructions = '';
  if (isFirst) {
    contextInstructions = `This is the FIRST module of the lesson. Start with a welcoming intro page with an emoji image and heading that introduces the overall lesson topic.`;
  } else if (isLast) {
    contextInstructions = `This is the LAST module of the lesson. End with a summary/review page that wraps up the key takeaways from the entire lesson.`;
  } else {
    contextInstructions = `This is module ${moduleIndex + 1} of ${totalModules}. It builds on previous modules. Start with a brief transition that connects to what was learned before.`;
  }

  const userPrompt = `Create content for the following module within a lesson about "${lessonTitle}".

Lesson description: ${lessonDescription}

Module title: "${modulePlan.title}"
Module description: ${modulePlan.description}
Target page count: ${modulePlan.pageCount}

Outline:
${modulePlan.outline}

${contextInstructions}

Return the JSON object with a "pages" array containing exactly ${modulePlan.pageCount} pages.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: MODULE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 12000,
    response_format: {
      type: 'json_schema',
      json_schema: MODULE_CONTENT_SCHEMA,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`No response from AI for module "${modulePlan.title}"`);
  }

  const parsed = JSON.parse(content);
  const pages: any[] = parsed.pages;

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`AI returned empty module for "${modulePlan.title}"`);
  }

  return cleanPages(pages);
}

// ═══════════════════════════════════════════════════════
//  Full two-phase lesson generation
// ═══════════════════════════════════════════════════════

export async function generateFullLesson(
  topic: string,
  moduleCount: number = 3
): Promise<GeneratedLesson> {
  // Phase 1: Plan the lesson
  const plan = await generateLessonPlan(topic, moduleCount);

  // Phase 2: Generate content for each module (in parallel)
  const moduleContents = await Promise.all(
    plan.modules.map((modulePlan, index) =>
      generateModuleContent(plan.title, plan.description, modulePlan, index, plan.modules.length)
    )
  );

  // Assemble the result
  const modules: GeneratedModule[] = plan.modules.map((modulePlan, index) => ({
    title: modulePlan.title,
    description: modulePlan.description,
    pages: moduleContents[index],
  }));

  return {
    title: plan.title,
    description: plan.description,
    tags: plan.tags,
    modules,
  };
}

// ═══════════════════════════════════════════════════════
//  Legacy single-call generation (kept for backward compat)
// ═══════════════════════════════════════════════════════

const LEGACY_SYSTEM_PROMPT = `You are an expert educational content creator for the Bloom learning platform. You create engaging, interactive lessons that teach concepts progressively.

Your output must be a JSON object with a "pages" array. Each page is either a "page" (teaching content) or a "question" (quiz).

PAGE format:
{
  "type": "page",
  "blocks": [
    { "type": "heading", "segments": [{ "text": "Title", "bold": null, "italic": null, "color": null, "definition": null }], "level": 1, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "paragraph", "segments": [{ "text": "Normal text", "bold": null, "italic": null, "color": null, "definition": null }, { "text": "bold text", "bold": true, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "image", "segments": null, "level": null, "src": "emoji:🧠", "caption": "Optional caption", "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "callout", "segments": [{ "text": "Helpful info", "bold": null, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": "tip", "title": "Pro Tip", "items": null, "size": null },
    { "type": "bulletList", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": [[{ "text": "Item 1", "bold": null, "italic": null, "color": null, "definition": null }]], "size": null },
    { "type": "math", "segments": null, "level": null, "src": null, "caption": "Einstein's equation", "latex": "E = mc^2", "style": null, "title": null, "items": null, "size": null },
    { "type": "divider", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null },
    { "type": "spacer", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": "md" }
  ],
  "question": null, "questionSegments": null, "options": null, "correctIndex": null, "explanation": null, "explanationSegments": null
}

QUESTION format:
{
  "type": "question",
  "blocks": null,
  "question": "What is X?",
  "questionSegments": [{ "text": "What is ", "bold": null, "italic": null, "color": null, "definition": null }, { "text": "X", "bold": true, "italic": null, "color": null, "definition": null }, { "text": "?", "bold": null, "italic": null, "color": null, "definition": null }],
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Because...",
  "explanationSegments": [{ "text": "Because...", "bold": null, "italic": null, "color": null, "definition": null }]
}

Guidelines:
- Start with a welcoming intro page with an emoji image and heading
- Alternate between teaching pages and questions
- Use rich formatting: bold for key terms, colors for emphasis, callouts for tips
- Include at least 1-2 questions per 3-4 teaching pages
- Use emojis for images (format: "emoji:🎯")
- Use LaTeX for any math equations
- Add definition terms where appropriate using the "definition" property on text segments
- Keep paragraphs concise and mobile-friendly
- End with a summary/review page
- Colors available: "accent" (orange), "secondary" (gray), "success" (green), "warning" (amber), "blue", "purple"
- Callout styles: "info", "tip", "warning", "example"
- For unused/optional fields, always provide null (never omit a field)

TAGS:
- Also include a "tags" array of 2-5 relevant topic tags for the lesson
- Tags should be short, lowercase, single-topic labels (e.g. "logic", "physics", "music theory", "calculus", "machine learning")
- Use commonly recognized subject/topic names
- Tags help users discover lessons by topic`;

export async function generateLessonDraft(
  topic: string,
  pageCount: number = 8
): Promise<{ pages: ContentData[]; tags: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const userPrompt = `Create an engaging ${pageCount}-page lesson about: "${topic}"

The lesson should:
- Have ${pageCount} total pages (mix of teaching pages and questions)
- Include at least ${Math.max(2, Math.floor(pageCount / 3))} questions spread throughout
- Start with an introduction and end with a summary
- Use rich formatting throughout
- Be suitable for someone learning this topic for the first time

Return the JSON object with a "pages" array.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: LEGACY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 16000,
    response_format: {
      type: 'json_schema',
      json_schema: LESSON_RESPONSE_SCHEMA,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  // With structured outputs the JSON is guaranteed to be valid and schema-conformant
  const parsed = JSON.parse(content);
  const pages: any[] = parsed.pages;

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('AI returned empty lesson');
  }

  // Extract tags from AI response
  const tags: string[] = Array.isArray(parsed.tags)
    ? parsed.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean)
    : [];

  return { pages: cleanPages(pages), tags };
}
