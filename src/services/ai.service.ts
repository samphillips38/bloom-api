import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import type { ContentData, ContentBlock, TextSegment } from '../db/schema';
import { db } from '../config/database';
import {
  lessons,
  lessonModules,
  lessonContent,
  lessonGenerationJobs,
} from '../db/schema';
import { eq } from 'drizzle-orm';

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
      enum: ['heading', 'paragraph', 'image', 'math', 'callout', 'bulletList', 'spacer', 'divider', 'interactive'],
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
    // interactive component fields
    componentId: { type: ['string', 'null'] as const },
    // JSON-encoded props string — parsed at runtime into Record<string, unknown>
    componentPropsJson: { type: ['string', 'null'] as const },
  },
  required: ['type', 'segments', 'level', 'src', 'caption', 'latex', 'style', 'title', 'items', 'size', 'componentId', 'componentPropsJson'],
  additionalProperties: false,
};

const LESSON_PAGE_SCHEMA = {
  type: 'object' as const,
  properties: {
    type: { type: 'string' as const, enum: ['page', 'question'] },
    // question format (only relevant when type === 'question')
    format: {
      type: ['string', 'null'] as const,
      enum: ['multiple-choice', 'true-false', 'multi-select', 'fill-blank', 'word-arrange', null],
    },
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
    // For multi-select: array of correct option indices
    correctIndices: {
      type: ['array', 'null'] as const,
      items: { type: 'integer' as const },
    },
    // For fill-blank: the exact correct text answer
    correctAnswer: { type: ['string', 'null'] as const },
    explanation: { type: ['string', 'null'] as const },
    explanationSegments: {
      type: ['array', 'null'] as const,
      items: TEXT_SEGMENT_SCHEMA,
    },
  },
  required: ['type', 'format', 'blocks', 'question', 'questionSegments', 'options', 'correctIndex', 'correctIndices', 'correctAnswer', 'explanation', 'explanationSegments'],
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
      prerequisiteConcepts: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Topics/concepts the learner should already understand before this lesson',
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
            isQuiz: { type: 'boolean' as const },
          },
          required: ['title', 'description', 'pageCount', 'outline', 'isQuiz'],
          additionalProperties: false,
        },
      },
    },
    required: ['title', 'description', 'tags', 'prerequisiteConcepts', 'modules'],
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
4. prerequisiteConcepts: 2-5 brief topic strings that a learner should already know before attempting this lesson (e.g. "basic algebra", "Newton's laws", "Python basics"). These help learners discover whether they are ready and help the platform link related lessons.
5. A list of modules that break the lesson into logical sections

Each module should have:
- A clear title
- A brief description (what the module covers)
- A recommended page count (mix of teaching pages and questions)
- An outline describing what should be covered, key points, and suggested question topics
- isQuiz: set to true ONLY for the final dedicated quiz module, false for all teaching modules

MANDATORY FINAL QUIZ MODULE:
Every lesson MUST end with a dedicated quiz module (isQuiz: true) titled "Final Quiz" or "<Topic> Quiz".
- This module contains ONLY question pages — no teaching content
- It should have 5–8 questions in MIXED formats: multiple-choice, true-false, multi-select, fill-blank, word-arrange
- Questions should comprehensively test the key concepts from ALL preceding modules
- Set pageCount to the number of questions (5–8)

Guidelines:
- Decide the number of teaching modules based on topic complexity:
  * 2–3 teaching modules + 1 quiz module for focused, narrow topics
  * 4–5 teaching modules + 1 quiz module for broad topics
  * Up to 6 teaching modules + 1 quiz module for comprehensive topics
- Each teaching module should have 3-6 pages
- Modules should build progressively on each other
- The first module should introduce the topic with a compelling real-world hook
- Include question suggestions in each teaching module outline`;

const MODULE_SYSTEM_PROMPT = `You are an expert educational content creator for the Bloom learning platform. You create engaging, interactive lesson content for a single module within a larger lesson.

Your output must be a JSON object with a "pages" array. Each page is either a "page" (teaching content) or a "question" (quiz).

═══════════════════════════════
PAGE format:
═══════════════════════════════
{
  "type": "page",
  "blocks": [ ...blocks... ],
  "question": null, "questionSegments": null, "options": null, "correctIndex": null, "explanation": null, "explanationSegments": null
}

