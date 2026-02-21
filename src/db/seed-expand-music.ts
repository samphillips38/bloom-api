import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedExpandMusic() {
  const client = await pool.connect();
  
  try {
    console.log('🎵 Expanding Musical Harmonies course...');
    
    // Get the course
    const courseResult = await client.query(`SELECT id FROM courses WHERE title = 'The Art of Musical Harmonies'`);
    const courseId = courseResult.rows[0]?.id;
    if (!courseId) throw new Error('Musical Harmonies course not found');
    
    // ==========================================
    // LEVEL 2: Chord Progressions (NEW)
    // ==========================================
    
    const level2Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Chord Progressions', 2) 
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [courseId]);
    
    let level2Id = level2Result.rows[0]?.id;
    if (!level2Id) {
      const existing = await client.query(`SELECT id FROM levels WHERE course_id = $1 AND order_index = 2`, [courseId]);
      level2Id = existing.rows[0]?.id;
    }
    
    if (level2Id) {
      const existingLessons = await client.query(`SELECT COUNT(*) FROM lessons WHERE level_id = $1`, [level2Id]);
      if (parseInt(existingLessons.rows[0].count) === 0) {
        
        // Lesson 1: The Circle of Fifths
        const circleLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'The Circle of Fifths', 'lesson', 1) RETURNING id
        `, [level2Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔄 Music is Most Elegant Map", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "The Circle of Fifths is perhaps the most important diagram in all of music theory. It organizes all 12 musical keys into a beautiful circular pattern where each key is a perfect fifth away from its neighbors. Once you understand it, you hold the master key to harmony."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Starting from C (which has no sharps or flats), move clockwise by a fifth each time:\\n\\nC → G → D → A → E → B → F♯/G♭ → D♭ → A♭ → E♭ → B♭ → F → back to C\\n\\nEach step clockwise adds one sharp. Each step counterclockwise adds one flat."}'),
            (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/circle-of-fifths.png", "caption": "The Circle of Fifths — the master map of musical keys and their relationships"}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "On the Circle of Fifths, what key is one step clockwise from C?", "options": ["F", "D", "G", "A"], "correctIndex": 2, "explanation": "Moving clockwise from C takes you to G — a perfect fifth above C. G major has one sharp (F♯). Each clockwise step adds one sharp to the key signature."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🎯 Why It Matters", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "The Circle of Fifths reveals which keys are closely related. Adjacent keys share most of their notes, so moving between them sounds smooth and natural. Distant keys share fewer notes, so transitions between them sound more dramatic and surprising.\\n\\nThis is why pop songs often use chords from neighboring keys (smooth), while jazz and classical music venture to distant keys (adventurous)."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🔗 Relative Major and Minor", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Every major key has a relative minor that shares the exact same notes. On the circle, the relative minor sits on the inner ring:\\n\\n• C major ↔ A minor (no sharps/flats)\\n• G major ↔ E minor (1 sharp)\\n• D major ↔ B minor (2 sharps)\\n\\nThis means you can switch between a major key and its relative minor seamlessly — they use the same notes but create completely different moods. Songwriters use this trick constantly."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What is the relative minor of G major?", "options": ["D minor", "B minor", "E minor", "A minor"], "correctIndex": 2, "explanation": "E minor is the relative minor of G major — they share the same key signature (one sharp: F♯). The relative minor always starts on the 6th degree of the major scale. In G major: G-A-B-C-D-E, so E is the 6th note."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The Circle of Fifths is not just theory — it is a practical tool. Composers and songwriters use it daily to find chords that work together, plan key changes, and understand why certain songs \\"sound right.\\" Keep it as your musical compass."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why do adjacent keys on the Circle of Fifths sound smooth together?", "options": ["They have the same tempo", "They share most of their notes", "They are in the same octave", "They use the same instruments"], "correctIndex": 1, "explanation": "Adjacent keys differ by only one note (one more sharp or flat). Since they share 6 of 7 notes, transitions between them sound natural and seamless. The more distant two keys are on the circle, the fewer notes they share."}')
        `, [circleLesson.rows[0].id]);
        
        // Lesson 2: Common Chord Progressions
        const progressionLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Common Chord Progressions', 'lesson', 2) RETURNING id
        `, [level2Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎶 The Patterns Behind Hit Songs", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A chord progression is a sequence of chords played one after another. Certain progressions appear in thousands of songs because they tap into something deeply satisfying in how our brains process music. Learning these patterns is like learning the grammar of music."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "We label chords with Roman numerals based on their position in the scale:\\n\\nIn C major: I=C, ii=Dm, iii=Em, IV=F, V=G, vi=Am, vii°=Bdim\\n\\nUppercase = major chord. Lowercase = minor chord. This system lets us describe progressions that work in ANY key."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🏆 The I-V-vi-IV Progression", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "This is the most popular chord progression in modern pop music. In C major: C - G - Am - F.\\n\\nYou have heard it in:\\n• \\"Let It Be\\" — The Beatles\\n• \\"No Woman No Cry\\" — Bob Marley\\n• \\"With or Without You\\" — U2\\n• \\"Someone Like You\\" — Adele\\n• \\"Despacito\\" — Luis Fonsi\\n\\nWhy does it work? It cycles through bright (I, IV, V) and dark (vi) emotions, creating a satisfying emotional journey that resolves back to the beginning."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "In the key of G major, what chords make up the I-V-vi-IV progression?", "options": ["G - D - Em - C", "G - C - Am - D", "G - F - Am - C", "G - A - Bm - D"], "correctIndex": 0, "explanation": "In G major: I=G, V=D, vi=Em, IV=C. That is G - D - Em - C. This progression sounds familiar because it has been used in countless hit songs across every genre."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎸 The I-IV-V (The Blues)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "The I-IV-V progression is the foundation of blues, rock and roll, and country music. In C: C - F - G.\\n\\nThe 12-bar blues follows a specific pattern:\\n| I | I | I | I |\\n| IV | IV | I | I |\\n| V | IV | I | V |\\n\\nThis structure has powered songs from Robert Johnson to Led Zeppelin to Stevie Ray Vaughan. The V chord creates tension that resolves back to I — a satisfying pull that keeps the music moving."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🌙 The vi-IV-I-V (The Emotional Journey)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Starting on the minor vi chord gives a progression an immediate emotional, melancholic quality. In C: Am - F - C - G.\\n\\nUsed in \\"Africa\\" by Toto, \\"Save Tonight\\" by Eagle-Eye Cherry, and \\"Apologize\\" by OneRepublic.\\n\\nNotice: this is the same four chords as I-V-vi-IV, just starting at a different point! The starting chord changes the entire emotional character."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Why does starting a progression on a minor chord change its emotional character?", "options": ["Minor chords are louder", "The minor starting point establishes a melancholic or introspective mood from the beginning", "It does not actually change anything", "Minor chords are played slower"], "correctIndex": 1, "explanation": "The first chord sets the emotional context for everything that follows. Starting on a minor chord immediately establishes a darker, more introspective or emotional tone, even if the remaining chords are identical to a major-starting progression."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Understanding progressions transforms how you listen to music. You will start hearing the patterns everywhere — in the songs on the radio, in movie soundtracks, in advertisements. And if you play an instrument, you will be able to play along with almost any song after identifying its progression."}')
        `, [progressionLesson.rows[0].id]);
        
        // Lesson 3: Keys and Scales
        const scalesLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Scales and Modes', 'lesson', 3) RETURNING id
        `, [level2Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎼 The DNA of Music", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A scale is an ordered collection of notes that defines the musical \\"alphabet\\" for a piece. If chords are words and progressions are sentences, scales are the alphabet from which everything is built."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The major scale follows a specific pattern of whole steps (W) and half steps (H):\\n\\nW - W - H - W - W - W - H\\n\\nStarting from C: C-(W)-D-(W)-E-(H)-F-(W)-G-(W)-A-(W)-B-(H)-C\\n\\nThis pattern creates the bright, happy sound we associate with major keys. It is the foundation of Western music."}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "What pattern of steps defines a major scale?", "options": ["All whole steps", "W-W-H-W-W-W-H", "H-W-W-H-W-W-W", "W-H-W-W-H-W-W"], "correctIndex": 1, "explanation": "The major scale follows the pattern Whole-Whole-Half-Whole-Whole-Whole-Half. This specific arrangement of intervals creates the characteristic bright, happy sound of major keys. You can build a major scale starting on any note using this pattern."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🌑 The Natural Minor Scale", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "The natural minor scale has its own pattern:\\n\\nW - H - W - W - H - W - W\\n\\nStarting from A: A-B-C-D-E-F-G-A (all white keys, just like C major!)\\n\\nThis creates the darker, more emotional sound of minor keys. The key difference from major is the lowered 3rd, 6th, and 7th degrees, which give minor its characteristic melancholy."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎭 The Seven Modes", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Modes are scales created by starting a major scale on different degrees. Each mode has a unique flavor:\\n\\n1. Ionian (start on 1st) — The major scale. Bright and happy.\\n2. Dorian (start on 2nd) — Minor with a bright twist. Jazz, funk, Santana.\\n3. Phrygian (start on 3rd) — Dark and exotic. Flamenco, metal.\\n4. Lydian (start on 4th) — Dreamy, floating. Film scores, The Simpsons theme.\\n5. Mixolydian (start on 5th) — Bluesy major. Rock, blues, folk.\\n6. Aeolian (start on 6th) — The natural minor scale. Sad, emotional.\\n7. Locrian (start on 7th) — Unstable, tense. Rarely used but hauntingly dark."}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "Which mode is known for its dark, exotic, flamenco-like sound?", "options": ["Ionian", "Dorian", "Phrygian", "Lydian"], "correctIndex": 2, "explanation": "Phrygian mode has a distinctive dark, exotic quality due to the half-step between its 1st and 2nd degrees. This characteristic interval gives it the Spanish/flamenco flavor and is also widely used in metal and Middle Eastern-influenced music."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🌍 Scales Around the World", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Not all music uses Western scales! Other cultures have developed their own beautiful scale systems:\\n\\n• Pentatonic: 5 notes — used globally from Chinese folk to blues to Celtic music\\n• Raga: Indian classical music uses complex ascending and descending patterns with microtones\\n• Maqam: Arabic/Turkish scales using quarter tones that do not exist in Western music\\n• Whole Tone: All whole steps — creates a dreamy, floating, Debussy-like atmosphere\\n\\nEach scale system reflects a different way of organizing sound and creates a completely different emotional palette."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why does starting the same notes on a different degree create a different mode?", "options": ["It changes the notes being used", "It changes the pattern of whole and half steps, creating a different emotional character", "Modes are just different octaves", "It only matters for classical music"], "correctIndex": 1, "explanation": "Although modes use the same set of notes, starting on a different degree rearranges the pattern of whole and half steps. This new pattern changes which intervals are emphasized, giving each mode its unique emotional flavor — from bright (Lydian) to dark (Phrygian)."}')
        `, [scalesLesson.rows[0].id]);
        
        // Practice for Level 2
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: Progressions & Scales', 'exercise', 4)
        `, [level2Id]);
      }
    }
    
    // ==========================================
    // LEVEL 3: Advanced Harmony (NEW)
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Advanced Harmony', 3) 
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [courseId]);
    
    let level3Id = level3Result.rows[0]?.id;
    if (!level3Id) {
      const existing = await client.query(`SELECT id FROM levels WHERE course_id = $1 AND order_index = 3`, [courseId]);
      level3Id = existing.rows[0]?.id;
    }
    
    if (level3Id) {
      const existingLessons = await client.query(`SELECT COUNT(*) FROM lessons WHERE level_id = $1`, [level3Id]);
      if (parseInt(existingLessons.rows[0].count) === 0) {
        
        // Lesson 1: Modulation
        const modLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Modulation & Key Changes', 'lesson', 1) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🚀 Changing Keys Mid-Song", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Modulation is the art of changing from one key to another within a piece of music. It is one of the most dramatic and emotionally powerful tools in a composer or songwriter is toolkit. When done well, a key change can give the listener goosebumps."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "You have heard it countless times: the last chorus of a pop song suddenly shifts up by a half-step or whole step, giving the music a fresh burst of energy. Think of \\"I Will Always Love You\\" by Whitney Houston or \\"Livin on a Prayer\\" by Bon Jovi — those key changes are unforgettable."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔑 Types of Modulation", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "1. Direct (Truck Driver) Modulation: Simply shift up by a step. No preparation — just jump! Used in pop music for that final-chorus energy boost.\\n\\n2. Pivot Chord Modulation: Use a chord that exists in BOTH the old key and the new key as a bridge. This creates the smoothest transitions.\\n\\n3. Common Tone Modulation: Hold one note constant while the harmony shifts around it, creating an elegant, cinematic transition.\\n\\n4. Chromatic Modulation: Use chromatically altered chords to slide into the new key. Common in jazz and film scores."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "What is a pivot chord modulation?", "options": ["Playing the same chord twice", "Using a chord common to both keys to smoothly transition between them", "Changing tempo during the key change", "Stopping the music and restarting in a new key"], "correctIndex": 1, "explanation": "A pivot chord belongs to both the current key and the target key. It acts as a bridge — the listener interprets it first in the old key, then as the new key takes hold, the chord is reinterpreted in the new context. This creates a seamless, natural-sounding transition."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎬 Modulation in Film Music", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Film composers are masters of modulation. John Williams might start a scene in a dark minor key and gradually modulate to a triumphant major key as the hero overcomes obstacles. Hans Zimmer uses dramatic key shifts to build overwhelming emotional crescendos.\\n\\nThe key change maps directly onto the emotional arc: as the story shifts, so does the music is tonal center. This is why film scores can make you cry even without dialogue."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "📐 Choosing Your Destination Key", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Not all key changes are equal. The relationship between keys determines the effect:\\n\\n• Up a half-step: Maximum energy boost (used in pop final choruses)\\n• Up a whole step: Strong lift, slightly less jarring\\n• To the relative minor/major: Mood shift but keeps the same notes\\n• To the dominant (V): Natural, forward-moving energy\\n• To a distant key (tritone away): Shocking, otherworldly, dramatic\\n\\nThe Circle of Fifths tells you how \\"far\\" any two keys are and helps predict how dramatic the shift will feel."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Why does modulating up a half-step for the final chorus create excitement?", "options": ["The notes are sharper and louder", "The unexpected shift to a brighter key gives a feeling of elevation and renewed energy", "Half-steps are naturally louder", "It makes the singer perform better"], "correctIndex": 1, "explanation": "A half-step up lifts the entire harmonic landscape, making everything feel fresh and elevated. The listener has settled into the original key, so the unexpected shift creates surprise and a sense of ascent — like suddenly being lifted higher."}')
        `, [modLesson.rows[0].id]);
        
        // Lesson 2: Extended and Jazz Chords
        const jazzLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Extended & Jazz Chords', 'lesson', 2) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎷 Beyond the Triad", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "While triads (3-note chords) are the foundation of harmony, the world of extended chords adds incredible richness and sophistication. By stacking more thirds on top of a triad, we create 7th chords, 9th chords, 11th chords, and 13th chords — each adding new colors to the palette."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The journey of chord extensions:\\n\\nTriad: 1 - 3 - 5 (bright and simple)\\n7th: 1 - 3 - 5 - 7 (added warmth or tension)\\n9th: 1 - 3 - 5 - 7 - 9 (lush and colorful)\\n11th: 1 - 3 - 5 - 7 - 9 - 11 (complex and ambient)\\n13th: 1 - 3 - 5 - 7 - 9 - 11 - 13 (the full palette — all 7 notes of the scale!)"}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "How is a 9th chord different from a 7th chord?", "options": ["It is louder", "It adds the 9th scale degree on top of the 7th chord", "It removes the 5th", "There is no difference"], "correctIndex": 1, "explanation": "A 9th chord takes a 7th chord (1-3-5-7) and adds the 9th degree on top: 1-3-5-7-9. Each extension adds another note stacked in thirds, creating increasingly rich and complex harmonies."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🎹 The Sound of Jazz", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Jazz harmony is built on extended chords. Where pop uses triads, jazz uses:\\n\\n• Major 7th (Cmaj7): Dreamy, sophisticated — the \\"jazz hello\\"\\n• Dominant 7th (C7): Bluesy tension that wants to resolve\\n• Minor 7th (Cm7): Mellow, smoky atmosphere\\n• Diminished 7th (Cdim7): Dramatic tension, classic suspense sound\\n• Augmented (Caug): Unsettling, dreamy, transitions beautifully\\n\\nJazz musicians also alter these chords — adding ♯9, ♭13, ♯11 — to create even more exotic flavors. Thelonious Monk and Bill Evans were masters of finding beauty in unexpected chord voicings."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎨 Chord Voicings", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "The same chord can sound dramatically different depending on how you arrange its notes — this is called voicing. A C major chord (C-E-G) in root position sounds plain. But spread the notes across octaves (G in the bass, C in the middle, E on top), and suddenly it sounds open and cinematic.\\n\\nProfessional arrangers spend years learning which voicings create the richest, most beautiful sounds. It is the difference between a student is chord and a professional is chord — same notes, completely different impact."}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "What is a chord voicing?", "options": ["How loudly a chord is played", "The specific arrangement and spacing of a chord is notes across registers", "Adding lyrics to a chord", "The speed at which chord notes are played"], "correctIndex": 1, "explanation": "A voicing is the specific way a chord is notes are arranged — which notes are on top, which are on the bottom, how far apart they are, and whether any are doubled. The same chord in different voicings can sound bright, dark, open, dense, or intimate."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🌈 The ii-V-I: Jazz is Most Important Progression", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "If there is one chord progression that defines jazz, it is ii-V-I (two-five-one). In C major: Dm7 - G7 - Cmaj7.\\n\\nThis progression appears in virtually every jazz standard. It creates a feeling of tension (ii and V) resolving to home (I). Jazz musicians practice ii-V-I patterns in all 12 keys because it is the fundamental building block of jazz improvisation.\\n\\nWhen you hear a jazz musician solo over complex chord changes, they are often navigating a series of ii-V-I progressions in different keys."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why is the ii-V-I progression so fundamental to jazz?", "options": ["It uses only simple triads", "It creates a natural arc of tension and resolution that appears in almost every jazz standard", "It was invented by Miles Davis", "It only works in the key of C"], "correctIndex": 1, "explanation": "The ii-V-I creates the most fundamental harmonic motion in Western music: building tension (ii to V) and resolving it (V to I). Jazz standards are largely constructed from chains of ii-V-I progressions, sometimes in the home key and sometimes modulating to other keys."}')
        `, [jazzLesson.rows[0].id]);
        
        // Lesson 3: Harmonic Analysis
        const analysisLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Harmonic Analysis', 'lesson', 3) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔬 Decoding the Harmony of Real Music", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Harmonic analysis is the skill of listening to a piece of music and understanding its harmonic structure — identifying the chords, the key, the progressions, and the techniques the composer used. It is like being able to read the blueprint of a building by looking at the finished structure."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "When you can analyze harmony, music transforms from a mysterious experience into one you can understand, appreciate on a deeper level, and recreate. You will hear WHY a song moves you, not just THAT it does."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "👂 How to Analyze a Song", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Step 1: Find the key. Listen for the \\"home\\" note — the note where the music feels resolved and at rest. Hum along until you find it.\\n\\nStep 2: Identify the bass notes. The bass line often outlines the chord roots.\\n\\nStep 3: Determine chord quality. Is each chord major, minor, or something else?\\n\\nStep 4: Label with Roman numerals. Relate each chord to the key (I, IV, V, vi, etc.)\\n\\nStep 5: Look for patterns. Most songs repeat their progressions, so once you identify the pattern, the rest falls into place."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "What is the first step in analyzing a song is harmony?", "options": ["Count the instruments", "Find the key by identifying the home note", "Look up the sheet music online", "Count the beats per measure"], "correctIndex": 1, "explanation": "Finding the key establishes the framework for all further analysis. The home note (tonic) is where the music feels most resolved. Once you know the key, you can identify all chords as Roman numerals relative to that key."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎵 Case Study: Let It Be", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Let us analyze \\"Let It Be\\" by The Beatles:\\n\\nKey: C major\\nProgression: C - G - Am - F (I - V - vi - IV)\\n\\nThis is the I-V-vi-IV we studied! The genius is in the simplicity:\\n• I (C) = stability, home\\n• V (G) = bright energy, movement\\n• vi (Am) = emotional depth, vulnerability\\n• IV (F) = warmth, hope\\n\\nThe emotional arc: Home → Energy → Vulnerability → Hope → Home again. This cycle mirrors the song is message of accepting difficulties and finding peace."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🔮 Borrowed Chords and Surprises", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Great songwriters add surprise by borrowing chords from parallel keys. If you are in C major, you might borrow a chord from C minor — like using A♭ (♭VI) or B♭ (♭VII). These \\"borrowed\\" chords add unexpected color.\\n\\nThe Beatles were masters of this. \\"In My Life\\" uses borrowed chords to create that bittersweet nostalgia. Radiohead is \\"Creep\\" uses a major III chord (borrowed from the parallel minor) for its iconic emotional gut-punch."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "What is a \\"borrowed chord\\"?", "options": ["A chord taken from another song", "A chord from the parallel major or minor key used to add surprise color", "A chord played by a guest musician", "A chord that is out of tune"], "correctIndex": 1, "explanation": "Borrowed chords (also called modal interchange) come from the parallel key — if you are in C major, you borrow from C minor, or vice versa. These unexpected chords add emotional depth and surprise without fully modulating to a new key."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "The more music you analyze, the better you become at hearing these patterns instantly. Eventually, you will listen to a new song and think, \\"Ah, that is a vi-IV-I-V with a borrowed ♭VII!\\" — and appreciate both the craft and the creativity of the songwriter."}')
        `, [analysisLesson.rows[0].id]);
        
        // Practice for Level 3
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: Analyze the Music', 'exercise', 4)
        `, [level3Id]);
      }
    }
    
    // Update course counts
    await client.query(`UPDATE courses SET lesson_count = 12, exercise_count = 20 WHERE id = $1`, [courseId]);
    
    console.log('✅ Musical Harmonies course expanded!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (existing)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (NEW - Chord Progressions)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (NEW - Advanced Harmony)');
    
  } catch (error) {
    console.error('❌ Failed to expand Music course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedExpandMusic().catch(console.error);
