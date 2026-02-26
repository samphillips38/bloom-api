/**
 * Rich content seed data — upgrades existing lesson content
 * to use the new rich page format with inline formatting,
 * definitions, LaTeX, callouts, and interactive components.
 *
 * Run AFTER the main seed has populated lessons.
 *
 * Usage:  npx tsx src/db/seed-rich-content.ts
 */
import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

// ── Helper to build a text segment ────────────────────────
const t = (text: string) => ({ text });
const bold = (text: string) => ({ text, bold: true });
const accent = (text: string) => ({ text, bold: true, color: 'accent' as const });
const blue = (text: string) => ({ text, bold: true, color: 'blue' as const });
const purple = (text: string) => ({ text, bold: true, color: 'purple' as const });
const def = (text: string, definition: string) => ({ text, underline: true, definition });
const latex = (tex: string) => ({ text: tex, latex: true });

async function seedRichContent() {
  const client = await pool.connect();

  try {
    console.log('🎨 Upgrading lesson content to rich format...');

    // ── Find "What is Logic?" lesson ──
    const logicLesson = await client.query(
      `SELECT id FROM lessons WHERE title = 'What is Logic?' LIMIT 1`
    );

    if (logicLesson.rows.length === 0) {
      console.log('⚠️  "What is Logic?" lesson not found — run main seed first.');
      return;
    }

    const lessonId = logicLesson.rows[0].id;

    // Delete existing content and modules for this lesson
    await client.query(`DELETE FROM lesson_content WHERE lesson_id = $1`, [lessonId]);
    await client.query(`DELETE FROM lesson_modules WHERE lesson_id = $1`, [lessonId]);

    // Create a single module to hold all 17 pages
    const logicModResult = await client.query(
      `INSERT INTO lesson_modules (id, lesson_id, title, order_index) VALUES (gen_random_uuid(), $1, $2, 1) RETURNING id`,
      [lessonId, 'What is Logic?']
    );
    const logicModuleId = logicModResult.rows[0].id;

    // Helper to insert a page (with module association)
    const insertPage = async (orderIndex: number, type: string, data: object) => {
      await client.query(
        `INSERT INTO lesson_content (id, lesson_id, module_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
        [lessonId, logicModuleId, orderIndex, type, JSON.stringify(data)]
      );
    };

    // ══════════════════════════════════════════════════════
    // PAGE 1 — Intro: heading + image + paragraph
    // ══════════════════════════════════════════════════════
    await insertPage(1, 'page', {
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
            t(' from bad ones, and is the bedrock of mathematics, science, and computer science.'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        { type: 'image', src: 'emoji:🧩', caption: 'Logic: the foundation of clear thinking' },
        { type: 'spacer', size: 'sm' },
        {
          type: 'callout',
          style: 'info',
          title: 'What you\'ll learn',
          segments: [
            t('This lesson covers the '),
            bold('branches of logic'),
            t(', its '),
            bold('history'),
            t(', key '),
            blue('terms and symbols'),
            t(', and hands-on '),
            accent('interactive exercises'),
            t(' to make it all click.'),
          ],
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 2 — Concept Web: branches of logic
    // ══════════════════════════════════════════════════════
    await insertPage(2, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Branches of Logic' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Logic isn\'t a single thing — it\'s a family of related disciplines. Explore the web below to discover the main branches:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'concept-web',
          props: {
            title: 'Branches of Logic',
            center: 'Logic',
            centerEmoji: '🧠',
            nodes: [
              { label: 'Deductive', description: 'Reasoning from general principles to specific conclusions. If premises are true and the argument is valid, the conclusion must be true. Example: All mammals breathe air. Whales are mammals. ∴ Whales breathe air.', emoji: '⬇️' },
              { label: 'Inductive', description: 'Reasoning from specific observations to general conclusions. The conclusion is probable but not guaranteed. This is how science builds theories from experiments.', emoji: '⬆️' },
              { label: 'Abductive', description: 'Inference to the best explanation. Given incomplete observations, find the most plausible hypothesis. Used by doctors, detectives, and scientists.', emoji: '🔍' },
              { label: 'Formal', description: 'Logic studied through abstract symbols and rules, independent of content or meaning. Includes propositional logic (P, Q, R) and predicate logic (∀x, ∃x).', emoji: '📐' },
              { label: 'Informal', description: 'Logic applied to natural language arguments. Includes identifying logical fallacies, rhetorical analysis, and everyday critical thinking skills.', emoji: '💬' },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 3 — Timeline: history of logic
    // ══════════════════════════════════════════════════════
    await insertPage(3, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'A Brief History of Logic' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Logic has evolved over '),
            bold('2,400 years'),
            t('. Tap the events below to explore its major milestones:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'timeline',
          props: {
            title: 'History of Logic',
            events: [
              { year: '350 BC', title: 'Aristotle\'s Organon', description: 'Aristotle formalizes deductive logic, creating the first systematic framework for reasoning through syllogisms. His work dominated logical thought for nearly 2,000 years.', emoji: '🏛️' },
              { year: '1847', title: 'Boole\'s Laws of Thought', description: 'George Boole develops Boolean algebra, connecting logic to mathematics with binary TRUE/FALSE values. This laid the groundwork for digital computing.', emoji: '🔢' },
              { year: '1879', title: 'Frege\'s Begriffsschrift', description: 'Gottlob Frege invents predicate logic — a far more expressive notation that can represent quantifiers (∀, ∃) and relations, not just propositions.', emoji: '📝' },
              { year: '1910', title: 'Principia Mathematica', description: 'Bertrand Russell and Alfred Whitehead attempt to derive all of mathematics from logical axioms — a monumental effort that runs to three volumes.', emoji: '📚' },
              { year: '1931', title: 'Gödel\'s Incompleteness', description: 'Kurt Gödel proves that any consistent formal system capable of basic arithmetic must contain statements that are true but unprovable within that system.', emoji: '♾️' },
              { year: '1936', title: 'Turing\'s Machines', description: 'Alan Turing defines computable logic through his theoretical "Turing Machine" — giving birth to computer science and the idea of algorithms.', emoji: '💻' },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 4 — Flashcard Deck: core logic terms
    // ══════════════════════════════════════════════════════
    await insertPage(4, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Core Logic Vocabulary' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Before we dive deeper, let\'s build a solid vocabulary. Flip through the cards below to learn the '),
            bold('essential terms'),
            t(':'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'flashcard-deck',
          props: {
            title: 'Logic Vocabulary',
            cards: [
              { front: 'Premise', back: 'A statement assumed to be true as a starting point for reasoning. An argument can have multiple premises.' },
              { front: 'Conclusion', back: 'The statement that is claimed to follow from the premises. The "therefore" statement.' },
              { front: 'Argument', back: 'A set of statements (premises) offered as reasons to believe a conclusion.' },
              { front: 'Valid', back: 'An argument is valid if the conclusion MUST be true whenever all premises are true. Validity is about structure, not truth.' },
              { front: 'Sound', back: 'An argument is sound if it is valid AND all its premises are actually true.' },
              { front: 'Fallacy', back: 'An error in reasoning. A fallacious argument may appear valid but contains a flaw that undermines its conclusion.' },
              { front: 'Proposition', back: 'Any declarative statement that is either true or false. Also called a "statement." E.g., "The sky is blue."' },
              { front: 'Tautology', back: 'A statement that is always true regardless of the truth values of its components. E.g., "P OR NOT P" is always true.' },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 5 — Classic Syllogism: callout + math
    // ══════════════════════════════════════════════════════
    await insertPage(5, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'The Classic Syllogism' }], level: 2 },
        { type: 'spacer', size: 'sm' },
        {
          type: 'callout',
          style: 'example',
          title: 'Aristotle\'s Most Famous Argument',
          segments: [
            bold('Premise 1: '), t('All humans are mortal.\n'),
            bold('Premise 2: '), t('Socrates is human.\n'),
            bold('Conclusion: '), accent('Therefore, Socrates is mortal.'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'paragraph',
          segments: [
            t('This is called a '),
            def('syllogism', 'A form of deductive reasoning with a major premise, a minor premise, and a conclusion. If both premises are true and the structure is valid, the conclusion must follow.'),
            t('. In symbolic notation:'),
          ],
        },
        {
          type: 'math',
          latex: '\\forall x\\,(H(x) \\implies M(x)), \\quad H(s) \\;\\vdash\\; M(s)',
          caption: '"For all x, if x is Human then x is Mortal. Socrates is Human. Therefore Socrates is Mortal."',
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'callout',
          style: 'tip',
          title: 'The power of deduction',
          segments: [
            t('If the premises are true and the argument is valid, there is '),
            accent('no escape'),
            t(' — the conclusion must be true. This certainty is what makes '),
            def('deductive reasoning', 'Reasoning that guarantees the truth of the conclusion given true premises. Moves from general rules to specific cases.'),
            t(' so powerful.'),
          ],
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 6 — Word Match: logic terms → definitions
    // ══════════════════════════════════════════════════════
    await insertPage(6, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Match the Terms' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Test your knowledge! Tap a term on the left, then tap its matching definition on the right:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'word-match',
          props: {
            title: 'Logic Terms',
            pairs: [
              { term: 'Premise', definition: 'Assumed starting statement' },
              { term: 'Conclusion', definition: 'What follows from premises' },
              { term: 'Valid', definition: 'Structure guarantees truth transfer' },
              { term: 'Sound', definition: 'Valid + premises are true' },
              { term: 'Fallacy', definition: 'An error in reasoning' },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 7 — Truth Tables: paragraph + truth-table-builder
    // ══════════════════════════════════════════════════════
    await insertPage(7, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Truth Tables' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('A '),
            def('truth table', 'A table showing all possible combinations of truth values for a logical expression. Each row is one scenario.'),
            t(' systematically lists every scenario for a logical expression. The '),
            blue('AND (∧)'),
            t(' operator is true only when '),
            bold('both'),
            t(' inputs are true. Try completing it:'),
          ],
        },
        {
          type: 'math',
          latex: 'P \\wedge Q \\text{ is TRUE only when both } P \\text{ and } Q \\text{ are TRUE}',
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'truth-table-builder',
          props: { title: 'AND (∧) Truth Table', operator: 'AND' },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 8 — Sortable Categories: valid vs invalid arguments
    // ══════════════════════════════════════════════════════
    await insertPage(8, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Valid or Invalid?' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Can you tell a '),
            accent('valid'),
            t(' argument from an '),
            bold('invalid'),
            t(' one? Sort each argument into the correct bucket:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'sortable-categories',
          props: {
            title: 'Sort the Arguments',
            instruction: 'Tap an argument, then tap a category.',
            categories: [
              {
                label: '✅ Valid',
                items: [
                  'All A are B. X is A. ∴ X is B.',
                  'If P then Q. P is true. ∴ Q is true.',
                  'No fish are mammals. Salmon is a fish. ∴ Salmon is not a mammal.',
                ],
              },
              {
                label: '❌ Invalid',
                items: [
                  'All dogs are animals. This is an animal. ∴ It\'s a dog.',
                  'I\'ve never seen a ghost, so they don\'t exist.',
                  'Everyone I know likes pizza. ∴ Everyone likes pizza.',
                ],
              },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 9 — Fill in the Blank: modus ponens
    // ══════════════════════════════════════════════════════
    await insertPage(9, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Complete the Argument' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('One of the most fundamental argument forms is '),
            def('Modus Ponens', 'Latin for "the way that affirms." The argument form: If P then Q; P is true; therefore Q is true. It is a valid deductive argument.'),
            t('. Fill in the blanks to complete it:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'fill-in-the-blank',
          props: {
            title: 'Modus Ponens',
            sentence: 'If P is __BLANK__, and P __BLANK__ Q is true, then Q must be __BLANK__.',
            blanks: ['true', 'implies', 'true'],
            wordBank: ['false', 'contradicts', 'unknown', 'optional'],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 10 — Sequence Sorter: steps of constructing a proof
    // ══════════════════════════════════════════════════════
    await insertPage(10, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Building a Logical Proof' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('A logical proof follows a specific sequence of steps. Can you put them in the right order?'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'sequence-sorter',
          props: {
            title: 'Steps of a Logical Proof',
            instruction: 'Arrange the steps from first to last.',
            items: [
              'Identify the premises of the argument',
              'Check that the argument form is valid',
              'Verify that all premises are actually true',
              'Apply valid inference rules step by step',
              'State the conclusion that follows',
            ],
            hint: 'Start with what you know, check the structure, then verify the facts.',
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 11 — Memory Match: operators ↔ symbols
    // ══════════════════════════════════════════════════════
    await insertPage(11, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Logic Symbols Memory Game' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Can you match each '),
            blue('logical operator'),
            t(' to its '),
            accent('symbol'),
            t('? Flip the cards to find the pairs:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'memory-match',
          props: {
            title: 'Operators & Symbols',
            pairs: [
              { term: '∧', definition: 'AND' },
              { term: '∨', definition: 'OR' },
              { term: '¬', definition: 'NOT' },
              { term: '→', definition: 'IMPLIES' },
              { term: '↔', definition: 'IFF' },
              { term: '∴', definition: 'THEREFORE' },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 12 — Poll: which application of logic interests you?
    // ══════════════════════════════════════════════════════
    await insertPage(12, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Your Take' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Logic shows up everywhere. Which '),
            accent('application'),
            t(' of logical reasoning are you most excited to explore?'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'poll',
          props: {
            question: 'Which application of logic interests you most?',
            options: [
              'Mathematics & Proofs',
              'Computer Science & Coding',
              'Philosophy & Ethics',
              'Everyday Decision Making',
              'Debate & Rhetoric',
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 13 — Hotspot Diagram: logic gates
    // ══════════════════════════════════════════════════════
    await insertPage(13, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Logic in Action: Gates' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Boolean logic — the logic of '),
            bold('true/false'),
            t(' values — directly powers every computer. '),
            def('Logic gates', 'Electronic components that implement logical operations (AND, OR, NOT, etc.) using transistors. Every modern processor contains billions of them.'),
            t(' implement logical operations in hardware. Explore each gate below:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'hotspot-diagram',
          props: {
            title: 'Logic Gates',
            diagramEmoji: '🖥️',
            diagramLabel: 'Digital Logic Circuit',
            hotspots: [
              { x: 18, y: 28, label: 'AND Gate (∧)', description: 'Outputs 1 only when BOTH inputs are 1. In code: A && B. Used to require multiple conditions simultaneously.', emoji: '⚡' },
              { x: 50, y: 18, label: 'OR Gate (∨)', description: 'Outputs 1 when AT LEAST ONE input is 1. In code: A || B. Used when any one condition being true is sufficient.', emoji: '🔀' },
              { x: 82, y: 32, label: 'NOT Gate (¬)', description: 'Inverts the single input — turns 1→0 and 0→1. In code: !A. Also called an inverter. Simplest possible gate.', emoji: '🔄' },
              { x: 28, y: 68, label: 'NAND Gate', description: 'NOT AND — the inverse of AND. Functionally complete: any logic circuit can be built from NAND gates alone. The most widely used gate in practice.', emoji: '🔩' },
              { x: 68, y: 70, label: 'XOR Gate (⊕)', description: 'Exclusive OR — outputs 1 when inputs are DIFFERENT. Used in binary addition (half adder) and cryptographic operations.', emoji: '⊕' },
            ],
          },
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 14 — Bar Chart Builder: logical fallacy frequency
    // ══════════════════════════════════════════════════════
    await insertPage(14, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Common Logical Fallacies' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('A '),
            def('logical fallacy', 'An error in reasoning that makes an argument invalid or unreliable. Recognizing fallacies is a critical thinking superpower.'),
            t(' is a flaw in reasoning. The chart below shows how commonly these fallacies appear in everyday debates. Adjust the sliders to explore:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'bar-chart-builder',
          props: {
            title: 'Fallacy Frequency in Debates',
            description: 'Approximate frequency (%) of common fallacies observed in political and online debates.',
            showValues: true,
            bars: [
              { label: 'Ad Hominem', value: 72, maxValue: 100 },
              { label: 'Straw Man', value: 58, maxValue: 100 },
              { label: 'Appeal to Authority', value: 63, maxValue: 100 },
              { label: 'False Dilemma', value: 45, maxValue: 100 },
              { label: 'Slippery Slope', value: 38, maxValue: 100 },
              { label: 'Circular Reasoning', value: 31, maxValue: 100 },
            ],
          },
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'callout',
          style: 'warning',
          title: 'Watch out!',
          segments: [
            t('The most common fallacy — '),
            def('Ad Hominem', 'Attacking the person making the argument rather than the argument itself. Latin for "to the man."'),
            t(' — attacks the '),
            bold('person'),
            t(', not the argument. Learning to spot it is the first step to better reasoning.'),
          ],
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 15 — Number Line: confidence self-rating
    // ══════════════════════════════════════════════════════
    await insertPage(15, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: 'Check In With Yourself' }], level: 2 },
        {
          type: 'paragraph',
          segments: [
            t('Metacognition — '),
            def('thinking about your own thinking', 'The ability to reflect on, understand, and control your own thought processes. Research shows metacognition significantly improves learning outcomes.'),
            t(' — is itself a logical skill. How are you feeling so far?'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'number-line',
          props: {
            title: 'Confidence Check',
            question: 'On a scale from 0 to 10, how confident are you about the concepts so far?',
            min: 0,
            max: 10,
            step: 1,
            unit: '/10',
          },
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'callout',
          style: 'tip',
          title: 'All levels are fine!',
          segments: [
            t('Whether you\'re at 2 or 10, this lesson has been designed to build your understanding step by step. Keep going! 🚀'),
          ],
        },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 16 — Quiz Question
    // ══════════════════════════════════════════════════════
    await insertPage(16, 'question', {
      type: 'question',
      question: 'An argument is described as "sound." What does this tell us?',
      questionSegments: [
        { text: 'An argument is described as ' },
        { text: '"sound."', bold: true, color: 'accent' },
        { text: ' What does this tell us?' },
      ],
      options: [
        'The argument is valid in its logical structure only',
        'The argument is both valid AND all its premises are true',
        'The conclusion is interesting and well-written',
        'The argument uses formal symbolic notation',
      ],
      correctIndex: 1,
      explanation: 'Soundness requires both validity (correct logical structure) and truth (all premises are actually true). A valid argument can still have false premises!',
      explanationSegments: [
        { text: 'Soundness', bold: true, color: 'accent' },
        { text: ' is a stronger standard than mere ' },
        { text: 'validity.', bold: true },
        { text: ' An argument is sound only if it is ' },
        { text: 'valid', underline: true, definition: 'The conclusion must follow from the premises — a structural property.' },
        { text: ' AND all its ' },
        { text: 'premises are actually true', bold: true },
        { text: ' in the real world. A valid argument can have false premises and a false conclusion!' },
      ],
    });

    // ══════════════════════════════════════════════════════
    // PAGE 17 — Summary + Venn Diagram
    // ══════════════════════════════════════════════════════
    await insertPage(17, 'page', {
      type: 'page',
      blocks: [
        { type: 'heading', segments: [{ text: '📝 Summary & Review' }], level: 2 },
        { type: 'spacer', size: 'sm' },
        {
          type: 'bulletList',
          items: [
            [accent('Logic'), t(' is the systematic study of valid reasoning')],
            [t('Arguments have '), blue('premises'), t(' → '), blue('conclusion'), t(' structure')],
            [bold('Valid'), t(' = correct structure; '), bold('Sound'), t(' = valid + true premises')],
            [t('Deductive reasoning gives '), accent('certainty'), t('; inductive gives '), accent('probability')],
            [t('Boolean logic powers all '), purple('digital computers'), t(' via logic gates')],
            [t('Recognizing '), def('fallacies', 'Errors in reasoning that undermine an argument\'s validity'), t(' is essential for critical thinking')],
          ],
        },
        { type: 'divider' },
        {
          type: 'paragraph',
          segments: [
            t('To wrap up, explore the relationship between '),
            bold('deductive'),
            t(' and '),
            bold('inductive'),
            t(' reasoning:'),
          ],
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'interactive',
          componentId: 'venn-diagram',
          props: {
            title: 'Types of Reasoning',
            leftLabel: 'Deductive',
            rightLabel: 'Inductive',
            leftItems: ['Guarantees conclusion', 'Used in mathematics', 'Works top-down'],
            rightItems: ['Probable conclusion', 'Used in science', 'Works bottom-up'],
            bothItems: ['Premises → Conclusion', 'Uses structured arguments', 'Found in philosophy'],
          },
        },
        { type: 'spacer', size: 'sm' },
        {
          type: 'callout',
          style: 'tip',
          title: 'Coming up next',
          segments: [
            t('Next we\'ll explore '),
            bold('statements and truth values'),
            t(' — the atomic building blocks of all logical reasoning. You\'re building a great foundation! 🧠'),
          ],
        },
      ],
    });

    console.log('✅ Showcase rich content seeded for "What is Logic?" lesson (17 pages, all components)!');

    // ── Also upgrade "Statements and Truth" if it exists ──
    const statementsLesson = await client.query(
      `SELECT id FROM lessons WHERE title = 'Statements and Truth' LIMIT 1`
    );

    if (statementsLesson.rows.length > 0) {
      const statementsId = statementsLesson.rows[0].id;
      await client.query(`DELETE FROM lesson_content WHERE lesson_id = $1`, [statementsId]);
      await client.query(`DELETE FROM lesson_modules WHERE lesson_id = $1`, [statementsId]);

      // Create a module for this lesson
      const stmtModResult = await client.query(
        `INSERT INTO lesson_modules (id, lesson_id, title, order_index) VALUES (gen_random_uuid(), $1, $2, 1) RETURNING id`,
        [statementsId, 'Statements and Truth']
      );
      const stmtModuleId = stmtModResult.rows[0].id;

      // Page 1: Introduction
      await client.query(
        `INSERT INTO lesson_content (id, lesson_id, module_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, $2, 1, 'page', $3)`,
        [statementsId, stmtModuleId, JSON.stringify({
          type: 'page',
          blocks: [
            {
              type: 'heading',
              segments: [{ text: '💡 Statements & Truth' }],
              level: 1,
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'paragraph',
              segments: [
                t('In logic, a '),
                def('statement', 'A declarative sentence that is either true or false — never both, and never neither. Also called a "proposition."'),
                t(' (or '),
                def('proposition', 'Another word for a logical statement. Propositions are the basic building blocks of logical arguments.'),
                t(') is a sentence that is either '),
                accent('true'),
                t(' or '),
                accent('false'),
                t(' — but never both.'),
              ],
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'example',
              title: 'Examples',
              segments: [
                { text: '✅  "The Earth orbits the Sun" → ', bold: true },
                t('TRUE\n'),
                { text: '✅  "2 + 2 = 5" → ', bold: true },
                t('FALSE\n'),
                { text: '❌  "Close the door!" → ', bold: true },
                t('NOT a statement (it\'s a command)'),
              ],
            },
          ],
        })]
      );

      // Page 2: Notation
      await client.query(
        `INSERT INTO lesson_content (id, lesson_id, module_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, $2, 2, 'page', $3)`,
        [statementsId, stmtModuleId, JSON.stringify({
          type: 'page',
          blocks: [
            {
              type: 'heading',
              segments: [{ text: 'Notation' }],
              level: 2,
            },
            {
              type: 'paragraph',
              segments: [
                t('We typically use letters like '),
                latex('P'),
                t(', '),
                latex('Q'),
                t(', and '),
                latex('R'),
                t(' to represent statements. Their '),
                def('truth value', 'Whether a statement is True (T) or False (F). Every statement has exactly one truth value.'),
                t(' is either '),
                blue('T'),
                t(' (true) or '),
                blue('F'),
                t(' (false).'),
              ],
            },
            {
              type: 'math',
              latex: 'P = \\text{"It is raining"} \\quad \\Rightarrow \\quad P \\in \\{T, F\\}',
            },
            { type: 'spacer', size: 'sm' },
            {
              type: 'callout',
              style: 'tip',
              title: 'Think of it like a light switch',
              segments: [
                t('A statement is like a switch — it\'s either '),
                accent('ON'),
                t(' (true) or '),
                accent('OFF'),
                t(' (false). There\'s no in-between in classical logic!'),
              ],
            },
          ],
        })]
      );

      // Page 3: Logical operators intro with interactive
      await client.query(
        `INSERT INTO lesson_content (id, lesson_id, module_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, $2, 3, 'page', $3)`,
        [statementsId, stmtModuleId, JSON.stringify({
          type: 'page',
          blocks: [
            {
              type: 'heading',
              segments: [{ text: 'Combining Statements' }],
              level: 2,
            },
            {
              type: 'paragraph',
              segments: [
                t('We can combine statements using '),
                def('logical operators', 'Symbols that connect statements to form new, more complex statements. The most common are AND (∧), OR (∨), and NOT (¬).'),
                t('. The simplest is '),
                accent('NOT'),
                t(' (¬), which flips a statement\'s truth value:'),
              ],
            },
            {
              type: 'math',
              latex: '\\neg P = \\text{"It is } \\textbf{not} \\text{ raining"}',
            },
            {
              type: 'paragraph',
              segments: [
                t('Try it yourself — fill in the NOT truth table:'),
              ],
            },
            {
              type: 'interactive',
              componentId: 'truth-table-builder',
              props: {
                title: 'NOT (¬) Truth Table',
                operator: 'NOT',
              },
            },
          ],
        })]
      );

      // Page 4: Question
      await client.query(
        `INSERT INTO lesson_content (id, lesson_id, module_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, $2, 4, 'question', $3)`,
        [statementsId, stmtModuleId, JSON.stringify({
          type: 'question',
          question: 'Which of the following is NOT a valid statement (proposition)?',
          options: [
            '"The sky is blue"',
            '"Please pass the salt"',
            '"7 is a prime number"',
            '"All cats are mammals"',
          ],
          correctIndex: 1,
          explanation: '"Please pass the salt" is a request/command, not a statement. Statements must be declarative sentences that can be either true or false.',
          explanationSegments: [
            { text: '"Please pass the salt"', bold: true },
            { text: ' is a ' },
            { text: 'request/command', bold: true, color: 'accent' },
            { text: ', not a statement. Statements must be ' },
            { text: 'declarative sentences', underline: true, definition: 'A sentence that declares something to be the case. It can be evaluated as true or false.' },
            { text: ' that can be either true or false.' },
          ],
        })]
      );

      console.log('✅ Rich content seeded for "Statements and Truth" lesson!');
    }

  } catch (error) {
    console.error('❌ Rich content seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedRichContent().catch(console.error);