STANDARD BLOCK EXAMPLES (all fields required — use null for unused ones):
{ "type": "heading",   "segments": [{ "text": "Title", "bold": null, "italic": null, "color": null, "definition": null }], "level": 2, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "paragraph", "segments": [{ "text": "Body text. ", "bold": null, "italic": null, "color": null, "definition": null }, { "text": "Key term", "bold": true, "italic": null, "color": "blue", "definition": "What this term means" }], "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "image",     "segments": null, "level": null, "src": "wikimedia:photosynthesis diagram", "caption": "Caption text", "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "callout",   "segments": [{ "text": "Tip text", "bold": null, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": "tip", "title": "Pro Tip", "items": null, "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "bulletList","segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": [[{ "text": "Item 1", "bold": null, "italic": null, "color": null, "definition": null }], [{ "text": "Item 2", "bold": null, "italic": null, "color": null, "definition": null }]], "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "math",      "segments": null, "level": null, "src": null, "caption": "Euler's identity", "latex": "e^{i\\pi} + 1 = 0", "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "divider",   "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null }
{ "type": "spacer",    "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": "md", "componentId": null, "componentPropsJson": null }

═══════════════════════════════
INTERACTIVE BLOCK format:
═══════════════════════════════
To embed an interactive component, use type "interactive". Set componentId to the component ID and componentPropsJson to a JSON-encoded STRING of the props object.

CRITICAL: componentPropsJson must be a STRING value containing valid JSON — NOT a nested object. Example:
{ "type": "interactive", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": "flashcard-deck", "componentPropsJson": "{\"title\":\"Key Terms\",\"cards\":[{\"front\":\"Photosynthesis\",\"back\":\"Process plants use to convert light into food\"}]}" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT REFERENCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. flashcard-deck — Flip cards to reveal definitions. Best for vocabulary, Q&A review.
   Required props: title (string), cards (array of {front, back})
   Example componentPropsJson: "{\"title\":\"Key Vocabulary\",\"cards\":[{\"front\":\"Term\",\"back\":\"What it means\"},{\"front\":\"Another Term\",\"back\":\"Its definition\"}]}"

2. word-match — Two-column matching: tap term then its definition. Best for terminology.
   Required props: title (string), pairs (array of {term, definition})
   Example componentPropsJson: "{\"title\":\"Match the Terms\",\"pairs\":[{\"term\":\"Mitosis\",\"definition\":\"Cell division producing 2 identical daughter cells\"},{\"term\":\"Meiosis\",\"definition\":\"Division producing 4 genetically unique gametes\"}]}"

3. memory-match — Card-flip memory game. Keep to 4–8 pairs. Best for symbols, formulas.
   Required props: title (string), pairs (array of {term, definition})
   Example componentPropsJson: "{\"title\":\"Symbol Memory\",\"pairs\":[{\"term\":\"∧\",\"definition\":\"AND\"},{\"term\":\"∨\",\"definition\":\"OR\"},{\"term\":\"¬\",\"definition\":\"NOT\"},{\"term\":\"→\",\"definition\":\"IMPLIES\"}]}"

4. sortable-categories — Sort items into category buckets. Best for classification.
   Required props: title, instruction, categories (array of {label, items[]})
   Example componentPropsJson: "{\"title\":\"Classify These\",\"instruction\":\"Tap an item, then its category.\",\"categories\":[{\"label\":\"Animals\",\"items\":[\"Dog\",\"Eagle\"]},{\"label\":\"Plants\",\"items\":[\"Oak\",\"Fern\"]}]}"

5. sequence-sorter — Reorder shuffled steps into correct order. Best for processes, algorithms.
   Required props: title, instruction, items (string[], IN correct order — they get shuffled), hint (optional string)
   Example componentPropsJson: "{\"title\":\"Steps in Order\",\"instruction\":\"Arrange from first to last.\",\"items\":[\"Collect data\",\"Analyse results\",\"Draw conclusions\",\"Publish findings\"],\"hint\":\"Think about the scientific method.\"}"

6. fill-in-the-blank — Complete sentences from a word bank. Use __BLANK__ in sentence.
   Required props: title, sentence (with __BLANK__ tokens), blanks (correct answers in order), wordBank (extra decoys)
   Example componentPropsJson: "{\"title\":\"Complete the Sentence\",\"sentence\":\"Water boils at __BLANK__ degrees Celsius and freezes at __BLANK__ degrees.\",\"blanks\":[\"100\",\"0\"],\"wordBank\":[\"50\",\"-10\",\"37\"]}"

7. poll — Vote and see results. Best for engagement, opinion checks.
   Required props: question (string), options (string[])
   Example componentPropsJson: "{\"question\":\"Which learning style works best for you?\",\"options\":[\"Visual diagrams\",\"Written notes\",\"Practice problems\",\"Discussion\"]}"

8. bar-chart-builder — Adjustable bar chart. Best for data exploration, comparisons.
   Required props: title, description, bars (array of {label, value, maxValue}), showValues (boolean)
   Example componentPropsJson: "{\"title\":\"Speed Comparison\",\"description\":\"Adjust the bars to compare.\",\"bars\":[{\"label\":\"Car\",\"value\":120,\"maxValue\":300},{\"label\":\"Train\",\"value\":300,\"maxValue\":300},{\"label\":\"Plane\",\"value\":900,\"maxValue\":1000}],\"showValues\":true}"

9. timeline — Expandable timeline. Best for history, biographical sequences.
   Required props: title, events (array of {year, title, description, emoji})
   Example componentPropsJson: "{\"title\":\"Key Events\",\"events\":[{\"year\":\"1905\",\"title\":\"Special Relativity\",\"description\":\"Einstein publishes his theory.\",\"emoji\":\"⚡\"},{\"year\":\"1915\",\"title\":\"General Relativity\",\"description\":\"Extended to include gravity.\",\"emoji\":\"🌌\"}]}"

10. number-line — Slider on a number line. Omit 'answer' for open self-rating. Best for math, estimation.
    Required props: title, question, min (number), max (number), step (number), unit (string)
    Optional props: answer (number — if provided, checks correctness), answerTolerance (number, default 1)
    Example (with answer): "{\"title\":\"Place the Value\",\"question\":\"Where is 3/4 on this number line?\",\"min\":0,\"max\":1,\"step\":0.05,\"unit\":\"\",\"answer\":0.75,\"answerTolerance\":0.1}"
    Example (self-rating): "{\"title\":\"Confidence Check\",\"question\":\"How confident are you? (0 = not at all, 10 = very)\",\"min\":0,\"max\":10,\"step\":1,\"unit\":\"\"}"

11. concept-web — Expandable hub-and-spoke card layout. Central concept at the top, satellite concept cards below — tap each to reveal its description. Best for overviews, mind maps, exploring relationships between ideas. 4–6 nodes ideal.
    Required props: title, center (string), centerEmoji (string), nodes (array of {label, description, emoji})
    Example componentPropsJson: "{\"title\":\"Types of Energy\",\"center\":\"Energy\",\"centerEmoji\":\"⚡\",\"nodes\":[{\"label\":\"Kinetic\",\"description\":\"Energy of motion — a moving car, running water.\",\"emoji\":\"🚗\"},{\"label\":\"Potential\",\"description\":\"Stored energy — a raised weight, a compressed spring.\",\"emoji\":\"⬆️\"},{\"label\":\"Thermal\",\"description\":\"Heat energy from particle vibration.\",\"emoji\":\"🔥\"}]}"

12. sine-wave-explorer — Interactive sine wave with sliders. Best for trigonometry, waves.
    Optional props: title (string), showAmplitude (bool), showFrequency (bool), showPhase (bool)
    Example componentPropsJson: "{\"title\":\"Explore the Sine Wave\",\"showAmplitude\":true,\"showFrequency\":true,\"showPhase\":false}"

13. truth-table-builder — Fill-in truth table for a logical operator. Best for logic, CS.
    Required props: title (string), operator ("AND" | "OR" | "NOT" | "IMPLIES")
    Example componentPropsJson: "{\"title\":\"OR Truth Table\",\"operator\":\"OR\"}"

14. venn-diagram — Two-circle Venn diagram with clickable regions. Best for set theory, comparisons.
    Required props: title, leftLabel, rightLabel, leftItems (string[]), bothItems (string[]), rightItems (string[])
    Example componentPropsJson: "{\"title\":\"Vertebrates vs Warm-blooded\",\"leftLabel\":\"Vertebrates only\",\"rightLabel\":\"Warm-blooded only\",\"leftItems\":[\"Fish\",\"Reptiles\"],\"bothItems\":[\"Birds\",\"Mammals\"],\"rightItems\":[]}"

═══════════════════════════════
QUESTION formats:
═══════════════════════════════

All question types share the same base structure. Set unused fields to null.

1. MULTIPLE-CHOICE (format: "multiple-choice") — 4 options, one correct
{
  "type": "question", "format": "multiple-choice", "blocks": null,
  "question": "What is X?", "questionSegments": [{"text":"What is X?","bold":null,"italic":null,"color":null,"definition":null}],
  "options": ["Option A","Option B","Option C","Option D"],
  "correctIndex": 0, "correctIndices": null, "correctAnswer": null,
  "explanation": "Because...", "explanationSegments": [{"text":"Because...","bold":null,"italic":null,"color":null,"definition":null}]
}

2. TRUE-FALSE (format: "true-false") — exactly 2 options: "True" and "False"
{
  "type": "question", "format": "true-false", "blocks": null,
  "question": "Photosynthesis produces oxygen.", "questionSegments": [{"text":"Photosynthesis produces oxygen.","bold":null,"italic":null,"color":null,"definition":null}],
  "options": ["True","False"],
  "correctIndex": 0, "correctIndices": null, "correctAnswer": null,
  "explanation": "Yes, oxygen is a byproduct.", "explanationSegments": null
}

3. MULTI-SELECT (format: "multi-select") — 4-5 options, MULTIPLE correct (use correctIndices)
{
  "type": "question", "format": "multi-select", "blocks": null,
  "question": "Which of these are noble gases? (Select all that apply)", "questionSegments": null,
  "options": ["Helium","Oxygen","Neon","Nitrogen","Argon"],
  "correctIndex": null, "correctIndices": [0,2,4], "correctAnswer": null,
  "explanation": "Helium, Neon, and Argon are all noble gases.", "explanationSegments": null
}

4. FILL-IN-THE-BLANK (format: "fill-blank") — learner types exact answer (use correctAnswer)
{
  "type": "question", "format": "fill-blank", "blocks": null,
  "question": "Water is made of hydrogen and ___.", "questionSegments": null,
  "options": null,
  "correctIndex": null, "correctIndices": null, "correctAnswer": "oxygen",
  "explanation": "H₂O contains hydrogen and oxygen atoms.", "explanationSegments": null
}

5. WORD-ARRANGE (format: "word-arrange") — options contains the shuffled word chips; correctIndex is unused; correctAnswer is the space-joined correct sentence
{
  "type": "question", "format": "word-arrange", "blocks": null,
  "question": "Arrange these words to form the correct statement:", "questionSegments": null,
  "options": ["light","plants","energy","absorb","to","use"],
  "correctIndex": null, "correctIndices": null, "correctAnswer": "plants absorb light to use energy",
  "explanation": "Plants absorb light energy for photosynthesis.", "explanationSegments": null
}

═══════════════════════════════
GUIDELINES:
═══════════════════════════════
- Use interactive components liberally — aim for at least 1-2 per TEACHING module to make lessons engaging
- Place interactive blocks on their OWN page (or with minimal surrounding text) so they have visual space
- Use rich text formatting: bold for key terms, colors for emphasis, definition tooltips
- Include at least 1 multiple-choice question per teaching module
- For image blocks, use format "wikimedia:<search term>" to source a real diagram from Wikimedia Commons (e.g. "wikimedia:photosynthesis light reaction", "wikimedia:neuron anatomy", "wikimedia:mitosis cell division stages"). Prefer real diagrams over emoji placeholders. Only use "emoji:<emoji>" when the topic is truly abstract and no real diagram would apply.
- Use LaTeX for math equations
- Keep paragraphs concise and mobile-friendly
- Colors: "accent" (orange), "secondary" (gray), "success" (green), "warning" (amber), "blue", "purple"
- Callout styles: "info", "tip", "warning", "example"
- For ALL unused/optional fields on standard blocks, always write null (never omit a field)
- For interactive blocks, componentPropsJson must be a valid JSON string (double-quote all keys and strings)
- Choose interactive components that match the content: use concept-web for overviews, timeline for history, memory-match for symbols, fill-in-the-blank for exercises, etc.

QUIZ MODULE RULES (when generating the dedicated final quiz):
- Include ONLY question pages — NO teaching content, NO interactive components, NO page-type blocks
- Use a MIX of all 5 question formats across the 5–8 questions
- Questions must test KEY CONCEPTS from across ALL modules of the lesson
- For fill-blank: use simple, unambiguous single-word or short-phrase answers
- For word-arrange: use 5–8 word chips that form a meaningful statement about the topic
- For multi-select: clearly indicate in the question text to "select all that apply"
- For all question types: ALWAYS set format to one of the 5 valid strings (never null for quiz questions)
- Set ALL unused fields to null (e.g. blocks: null, correctIndices: null when not multi-select, etc.)`;

// ═══════════════════════════════════════════════════════
//  Phase 1b: Review System Prompt
// ═══════════════════════════════════════════════════════

const REVIEW_SYSTEM_PROMPT = `You are a senior educational content reviewer for the Bloom learning platform. Your role is to critically evaluate and refine an initial lesson plan BEFORE content is generated, so the final lesson is genuinely excellent — not generic or filler-heavy.

You will receive an initial lesson plan and must return an improved version with the same JSON structure (title, description, tags, modules with title, description, pageCount, outline).

═══════════════════════════════
REVIEW CRITERIA — apply each rigorously:
═══════════════════════════════

1. CONTENT QUALITY — eliminate filler:
   - Every module outline must specify EXACTLY what to teach, not vague instructions like "explain the concept"
   - Replace vague phrases with concrete content: instead of "discuss the importance of X", write "explain WHY X matters using the specific example of Y"
   - Ensure depth over breadth — each page should leave the learner knowing something specific and usable
   - Questions must test genuine understanding, not trivial recall (not "What is X called?" but "Why does X happen?")

2. LESSON FLOW — make it coherent:
   - The first module should hook the learner with an interesting real-world application or surprising fact before diving into theory
   - Each module outline must note how it connects to the previous module (write a brief "Building on [previous module]..." transition note)
   - Concepts must be introduced before they are used — check for any forward references
   - The final module should synthesise all key ideas and provide genuine closure, not just repetition

3. INTERACTIVE COMPONENTS — the heart of Bloom lessons:
   - EVERY module must include at least 1–2 interactive components. Specify them EXPLICITLY in the outline.
   - Choose the right component for the content:
     * flashcard-deck → vocabulary, definitions, key terms
     * word-match / memory-match → terminology matching, symbols, formulas
     * sequence-sorter → processes, algorithms, historical timelines, step-by-step procedures
     * sortable-categories → classification, taxonomy, grouping exercises
     * fill-in-the-blank → practising definitions, completing formulas, cloze exercises
     * timeline → historical events, biographical sequences, era comparisons
     * concept-web → overview of a topic, relationships between ideas, mind maps
     * bar-chart-builder → comparing quantities, data exploration, statistics
     * venn-diagram → comparing two concepts, set theory, overlapping categories
     * number-line → numerical estimation, fractions, probability, placing values
     * poll → reflection, opinion checks, "what do you think?" moments
     * sine-wave-explorer → waves, trigonometry, oscillations
     * truth-table-builder → logic gates, boolean operators
   - Write in the outline exactly which interactive to use and what it should contain, e.g.:
     "Interactive: sequence-sorter — learner orders the 5 steps of the nitrogen cycle"
     "Interactive: concept-web — central node 'Photosynthesis', satellite nodes for Light Reaction, Calvin Cycle, Chlorophyll, Glucose, Oxygen"
   - Replace passive reading pages with interactive equivalents wherever possible

4. OPENING IMAGE — mandatory:
   - The very first page of Module 1 must open with a real Wikimedia Commons image, not an emoji
   - Include this line in Module 1's outline: "Opening image: wikimedia:<specific descriptive search term>"
   - Choose a search term that will find a compelling, relevant diagram or photograph (e.g. "wikimedia:human brain anatomy labeled diagram", "wikimedia:photosynthesis light reaction chloroplast")

5. IMAGES THROUGHOUT:
   - Suggest specific Wikimedia search terms wherever a diagram would genuinely aid understanding
   - Format: "Image: wikimedia:<search term>" in the relevant module outline
   - Only suggest where a real diagram exists — avoid decorative images

5. FINAL QUIZ MODULE — mandatory:
   - The LAST module must ALWAYS have isQuiz: true and be a dedicated quiz with 5–8 questions
   - Ensure the quiz tests ALL key concepts from the entire lesson, not just the last module
   - The quiz module outline must specify exactly which question formats to use:
     * multiple-choice: standard 4-option MCQ
     * true-false: binary yes/no (2 options)
     * multi-select: "select all that apply" (multiple correct answers)
     * fill-blank: learner types the exact answer
     * word-arrange: learner taps shuffled word chips to form the answer
   - All teaching modules should have isQuiz: false

6. PREREQUISITE CONCEPTS — verify quality:
   - prerequisiteConcepts should be 2-5 specific, learnable topic strings
   - They should be concrete enough to search for (e.g. "basic algebra" not "math")

Return the refined plan. You may adjust pageCount per module if more or fewer pages are needed for quality (keep 3–6 per teaching module, 5–8 for quiz module). Do not dramatically change the number of teaching modules unless the structure is genuinely wrong for the topic.`;

// ═══════════════════════════════════════════════════════
//  Wikimedia Commons image resolution
// ═══════════════════════════════════════════════════════

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/**
 * Given a search term, returns the direct URL of the first matching image on
 * Wikimedia Commons, or null if nothing is found / the request fails.
 */
async function resolveWikimediaUrl(term: string): Promise<string | null> {
  try {
    // Step 1: text-search in File: namespace
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srnamespace: '6',
      srsearch: term,
      srlimit: '5',
      format: 'json',
      origin: '*',
    });
    const searchRes = await fetch(`${COMMONS_API}?${searchParams}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!searchRes.ok) return null;
    const searchData: any = await searchRes.json();
    const hits: Array<{ title: string }> = searchData?.query?.search ?? [];
    if (hits.length === 0) return null;

    // Step 2: resolve full image URL for the first result
    const infoParams = new URLSearchParams({
      action: 'query',
      titles: hits[0].title,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
      origin: '*',
    });
    const infoRes = await fetch(`${COMMONS_API}?${infoParams}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!infoRes.ok) return null;
    const infoData: any = await infoRes.json();
    const pages = Object.values(infoData?.query?.pages ?? {}) as Array<{
      imageinfo?: Array<{ url: string }>;
    }>;
    return pages[0]?.imageinfo?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Post-processes AI-generated pages: finds every image block with
 * src="wikimedia:<term>" and replaces it with a real Wikimedia Commons URL.
 * Falls back to "emoji:🖼️" if the search returns no result.
 * Runs all resolutions in parallel for speed.
 */
async function resolveWikimediaImages(pages: ContentData[]): Promise<ContentData[]> {
  // Collect unique search terms
  const terms = new Set<string>();
  for (const page of pages) {
    if (page.type === 'page') {
      for (const block of page.blocks) {
        if (block.type === 'image' && block.src.startsWith('wikimedia:')) {
          terms.add(block.src.slice('wikimedia:'.length).trim());
        }
      }
    }
  }

  if (terms.size === 0) return pages;

  // Resolve all unique terms in parallel
  const resolved = new Map<string, string>();
  await Promise.all(
    Array.from(terms).map(async (term) => {
      const url = await resolveWikimediaUrl(term);
      resolved.set(term, url ?? 'emoji:🖼️');
    })
  );

  // Replace src values
  return pages.map((page): ContentData => {
    if (page.type !== 'page') return page;
    return {
      ...page,
      blocks: page.blocks.map((block): typeof block => {
        if (block.type === 'image' && block.src.startsWith('wikimedia:')) {
          const term = block.src.slice('wikimedia:'.length).trim();
          return { ...block, src: resolved.get(term) ?? 'emoji:🖼️' };
        }
        return block;
      }),
    };
  });
}

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

  // Handle interactive blocks: parse componentPropsJson → props
  if (base.type === 'interactive' && base.componentId) {
    let props: Record<string, unknown> = {};
    if (base.componentPropsJson) {
      try {
        props = JSON.parse(base.componentPropsJson);
      } catch {
        // malformed JSON — use empty props
      }
    }
    delete base.componentPropsJson;
    return { type: 'interactive', componentId: base.componentId, props } as ContentBlock;
  }

  // Remove interactive-only fields from non-interactive blocks
  delete base.componentId;
  delete base.componentPropsJson;

  return base as ContentBlock;
}

function cleanPages(pages: any[]): ContentData[] {
  return pages.map((page: any): ContentData => {
    if (page.type === 'question') {
      const format = page.format || 'multiple-choice';
      return {
        type: 'question' as const,
        format,
        question: page.question || 'Question',
        questionSegments: cleanSegments(page.questionSegments) || [{ text: page.question || 'Question' }],
        options: page.options || [],
        correctIndex: typeof page.correctIndex === 'number' ? page.correctIndex : (format === 'multiple-choice' || format === 'true-false' ? 0 : undefined),
        correctIndices: Array.isArray(page.correctIndices) ? page.correctIndices : undefined,
        correctAnswer: typeof page.correctAnswer === 'string' ? page.correctAnswer : undefined,
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
  prerequisiteConcepts: string[];
  modules: ModulePlan[];
}

export interface ModulePlan {
  title: string;
  description: string;
  pageCount: number;
  outline: string;
  isQuiz: boolean;
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
//  Source Content Extraction
// ═══════════════════════════════════════════════════════

/**
 * Extract readable text from a URL (server-side fetch to avoid CORS issues).
 */
export async function extractUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Bloom Educational Platform - content indexing)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (HTTP ${response.status})`);
  }

  const html = await response.text();

  // Strip scripts, styles, then all tags — leave whitespace-collapsed text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 20000); // cap at 20 000 chars to keep prompt manageable

  if (text.length < 100) {
    throw new Error('Could not extract meaningful text from the URL');
  }

  return text;
}

/**
 * Extract text from a PDF. Accepts either a raw Buffer or a base64-encoded string.
 */
export async function extractPdfContent(input: Buffer | string): Promise<string> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'base64');
  const data = await pdfParse(buffer);
  const text = data.text.replace(/\s+/g, ' ').trim().substring(0, 20000);

  if (text.length < 100) {
    throw new Error('Could not extract meaningful text from the PDF');
  }

  return text;
}

