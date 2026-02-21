import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create categories
    await client.query(`
      INSERT INTO categories (id, name, slug, order_index) VALUES
        (gen_random_uuid(), 'Logic', 'logic', 1),
        (gen_random_uuid(), 'Writing', 'writing', 2),
        (gen_random_uuid(), 'Math', 'math', 3),
        (gen_random_uuid(), 'Science', 'science', 4),
        (gen_random_uuid(), 'CS', 'cs', 5)
      ON CONFLICT (slug) DO NOTHING;
    `);
    
    // Get category IDs
    const logicCat = await client.query(`SELECT id FROM categories WHERE slug = 'logic'`);
    const writingCat = await client.query(`SELECT id FROM categories WHERE slug = 'writing'`);
    
    const logicCatId = logicCat.rows[0]?.id;
    const writingCatId = writingCat.rows[0]?.id;
    
    if (!logicCatId || !writingCatId) {
      throw new Error('Categories not found');
    }
    
    // Create courses
    const course1Result = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'Introduction to Logic', 'Learn the fundamentals of logical thinking and reasoning. Build a strong foundation for problem-solving.', '#FF6B35', 8, 24, true, 1)
      RETURNING id
    `, [logicCatId]);
    
    const course2Result = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'Creative Writing Fundamentals', 'Master the art of storytelling. Learn narrative structure, character development, and creative expression.', '#FFB800', 10, 30, true, 2)
      RETURNING id
    `, [writingCatId]);
    
    const course1Id = course1Result.rows[0].id;
    const course2Id = course2Result.rows[0].id;
    
    // Create levels for Introduction to Logic
    const level1Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) VALUES (gen_random_uuid(), $1, 'Introduction', 1) RETURNING id
    `, [course1Id]);
    const level2Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) VALUES (gen_random_uuid(), $1, 'Basic Reasoning', 2) RETURNING id
    `, [course1Id]);
    
    const level1Id = level1Result.rows[0].id;
    const level2Id = level2Result.rows[0].id;
    
    // Create levels for Creative Writing
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) VALUES (gen_random_uuid(), $1, 'Story Structure', 1) RETURNING id
    `, [course2Id]);
    const level4Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) VALUES (gen_random_uuid(), $1, 'Character Development', 2) RETURNING id
    `, [course2Id]);
    
    const level3Id = level3Result.rows[0].id;
    const level4Id = level4Result.rows[0].id;
    
    // Create lessons for Introduction to Logic - Level 1
    const lesson1Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'What is Logic?', 'lesson', 1) RETURNING id
    `, [level1Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Statements and Truth', 'lesson', 2)`, [level1Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Logical Operators', 'lesson', 3)`, [level1Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Practice: Basic Logic', 'exercise', 4)`, [level1Id]);
    
    const lesson1Id = lesson1Result.rows[0].id;
    
    // Create lessons for Logic - Level 2
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Deductive Reasoning', 'lesson', 1)`, [level2Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Inductive Reasoning', 'lesson', 2)`, [level2Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Common Fallacies', 'lesson', 3)`, [level2Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Practice: Reasoning', 'exercise', 4)`, [level2Id]);
    
    // Create lessons for Creative Writing - Level 1
    const lesson9Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'The Three-Act Structure', 'lesson', 1) RETURNING id
    `, [level3Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Conflict and Tension', 'lesson', 2)`, [level3Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Pacing Your Story', 'lesson', 3)`, [level3Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Practice: Plot Outline', 'exercise', 4)`, [level3Id]);
    
    const lesson9Id = lesson9Result.rows[0].id;
    
    // Create lessons for Creative Writing - Level 2
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Creating Memorable Characters', 'lesson', 1)`, [level4Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Character Motivation', 'lesson', 2)`, [level4Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Dialogue That Sings', 'lesson', 3)`, [level4Id]);
    await client.query(`INSERT INTO lessons (id, level_id, title, type, order_index) VALUES (gen_random_uuid(), $1, 'Practice: Character Sketch', 'exercise', 4)`, [level4Id]);
    
    // Create lesson content for "What is Logic?"
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "Logic is the systematic study of valid reasoning. It helps us distinguish good arguments from bad ones."}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "At its core, logic is about understanding the relationship between statements and determining when one statement necessarily follows from others."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Consider this example: If all humans are mortal, and Socrates is human, then Socrates must be mortal. This is a classic logical argument.", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "Which of the following best describes what logic studies?", "options": ["The history of philosophy", "Valid patterns of reasoning", "Mathematical equations", "Scientific experiments"], "correctIndex": 1, "explanation": "Logic is the study of valid reasoning - how to construct arguments where conclusions follow necessarily from premises."}')
    `, [lesson1Id]);
    
    // Create lesson content for "The Three-Act Structure"
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "The three-act structure is a model used in storytelling that divides a narrative into three parts: Setup, Confrontation, and Resolution."}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Act One (Setup): Introduce your characters, setting, and the central conflict. This typically takes up about 25% of your story."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Act Two (Confrontation): The longest act, where your protagonist faces obstacles and the conflict intensifies. About 50% of your story."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Act Three (Resolution): The climax and conclusion. All storylines converge, and the conflict is resolved. About 25% of your story."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Which act typically contains the climax of the story?", "options": ["Act One", "Act Two", "Act Three", "None of the above"], "correctIndex": 2, "explanation": "Act Three contains the climax and resolution, where all storylines converge and the conflict reaches its peak before being resolved."}')
    `, [lesson9Id]);
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
