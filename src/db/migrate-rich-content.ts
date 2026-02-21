/**
 * Migrates existing lesson content to the new rich page format.
 * Upgrades math course lessons ("Why Calculus Matters", "Understanding Limits",
 * "Continuity: No Gaps Allowed", "What is a Derivative?", "The Rules of Differentiation")
 * plus the Logic course ("What is Logic?", "Statements and Truth", "Logical Operators")
 * to use rich blocks with inline formatting, definitions, LaTeX, callouts, and
 * interactive components.
 *
 * Safe to run multiple times — it deletes and replaces content for matched lessons.
 *
 * Usage:  npx ts-node src/db/migrate-rich-content.ts
 */
import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

// ── Shorthand helpers for building segments ──
const t = (text: string) => ({ text });
const bold = (text: string) => ({ text, bold: true });
const accent = (text: string) => ({ text, bold: true, color: 'accent' });
const blue = (text: string) => ({ text, bold: true, color: 'blue' });
const purple = (text: string) => ({ text, bold: true, color: 'purple' });
const def = (text: string, definition: string) => ({ text, underline: true, definition });
const latex = (tex: string) => ({ text: tex, latex: true });

type LessonUpgrade = {
  title: string;
  content: Array<{ contentType: string; contentData: Record<string, unknown> }>;
};