// ═══════════════════════════════════════════════════════
//  Phase 1: Plan the lesson structure
// ═══════════════════════════════════════════════════════

export async function generateLessonPlan(
  topic: string,
  sourceContent?: string,
): Promise<LessonPlan> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const sourceSection = sourceContent
    ? `\n\nBASE THE LESSON ON THE FOLLOWING SOURCE MATERIAL (summarise, adapt, and structure it — do not copy verbatim):\n---\n${sourceContent}\n---`
    : '';

  const userPrompt = `Plan a comprehensive lesson about: "${topic}"

The lesson should:
- Have as many modules as the topic genuinely requires (you decide — see guidelines)
- Be suitable for someone learning this topic for the first time
- Progress from fundamentals to more advanced concepts
- Include questions in each module to reinforce learning${sourceSection}

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
    prerequisiteConcepts: Array.isArray(parsed.prerequisiteConcepts) ? parsed.prerequisiteConcepts : [],
    modules: Array.isArray(parsed.modules) ? parsed.modules.map((m: any) => ({ ...m, isQuiz: m.isQuiz === true })) : [],
  };
}

// ═══════════════════════════════════════════════════════
//  Phase 1b: Review and refine the lesson plan
// ═══════════════════════════════════════════════════════

export async function refineLessonPlan(
  topic: string,
  initialPlan: LessonPlan,
): Promise<LessonPlan> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const userPrompt = `Review and refine the following initial lesson plan for the topic: "${topic}"

