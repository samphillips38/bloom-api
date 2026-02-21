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

    // Delete existing content for this lesson
    await client.query(`DELETE FROM lesson_content WHERE lesson_id = $1`, [lessonId]);

    // ── Page 1: Title & intro with definitions ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 1, 'page', $2)`,
      [lessonId, JSON.stringify({
        type: 'page',
        blocks: [
          {
            type: 'heading',
            segments: [{ text: '🧠 What is Logic?' }],
            level: 1,
          },
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
          {
            type: 'image',
            src: 'emoji:🧩',
            caption: 'Logic is the foundation of clear thinking',
          },
        ],
      })]
    );

    // ── Page 2: Core concept with callout ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 2, 'page', $2)`,
      [lessonId, JSON.stringify({
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
          { type: 'divider' },
          {
            type: 'paragraph',
            segments: [
              t('We use logic every day — from deciding what to eat, to debugging code, to forming opinions about the world.'),
            ],
          },
        ],
      })]
    );

    // ── Page 3: Classic example with formatted reasoning ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 3, 'page', $2)`,
      [lessonId, JSON.stringify({
        type: 'page',
        blocks: [
          {
            type: 'heading',
            segments: [{ text: 'The Classic Example' }],
            level: 2,
          },
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
              def('syllogism', 'A form of deductive reasoning consisting of a major premise, a minor premise, and a conclusion. First formalized by Aristotle around 350 BC.'),
              t(' — one of the oldest forms of logical reasoning, first described by '),
              bold('Aristotle'),
              t(' over 2,300 years ago.'),
            ],
          },
          {
            type: 'callout',
            style: 'tip',
            title: 'Why does this work?',
            segments: [
              t('If the premises are true, the conclusion '),
              accent('must'),
              t(' be true. There\'s no way around it — that\'s the power of '),
              def('deductive reasoning', 'A type of logical reasoning where the conclusion is guaranteed to be true if the premises are true. It moves from general rules to specific cases.'),
              t('.'),
            ],
          },
        ],
      })]
    );

    // ── Page 4: Logical notation with LaTeX ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 4, 'page', $2)`,
      [lessonId, JSON.stringify({
        type: 'page',
        blocks: [
          {
            type: 'heading',
            segments: [{ text: 'The Language of Logic' }],
            level: 2,
          },
          {
            type: 'paragraph',
            segments: [
              t('Logicians use '),
              bold('symbolic notation'),
              t(' to write arguments precisely. Here\'s how we\'d write "if P then Q":'),
            ],
          },
          {
            type: 'math',
            latex: 'P \\implies Q',
            caption: '"If P is true, then Q must be true"',
          },
          {
            type: 'paragraph',
            segments: [
              t('And the Socrates example becomes:'),
            ],
          },
          {
            type: 'math',
            latex: '\\forall x \\,(\\text{Human}(x) \\implies \\text{Mortal}(x))',
            caption: '"For all x, if x is human then x is mortal"',
          },
          { type: 'spacer', size: 'sm' },
          {
            type: 'callout',
            style: 'info',
            title: 'Don\'t worry!',
            segments: [
              t('You don\'t need to memorize these symbols now. We\'ll learn them step by step in later lessons. The key takeaway is that logic can be '),
              accent('precise'),
              t(' and '),
              accent('unambiguous'),
              t('.'),
            ],
          },
        ],
      })]
    );

    // ── Page 5: Interactive truth table ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 5, 'page', $2)`,
      [lessonId, JSON.stringify({
        type: 'page',
        blocks: [
          {
            type: 'heading',
            segments: [{ text: 'Try It: Truth Tables' }],
            level: 2,
          },
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
          {
            type: 'interactive',
            componentId: 'truth-table-builder',
            props: {
              title: 'AND (∧) Truth Table',
              operator: 'AND',
            },
          },
        ],
      })]
    );

    // ── Page 6: Venn Diagram interactive ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 6, 'page', $2)`,
      [lessonId, JSON.stringify({
        type: 'page',
        blocks: [
          {
            type: 'heading',
            segments: [{ text: 'Visualizing Logic' }],
            level: 2,
          },
          {
            type: 'paragraph',
            segments: [
              t('We can also visualize logical relationships using '),
              def('Venn diagrams', 'Diagrams that use overlapping circles to show the relationships between different sets or groups. Named after mathematician John Venn (1834–1923).'),
              t('. Tap the regions below to explore:'),
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
      })]
    );

    // ── Page 7: Summary with bullet points ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 7, 'page', $2)`,
      [lessonId, JSON.stringify({
        type: 'page',
        blocks: [
          {
            type: 'heading',
            segments: [{ text: '📝 Key Takeaways' }],
            level: 2,
          },
          { type: 'spacer', size: 'sm' },
          {
            type: 'bulletList',
            items: [
              [accent('Logic'), t(' is the study of valid reasoning')],
              [t('Arguments consist of '), blue('premises'), t(' and a '), blue('conclusion')],
              [t('A valid argument\'s conclusion '), bold('must be true'), t(' if its premises are true')],
              [t('We can express logic using '), purple('symbolic notation'), t(' like '), latex('P \\implies Q')],
              [def('Truth tables', 'Tables showing all possible input/output combinations for a logical expression'), t(' help us verify logical operators')],
            ],
          },
          { type: 'divider' },
          {
            type: 'callout',
            style: 'tip',
            title: 'Coming up next',
            segments: [
              t('In the next lesson, we\'ll dive deeper into '),
              bold('statements and truth values'),
              t(' — the building blocks of all logical reasoning.'),
            ],
          },
        ],
      })]
    );

    // ── Page 8: Quiz question ──
    await client.query(
      `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 8, 'question', $2)`,
      [lessonId, JSON.stringify({
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
        explanation: 'Logic is the study of valid reasoning — how to construct arguments where conclusions follow necessarily from premises.',
        explanationSegments: [
          { text: 'Logic is the study of ' },
          { text: 'valid reasoning', bold: true, color: 'accent' },
          { text: ' — how to construct arguments where conclusions ' },
          { text: 'necessarily follow', underline: true, definition: 'The conclusion must be true whenever the premises are true.' },
          { text: ' from premises. While logic is used in philosophy, math, and science, it is fundamentally about the ' },
          { text: 'structure of arguments', bold: true },
          { text: ' themselves.' },
        ],
      })]
    );

    console.log('✅ Rich content seeded for "What is Logic?" lesson!');

    // ── Also upgrade "Statements and Truth" if it exists ──
    const statementsLesson = await client.query(
      `SELECT id FROM lessons WHERE title = 'Statements and Truth' LIMIT 1`
    );

    if (statementsLesson.rows.length > 0) {
      const statementsId = statementsLesson.rows[0].id;
      await client.query(`DELETE FROM lesson_content WHERE lesson_id = $1`, [statementsId]);

      // Page 1: Introduction
      await client.query(
        `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 1, 'page', $2)`,
        [statementsId, JSON.stringify({
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
        `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 2, 'page', $2)`,
        [statementsId, JSON.stringify({
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
        `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 3, 'page', $2)`,
        [statementsId, JSON.stringify({
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
        `INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES (gen_random_uuid(), $1, 4, 'question', $2)`,
        [statementsId, JSON.stringify({
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