const lessonUpgrades: LessonUpgrade[] = [
  // ═══════════════════════════════════════════
  // MATH: "Why Calculus Matters"
  // ═══════════════════════════════════════════
  {
    title: 'Why Calculus Matters',
    content: [
      // Page 1: Title & hook
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🌎 The Mathematics of Change' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('The world is in constant motion. Planets orbit, populations grow, temperatures fluctuate. '),
                bold('Algebra'),
                t(' can describe static situations, but to understand '),
                accent('change'),
                t(' — how fast, how much, what direction — we need '),
                def('calculus', 'A branch of mathematics focused on rates of change (differential calculus) and accumulation of quantities (integral calculus). Independently invented by Newton and Leibniz in the late 1600s.'),
                t('.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            { type: 'image', src: 'emoji:🌍', caption: 'Calculus: the language of a changing world' },
          ],
        },
      },
      // Page 2: History & significance
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            {
              type: 'paragraph',
              segments: [
                t('Calculus was independently invented by '),
                def('Isaac Newton', 'English mathematician and physicist (1643–1727). Developed calculus to solve problems in physics, particularly planetary motion and gravity.'),
                t(' and '),
                def('Gottfried Leibniz', 'German mathematician and philosopher (1646–1716). Developed calculus with a focus on notation. The ∫ and d/dx symbols we use today come from Leibniz.'),
                t(' in the late 1600s.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'Think about it',
              segments: [
                t('Without calculus, there would be '),
                bold('no smartphones'),
                t(', no GPS, no space travel, no modern medicine, and no internet. It\'s been called the greatest intellectual achievement of the human mind.'),
              ],
            },
          ],
        },
      },
      // Page 3: Two Big Questions with LaTeX
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Two Big Questions' }], level: 2 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Calculus answers two fundamental questions:'),
              ],
            },
            {
              type: 'bulletList',
              items: [
                [accent('Derivatives: '), t('At any given instant, how fast is something changing?')],
                [accent('Integrals: '), t('Over a period of time, how much total change accumulates?')],
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'The deep connection',
              segments: [
                t('These two questions are '),
                def('inverse operations', 'Two operations where one "undoes" the other — like addition and subtraction, or multiplication and division. Derivatives and integrals undo each other.'),
                t(', connected by the '),
                bold('Fundamental Theorem of Calculus'),
                t('.'),
              ],
            },
            {
              type: 'math',
              latex: '\\frac{d}{dx} \\int_a^x f(t)\\, dt = f(x)',
              caption: 'The Fundamental Theorem — differentiation undoes integration',
            },
          ],
        },
      },
      // Page 4: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'What are the two fundamental questions calculus answers?',
          questionSegments: [
            { text: 'What are the ' },
            { text: 'two fundamental questions', bold: true, color: 'accent' },
            { text: ' calculus answers?' },
          ],
          options: [
            'Addition and subtraction',
            'The rate of change at an instant (derivatives) and total accumulated change (integrals)',
            'Length and width',
            'Speed and distance only',
          ],
          correctIndex: 1,
          explanation: 'Derivatives measure the instantaneous rate of change, while integrals measure accumulated change. These two concepts form the core of calculus.',
          explanationSegments: [
            { text: 'Derivatives', bold: true, color: 'accent' },
            { text: ' measure the ' },
            { text: 'instantaneous rate of change', underline: true, definition: 'The rate at which a quantity is changing at one specific moment in time, as opposed to an average over an interval.' },
            { text: ', while ' },
            { text: 'integrals', bold: true, color: 'accent' },
            { text: ' measure ' },
            { text: 'accumulated change', bold: true },
            { text: '. These two concepts form the core of calculus and are connected by the Fundamental Theorem.' },
          ],
        },
      },
      // Page 5: Daily life applications
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🚀 Calculus in Daily Life' }], level: 2 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'bulletList',
              items: [
                [bold('GPS '), t('uses calculus to calculate your position from satellite signals')],
                [bold('Weather forecasts '), t('rely on calculus-based differential equations')],
                [bold('Streaming '), t('algorithms use calculus to optimise video compression')],
                [bold('Medical imaging '), t('(CT, MRI) reconstructs 3D images using integral calculus')],
                [bold('Engineering '), t('— every bridge, building, and airplane was designed using calculus')],
              ],
            },
            { type: 'divider' },
            {
              type: 'callout',
              style: 'example',
              title: 'Our approach',
              segments: [
                t('In this course, we prioritise '),
                accent('understanding over memorisation'),
                t('. Every formula has a story. The goal is for you to think "of COURSE that\'s the derivative!" rather than "I memorised this rule."'),
              ],
            },
          ],
        },
      },
      // Page 6: Interactive sine wave
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Explore: Changing Functions' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Before we dive into formal definitions, let\'s build intuition. The '),
                def('sine wave', 'A smooth, periodic wave described by the function y = sin(x). It appears everywhere in nature — sound waves, light waves, ocean tides, and alternating current.'),
                t(' below shows how a function can change. Drag the sliders to see how '),
                accent('amplitude'),
                t(', '),
                blue('frequency'),
                t(', and '),
                purple('phase'),
                t(' affect the shape:'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'interactive',
              componentId: 'sine-wave-explorer',
              props: { title: 'Function Explorer' },
            },
          ],
        },
      },
      // Page 7: Final question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'Why was calculus such a revolutionary invention?',
          options: [
            'It made arithmetic faster',
            'It provided tools to mathematically describe and predict change and motion',
            'It replaced all previous mathematics',
            'It was only useful for physics',
          ],
          correctIndex: 1,
          explanation: 'Before calculus, mathematics could describe static situations but had no systematic way to handle change and motion.',
          explanationSegments: [
            { text: 'Before calculus, mathematics could describe ' },
            { text: 'static situations', bold: true },
            { text: ' but had no systematic way to handle ' },
            { text: 'change and motion', bold: true, color: 'accent' },
            { text: '. Calculus gave scientists the language to describe, predict, and control ' },
            { text: 'dynamic systems', underline: true, definition: 'Systems that evolve over time — from planetary orbits to population growth to electrical circuits.' },
            { text: ' — from planetary orbits to population growth.' },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // MATH: "Understanding Limits"
  // ═══════════════════════════════════════════
  {
    title: 'Understanding Limits',
    content: [
      // Page 1: Title + intuition
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🎯 Getting Infinitely Close' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('A '),
                def('limit', 'The value that a function approaches as its input approaches some value. Written as lim(x→a) f(x) = L. The function doesn\'t need to actually reach L — it just needs to get arbitrarily close.'),
                t(' describes what value a function '),
                accent('approaches'),
                t(' as the input gets closer and closer to some number.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'example',
              title: 'Imagine this',
              segments: [
                t('You\'re walking toward a wall, but each step covers '),
                bold('half the remaining distance'),
                t('. Step 1: halfway. Step 2: three-quarters. Step 3: seven-eighths. You never quite reach the wall, but you get '),
                accent('infinitely close'),
                t('. The limit of your position is the wall.'),
              ],
            },
          ],
        },
      },
      // Page 2: Notation with LaTeX
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'The Notation' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('We write limits using this notation:'),
              ],
            },
            {
              type: 'math',
              latex: '\\lim_{x \\to a} f(x) = L',
              caption: '"As x approaches a, f(x) approaches L"',
            },
            {
              type: 'paragraph',
              segments: [
                t('This means: as '),
                latex('x'),
                t(' gets closer and closer to '),
                latex('a'),
                t(' (from both sides), '),
                latex('f(x)'),
                t(' gets closer and closer to '),
                latex('L'),
                t('.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'Key point',
              segments: [
                t('The function does '),
                bold('NOT'),
                t(' need to actually reach '),
                latex('L'),
                t('. Limits are about the '),
                accent('approach'),
                t(', not the arrival.'),
              ],
            },
          ],
        },
      },
      // Page 3: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'What does a limit describe?',
          options: [
            'The maximum value of a function',
            'The value a function approaches as the input gets closer to a specific point',
            'The speed of a function',
            'The area under a function',
          ],
          correctIndex: 1,
          explanation: 'A limit describes the value that a function approaches as its input approaches a specific value.',
          explanationSegments: [
            { text: 'A limit describes the value a function ' },
            { text: 'approaches', bold: true, color: 'accent' },
            { text: ' as its input approaches a specific value. Crucially, the function ' },
            { text: 'does not need to actually reach', bold: true },
            { text: ' that value — limits are about the ' },
            { text: 'approach', underline: true, definition: 'Getting arbitrarily close to a value without necessarily reaching it. This is what makes limits powerful — they handle infinity and division by zero.' },
            { text: ', not the arrival.' },
          ],
        },
      },
      // Page 4: Why Limits Matter
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🔍 Why Limits Matter' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Limits are the '),
                accent('foundation'),
                t(' that all of calculus is built upon. They allow us to make sense of concepts that seem paradoxical:'),
              ],
            },
            {
              type: 'bulletList',
              items: [
                [bold('Instantaneous speed: '), t('How can you have a speed at a '), def('single instant', 'A single point in time with zero duration. Calculating speed normally requires two time points — limits let us handle the paradox of speed at a single moment.'), t('?')],
                [bold('Area under curves: '), t('How do you measure the area of a shape with curved boundaries?')],
                [bold('Infinite sums: '), t('Can you add infinitely many numbers and get a finite answer?')],
              ],
            },
            { type: 'divider' },
            {
              type: 'paragraph',
              segments: [
                t('All of these require limits — approaching but never quite reaching infinity or zero.'),
              ],
            },
          ],
        },
      },
      // Page 5: sin(x)/x example
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🧪 A Famous Example' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Consider the function '),
                latex('f(x) = \\frac{\\sin(x)}{x}'),
                t('. What happens at '),
                latex('x = 0'),
                t('?'),
              ],
            },
            {
              type: 'math',
              latex: 'f(0) = \\frac{\\sin(0)}{0} = \\frac{0}{0} \\quad \\text{— undefined!}',
            },
            {
              type: 'paragraph',
              segments: [
                t('But watch what happens as '),
                latex('x'),
                t(' approaches 0:'),
              ],
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Getting closer...',
              segments: [
                latex('x = 1'),
                t(':  '),
                latex('f(x) \\approx 0.841'),
                t('\n'),
                latex('x = 0.1'),
                t(':  '),
                latex('f(x) \\approx 0.998'),
                t('\n'),
                latex('x = 0.01'),
                t(':  '),
                latex('f(x) \\approx 0.99998'),
                t('\n'),
                latex('x = 0.001'),
                t(':  '),
                latex('f(x) \\approx 0.9999998'),
              ],
            },
            {
              type: 'math',
              latex: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1',
              caption: 'The limit exists even though the function is undefined at x = 0!',
            },
          ],
        },
      },
      // Page 6: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'Can a limit exist at a point where the function itself is undefined?',
          options: [
            'No — the function must be defined for the limit to exist',
            'Yes — the limit describes what value the function APPROACHES, not its actual value',
            'Only for polynomial functions',
            'Only when the limit equals zero',
          ],
          correctIndex: 1,
          explanation: 'Limits describe the behavior NEAR a point, not AT that point.',
          explanationSegments: [
            { text: 'Limits describe the behaviour of a function ' },
            { text: 'near', bold: true, color: 'accent' },
            { text: ' a point, not ' },
            { text: 'at', bold: true },
            { text: ' that point. A function can be undefined at ' },
            { text: 'x = a', latex: true },
            { text: ', yet ' },
            { text: '\\lim_{x \\to a} f(x)', latex: true },
            { text: ' can still exist if the function approaches a consistent value from both sides.' },
          ],
        },
      },
      // Page 7: Summary
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            {
              type: 'paragraph',
              segments: [
                t('Limits are the bridge between the '),
                bold('finite'),
                t(' and the '),
                bold('infinite'),
                t('. They let us extract precise, finite answers from processes that involve infinitely many steps.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'The big picture',
              segments: [
                t('This idea — making the infinite '),
                accent('precise'),
                t(' — is what makes calculus possible. Every derivative and every integral is secretly a limit in disguise.'),
              ],
            },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // LOGIC: "What is Logic?"
  // ═══════════════════════════════════════════
  {
    title: 'What is Logic?',
    content: [
      // Page 1: Title & intro
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🧠 What is Logic?' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Logic is the '),
                def('systematic study', 'A methodical, structured approach to understanding something — following clear rules and principles rather than intuition alone.'),
                t(' of '),
                accent('valid reasoning'),
                t('. It helps us distinguish '),
                bold('good arguments'),
                t(' from bad ones.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            { type: 'image', src: 'emoji:🧩', caption: 'Logic is the foundation of clear thinking' },
          ],
        },
      },
      // Page 2: Core concept
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            {
              type: 'paragraph',
              segments: [
                t('At its core, logic is about understanding the '),
                bold('relationship between statements'),
                t(' and determining when one statement '),
                def('necessarily follows', 'In logic, "necessarily follows" means the conclusion MUST be true whenever the premises are true — there is no possible scenario where the premises are true but the conclusion is false.'),
                t(' from others.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'Key Idea',
              segments: [
                t('A '),
                def('logical argument', 'A set of statements (premises) followed by a conclusion. The argument is valid if the conclusion logically follows from the premises.'),
                t(' consists of '),
                blue('premises'),
                t(' (things we assume to be true) and a '),
                blue('conclusion'),
                t(' (what must follow).'),
              ],
            },
          ],
        },
      },
      // Page 3: Classic example
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'The Classic Example' }], level: 2 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'example',
              title: 'Syllogism',
              segments: [
                bold('Premise 1: '),
                t('All humans are mortal.\n'),
                bold('Premise 2: '),
                t('Socrates is human.\n'),
                bold('Conclusion: '),
                accent('Socrates is mortal.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('This is called a '),
                def('syllogism', 'A form of deductive reasoning consisting of a major premise, a minor premise, and a conclusion. First formalised by Aristotle around 350 BC.'),
                t(' — one of the oldest forms of logical reasoning.'),
              ],
            },
          ],
        },
      },
      // Page 4: LaTeX notation
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'The Language of Logic' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Logicians use '),
                bold('symbolic notation'),
                t(' to write arguments precisely:'),
              ],
            },
            { type: 'math', latex: 'P \\implies Q', caption: '"If P is true, then Q must be true"' },
            {
              type: 'paragraph',
              segments: [t('And the Socrates example becomes:')],
            },
            { type: 'math', latex: '\\forall x \\,(\\text{Human}(x) \\implies \\text{Mortal}(x))' },
            {
              type: 'callout',
              style: 'info',
              title: 'Don\'t worry!',
              segments: [
                t('You don\'t need to memorise these symbols now. The key takeaway is that logic can be '),
                accent('precise'),
                t(' and '),
                accent('unambiguous'),
                t('.'),
              ],
            },
          ],
        },
      },
      // Page 5: Interactive truth table
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Try It: Truth Tables' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('A '),
                def('truth table', 'A table showing all possible combinations of truth values for a logical expression. Each row represents one possible scenario.'),
                t(' shows every possible combination of true/false values. Try filling in the AND ('),
                latex('\\wedge'),
                t(') operator:'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            { type: 'interactive', componentId: 'truth-table-builder', props: { title: 'AND (∧) Truth Table', operator: 'AND' } },
          ],
        },
      },
      // Page 6: Venn diagram
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Visualising Logic' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('We can visualise logical relationships using '),
                def('Venn diagrams', 'Diagrams using overlapping circles to show relationships between sets. Named after mathematician John Venn (1834–1923).'),
                t('. Tap the regions below:'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'interactive',
              componentId: 'venn-diagram',
              props: {
                title: 'Logical Categories',
                leftLabel: 'Mortal',
                rightLabel: 'Greek',
                leftItems: ['Trees', 'Dogs', 'Humans'],
                rightItems: ['Zeus', 'Athena', 'Apollo'],
                bothItems: ['Socrates', 'Plato', 'Aristotle'],
              },
            },
          ],
        },
      },
      // Page 7: Quiz
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'Which of the following best describes what logic studies?',
          questionSegments: [
            { text: 'Which of the following best describes what ' },
            { text: 'logic', bold: true, color: 'accent' },
            { text: ' studies?' },
          ],
          options: [
            'The history of philosophy',
            'Valid patterns of reasoning',
            'Mathematical equations only',
            'Scientific experiments',
          ],
          correctIndex: 1,
          explanation: 'Logic is the study of valid reasoning.',
          explanationSegments: [
            { text: 'Logic is the study of ' },
            { text: 'valid reasoning', bold: true, color: 'accent' },
            { text: ' — how to construct arguments where conclusions ' },
            { text: 'necessarily follow', underline: true, definition: 'The conclusion must be true whenever the premises are true.' },
            { text: ' from premises.' },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // MATH: "Continuity: No Gaps Allowed"
  // ═══════════════════════════════════════════
  {
    title: 'Continuity: No Gaps Allowed',
    content: [
      // Page 1: Title & intuition
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '✏️ Drawing Without Lifting Your Pen' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Intuitively, a '),
                def('continuous function', 'A function where small changes in the input produce small changes in the output — no sudden jumps. You can draw its graph without lifting your pen.'),
                t(' is one you can draw '),
                accent('without lifting your pen'),
                t('. No gaps, no jumps, no sudden teleportations.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            { type: 'image', src: 'emoji:✏️', caption: 'Continuous = no breaks in the curve' },
          ],
        },
      },
      // Page 2: Formal definition with LaTeX
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'The Formal Definition' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('A function '),
                latex('f'),
                t(' is '),
                bold('continuous at a point '),
                latex('a'),
                t(' if three conditions are met:'),
              ],
            },
            {
              type: 'bulletList',
              items: [
                [latex('f(a)'), t(' exists — the function is '), def('defined', 'The function has a value at that point; there is no hole in the domain.'), t(' at that point')],
                [latex('\\lim_{x \\to a} f(x)'), t(' exists — the limit exists at that point')],
                [latex('\\lim_{x \\to a} f(x) = f(a)'), t(' — the limit equals the function value')],
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'In plain English',
              segments: [
                t('The function '),
                accent('arrives exactly where you\'d expect'),
                t(' based on the surrounding values. No surprises!'),
              ],
            },
          ],
        },
      },
      // Page 3: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'What makes a function continuous at a point?',
          questionSegments: [
            { text: 'What makes a function ' },
            { text: 'continuous', bold: true, color: 'accent' },
            { text: ' at a point?' },
          ],
          options: [
            'The function must be differentiable',
            'The function value must equal the limit at that point',
            'The function must be positive',
            'The function must be increasing',
          ],
          correctIndex: 1,
          explanation: 'A function is continuous at a point when its actual value equals its limit there.',
          explanationSegments: [
            { text: 'A function is continuous when ' },
            { text: 'f(a) = lim f(x)', latex: true },
            { text: '. This means there\'s no gap, jump, or hole — the function behaves ' },
            { text: 'exactly as its surrounding values predict', bold: true, color: 'accent' },
            { text: '.' },
          ],
        },
      },
      // Page 4: Types of discontinuity
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🕳️ Types of Discontinuity' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('When continuity fails, we get '),
                def('discontinuities', 'Points where a function is not continuous — where the pen must be lifted off the page.'),
                t('. There are three types:'),
              ],
            },
            {
              type: 'bulletList',
              items: [
                [accent('Removable (hole): '), t('The limit exists but the function is undefined or has the wrong value. Like a '), bold('pothole'), t(' — you could fix it by filling in the right value.')],
                [accent('Jump: '), t('The function approaches different values from the left and right. Like a '), bold('staircase'), t(' — the two sides disagree.')],
                [accent('Infinite: '), t('The function shoots off toward infinity. Like a '), bold('vertical asymptote'), t(' — the function goes haywire.')],
              ],
            },
          ],
        },
      },
      // Page 5: IVT
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🌊 The Intermediate Value Theorem' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('One of the most beautiful consequences of continuity is the '),
                def('Intermediate Value Theorem (IVT)', 'If a continuous function starts at one value and ends at another, it must pass through every value in between. There are no shortcuts — you must cross every level on the way.'),
                t(':'),
              ],
            },
            {
              type: 'math',
              latex: '\\text{If } f \\text{ is continuous on } [a, b] \\text{ and } f(a) < k < f(b), \\text{ then } \\exists\\, c \\in [a, b] \\text{ where } f(c) = k',
              caption: 'You can\'t go from below to above without crossing',
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'Why this matters',
              segments: [
                t('The IVT '),
                accent('proves equations have solutions'),
                t('! If '),
                latex('f(1) = -3'),
                t(' and '),
                latex('f(5) = 7'),
                t(', and '),
                latex('f'),
                t(' is continuous, then '),
                latex('f(x) = 0'),
                t(' must have a solution between 1 and 5.'),
              ],
            },
          ],
        },
      },
      // Page 6: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'The temperature at midnight is 2°C and at noon is 25°C. What does the IVT guarantee?',
          options: [
            'The temperature was exactly 15°C at 6 AM',
            'At some point, every temperature between 2°C and 25°C was reached',
            'The temperature increased steadily',
            'Nothing — the IVT does not apply to temperature',
          ],
          correctIndex: 1,
          explanation: 'Since temperature changes continuously, the IVT guarantees every value between 2°C and 25°C was reached.',
          explanationSegments: [
            { text: 'Temperature changes ' },
            { text: 'continuously', bold: true, color: 'accent' },
            { text: ' (no instant jumps), so the IVT guarantees that ' },
            { text: 'every temperature between 2°C and 25°C', bold: true },
            { text: ' was reached at some point. We don\'t know ' },
            { text: 'when', bold: true },
            { text: ' — just that it ' },
            { text: 'must have happened', bold: true, color: 'accent' },
            { text: '.' },
          ],
        },
      },
      // Page 7: Summary
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            {
              type: 'paragraph',
              segments: [
                t('Continuity might seem simple, but it\'s remarkably '),
                bold('deep'),
                t('. It\'s the foundation that allows us to take '),
                accent('derivatives'),
                t(' and '),
                accent('integrals'),
                t(' — the two pillars of calculus.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'The big picture',
              segments: [
                t('Without continuity, the machinery of calculus '),
                bold('breaks down'),
                t('. It\'s the quiet assumption that makes everything else possible.'),
              ],
            },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // MATH: "What is a Derivative?"
  // ═══════════════════════════════════════════
  {
    title: 'What is a Derivative?',
    content: [
      // Page 1: Title & hook
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '📈 Capturing the Instant' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Imagine you\'re driving and glance at your speedometer. It reads '),
                bold('60 mph'),
                t('. But what does that really mean? You\'re not travelling for a whole hour — you\'re looking at your speed at a '),
                def('single instant', 'A single point in time with zero duration. Speed normally requires two time points — how can we define it at just one?'),
                t('.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'The big question',
              segments: [
                t('How can we mathematically define speed at an instant when speed requires '),
                accent('two time points'),
                t('?'),
              ],
            },
          ],
        },
      },
      // Page 2: From average to instantaneous
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🔍 From Average to Instantaneous' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                def('Average speed', 'Total distance divided by total time — a rough summary of how fast you were going over an interval.'),
                t(' is easy: distance ÷ time. But what about speed at '),
                bold('exactly'),
                t(' '),
                latex('t = 1'),
                t('?'),
              ],
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Shrinking the interval',
              segments: [
                latex('t = 1'),
                t(' to '),
                latex('t = 1.1'),
                t(': average speed ≈ 62 mph\n'),
                latex('t = 1'),
                t(' to '),
                latex('t = 1.01'),
                t(': average speed ≈ 60.5 mph\n'),
                latex('t = 1'),
                t(' to '),
                latex('t = 1.001'),
                t(': average speed ≈ 60.05 mph'),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('As the interval shrinks toward zero, the average speed approaches the '),
                accent('instantaneous speed'),
                t('. This limit '),
                bold('IS'),
                t(' the derivative!'),
              ],
            },
            {
              type: 'math',
              latex: "f'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}",
              caption: 'The formal definition of the derivative',
            },
          ],
        },
      },
      // Page 3: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'The derivative at a point represents:',
          questionSegments: [
            { text: 'The ' },
            { text: 'derivative', bold: true, color: 'accent' },
            { text: ' at a point represents:' },
          ],
          options: [
            'The average rate of change over a large interval',
            'The instantaneous rate of change — the limit of average rates as the interval shrinks to zero',
            'The maximum value of the function',
            'The total area under the curve',
          ],
          correctIndex: 1,
          explanation: 'The derivative captures the precise rate of change at a single instant.',
          explanationSegments: [
            { text: 'The derivative is defined as the ' },
            { text: 'limit', bold: true, color: 'accent' },
            { text: ' of the average rate of change as the interval becomes ' },
            { text: 'infinitely small', bold: true },
            { text: '. It captures the precise rate of change at a ' },
            { text: 'single instant', underline: true, definition: 'A specific moment in time — the derivative solves the paradox of defining speed at a point with zero duration.' },
            { text: '.' },
          ],
        },
      },
      // Page 4: Geometric meaning
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '📐 Tangent Lines' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Visually, the derivative at a point equals the '),
                accent('slope of the tangent line'),
                t(' to the curve at that point.'),
              ],
            },
            {
              type: 'bulletList',
              items: [
                [bold('Steep tangent'), t(' = large derivative (rapid change)')],
                [bold('Flat tangent'), t(' = small derivative (slow change)')],
                [bold('Positive derivative'), t(' → function is '), accent('increasing')],
                [bold('Negative derivative'), t(' → function is '), accent('decreasing')],
                [bold('Zero derivative'), t(' → function is momentarily '), accent('flat'), t(' — often a peak or valley')],
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'Think about it',
              segments: [
                t('A '),
                def('tangent line', 'A straight line that just barely touches a curve at one point, showing the direction the curve is heading at that instant.'),
                t(' shows the '),
                bold('direction'),
                t(' the curve is heading at that instant.'),
              ],
            },
          ],
        },
      },
      // Page 5: Interactive
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Explore: Function & Derivative' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Use the interactive below to see how the '),
                accent('derivative'),
                t(' of a sine wave relates to the original function. Notice how the derivative is '),
                bold('zero at the peaks and valleys'),
                t(', and '),
                bold('largest where the function is steepest'),
                t('.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'interactive',
              componentId: 'sine-wave-explorer',
              props: { title: 'Derivative Visualiser' },
            },
          ],
        },
      },
      // Page 6: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'If the derivative of a function is zero at a point, what does that mean geometrically?',
          options: [
            'The function equals zero',
            'The tangent line is horizontal — the function is momentarily flat',
            'The function is discontinuous',
            'The function is linear',
          ],
          correctIndex: 1,
          explanation: 'A derivative of zero means the tangent line is perfectly horizontal.',
          explanationSegments: [
            { text: 'A derivative of zero means the tangent line is perfectly ' },
            { text: 'horizontal', bold: true, color: 'accent' },
            { text: ' — the function is neither increasing nor decreasing at that instant. This often indicates a local ' },
            { text: 'maximum', underline: true, definition: 'A point where the function reaches a peak — higher than all nearby points.' },
            { text: ' (peak), local ' },
            { text: 'minimum', underline: true, definition: 'A point where the function reaches a valley — lower than all nearby points.' },
            { text: ' (valley), or inflection point.' },
          ],
        },
      },
      // Page 7: Summary
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            {
              type: 'paragraph',
              segments: [
                t('The derivative transforms a '),
                bold('position'),
                t(' function into a '),
                accent('velocity'),
                t(' function, a velocity function into an '),
                accent('acceleration'),
                t(' function, and a revenue function into a '),
                accent('marginal revenue'),
                t(' function.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'The universal tool',
              segments: [
                t('Derivatives are the '),
                accent('universal tool'),
                t(' for understanding how things change. Wherever there\'s change, there\'s a derivative waiting to describe it.'),
              ],
            },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // MATH: "The Rules of Differentiation"
  // ═══════════════════════════════════════════
  {
    title: 'The Rules of Differentiation',
    content: [
      // Page 1: Title & hook
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '⚡ Shortcuts That Took Centuries' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Computing derivatives from the '),
                def('limit definition', 'The formal definition f\'(a) = lim(h→0) [f(a+h) − f(a)] / h. Correct but tedious for everyday use.'),
                t(' every time would be incredibly tedious. Fortunately, mathematicians have discovered '),
                accent('elegant rules'),
                t(' that let us differentiate quickly.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'Key insight',
              segments: [
                t('These rules aren\'t arbitrary — each one has a deep '),
                bold('geometric or algebraic reason'),
                t(' behind it.'),
              ],
            },
          ],
        },
      },
      // Page 2: Power Rule
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🔢 The Power Rule' }], level: 2 },
            {
              type: 'math',
              latex: '\\frac{d}{dx} x^n = n x^{n-1}',
              caption: 'Bring down the exponent, reduce by one',
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Examples',
              segments: [
                latex('f(x) = x^3'),
                t(' → '),
                latex("f'(x) = 3x^2"),
                t('\n'),
                latex('f(x) = x^5'),
                t(' → '),
                latex("f'(x) = 5x^4"),
                t('\n'),
                latex('f(x) = \\sqrt{x} = x^{1/2}'),
                t(' → '),
                latex("f'(x) = \\tfrac{1}{2} x^{-1/2}"),
                t('\n'),
                latex('f(x) = 1/x = x^{-1}'),
                t(' → '),
                latex("f'(x) = -x^{-2}"),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('The power rule works for '),
                accent('any exponent'),
                t(' — positive, negative, fractional. It\'s the '),
                bold('workhorse'),
                t(' of differentiation.'),
              ],
            },
          ],
        },
      },
      // Page 3: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'Using the power rule, what is the derivative of f(x) = x⁴?',
          questionSegments: [
            { text: 'Using the power rule, what is the derivative of ' },
            { text: 'f(x) = x^4', latex: true },
            { text: '?' },
          ],
          options: ['x³', '4x³', '4x⁴', '3x⁴'],
          correctIndex: 1,
          explanation: 'Bring down the 4, reduce the exponent by 1: 4x³.',
          explanationSegments: [
            { text: 'The power rule says: bring down the exponent as a coefficient, then ' },
            { text: 'reduce the exponent by 1', bold: true, color: 'accent' },
            { text: '. So ' },
            { text: 'x^4', latex: true },
            { text: ' becomes ' },
            { text: '4x^3', latex: true },
            { text: '.' },
          ],
        },
      },
      // Page 4: Chain Rule
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🔗 The Chain Rule' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('What about '),
                def('composite functions', 'A function inside another function, like f(g(x)). The outer function acts on the output of the inner function.'),
                t(' like '),
                latex('f(x) = (3x + 1)^5'),
                t('?'),
              ],
            },
            {
              type: 'math',
              latex: '\\frac{dy}{dx} = f\'(g(x)) \\cdot g\'(x)',
              caption: '"Differentiate the outer, multiply by the derivative of the inner"',
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Worked example',
              segments: [
                t('For '),
                latex('(3x + 1)^5'),
                t(':\n'),
                bold('Outer: '),
                latex('(\\cdot)^5 \\to 5(\\cdot)^4'),
                t('\n'),
                bold('Inner: '),
                latex('3x + 1 \\to 3'),
                t('\n'),
                bold('Result: '),
                latex('5(3x+1)^4 \\cdot 3 = 15(3x+1)^4'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Think of it like a '),
                bold('chain of gears'),
                t('. Each function contributes its own rate of change, and the overall rate is the '),
                accent('product'),
                t(' of each connection\'s rate.'),
              ],
            },
          ],
        },
      },
      // Page 5: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'The chain rule is used when you need to differentiate:',
          options: [
            'A constant',
            'A sum of two functions',
            'A composite function (a function inside another function)',
            'A polynomial',
          ],
          correctIndex: 2,
          explanation: 'The chain rule handles composite functions.',
          explanationSegments: [
            { text: 'The chain rule handles ' },
            { text: 'composite functions', bold: true, color: 'accent' },
            { text: ' — when one function is nested inside another. Whenever you see a function applied to something more complex than just ' },
            { text: 'x', latex: true },
            { text: ', you need the chain rule.' },
          ],
        },
      },
      // Page 6: Product & Quotient Rules
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '📦 Product & Quotient Rules' }], level: 2 },
            {
              type: 'math',
              latex: '\\frac{d}{dx}[f \\cdot g] = f\' g + f g\'',
              caption: 'Product Rule',
            },
            {
              type: 'callout',
              style: 'warning',
              title: 'Common mistake',
              segments: [
                t('The derivative of a product is '),
                accent('NOT'),
                t(' the product of the derivatives! Both functions change simultaneously.'),
              ],
            },
            {
              type: 'math',
              latex: '\\frac{d}{dx}\\left[\\frac{f}{g}\\right] = \\frac{f\' g - f g\'}{g^2}',
              caption: 'Quotient Rule — "Low d-high minus high d-low, over the square of what\'s below"',
            },
          ],
        },
      },
      // Page 7: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'Why is the derivative of f(x)·g(x) NOT simply f\'(x)·g\'(x)?',
          questionSegments: [
            { text: 'Why is the derivative of ' },
            { text: 'f(x) \\cdot g(x)', latex: true },
            { text: ' NOT simply ' },
            { text: "f'(x) \\cdot g'(x)", latex: true },
            { text: '?' },
          ],
          options: [
            'It is — that is the correct formula',
            'Both functions change simultaneously, so we must account for each one\'s change while the other holds',
            'Multiplication does not work with derivatives',
            'It only works for constants',
          ],
          correctIndex: 1,
          explanation: 'When two functions are multiplied, both change at the same time.',
          explanationSegments: [
            { text: 'The change in ' },
            { text: 'f \\cdot g', latex: true },
            { text: ' comes from ' },
            { text: 'f', latex: true },
            { text: ' changing while ' },
            { text: 'g', latex: true },
            { text: ' stays (' },
            { text: "f' g", latex: true },
            { text: ') PLUS ' },
            { text: 'g', latex: true },
            { text: ' changing while ' },
            { text: 'f', latex: true },
            { text: ' stays (' },
            { text: "f g'", latex: true },
            { text: '). Like how a rectangle\'s area changes when ' },
            { text: 'both sides grow', bold: true, color: 'accent' },
            { text: '.' },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // LOGIC: "Statements and Truth"
  // ═══════════════════════════════════════════
  {
    title: 'Statements and Truth',
    content: [
      // Page 1: Title & intro
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '📝 What is a Statement?' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('In logic, a '),
                def('statement', 'A declarative sentence that is either true or false — never both, never neither. Also called a proposition. Commands, questions, and exclamations are NOT statements.'),
                t(' (or '),
                def('proposition', 'Another word for a logical statement. A sentence that can be assigned a definite truth value of true or false.'),
                t(') is a sentence that is either '),
                accent('true'),
                t(' or '),
                accent('false'),
                t(' — never both, never neither.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            { type: 'image', src: 'emoji:⚖️', caption: 'Every statement tips the scales: true or false' },
          ],
        },
      },
      // Page 2: Examples
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Statement or Not?' }], level: 2 },
            {
              type: 'bulletList',
              items: [
                [{ text: '✅ ', bold: true }, t('"The Earth orbits the Sun" — '), accent('Statement'), t(' (it\'s true)')],
                [{ text: '✅ ', bold: true }, t('"2 + 2 = 5" — '), accent('Statement'), t(' (it\'s false, but still a statement!)')],
                [{ text: '❌ ', bold: true }, t('"Close the door!" — '), bold('Not a statement'), t(' (it\'s a command)')],
                [{ text: '❌ ', bold: true }, t('"What time is it?" — '), bold('Not a statement'), t(' (it\'s a question)')],
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'Key insight',
              segments: [
                t('A statement doesn\'t have to be '),
                bold('true'),
                t(' to be a statement — it just has to be '),
                accent('decidably true or false'),
                t('.'),
              ],
            },
          ],
        },
      },
      // Page 3: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'Which of the following is a logical statement?',
          questionSegments: [
            { text: 'Which of the following is a logical ' },
            { text: 'statement', bold: true, color: 'accent' },
            { text: '?' },
          ],
          options: [
            '"Please sit down."',
            '"Is it raining?"',
            '"7 is a prime number."',
            '"Wow, what a day!"',
          ],
          correctIndex: 2,
          explanation: '"7 is a prime number" is definitively true — it\'s a proper logical statement.',
          explanationSegments: [
            { text: '"7 is a prime number" is a ' },
            { text: 'declarative sentence', bold: true },
            { text: ' that is definitively ' },
            { text: 'true', bold: true, color: 'accent' },
            { text: '. Commands, questions, and exclamations cannot be assigned truth values.' },
          ],
        },
      },
      // Page 4: Truth values & variables
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '⚖️ Truth Values' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Every statement has exactly one '),
                def('truth value', 'The classification of a statement as either True (T) or False (F). In classical logic, every statement must have exactly one truth value.'),
                t(': '),
                accent('True (T)'),
                t(' or '),
                accent('False (F)'),
                t('. In logic, we use letters like '),
                latex('p'),
                t(', '),
                latex('q'),
                t(', and '),
                latex('r'),
                t(' to represent statements.'),
              ],
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Using variables',
              segments: [
                t('Let '),
                latex('p'),
                t(' = "It is raining"\nLet '),
                latex('q'),
                t(' = "The ground is wet"\n\nOn a rainy day: '),
                latex('p'),
                t(' is '),
                bold('True'),
                t(', '),
                latex('q'),
                t(' is '),
                bold('True'),
                t('\nOn a sunny dry day: '),
                latex('p'),
                t(' is '),
                bold('False'),
                t(', '),
                latex('q'),
                t(' is '),
                bold('False'),
              ],
            },
          ],
        },
      },
      // Page 5: Simple vs compound
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🧩 Simple vs. Compound' }], level: 2 },
            {
              type: 'bulletList',
              items: [
                [accent('Simple: '), t('Contains a single idea — "The sky is blue."')],
                [accent('Compound: '), t('Combines simple statements using '), def('logical connectives', 'Words or symbols (AND, OR, NOT, IF...THEN) used to combine statements into more complex expressions.'), t(' — "The sky is blue '), bold('AND'), t(' the grass is green."')],
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'info',
              title: 'Why this matters',
              segments: [
                t('Most real-world reasoning involves '),
                accent('compound'),
                t(' statements. "If you have a fever '),
                bold('AND'),
                t(' a cough, '),
                bold('THEN'),
                t(' you might have the flu" — that\'s compound logic in action!'),
              ],
            },
          ],
        },
      },
      // Page 6: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: '"If it is Tuesday, then we have a meeting" is an example of what?',
          options: [
            'A simple statement',
            'A compound statement',
            'A question',
            'A paradox',
          ],
          correctIndex: 1,
          explanation: 'It combines two simple statements using the IF...THEN connective.',
          explanationSegments: [
            { text: 'This is a ' },
            { text: 'compound statement', bold: true, color: 'accent' },
            { text: ' because it combines two simple statements ("it is Tuesday" and "we have a meeting") using the logical connective ' },
            { text: 'IF...THEN', bold: true },
            { text: '.' },
          ],
        },
      },
      // Page 7: Paradoxes
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🎭 Beware of Paradoxes!' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                t('Some sentences '),
                bold('seem'),
                t(' like statements but create logical contradictions. The famous '),
                def('Liar Paradox', 'A self-referencing statement that creates an unresolvable contradiction. If the statement is true, it must be false; if false, it must be true.'),
                t(':'),
              ],
            },
            {
              type: 'callout',
              style: 'warning',
              title: '"This sentence is false."',
              segments: [
                t('If it\'s '),
                accent('true'),
                t(', then it must be '),
                bold('false'),
                t(' (because that\'s what it says).\nIf it\'s '),
                accent('false'),
                t(', then it must be '),
                bold('true'),
                t(' (because "this sentence is false" would be wrong).'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Logicians have spent '),
                bold('centuries'),
                t(' wrestling with such puzzles. They remind us why precise definitions matter!'),
              ],
            },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // LOGIC: "Logical Operators"
  // ═══════════════════════════════════════════
  {
    title: 'Logical Operators',
    content: [
      // Page 1: Title & intro
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: '🔗 The Five Fundamental Operators' }], level: 1 },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                def('Logical operators', 'Symbols or words used to combine or modify statements. Also called connectives. They are the building blocks of all logical expressions.'),
                t(' (also called connectives) are the tools we use to '),
                accent('combine and modify'),
                t(' statements. There are five fundamental operators that form the backbone of all logical reasoning.'),
              ],
            },
          ],
        },
      },
      // Page 2: NOT & AND
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'NOT & AND' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                bold('1. NOT ('),
                latex('\\neg'),
                bold(') — Negation'),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('Flips a statement\'s truth value. If '),
                latex('p'),
                t(' is true, then '),
                latex('\\neg p'),
                t(' is false, and vice versa.'),
              ],
            },
            { type: 'math', latex: 'p = \\text{"It is sunny"} \\implies \\neg p = \\text{"It is NOT sunny"}' },
            { type: 'divider' },
            {
              type: 'paragraph',
              segments: [
                bold('2. AND ('),
                latex('\\wedge'),
                bold(') — Conjunction'),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('True '),
                accent('only'),
                t(' when '),
                bold('both'),
                t(' statements are true.'),
              ],
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Example',
              segments: [
                t('"It is warm '),
                bold('AND'),
                t(' it is sunny" — only true when '),
                accent('both'),
                t(' conditions hold.'),
              ],
            },
          ],
        },
      },
      // Page 3: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'If p is TRUE and q is FALSE, what is p ∧ q (p AND q)?',
          questionSegments: [
            { text: 'If ' },
            { text: 'p', latex: true },
            { text: ' is TRUE and ' },
            { text: 'q', latex: true },
            { text: ' is FALSE, what is ' },
            { text: 'p \\wedge q', latex: true },
            { text: '?' },
          ],
          options: ['True', 'False', 'Unknown', 'Both true and false'],
          correctIndex: 1,
          explanation: 'AND requires BOTH to be true. Since q is false, p ∧ q is false.',
          explanationSegments: [
            { text: 'AND requires ' },
            { text: 'both', bold: true, color: 'accent' },
            { text: ' statements to be true. Since ' },
            { text: 'q', latex: true },
            { text: ' is false, ' },
            { text: 'p \\wedge q', latex: true },
            { text: ' is ' },
            { text: 'false', bold: true },
            { text: '. Even one false component makes the entire AND expression false.' },
          ],
        },
      },
      // Page 4: OR & IF...THEN
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'OR & IF...THEN' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                bold('3. OR ('),
                latex('\\vee'),
                bold(') — Disjunction'),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('True when '),
                accent('at least one'),
                t(' statement is true. In logic, OR is '),
                def('inclusive', 'Logical OR includes the case where both are true. This differs from everyday English where "or" often implies "one or the other, but not both."'),
                t(' — also true when both are true.'),
              ],
            },
            { type: 'divider' },
            {
              type: 'paragraph',
              segments: [
                bold('4. IF...THEN ('),
                latex('\\to'),
                bold(') — Implication'),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('"If '),
                latex('p'),
                t(', then '),
                latex('q'),
                t('" is false '),
                accent('only'),
                t(' when '),
                latex('p'),
                t(' is true but '),
                latex('q'),
                t(' is false.'),
              ],
            },
            {
              type: 'callout',
              style: 'tip',
              title: 'Surprising but true!',
              segments: [
                t('"If pigs fly, then the moon is made of cheese" is logically '),
                accent('TRUE'),
                t(' — because a '),
                def('false premise', 'A starting assumption that is false. In logic, a false premise can imply anything — the implication is considered "vacuously true."'),
                t(' can imply anything!'),
              ],
            },
          ],
        },
      },
      // Page 5: Question
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'When is "If p, then q" (p → q) FALSE?',
          questionSegments: [
            { text: 'When is "If ' },
            { text: 'p', latex: true },
            { text: ', then ' },
            { text: 'q', latex: true },
            { text: '" (' },
            { text: 'p \\to q', latex: true },
            { text: ') FALSE?' },
          ],
          options: [
            'When p is false and q is true',
            'When both p and q are false',
            'When p is true and q is false',
            'When both p and q are true',
          ],
          correctIndex: 2,
          explanation: 'An implication is false ONLY when the premise is true but the conclusion is false.',
          explanationSegments: [
            { text: 'An implication ' },
            { text: 'p \\to q', latex: true },
            { text: ' is false ' },
            { text: 'only', bold: true, color: 'accent' },
            { text: ' when the premise ' },
            { text: 'p', latex: true },
            { text: ' is true but the conclusion ' },
            { text: 'q', latex: true },
            { text: ' is false. A false premise ' },
            { text: 'cannot break a promise', bold: true },
            { text: '.' },
          ],
        },
      },
      // Page 6: IF AND ONLY IF & truth table interactive
      {
        contentType: 'page',
        contentData: {
          type: 'page',
          blocks: [
            { type: 'heading', segments: [{ text: 'Biconditional & Practice' }], level: 2 },
            {
              type: 'paragraph',
              segments: [
                bold('5. IF AND ONLY IF ('),
                latex('\\leftrightarrow'),
                bold(') — Biconditional'),
              ],
            },
            {
              type: 'paragraph',
              segments: [
                t('True when both statements have the '),
                accent('same truth value'),
                t(' — both true or both false.'),
              ],
            },
            {
              type: 'callout',
              style: 'example',
              title: 'Example',
              segments: [
                t('"You pass '),
                bold('if and only if'),
                t(' you score above 60%" — passing '),
                accent('requires'),
                t(' the score, and the score '),
                accent('guarantees'),
                t(' passing. It works both ways.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('Try building an '),
                bold('OR'),
                t(' truth table:'),
              ],
            },
            { type: 'interactive', componentId: 'truth-table-builder', props: { title: 'OR (∨) Truth Table', operator: 'OR' } },
          ],
        },
      },
      // Page 7: Question & real-world applications
      {
        contentType: 'question',
        contentData: {
          type: 'question',
          question: 'What does the expression ¬(p ∧ q) mean?',
          questionSegments: [
            { text: 'What does ' },
            { text: '\\neg(p \\wedge q)', latex: true },
            { text: ' mean?' },
          ],
          options: [
            'NOT p AND NOT q',
            'It is NOT the case that both p and q are true',
            'p OR q',
            'Neither — the expression is invalid',
          ],
          correctIndex: 1,
          explanation: '¬(p ∧ q) negates the entire conjunction.',
          explanationSegments: [
            { text: '\\neg(p \\wedge q)', latex: true },
            { text: ' negates the ' },
            { text: 'entire conjunction', bold: true, color: 'accent' },
            { text: '. It means "it is NOT the case that both ' },
            { text: 'p', latex: true },
            { text: ' and ' },
            { text: 'q', latex: true },
            { text: ' are true". Note: this differs from ' },
            { text: '(\\neg p \\wedge \\neg q)', latex: true },
            { text: ' — a distinction captured by ' },
            { text: 'De Morgan\'s Laws', underline: true, definition: 'Two important rules: ¬(p ∧ q) ≡ (¬p ∨ ¬q) and ¬(p ∨ q) ≡ (¬p ∧ ¬q). They show how negation distributes over AND and OR.' },
            { text: '!' },
          ],
        },
      },
    ],
  },
];

async function migrateRichContent() {
  const client = await pool.connect();

  try {
    console.log('🎨 Migrating lesson content to rich format...\n');

    for (const upgrade of lessonUpgrades) {
      const result = await client.query(
        `SELECT id FROM lessons WHERE title = $1 LIMIT 1`,
        [upgrade.title]
      );

      if (result.rows.length === 0) {
        console.log(`⚠️  Lesson "${upgrade.title}" not found — skipping`);
        continue;
      }

      const lessonId = result.rows[0].id;

      // Delete old content
      const deleted = await client.query(
        `DELETE FROM lesson_content WHERE lesson_id = $1`,
        [lessonId]
      );
      console.log(`   Deleted ${deleted.rowCount} old content blocks`);

      // Insert new rich content
      for (let i = 0; i < upgrade.content.length; i++) {
        const c = upgrade.content[i];
        await client.query(
          `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [lessonId, i + 1, c.contentType, JSON.stringify(c.contentData)]
        );
      }

      console.log(`✅ "${upgrade.title}" → ${upgrade.content.length} rich pages`);
    }

    console.log('\n🎉 Migration complete! Refresh the web app to see changes.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRichContent().catch(console.error);