Initial plan:
${JSON.stringify(initialPlan, null, 2)}

Apply all review criteria: eliminate filler, improve flow, add specific interactive components to every module, ensure the first page uses a Wikimedia image, and specify image search terms where diagrams would help.

Return the refined lesson plan with the same JSON structure.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: REVIEW_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 6000,
    response_format: {
      type: 'json_schema',
      json_schema: LESSON_PLAN_SCHEMA,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI during lesson plan review');
  }

  const parsed = JSON.parse(content);
  return {
    title: parsed.title,
    description: parsed.description,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean) : [],
    prerequisiteConcepts: Array.isArray(parsed.prerequisiteConcepts) ? parsed.prerequisiteConcepts : [],
    modules: Array.isArray(parsed.modules) ? parsed.modules.map((m: any) => ({ ...m, isQuiz: m.isQuiz === true })) : [],
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
  totalModules: number,
  sourceContent?: string,
): Promise<ContentData[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const isFirst = moduleIndex === 0;
  const isQuizModule = modulePlan.isQuiz === true;

  let contextInstructions = '';
  if (isQuizModule) {
    contextInstructions = `This is the FINAL QUIZ MODULE. Generate ONLY question pages — NO teaching content whatsoever.
Use a mix of all question formats: multiple-choice, true-false, multi-select, fill-blank, and word-arrange.
Questions must comprehensively test key concepts from the ENTIRE lesson "${lessonTitle}".
Generate exactly ${modulePlan.pageCount} question pages.
Every question MUST have format set to one of: "multiple-choice", "true-false", "multi-select", "fill-blank", "word-arrange".
For multi-select, use correctIndices array. For fill-blank, use correctAnswer string. For word-arrange, options are the shuffled word chips and correctAnswer is the correct space-joined sentence.`;
  } else if (isFirst) {
    contextInstructions = `This is the FIRST module of the lesson. Start with a welcoming intro page that introduces the overall lesson topic. The VERY FIRST block on this intro page must be a real Wikimedia Commons image (use src="wikimedia:<relevant search term>") — NOT an emoji. Choose a search term that will find a compelling, on-topic diagram or photograph. Follow it with a heading and a brief engaging paragraph that hooks the learner.`;
  } else {
    contextInstructions = `This is module ${moduleIndex + 1} of ${totalModules}. It builds on previous modules. Start with a brief transition that connects to what was learned before.`;
  }

  const sourceSection = sourceContent
    ? `\n\nUse the following source material to inform this module's content:\n---\n${sourceContent.substring(0, 8000)}\n---`
    : '';

  const userPrompt = `Create content for the following module within a lesson about "${lessonTitle}".

Lesson description: ${lessonDescription}

Module title: "${modulePlan.title}"
Module description: ${modulePlan.description}
Target page count: ${modulePlan.pageCount}

Outline:
${modulePlan.outline}

${contextInstructions}${sourceSection}

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

  return await resolveWikimediaImages(cleanPages(pages));
}

// ═══════════════════════════════════════════════════════
//  Background (async) generation — saves directly to DB
// ═══════════════════════════════════════════════════════

export interface BackgroundGenerationParams {
  lessonId: string;
  userId: string;
  jobId: string;
  topic: string;
  sourceContent?: string;
  sourceType?: 'topic' | 'url' | 'pdf';
}

/**
 * Run a full two-phase lesson generation in the background,
 * writing results directly to the database and updating the job record.
 * Call this with `void` — it is designed to be fire-and-forget.
 */
export async function startBackgroundGeneration(params: BackgroundGenerationParams): Promise<void> {
  const { lessonId, userId, jobId, topic, sourceContent } = params;

  const updateJob = (fields: Partial<typeof lessonGenerationJobs.$inferInsert>) =>
    db.update(lessonGenerationJobs)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(lessonGenerationJobs.id, jobId));

  try {
    // ── Phase 1: Planning ──────────────────────────────
    await updateJob({ status: 'planning' });

    const initialPlan = await generateLessonPlan(topic, sourceContent);

    // ── Phase 1b: Reviewing & refining the plan ────────
    await updateJob({ status: 'reviewing' });

    const plan = await refineLessonPlan(topic, initialPlan);

    // Update the lesson stub with AI-generated title/description/tags + prerequisite concepts
    // Store prerequisiteConcepts as a special metadata field alongside the tags
    await db.update(lessons)
      .set({
        title: plan.title,
        description: plan.description,
        tags: plan.tags,
        aiInvolvement: 'full',
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lessonId));

    // Store prerequisiteConcepts in the lesson's JSON metadata (via description extension)
    // We store it separately — tag the lesson with prerequisite concept tags for discoverability
    if (plan.prerequisiteConcepts?.length) {
      // Merge prerequisite concepts into the lesson tags for searchability
      const allTags = [...new Set([...plan.tags, ...plan.prerequisiteConcepts.map(c => c.toLowerCase().trim())])];
      await db.update(lessons)
        .set({ tags: allTags })
        .where(eq(lessons.id, lessonId));
    }

    // Advance to generating phase
    await updateJob({ status: 'generating', totalModules: plan.modules.length });

    // ── Phase 2: Generate each module ─────────────────
    for (let i = 0; i < plan.modules.length; i++) {
      const modulePlan = plan.modules[i];

      await updateJob({ currentModuleTitle: modulePlan.title });

      // Create module record — append "[Quiz]" marker to quiz module title for detection
      const moduleTitle = modulePlan.isQuiz && !modulePlan.title.toLowerCase().includes('quiz')
        ? `${modulePlan.title} [Quiz]`
        : modulePlan.title;
      const [moduleRecord] = await db.insert(lessonModules).values({
        lessonId,
        title: moduleTitle,
        description: modulePlan.description,
        orderIndex: i,
      }).returning();

      // Generate module pages
      const pages = await generateModuleContent(
        plan.title,
        plan.description,
        modulePlan,
        i,
        plan.modules.length,
        sourceContent,
      );

      // Save pages to DB
      if (pages.length > 0) {
        await db.insert(lessonContent).values(
          pages.map((pageData, pIdx) => ({
            lessonId,
            moduleId: moduleRecord.id,
            orderIndex: pIdx,
            contentType: pageData.type === 'question' ? 'question' : 'page',
            contentData: pageData,
            authorId: userId,
          })),
        );
      }

      await updateJob({ completedModules: i + 1 });
    }

    // ── Done ──────────────────────────────────────────
    await updateJob({ status: 'completed', currentModuleTitle: null });
  } catch (error: any) {
    console.error('[BackgroundGeneration] Failed for lesson', lessonId, error);
    await updateJob({
      status: 'failed',
      error: error?.message ?? 'Unknown error during generation',
    }).catch(() => {/* ignore secondary failure */});
  }
}

// ═══════════════════════════════════════════════════════
//  Full two-phase lesson generation
// ═══════════════════════════════════════════════════════

export async function generateFullLesson(
  topic: string,
): Promise<GeneratedLesson> {
  // Phase 1: Plan the lesson
  const plan = await generateLessonPlan(topic);

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
    { "type": "heading", "segments": [{ "text": "Title", "bold": null, "italic": null, "color": null, "definition": null }], "level": 1, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "paragraph", "segments": [{ "text": "Normal text", "bold": null, "italic": null, "color": null, "definition": null }, { "text": "bold text", "bold": true, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "image", "segments": null, "level": null, "src": "wikimedia:brain anatomy diagram", "caption": "Optional caption", "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "callout", "segments": [{ "text": "Helpful info", "bold": null, "italic": null, "color": null, "definition": null }], "level": null, "src": null, "caption": null, "latex": null, "style": "tip", "title": "Pro Tip", "items": null, "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "bulletList", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": [[{ "text": "Item 1", "bold": null, "italic": null, "color": null, "definition": null }]], "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "math", "segments": null, "level": null, "src": null, "caption": "Einstein's equation", "latex": "E = mc^2", "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "divider", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": null, "componentId": null, "componentPropsJson": null },
    { "type": "spacer", "segments": null, "level": null, "src": null, "caption": null, "latex": null, "style": null, "title": null, "items": null, "size": "md", "componentId": null, "componentPropsJson": null }
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
- For image blocks, use format "wikimedia:<search term>" to source a real diagram from Wikimedia Commons (e.g. "wikimedia:photosynthesis diagram", "wikimedia:human heart anatomy"). Only use "emoji:<emoji>" when no real diagram would apply.
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

  return { pages: await resolveWikimediaImages(cleanPages(pages)), tags };
}
