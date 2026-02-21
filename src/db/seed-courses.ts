import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedCourses() {
  const client = await pool.connect();
  
  try {
    console.log('🎵 Adding Music and Physics courses...');
    
    // Create Music category
    await client.query(`
      INSERT INTO categories (id, name, slug, order_index) 
      VALUES (gen_random_uuid(), 'Music', 'music', 6)
      ON CONFLICT (slug) DO NOTHING
    `);
    
    // Create Physics category  
    await client.query(`
      INSERT INTO categories (id, name, slug, order_index)
      VALUES (gen_random_uuid(), 'Physics', 'physics', 7)
      ON CONFLICT (slug) DO NOTHING
    `);
    
    // Get category IDs
    const musicCat = await client.query(`SELECT id FROM categories WHERE slug = 'music'`);
    const physicsCat = await client.query(`SELECT id FROM categories WHERE slug = 'physics'`);
    
    const musicCatId = musicCat.rows[0]?.id;
    const physicsCatId = physicsCat.rows[0]?.id;
    
    // ==========================================
    // COURSE 1: MUSICAL HARMONIES
    // ==========================================
    
    const harmonyCourseResult = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'The Art of Musical Harmonies', 'Discover the beautiful mathematics behind music. Learn how notes combine to create emotions, from simple intervals to complex chord progressions.', '#E91E63', 6, 12, true, 1)
      RETURNING id
    `, [musicCatId]);
    
    const harmonyCourseId = harmonyCourseResult.rows[0].id;
    
    // Level 1: Foundations of Harmony
    const harmonyLevel1Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Foundations of Harmony', 1) 
      RETURNING id
    `, [harmonyCourseId]);
    const harmonyLevel1Id = harmonyLevel1Result.rows[0].id;
    
    // Lesson 1: What is Harmony?
    const harmonyLesson1Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'What is Harmony?', 'lesson', 1) 
      RETURNING id
    `, [harmonyLevel1Id]);
    const harmonyLesson1Id = harmonyLesson1Result.rows[0].id;
    
    // Content for "What is Harmony?"
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎹 Welcome to the World of Harmony", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "When you hear a beautiful chord on a piano or guitar, you are experiencing harmony — the magical combination of multiple notes played simultaneously."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Harmony is what gives music its emotional depth. A single melody line tells a story, but harmony adds color, mood, and feeling to that story."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/harmony-waves.png", "caption": "Sound waves combining to create harmony — when frequencies align, beautiful music emerges"}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🔬 The Science Behind the Sound", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Every musical note is actually a vibration at a specific frequency. When we play two notes together, their sound waves interact. Some combinations feel pleasant (consonant), while others create tension (dissonant)."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "The ancient Greeks discovered that the most pleasing harmonies occur when the frequency ratios between notes are simple numbers like 2:1, 3:2, or 4:3."}'),
        (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "What is harmony in music?", "options": ["Playing notes one after another", "The speed of the music", "Multiple notes played together that create a pleasing sound", "The volume of the instruments"], "correctIndex": 2, "explanation": "Harmony is created when multiple notes sound simultaneously. The way these notes interact creates the emotional character of the music."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🎭 Harmony Creates Emotion", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Think about how a major chord sounds bright and happy, while a minor chord sounds sad or mysterious. This emotional power comes entirely from the mathematical relationships between the notes!"}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Movie composers use this knowledge to manipulate your emotions. A suspenseful scene uses dissonant harmonies that create tension, while a triumphant moment uses consonant major chords."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why do some note combinations sound pleasant while others sound tense?", "options": ["It depends on how loud they are played", "Simple frequency ratios between notes create consonance", "It is completely random and subjective", "Only electronic instruments can create harmony"], "correctIndex": 1, "explanation": "When the frequency ratio between notes is a simple fraction (like 2:1 or 3:2), our brains perceive this as consonant and pleasing. More complex ratios create dissonance and tension."}')
    `, [harmonyLesson1Id]);
    
    // Lesson 2: Intervals - The Building Blocks
    const harmonyLesson2Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'Intervals: The Building Blocks', 'lesson', 2) 
      RETURNING id
    `, [harmonyLevel1Id]);
    const harmonyLesson2Id = harmonyLesson2Result.rows[0].id;
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📐 What is an Interval?", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "An interval is simply the distance between two notes. Just like we measure physical distance in meters, we measure musical distance in intervals."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Intervals are named by counting the letter names between notes. From C to E is a third (C-D-E = 3 letters). From C to G is a fifth (C-D-E-F-G = 5 letters)."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/intervals-keyboard.png", "caption": "Common intervals shown on a piano keyboard"}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🎯 The Perfect Intervals", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Some intervals are called perfect because they have the simplest frequency ratios and have been considered ideal since ancient times:"}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "• Perfect Unison (1:1) — The same note\\n• Perfect Octave (2:1) — Like C to the next C\\n• Perfect Fifth (3:2) — The foundation of most chords\\n• Perfect Fourth (4:3) — Creates a sense of openness"}'),
        (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "If you play C and then count up to G, what interval have you created?", "options": ["A third", "A fourth", "A fifth", "An octave"], "correctIndex": 2, "explanation": "Counting C-D-E-F-G gives us 5 letter names, making this a fifth. The perfect fifth (3:2 ratio) is one of the most consonant and powerful intervals in music."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🎨 Major and Minor Intervals", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Thirds and sixths come in two flavors: major (larger) and minor (smaller). This distinction is crucial — it is the difference between a happy major chord and a sad minor chord!"}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "A major third spans 4 half-steps (like C to E), while a minor third spans only 3 half-steps (like C to E♭). That single half-step difference completely changes the emotional character."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "What makes a minor interval different from a major interval?", "options": ["Minor intervals are played quieter", "Minor intervals are one half-step smaller than major intervals", "Minor intervals use only black keys", "There is no difference"], "correctIndex": 1, "explanation": "A minor interval is exactly one half-step smaller than its major counterpart. This small difference creates the distinctive sad or mysterious quality of minor keys."}')
    `, [harmonyLesson2Id]);
    
    // Lesson 3: Building Chords
    const harmonyLesson3Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'Building Your First Chords', 'lesson', 3) 
      RETURNING id
    `, [harmonyLevel1Id]);
    const harmonyLesson3Id = harmonyLesson3Result.rows[0].id;
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🏗️ From Intervals to Chords", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A chord is created when we stack intervals on top of each other. The most common chords are triads — three notes stacked in thirds."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Think of building a chord like building a tower: you start with a foundation note (the root), then add notes above it at specific intervals."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/chord-building.png", "caption": "Building major and minor triads by stacking thirds"}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🌟 The Major Triad", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "A major triad = Root + Major Third + Perfect Fifth\\n\\nFor example, C Major = C + E + G\\n\\nThis combination creates a bright, stable, happy sound that feels resolved and complete."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌙 The Minor Triad", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "A minor triad = Root + Minor Third + Perfect Fifth\\n\\nFor example, C Minor = C + E♭ + G\\n\\nJust by lowering the third by one half-step, the entire mood shifts to something darker and more introspective."}'),
        (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "What notes make up a G Major triad?", "options": ["G - A - B", "G - B - D", "G - B♭ - D", "G - C - E"], "correctIndex": 1, "explanation": "A major triad is Root + Major Third + Perfect Fifth. Starting from G: G (root) + B (major third above G) + D (perfect fifth above G) = G Major triad."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🔮 Beyond Triads", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "By adding a fourth note (the seventh), we create seventh chords with even richer colors. Jazz musicians love these chords for their sophisticated, complex sound."}'),
        (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "• Major 7th — Dreamy, romantic (think of a sunset)\\n• Dominant 7th — Tense, wants to resolve (the sound of blues)\\n• Minor 7th — Mellow, jazzy sophistication"}'),
        (gen_random_uuid(), $1, 13, 'question', '{"type": "question", "question": "What is the only difference between a C Major and C minor triad?", "options": ["The root note changes", "The fifth is different", "The third is lowered by a half-step", "Minor chords have four notes"], "correctIndex": 2, "explanation": "The only difference is the third! C Major has E (major third), while C minor has E♭ (minor third). The root and fifth stay the same."}')
    `, [harmonyLesson3Id]);
    
    // Practice lesson
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'Practice: Identify the Harmonies', 'exercise', 4)
    `, [harmonyLevel1Id]);
    
    // ==========================================
    // COURSE 2: QUANTUM COMPUTING
    // ==========================================
    
    const quantumCourseResult = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'Quantum Computing: A New Paradigm', 'Journey into the fascinating world where physics meets computation. Understand qubits, superposition, and why quantum computers could revolutionize everything.', '#00BCD4', 6, 15, true, 1)
      RETURNING id
    `, [physicsCatId]);
    
    const quantumCourseId = quantumCourseResult.rows[0].id;
    
    // Level 1: Quantum Foundations
    const quantumLevel1Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Quantum Foundations', 1) 
      RETURNING id
    `, [quantumCourseId]);
    const quantumLevel1Id = quantumLevel1Result.rows[0].id;
    
    // Lesson 1: Beyond Classical Computing
    const quantumLesson1Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'Beyond Classical Computing', 'lesson', 1) 
      RETURNING id
    `, [quantumLevel1Id]);
    const quantumLesson1Id = quantumLesson1Result.rows[0].id;
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🖥️ The Limits of Classical Computers", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Your smartphone is incredibly powerful. It can process billions of calculations per second. Yet there are problems so complex that even the world fastest supercomputers would take longer than the age of the universe to solve them."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Classical computers process information as bits — tiny switches that are either OFF (0) or ON (1). Every photo, video, and app on your phone is ultimately just a massive sequence of these 0s and 1s."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/classical-bits.png", "caption": "Classical bits: each switch must be definitively 0 or 1"}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "⚡ Why Some Problems Are Impossible", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Imagine you need to find the best route through 50 cities. There are more possible routes than atoms in the observable universe! A classical computer must check them one by one."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "This is where quantum computers change everything. They do not just compute faster — they compute fundamentally differently, exploring many possibilities simultaneously."}'),
        (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "What is the basic unit of information in a classical computer?", "options": ["A qubit", "A byte", "A bit (0 or 1)", "A pixel"], "correctIndex": 2, "explanation": "Classical computers use bits — binary digits that can only be 0 or 1. Everything your computer does is built on processing these simple binary values."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🌌 Enter the Quantum Realm", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Quantum computers harness the strange rules of quantum physics — rules that govern atoms, electrons, and photons. At this tiny scale, particles behave in ways that seem impossible in our everyday world."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "These quantum effects — superposition, entanglement, and interference — give quantum computers their extraordinary power. They are not just faster calculators; they are an entirely new kind of machine."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why can some problems not be solved by classical computers in a reasonable time?", "options": ["Computers are not fast enough", "The number of possibilities grows exponentially, exceeding computational capacity", "We have not written the right software yet", "Classical computers can solve any problem given enough time"], "correctIndex": 1, "explanation": "Some problems have so many possibilities that checking them all would take longer than the universe has existed, even with the fastest supercomputers. Quantum computers can explore these possibilities differently."}')
    `, [quantumLesson1Id]);
    
    // Lesson 2: The Qubit Revolution
    const quantumLesson2Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'The Qubit: A New Kind of Bit', 'lesson', 2) 
      RETURNING id
    `, [quantumLevel1Id]);
    const quantumLesson2Id = quantumLesson2Result.rows[0].id;
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎱 Meet the Qubit", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A qubit (quantum bit) is the quantum version of a classical bit. But unlike a regular bit that must be 0 OR 1, a qubit can be 0 AND 1 at the same time!"}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Think of a coin. A classical bit is like a coin lying on a table — definitely heads or definitely tails. A qubit is like a coin spinning in the air — in some sense, it is both heads AND tails until it lands."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/qubit-sphere.png", "caption": "The Bloch sphere: a qubit can exist anywhere on this sphere, representing all possible combinations of 0 and 1"}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🌀 Superposition: Being in Two States at Once", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "This ability to be in multiple states simultaneously is called superposition. It is not that we do not know which state the qubit is in — it genuinely exists in a combination of both states!"}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Here is where it gets powerful: with 2 qubits in superposition, you can represent 4 values simultaneously. With 50 qubits, you can represent more values than there are atoms in Earth!"}'),
        (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "What is superposition?", "options": ["When a qubit moves very fast", "When a qubit exists in multiple states simultaneously", "When two qubits are connected", "When a quantum computer overheats"], "correctIndex": 1, "explanation": "Superposition is the quantum phenomenon where a qubit exists in a combination of 0 and 1 simultaneously, only collapsing to a definite state when measured."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "📊 Exponential Power", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Classical bits: n bits can represent ONE of 2ⁿ values\\nQubits: n qubits can represent ALL 2ⁿ values simultaneously\\n\\nThis exponential advantage is why quantum computers could solve certain problems impossibly fast."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "With just 300 qubits in superposition, you could theoretically represent more states than there are atoms in the visible universe. That is the mind-bending power of quantum computing."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "How many values can 3 classical bits represent at once?", "options": ["3 values", "6 values", "8 values, but only one at a time", "8 values simultaneously"], "correctIndex": 2, "explanation": "3 bits can represent 2³ = 8 different values (000 through 111), but only ONE value at any moment. 3 qubits in superposition can represent all 8 simultaneously!"}')
    `, [quantumLesson2Id]);
    
    // Lesson 3: Entanglement
    const quantumLesson3Result = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'Entanglement: Spooky Action', 'lesson', 3) 
      RETURNING id
    `, [quantumLevel1Id]);
    const quantumLesson3Id = quantumLesson3Result.rows[0].id;
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "👻 Einstein Called It Spooky", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Quantum entanglement is perhaps the strangest phenomenon in all of physics. Even Einstein was disturbed by it, calling it spooky action at a distance."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "When two qubits become entangled, they form a connection that transcends space. Measuring one qubit instantly affects the other, no matter how far apart they are — even on opposite sides of the universe!"}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/entanglement.png", "caption": "Entangled particles remain connected regardless of distance"}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🎭 The Magic Coins Analogy", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Imagine two magic coins. You give one to a friend who travels to Mars. When you flip your coin and get heads, your friend coin instantly becomes tails — faster than light could travel between you!"}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "This is not science fiction — it has been proven in countless experiments. Entanglement is real, and it is one of the key resources that makes quantum computing so powerful."}'),
        (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "What happens when you measure one particle of an entangled pair?", "options": ["Nothing special occurs", "The other particle is instantly affected, regardless of distance", "The particles must be close together", "The measurement fails"], "correctIndex": 1, "explanation": "When you measure one entangled particle, the other instantly assumes a correlated state, no matter how far apart they are. This has been verified experimentally many times."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🔗 Entanglement as a Resource", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "In quantum computing, entanglement is not just a curiosity — it is a computational resource. Entangled qubits can process information in ways that are simply impossible for classical bits."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Quantum algorithms like Shor algorithm (for breaking encryption) and Grover algorithm (for searching) rely heavily on creating and manipulating entangled states."}'),
        (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "The more qubits you can entangle together, the more powerful your quantum computer becomes. Current state-of-the-art systems can entangle hundreds of qubits."}'),
        (gen_random_uuid(), $1, 13, 'question', '{"type": "question", "question": "Why is entanglement important for quantum computing?", "options": ["It makes computers faster", "It allows qubits to stay cold", "It enables quantum algorithms to process information in ways impossible for classical computers", "It is just a theoretical concept with no practical use"], "correctIndex": 2, "explanation": "Entanglement is a key resource for quantum algorithms. It allows quantum computers to explore many possibilities in a coordinated way, enabling exponential speedups for certain problems."}')
    `, [quantumLesson3Id]);
    
    // Practice lesson
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index) 
      VALUES (gen_random_uuid(), $1, 'Practice: Quantum Concepts', 'exercise', 4)
    `, [quantumLevel1Id]);
    
    // Update course counts
    await client.query(`UPDATE courses SET lesson_count = 4, exercise_count = 8 WHERE id = $1`, [harmonyCourseId]);
    await client.query(`UPDATE courses SET lesson_count = 4, exercise_count = 10 WHERE id = $1`, [quantumCourseId]);
    
    console.log('✅ Music and Physics courses added successfully!');
    console.log('   🎵 Musical Harmonies: 3 lessons + 1 exercise');
    console.log('   ⚛️  Quantum Computing: 3 lessons + 1 exercise');
    
  } catch (error) {
    console.error('❌ Failed to add courses:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCourses().catch(console.error);
