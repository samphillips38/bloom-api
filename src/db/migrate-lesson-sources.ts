import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migrateLessonSources() {
  const client = await pool.connect();

  try {
    console.log('📝 Adding sources column to lesson_content and populating math course metadata...');

    // 1. Add sources column if it doesn't exist
    await client.query(`
      ALTER TABLE lesson_content 
      ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '[]'::jsonb
    `);
    console.log('  ✅ sources column added to lesson_content');

    // 2. Update the math course creator metadata
    await client.query(`
      UPDATE courses 
      SET creator_name = 'Bloom Team', ai_involvement = 'collaboration'
      WHERE title = 'The Beauty of Calculus'
    `);
    console.log('  ✅ Math course metadata updated');

    // 3. Find all math course lessons and add example sources
    const mathLessons = await client.query(`
      SELECT l.id, l.title FROM lessons l
      JOIN levels lv ON l.level_id = lv.id
      JOIN courses c ON lv.course_id = c.id
      WHERE c.title = 'The Beauty of Calculus'
      ORDER BY lv.order_index, l.order_index
    `);

    if (mathLessons.rows.length === 0) {
      console.log('  ⚠️  No math course lessons found. Run db:seed-new-math first.');
      return;
    }

    // Sources by lesson title (must match actual DB titles)
    const sourcesByLesson: Record<string, { title: string; url?: string; description?: string }[]> = {
      'Why Calculus Matters': [
        { title: 'Essence of Calculus — 3Blue1Brown', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr', description: 'Visual introduction to the core ideas of calculus' },
        { title: 'A Brief History of Calculus', url: 'https://www.britannica.com/science/calculus-mathematics', description: 'Newton and Leibniz\'s independent invention of calculus' },
      ],
      'Understanding Limits': [
        { title: 'Limits — Khan Academy', url: 'https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new', description: 'Interactive exercises on limits and continuity' },
        { title: 'What is a Limit? — 3Blue1Brown', url: 'https://www.youtube.com/watch?v=kfF40MiS7zA', description: 'Visual explanation of the epsilon-delta definition' },
      ],
      'Continuity: No Gaps Allowed': [
        { title: 'Continuity — Khan Academy', url: 'https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new/ab-1-12/v/continuity-at-a-point', description: 'When functions behave nicely and when they don\'t' },
      ],
      'What is a Derivative?': [
        { title: 'The Paradox of the Derivative — 3Blue1Brown', url: 'https://www.youtube.com/watch?v=9vKqVkMQHKk', description: 'Why derivatives capture instantaneous change' },
        { title: 'Derivative Rules Reference', url: 'https://www.mathsisfun.com/calculus/derivatives-rules.html', description: 'Power rule, product rule, chain rule cheat sheet' },
        { title: 'Principia Mathematica — Isaac Newton (1687)', description: 'The foundational text introducing calculus as "the method of fluxions"' },
      ],
      'The Rules of Differentiation': [
        { title: 'Differentiation Rules — Paul\'s Online Math Notes', url: 'https://tutorial.math.lamar.edu/Classes/CalcI/DiffFormulas.aspx', description: 'Comprehensive reference with worked examples' },
        { title: 'Chain Rule Intuition — 3Blue1Brown', url: 'https://www.youtube.com/watch?v=YG15m2VwSjA', description: 'Why the chain rule works and how to think about it' },
      ],
      'Applications: Optimization & Motion': [
        { title: 'Applications of Derivatives — MIT OpenCourseWare', url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', description: 'Real-world optimization and related rates problems' },
        { title: 'Physics and Calculus', url: 'https://www.feynmanlectures.caltech.edu/', description: 'Feynman Lectures — how derivatives describe motion' },
      ],
      'What is an Integral?': [
        { title: 'Integration and the Fundamental Theorem — 3Blue1Brown', url: 'https://www.youtube.com/watch?v=rfG8ce4nNh0', description: 'Visual proof of why integration is anti-differentiation' },
        { title: 'The History of Integration', url: 'https://www.britannica.com/science/integral-calculus', description: 'From Archimedes\' method of exhaustion to Riemann sums' },
      ],
      'Integration Techniques': [
        { title: 'Fundamental Theorem of Calculus — Khan Academy', url: 'https://www.khanacademy.org/math/ap-calculus-ab/ab-integration-new/ab-6-4/v/fundamental-theorem-of-calculus', description: 'The bridge between derivatives and integrals' },
        { title: 'Calculus Made Easy — Silvanus Thompson (1910)', description: 'Classic accessible introduction: "What one fool can do, another can"' },
      ],
      'Applications: Areas, Volumes & More': [
        { title: 'Applications of Integration — MIT OCW 18.01', url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', description: 'Area, volume, work, and probability applications' },
        { title: 'Integrals in Physics', url: 'https://www.feynmanlectures.caltech.edu/', description: 'Feynman Lectures — how integration underpins physics' },
      ],
    };

    for (const lesson of mathLessons.rows) {
      const sources = sourcesByLesson[lesson.title];
      if (sources && sources.length > 0) {
        // Add sources to the first content page of each lesson
        const firstPage = await client.query(
          `SELECT id FROM lesson_content WHERE lesson_id = $1 ORDER BY order_index LIMIT 1`,
          [lesson.id]
        );
        if (firstPage.rows[0]) {
          await client.query(
            `UPDATE lesson_content SET sources = $1 WHERE id = $2`,
            [JSON.stringify(sources), firstPage.rows[0].id]
          );
          console.log(`  📚 Added ${sources.length} sources to "${lesson.title}"`);
        }
      }
    }

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateLessonSources().catch(console.error);
