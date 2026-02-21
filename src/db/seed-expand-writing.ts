import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedExpandWriting() {
  const client = await pool.connect();
  
  try {
    console.log('✍️ Expanding Creative Writing Fundamentals course...');
    
    // Get writing category
    const writingCat = await client.query(`SELECT id FROM categories WHERE slug = 'writing'`);
    const writingCatId = writingCat.rows[0]?.id;
    if (!writingCatId) throw new Error('Writing category not found');
    
    // Get the course
    const courseResult = await client.query(`SELECT id FROM courses WHERE title = 'Creative Writing Fundamentals'`);
    const courseId = courseResult.rows[0]?.id;
    if (!courseId) throw new Error('Writing course not found');
    
    // Get existing levels
    const levelsResult = await client.query(`SELECT id, title, order_index FROM levels WHERE course_id = $1 ORDER BY order_index`, [courseId]);
    const level1Id = levelsResult.rows[0]?.id; // Story Structure
    const level2Id = levelsResult.rows[1]?.id; // Character Development
    
    // ==========================================
    // LEVEL 1: Fill in missing lesson content
    // ==========================================
    
    // --- Lesson: "Conflict and Tension" ---
    const conflictLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Conflict and Tension'`, [level1Id]);
    const conflictLessonId = conflictLesson.rows[0]?.id;
    
    if (conflictLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [conflictLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⚔️ The Engine of Every Story", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Conflict is the heartbeat of storytelling. Without conflict, there is no story — just a sequence of events. Conflict creates the tension that keeps readers turning pages at 2 AM, desperate to find out what happens next."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "At its core, conflict is simple: a character wants something, and something stands in the way. That gap between desire and obstacle is where all the drama lives."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🌊 The Four Types of Conflict", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "1. Character vs. Character — Two characters with opposing goals. Think Sherlock Holmes vs. Moriarty, or Harry Potter vs. Voldemort. This is the most classic and immediately gripping form.\\n\\n2. Character vs. Nature — A character struggling against natural forces. Survival stories, disaster narratives, or the human struggle against disease. Think of \\"The Revenant\\" or \\"Life of Pi.\\""}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "3. Character vs. Society — A character pushing against social rules, institutions, or cultural expectations. \\"1984,\\" \\"The Handmaid is Tale,\\" and \\"To Kill a Mockingbird\\" all center on this conflict.\\n\\n4. Character vs. Self — The most intimate conflict. A character battling their own fears, desires, addictions, or moral dilemmas. This internal struggle often runs alongside one of the external conflicts above."}'),
            (gen_random_uuid(), $1, 7, 'question', '{"type": "question", "question": "A character wrestling with guilt about a past decision is an example of:", "options": ["Character vs. Character", "Character vs. Nature", "Character vs. Society", "Character vs. Self"], "correctIndex": 3, "explanation": "Internal struggles — guilt, fear, moral dilemmas, temptation — are Character vs. Self conflicts. This type adds psychological depth and is often the most emotionally resonant for readers."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "📈 Building Tension", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Tension is the reader is feeling that something important is at stake. Great writers escalate tension through:\\n\\n• Raising the stakes: Make the consequences of failure more severe\\n• Ticking clocks: Add time pressure (\\"You have 24 hours...\\")\\n• Complications: Just when things seem manageable, add new obstacles\\n• Near misses: The character almost succeeds, then fails — or almost fails, then barely escapes\\n• Withholding information: Let the reader know something the character does not (dramatic irony)"}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Think of tension like a rubber band being slowly stretched. The reader feels the increasing strain. If you release it too early, the story falls flat. If you stretch it too far without resolution, the reader loses patience. The art is in the timing."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Which technique increases tension by adding time pressure?", "options": ["Flashbacks", "A ticking clock", "Descriptive passages", "Changing point of view"], "correctIndex": 1, "explanation": "A ticking clock creates urgency by establishing a deadline. Whether it is a bomb countdown, a wedding date, or a seasonal deadline, time pressure forces characters (and readers) to feel the mounting tension."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "🎭 Conflict is Not Just Fighting", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "Many beginning writers think conflict means arguments or battles. But the most powerful conflicts are often quiet: a mother choosing between career and family, a student deciding whether to report cheating, two friends growing apart. Emotional conflict can be far more compelling than physical conflict."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "Why is conflict essential to storytelling?", "options": ["Readers enjoy violence", "It creates the tension that drives the narrative forward", "Every story must have a villain", "Conflict is optional in literary fiction"], "correctIndex": 1, "explanation": "Conflict creates the tension that propels the story. It gives characters motivation, forces them to make choices, and keeps readers engaged. Without conflict, there is nothing at stake and no reason for the reader to care."}')
        `, [conflictLessonId]);
      }
    }
    
    // --- Lesson: "Pacing Your Story" ---
    const pacingLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Pacing Your Story'`, [level1Id]);
    const pacingLessonId = pacingLesson.rows[0]?.id;
    
    if (pacingLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [pacingLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⏱️ The Rhythm of Your Story", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Pacing is the speed at which your story unfolds. It is the difference between a reader breathlessly racing through pages and one savoring every sentence. Master pacing, and you control the reader is experience like a film director controls a movie."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Think of pacing like music. A great song does not play at the same tempo throughout — it has verses, builds, drops, and crescendos. Your story needs the same variation."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🏃 Fast Pacing Techniques", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Speed up when you want excitement and urgency:\\n\\n• Short sentences. Punchy. Direct.\\n• Rapid dialogue with minimal tags\\n• Action verbs: \\"sprinted,\\" \\"crashed,\\" \\"shattered\\"\\n• Skip unnecessary transitions (jump from one scene to the next)\\n• Focus on external action rather than internal reflection\\n• Brief paragraphs — even single-line paragraphs for impact"}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🐌 Slow Pacing Techniques", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Slow down for emotional depth and atmosphere:\\n\\n• Longer, more complex sentences that wind and explore\\n• Detailed descriptions of setting and sensory details\\n• Internal monologue and character reflection\\n• Flashbacks that deepen character understanding\\n• Dialogue that reveals character rather than advancing plot\\n• Moments of quiet contemplation between action sequences"}'),
            (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "To create a sense of urgency in an action scene, you should:", "options": ["Use long, flowing sentences with lots of description", "Use short, punchy sentences with action verbs", "Include detailed character backstory during the scene", "Slow down to describe every detail of the environment"], "correctIndex": 1, "explanation": "Short sentences create a rapid, breathless feeling that mirrors the urgency of the action. They force the reader is eye to move quickly across the page, building momentum and excitement."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "📊 The Scene-Sequel Pattern", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "One powerful pacing framework alternates between Scenes and Sequels:\\n\\nScene (fast): Goal → Conflict → Disaster\\nThe character pursues a goal, faces opposition, and something goes wrong.\\n\\nSequel (slow): Reaction → Dilemma → Decision\\nThe character processes what happened, weighs their options, and decides what to do next.\\n\\nThis alternation creates a natural breathing rhythm that keeps readers engaged without exhausting them."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "🎯 Chapter Endings and Hooks", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "The end of each chapter or scene is critical for pacing. A cliffhanger or unanswered question propels the reader into the next chapter. But not every chapter needs a dramatic cliffhanger — sometimes a quiet moment of emotional resonance or a subtle question is more effective.\\n\\nThe key is to never end on a note of complete satisfaction. Always leave one thread dangling that pulls the reader forward."}'),
            (gen_random_uuid(), $1, 13, 'question', '{"type": "question", "question": "In the Scene-Sequel pattern, what comes during the Sequel?", "options": ["Goal, Conflict, and Disaster", "Reaction, Dilemma, and Decision", "Introduction, Rising Action, and Climax", "Setting, Character, and Theme"], "correctIndex": 1, "explanation": "The Sequel is the slower, reflective portion: the character reacts to what happened in the Scene, faces a dilemma about what to do next, and makes a decision. This gives readers (and characters) time to breathe and process before the next burst of action."}')
        `, [pacingLessonId]);
      }
    }
    
    // ==========================================
    // LEVEL 2: Fill in missing lesson content
    // ==========================================
    
    // --- Lesson: "Creating Memorable Characters" ---
    const memCharsLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Creating Memorable Characters'`, [level2Id]);
    const memCharsLessonId = memCharsLesson.rows[0]?.id;
    
    if (memCharsLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [memCharsLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🌟 Characters That Live Beyond the Page", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Readers forget plot details, but they never forget great characters. Elizabeth Bennet, Atticus Finch, Sherlock Holmes — these characters feel like real people decades after their stories were written. Creating such characters is both an art and a craft."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The secret? Memorable characters feel like complete human beings — contradictory, surprising, and deeply specific. They are not types or archetypes; they are individuals."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🧊 The Iceberg Principle", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Ernest Hemingway believed that a writer should know everything about their characters — even if 90% never makes it onto the page. Like an iceberg, the visible portion is supported by a massive hidden foundation.\\n\\nFor each major character, know their:\\n• Childhood and formative experiences\\n• Greatest fear and deepest desire\\n• How they behave under extreme stress\\n• What they would never do (and what might push them to do it anyway)\\n• Their secret — the thing they hide from everyone"}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "The Iceberg Principle in character development means:", "options": ["Characters should be cold and distant", "Writers should know far more about their characters than appears in the text", "Only show the tip of the character is personality", "Characters should be mysterious and unexplained"], "correctIndex": 1, "explanation": "Hemingway is Iceberg Principle suggests that the depth of a character comes from the author is deep understanding of them. Even though most backstory stays beneath the surface, it informs every word the character speaks and every choice they make."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎭 Contradictions Make Characters Real", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Real people are contradictory, and so should your characters be. A ruthless CEO who is tender with animals. A timid librarian who is fearless when defending a friend. A priest who struggles with doubt.\\n\\nContradictions create depth because they suggest complexity — there is a story behind why this person is the way they are. The reader wants to understand, and that curiosity keeps them reading."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "✨ Specificity Over Generality", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Vague: \\"She was sad.\\"\\nSpecific: \\"She kept rearranging the salt and pepper shakers, unable to look at the empty chair across the table.\\"\\n\\nSpecific details make characters vivid. Do not say a character is \\"smart\\" — show them solving a problem in an unexpected way. Do not say they are \\"kind\\" — show them giving their last dollar to a stranger even though they can not afford lunch."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Which creates a more memorable character?", "options": ["\\"He was a brave soldier\\"", "\\"He whistled while disarming the bomb, his hands steady as a surgeon is, even as his left boot slowly filled with blood\\"", "\\"He had many good qualities\\"", "\\"He was tall, strong, and courageous\\""], "correctIndex": 1, "explanation": "Specific, concrete details are far more vivid and memorable than abstract descriptions. The second option shows bravery through action and telling details, creating a vivid mental image that sticks with the reader."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "🔄 Characters Must Change", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "The most satisfying characters undergo transformation. This is called the character arc. By the end of the story, the character should be fundamentally different from who they were at the beginning — they have learned, grown, or been broken by their experiences.\\n\\nThe change does not have to be positive. A tragic arc can be equally compelling. What matters is that the character is journey has changed them in a way that feels earned and inevitable."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "What is a character arc?", "options": ["The physical journey a character takes in the story", "The transformation a character undergoes throughout the narrative", "The curve of a character is popularity with readers", "The backstory of a character before the main events"], "correctIndex": 1, "explanation": "A character arc is the inner transformation a character experiences over the course of the story. Through challenges, choices, and consequences, the character evolves — learning, growing, or sometimes declining. This change is the emotional core of most stories."}')
        `, [memCharsLessonId]);
      }
    }
    
    // --- Lesson: "Character Motivation" ---
    const motivLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Character Motivation'`, [level2Id]);
    const motivLessonId = motivLesson.rows[0]?.id;
    
    if (motivLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [motivLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎯 Why Characters Do What They Do", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Motivation is the why behind every character is action. It is the invisible force that drives the story forward. When motivation is clear and compelling, readers accept even extreme actions. When it is weak or unclear, even simple actions feel forced and unbelievable."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "A character does not rob a bank because the plot requires it. They rob a bank because their child needs an operation they cannot afford, and they have exhausted every legal option. See the difference? The second version makes the reader understand, even sympathize."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🧅 Layers of Motivation", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Strong characters have layered motivations:\\n\\n• Surface want: What the character says they want. \\"I want to win the tournament.\\"\\n• Deep need: What they actually need (often unconsciously). \\"I need my father is approval.\\"\\n• The wound: The past experience driving the need. \\"My father told me I would never amount to anything.\\"\\n\\nThe tension between want and need is what creates the richest character journeys. The character pursues their want, but the story is really about them discovering their need."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "What is the difference between a character is want and their need?", "options": ["There is no difference", "Want is conscious and external; need is often unconscious and internal", "Want is what villains have; need is what heroes have", "Need comes before want in the story"], "correctIndex": 1, "explanation": "A character is want is their conscious, stated goal (win the race, find the treasure). Their need is the deeper, often unconscious emotional or psychological growth they require (learn to trust, overcome fear). The best stories make the character realize their need through pursuing their want."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "💎 Making Motivation Believable", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "For motivation to feel real, it must be:\\n\\n• Proportional: The motivation should match the action. A character would not risk their life over something trivial (unless you establish them as reckless).\\n• Personal: Connected to the character is specific history, not generic. Not just \\"revenge\\" but \\"revenge for what happened to my sister on that specific rainy Tuesday.\\"\\n• Tested: The character should face moments that challenge their motivation. Do they persist? Do they waver? These moments reveal true character."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🎭 Villain Motivation", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "The best villains believe they are the heroes of their own stories. They have motivations that, from their perspective, are perfectly logical and even justified.\\n\\nThanos wants to save the universe from overpopulation. Killmonger wants justice for his oppressed people. These villains are compelling because we can understand their logic, even as we reject their methods.\\n\\nA villain whose only motivation is \\"being evil\\" is boring. Give them a reason that makes the reader pause and think."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Why are villains with understandable motivations more compelling?", "options": ["Because readers like villains", "Because it makes the moral conflict more complex and thought-provoking", "Because villains should always be sympathetic", "Because it makes the hero seem weaker"], "correctIndex": 1, "explanation": "When a villain has an understandable motivation, the conflict becomes morally complex. The reader must grapple with the fact that the villain has a point, even though their methods are wrong. This moral ambiguity creates richer, more engaging stories."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "⚡ Motivation in Action", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "The golden rule: Show motivation through action, not exposition. Instead of telling the reader \\"Maria was motivated by fear of abandonment,\\" show Maria panicking when her best friend does not text back for three hours, or agreeing to things she hates just to avoid conflict.\\n\\nEvery scene should be driven by at least one character is motivation. If a scene does not connect to what a character wants or needs, ask yourself: why is this scene here?"}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "What is the best way to convey a character is motivation?", "options": ["Have the narrator explain it directly", "Through the character is actions and choices", "Through another character explaining it", "In the book is introduction"], "correctIndex": 1, "explanation": "Show, do not tell. Motivation is most powerfully conveyed through what characters DO, especially under pressure. Actions speak louder than exposition. When a character makes a difficult choice, their motivation is revealed naturally and believably."}')
        `, [motivLessonId]);
      }
    }
    
    // --- Lesson: "Dialogue That Sings" ---
    const dialogueLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Dialogue That Sings'`, [level2Id]);
    const dialogueLessonId = dialogueLesson.rows[0]?.id;
    
    if (dialogueLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [dialogueLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "💬 The Art of Conversation on the Page", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Great dialogue is one of the most powerful tools in a writer is toolkit. It reveals character, advances plot, builds tension, and brings your story to life. But writing dialogue that sounds natural while still serving the story is one of the hardest skills to master."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The key insight: written dialogue should feel like real speech without actually being real speech. Real conversations are full of \\"ums,\\" false starts, and aimless tangents. Written dialogue captures the essence and rhythm of real speech while cutting all the fat."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🎤 Each Character Needs a Distinct Voice", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Readers should be able to tell who is speaking even without dialogue tags. Each character should have distinctive speech patterns:\\n\\n• Vocabulary level: A professor speaks differently from a teenager\\n• Sentence length: Some characters are terse, others verbose\\n• Verbal tics: Repeated phrases, filler words, or habitual expressions\\n• What they talk about: Each character has favorite topics and avoidances\\n• Rhythm: Some speak in long, flowing sentences; others in choppy fragments"}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Why should each character have a distinct speaking voice?", "options": ["To make the dialogue longer", "So readers can identify speakers and because it reveals personality", "To show off vocabulary", "To avoid using dialogue tags"], "correctIndex": 1, "explanation": "Distinct voices serve two purposes: readers can identify who is speaking (clarity), and the way a character speaks reveals their personality, education, emotional state, and background. Voice is characterization."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🎭 Subtext: What is NOT Said", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "The most powerful dialogue happens beneath the surface. Subtext is the real meaning hiding under the literal words.\\n\\n\\"Fine. I am fine. Everything is fine.\\" — Three \\"fines\\" that scream \\"I am NOT fine.\\"\\n\\n\\"Nice apartment.\\" (Looking at her ex is new place with his new girlfriend.) — Not really about the apartment at all.\\n\\nPeople rarely say exactly what they mean. They hint, deflect, avoid, and imply. Great dialogue embraces this gap between what is said and what is meant."}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "What is subtext in dialogue?", "options": ["Text that appears below the dialogue", "The unspoken meaning beneath the literal words", "Stage directions between dialogue lines", "A character is inner monologue"], "correctIndex": 1, "explanation": "Subtext is the implied meaning hiding beneath the surface of the actual words. When a character says something simple but means something deeper, that gap between stated and intended meaning creates dramatic tension and reveals character."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "📝 Dialogue Tags and Action Beats", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Dialogue tags (\\"he said,\\" \\"she asked\\") should be mostly invisible. \\"Said\\" is almost always the best choice — readers gloss over it. Avoid fancy alternatives like \\"exclaimed,\\" \\"proclaimed,\\" or \\"ejaculated\\" (yes, older novels used this).\\n\\nEven better: use action beats instead of tags.\\n\\nRather than: \\"I can not do this anymore,\\" she said angrily.\\nTry: \\"I can not do this anymore.\\" She slammed the folder on the desk.\\n\\nThe action shows the emotion and identifies the speaker simultaneously."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "🚫 Common Dialogue Mistakes", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "• Information dumping: \\"As you know, Bob, we have been partners for 15 years since that incident in Prague.\\" Real people do not recap shared history.\\n\\n• On-the-nose dialogue: Characters saying exactly what they feel. Real people are indirect, especially about emotions.\\n\\n• All characters sound the same: If you can swap dialogue between characters without noticing, the voices are not distinct enough.\\n\\n• Too much small talk: Skip the greetings and pleasantries. Enter scenes as late as possible."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "\\"As you know, we have been friends since college...\\" is an example of:", "options": ["Great exposition", "Subtext", "Artificial information dumping through dialogue", "Realistic conversation"], "correctIndex": 2, "explanation": "This is a classic dialogue mistake called \\"As you know, Bob\\" — characters telling each other things they already know, purely to inform the reader. It sounds unnatural because real people never recap shared knowledge this way. Find subtler ways to convey backstory."}')
        `, [dialogueLessonId]);
      }
    }
    
    // ==========================================
    // LEVEL 3: Setting & World-Building (NEW)
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Setting & World-Building', 3) 
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
        
        // Lesson 1: Setting as Character
        const settingLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Setting as Character', 'lesson', 1) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🌍 More Than Just a Backdrop", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Setting is not just where your story happens — it is an active force that shapes everything. The best settings feel as alive and complex as any character. Think of Hogwarts, Middle-earth, or the dystopian Gilead. These places are inseparable from their stories."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Setting encompasses:\\n\\n• Place: Physical location, geography, architecture\\n• Time: Historical period, season, time of day\\n• Culture: Social norms, values, conflicts of the society\\n• Atmosphere: The emotional feeling the environment creates\\n• Rules: How the world works (especially important in fantasy/sci-fi)"}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "Why is it said that \\"setting can be a character\\"?", "options": ["Because settings can literally talk", "Because a well-crafted setting actively influences characters and plot, just as another character would", "Because every story needs at least three characters", "Because settings are always personified"], "correctIndex": 1, "explanation": "When setting is treated as a character, it actively shapes the story. It influences what characters can do, creates obstacles, reflects emotional states, and can even change over time. A harsh winter, a crumbling city, or a magical forest does not just sit there — it pushes and pulls the narrative."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🎨 Sensory World-Building", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "The most immersive settings engage all five senses, not just sight:\\n\\n• Sight: The amber glow of gas lamps on wet cobblestones\\n• Sound: The distant clang of a church bell, the hush of falling snow\\n• Smell: Fresh bread from the bakery below, diesel fumes, salt air\\n• Touch: The rough texture of a brick wall, the sticky summer heat\\n• Taste: Dust in the air during a sandstorm, the metallic tang of fear\\n\\nTwo or three well-chosen sensory details do more work than a page of visual description."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🪞 Setting Reflects Emotion", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Great writers use setting to mirror or contrast the emotional state of their characters. This technique is called pathetic fallacy.\\n\\nA grieving character walking through autumn leaves. A couple falling in love under a starlit sky. An anxious character in a cramped, dimly lit room. The environment amplifies the emotion without a single word of exposition.\\n\\nContrast can be equally powerful: a funeral on a beautiful sunny day creates an unsettling dissonance that heightens the emotional impact."}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "Describing a storm during an emotional argument is an example of:", "options": ["Poor timing in the plot", "Pathetic fallacy — using setting to mirror character emotions", "A plot hole", "World-building"], "correctIndex": 1, "explanation": "Pathetic fallacy is the technique of using environment and weather to reflect characters emotional states. The raging storm mirrors the raging argument, creating a powerful emotional resonance without needing to state the characters feelings directly."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🏗️ Building Believable Worlds", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Whether your story is set in modern-day Tokyo or an alien planet, the world must feel internally consistent. Readers will accept any rules you establish — but they will never forgive you for breaking them.\\n\\nAsk yourself: How does this society work? What are the power structures? What do people value? What do they eat? How do they travel? What is taboo? The answers do not all need to appear in the story, but knowing them makes your world feel solid and real."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "What is the most important rule of world-building?", "options": ["Include as many details as possible", "Internal consistency — the world must follow its own established rules", "Always base it on real locations", "Make it as different from reality as possible"], "correctIndex": 1, "explanation": "Internal consistency is paramount. Readers will accept magic, faster-than-light travel, or talking animals — as long as the rules are established and followed. Breaking your own world is rules shatters the reader is trust and immersion."}')
        `, [settingLesson.rows[0].id]);
        
        // Lesson 2: Show, Don't Tell
        const showLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Show, Don''t Tell', 'lesson', 2) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "👁️ The Writer is Golden Rule", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "\\"Show, don not tell\\" is perhaps the most repeated advice in creative writing — and for good reason. It is the difference between a reader being told about your world and actually experiencing it."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Telling: \\"Sarah was nervous.\\"\\nShowing: \\"Sarah is fingers tapped a rapid pattern on the armrest. She checked her phone again — still twenty minutes until the interview. She smoothed her skirt for the fifth time.\\"\\n\\nThe first tells you a fact. The second lets you feel Sarah is nervousness in your own body."}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "Which is an example of \\"showing\\" rather than \\"telling\\"?", "options": ["\\"He was angry.\\"", "\\"He was the angriest man in town.\\"", "\\"His jaw clenched and he hurled his coffee mug against the wall.\\"", "\\"Everyone knew he had anger issues.\\""], "correctIndex": 2, "explanation": "Showing uses specific actions, sensory details, and concrete imagery to let the reader experience the emotion directly. A clenched jaw and a hurled mug convey anger far more powerfully than the abstract label \\"angry.\\""}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🔍 How to Show", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Transform telling into showing by using:\\n\\n• Actions: What does the character DO that reveals their state?\\n• Body language: Clenched fists, averted eyes, a forced smile\\n• Sensory details: What do they see, hear, smell, feel?\\n• Dialogue: How someone speaks reveals more than what they say\\n• Specific details: Replace abstractions with concrete images\\n\\nInstead of \\"The room was messy,\\" try \\"Dirty plates towered on the nightstand. Clothes formed archipelagos across the floor. Somewhere under a pizza box, an alarm clock buzzed uselessly.\\""}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "⚖️ When Telling is Actually Better", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Here is the controversial truth: sometimes telling is better than showing. You should TELL when:\\n\\n• Conveying minor information quickly: \\"Three weeks passed.\\"\\n• The emotion or fact is not important enough to spend time showing\\n• You need to maintain pacing (showing everything would slow the story to a crawl)\\n• Transitioning between scenes\\n\\nThe real rule is not \\"always show.\\" It is \\"show the important things and tell the rest.\\" Save your detailed showing for the moments that matter most."}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "When is \\"telling\\" acceptable in writing?", "options": ["Never — always show everything", "When conveying minor details or transitioning to maintain pacing", "Only in the first paragraph", "Only in non-fiction"], "correctIndex": 1, "explanation": "Telling is appropriate for minor details, transitions, and maintaining pacing. If you showed every single emotion and detail, your story would be ten times longer and the truly important moments would lose their impact. Show what matters most; tell the rest efficiently."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🎯 The Showing Checklist", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Before you finalize a scene, check for these common telling words and consider showing instead:\\n\\n• Emotion words: angry, sad, happy, scared → Show through behavior\\n• Judgment words: beautiful, ugly, amazing, terrible → Show through specific details\\n• \\"Felt\\" constructions: \\"She felt cold\\" → \\"Goosebumps prickled her arms\\"\\n• Adverbs: \\"He said angrily\\" → Show the anger in his words and actions\\n\\nNot every instance needs converting, but checking helps you find the moments that deserve more vivid treatment."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "How would you improve \\"She felt scared\\"?", "options": ["Add more adjectives: \\"She felt very, deeply scared\\"", "\\"Her heart hammered. She pressed her back against the wall, eyes fixed on the shadow creeping under the door.\\"", "\\"She was a scared woman.\\"", "\\"The author wants you to know she was scared.\\""], "correctIndex": 1, "explanation": "The second option replaces the abstract \\"felt scared\\" with physical sensations (hammering heart), specific actions (pressing against wall), and vivid imagery (shadow under door). The reader does not need to be told she is scared — they feel it themselves."}')
        `, [showLesson.rows[0].id]);
        
        // Lesson 3: Point of View
        const povLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Choosing Your Point of View', 'lesson', 3) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "👤 The Lens of Your Story", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Point of view (POV) determines whose eyes the reader looks through. It is one of the most important choices you will make, because it shapes everything — what information the reader has access to, how close they feel to the characters, and even the style of the prose."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🔵 First Person (\\"I\\")", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "\\"I walked into the room and immediately knew something was wrong.\\"\\n\\nStrengths: Intimate, personal, great for voice-driven stories. The reader is inside the character is head.\\n\\nLimitations: You can only show what this character knows, sees, and thinks. If something happens off-screen, you need a way for the narrator to discover it.\\n\\nPerfect for: Coming-of-age stories, mysteries, unreliable narrators, deeply personal narratives."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🟢 Third Person Limited (\\"He/She\\")", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "\\"She walked into the room and immediately knew something was wrong.\\"\\n\\nStrengths: Close to the character but with more flexibility. You can occasionally pull back for a wider view. Most popular POV in modern fiction.\\n\\nLimitations: Still limited to one character is perspective per scene (switching mid-scene is disorienting).\\n\\nPerfect for: Most genres. You can rotate between characters across chapters (as Game of Thrones does) to show multiple perspectives."}'),
            (gen_random_uuid(), $1, 7, 'question', '{"type": "question", "question": "What is the main advantage of first-person POV?", "options": ["You can show every character is thoughts", "It creates the deepest intimacy and strongest character voice", "It is the easiest to write", "It works best for large casts"], "correctIndex": 1, "explanation": "First person puts the reader directly inside the narrator is mind, creating unmatched intimacy. The character is unique voice, biases, and personality color every observation. This makes it ideal for stories that depend on a strong, distinctive narrator."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🟡 Third Person Omniscient (\\"The All-Knowing Narrator\\")", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "\\"She walked into the room, unaware that behind the curtain, Marcus gripped the letter that would change both their lives.\\"\\n\\nStrengths: The narrator knows everything — every character is thoughts, future events, and hidden truths. Can create dramatic irony and sweep across a wide canvas.\\n\\nLimitations: Can feel distant. Harder to create intimacy. Requires a strong narrative voice to avoid feeling clinical.\\n\\nPerfect for: Epic stories, historical fiction, multi-generational sagas, fairy tales."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🔴 Second Person (\\"You\\")", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "\\"You walk into the room and immediately know something is wrong.\\"\\n\\nRare in fiction, but striking when done well. It places the reader directly into the story as a participant. It can feel immersive and urgent, or pushy and gimmicky — the execution must be skilled.\\n\\nNotable examples: \\"Bright Lights, Big City\\" by Jay McInerney, and most choose-your-own-adventure books."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Which POV allows the narrator to reveal what multiple characters are thinking?", "options": ["First person", "Second person", "Third person limited", "Third person omniscient"], "correctIndex": 3, "explanation": "Third person omniscient has an all-knowing narrator who can dip into any character is mind, reveal hidden information, and even comment on the story. It is the most flexible POV but requires skill to maintain intimacy."}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "The right POV depends on your story. Ask: Whose perspective makes this story most compelling? What information should the reader have (and not have)? How close should the reader feel to the protagonist? Your answers will point you to the right choice."}')
        `, [povLesson.rows[0].id]);
        
        // Practice for Level 3
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: Setting & Perspective', 'exercise', 4)
        `, [level3Id]);
      }
    }
    
    // ==========================================
    // LEVEL 4: Voice & Style (NEW)
    // ==========================================
    
    const level4Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Voice & Style', 4) 
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [courseId]);
    
    let level4Id = level4Result.rows[0]?.id;
    if (!level4Id) {
      const existing = await client.query(`SELECT id FROM levels WHERE course_id = $1 AND order_index = 4`, [courseId]);
      level4Id = existing.rows[0]?.id;
    }
    
    if (level4Id) {
      const existingLessons = await client.query(`SELECT COUNT(*) FROM lessons WHERE level_id = $1`, [level4Id]);
      if (parseInt(existingLessons.rows[0].count) === 0) {
        
        // Lesson 1: Finding Your Voice
        const voiceLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Finding Your Voice', 'lesson', 1) RETURNING id
        `, [level4Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎙️ What Makes Your Writing Yours?", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Voice is the most elusive and most important quality of great writing. It is the personality that comes through in your prose — the thing that makes your writing sound like YOU and nobody else. Think of it as your literary fingerprint."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "You can recognize a Hemingway sentence (short, muscular, understated) from a Toni Morrison sentence (lyrical, layered, incantatory) in an instant. That is voice. It is not just WHAT you say, but HOW you say it — your word choices, sentence rhythms, the things you notice, and the things you leave unsaid."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🌱 Voice is Discovered, Not Manufactured", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "You cannot force a voice. It emerges naturally as you write more and become more comfortable on the page. The best way to find your voice is to:\\n\\n• Write a lot (there is no shortcut)\\n• Read widely and notice which styles resonate with you\\n• Stop trying to sound \\"literary\\" and write how you naturally think\\n• Take risks — your quirks and obsessions ARE your voice\\n• Imitate writers you admire, then gradually let your own style emerge from the influence"}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "What is \\"voice\\" in writing?", "options": ["The narrator is speaking volume", "The distinctive style and personality that comes through in an author is prose", "The tone of dialogue only", "Grammar and punctuation choices"], "correctIndex": 1, "explanation": "Voice is the unique combination of style, tone, word choice, rhythm, and personality that makes a writer is work distinctively their own. It is the thing that makes you recognize an author is work even without seeing their name."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "📐 Sentence Rhythm and Variation", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "The rhythm of your sentences is a huge part of voice. Read this:\\n\\n\\"The dog sat. The dog was brown. The dog was big. The dog barked.\\"\\n\\nBoring! Now read this:\\n\\n\\"The dog sat in the corner — a hulking, mud-brown beast whose bark could rattle windowpanes and send cats scrambling for the highest shelf.\\"\\n\\nVariation in sentence length and structure creates music on the page. Mix short punchy sentences with longer, rolling ones. Let the rhythm match the mood."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🎯 Word Choice is Everything", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "The difference between the right word and the almost right word, Mark Twain said, is the difference between lightning and a lightning bug.\\n\\n\\"Walked\\" vs \\"strolled\\" vs \\"trudged\\" vs \\"sauntered\\" — each paints a completely different picture. Every word carries connotations, rhythms, and associations. Choose them with care.\\n\\nUse the most specific, vivid word available. Not \\"flower\\" but \\"orchid.\\" Not \\"said loudly\\" but \\"bellowed.\\" Not \\"went quickly\\" but \\"sprinted.\\""}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Why is word choice crucial to a writer is voice?", "options": ["Bigger words make better writing", "Each word carries unique connotations and rhythms that shape the reader is experience", "Editors prefer specific vocabulary", "It does not matter as long as grammar is correct"], "correctIndex": 1, "explanation": "Every word choice shapes the reader is sensory experience, emotional response, and impression of the author is style. The specific words you habitually reach for — their sounds, rhythms, and associations — are a core part of what makes your voice unique."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Remember: the goal is not to write \\"beautifully\\" — it is to write authentically. The writer who tries too hard to sound impressive usually sounds hollow. The writer who writes honestly, from their own perspective and passion, is the one who resonates."}')
        `, [voiceLesson.rows[0].id]);
        
        // Lesson 2: The Art of Revision
        const revisionLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'The Art of Revision', 'lesson', 2) RETURNING id
        `, [level4Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "✂️ Writing is Rewriting", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Ernest Hemingway famously said, \\"The first draft of anything is garbage.\\" Every great piece of writing has been revised — often extensively. The myth of the genius who produces perfect prose in one sitting is just that: a myth."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Revision is not just fixing typos and grammar. It is rethinking, restructuring, and sometimes completely rewriting. It is where good writing becomes great writing. Most professional authors say they spend more time revising than writing first drafts."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔄 The Three Passes", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Effective revision happens in layers, from big picture to small details:\\n\\nPass 1 — Structure (Macro): Does the story work? Is the plot logical? Does the pacing feel right? Are characters consistent? Are there scenes that should be cut or added? This is the hardest pass because it may require killing your darlings.\\n\\nPass 2 — Scene & Paragraph (Meso): Does each scene earn its place? Is the dialogue sharp? Is there enough showing vs. telling? Does each paragraph flow to the next?\\n\\nPass 3 — Sentence & Word (Micro): Is every word necessary? Are there clichés to replace? Can sentences be tightened? Is the rhythm varied?"}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Why should you revise in multiple passes from big picture to small details?", "options": ["It is faster to do it all at once", "Because if you fix structure first, the sentences you polished might get cut anyway", "Small details are less important", "Professional editors require three drafts"], "correctIndex": 1, "explanation": "Working big-to-small prevents wasted effort. If you spend hours perfecting a sentence, then realize the entire scene needs to be cut for structural reasons, that work was wasted. Fix the architecture first, then decorate the rooms."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🗑️ Killing Your Darlings", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "William Faulkner advised: \\"Kill your darlings.\\" This means cutting passages you love that do not serve the story. That beautiful metaphor you spent an hour crafting? If it slows the pacing or distracts from the narrative, it needs to go.\\n\\nThis is agonizing. But the story must come first. Save deleted passages in a separate file — they might find a home in another project. But do not let your attachment to any single piece of writing weaken the whole."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "📖 Reading Aloud", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "One of the most powerful revision techniques is reading your work aloud. Your ear catches things your eye misses:\\n\\n• Awkward rhythms and tongue-twisters\\n• Sentences that are too long (you run out of breath)\\n• Repetitive word choices\\n• Dialogue that sounds unnatural\\n• Passages where your attention wanders (if you are bored reading aloud, readers will be bored silently)"}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "⏰ The Importance of Distance", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "After finishing a draft, step away from it. A week, a month, even longer. When you return, you will see your work with fresh eyes — you will notice problems that were invisible when you were immersed in writing. This distance is invaluable and cannot be rushed.\\n\\nStephen King recommends putting a finished draft in a drawer for at least six weeks before revising. The longer you wait, the more objective you become."}'),
            (gen_random_uuid(), $1, 13, 'question', '{"type": "question", "question": "What does \\"kill your darlings\\" mean in revision?", "options": ["Remove all your favorite characters", "Cut beloved passages that do not serve the story", "Delete the entire first draft", "Remove all emotional content"], "correctIndex": 1, "explanation": "Killing your darlings means having the discipline to cut passages you love — clever phrases, beautiful descriptions, witty dialogue — if they do not serve the story is needs. The story is greater good must outweigh attachment to any individual piece of writing."}')
        `, [revisionLesson.rows[0].id]);
        
        // Lesson 3: Writing Hooks
        const hooksLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Opening Lines & Hooks', 'lesson', 3) RETURNING id
        `, [level4Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🪝 You Only Get One First Impression", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Your opening line is the most important sentence you will write. It is the handshake between you and the reader. If it is limp, they put the book down. If it grabs them, they are yours."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Some of the greatest opening lines in literature:\\n\\n\\"It was a bright cold day in April, and the clocks were striking thirteen.\\" — 1984\\n\\n\\"Call me Ishmael.\\" — Moby Dick\\n\\n\\"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\\" — Pride and Prejudice\\n\\nEach one instantly creates a question in the reader is mind. Clocks striking thirteen? Why should I call you Ishmael? Is that truth really universal? Questions pull readers in."}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "What makes \\"the clocks were striking thirteen\\" such an effective opening detail?", "options": ["It tells us the exact time", "It immediately signals something is wrong — clocks do not strike thirteen — creating curiosity", "It describes the weather", "It introduces the main character"], "correctIndex": 1, "explanation": "Thirteen strikes immediately tells the reader that something is fundamentally wrong with this world. It creates an instant question — why thirteen? — that pulls the reader forward. A great opening creates curiosity in the fewest possible words."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🎣 Types of Hooks", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "• The Question Hook: Start with a mystery that demands an answer. \\"The last man on Earth sat alone in a room. There was a knock at the door.\\"\\n\\n• The Action Hook: Drop the reader into the middle of something happening. \\"The bomb detonated at 8:47 AM, three minutes after Emily decided to take the stairs instead of the elevator.\\"\\n\\n• The Voice Hook: A narrator so distinctive that readers are instantly charmed. \\"If you really want to hear about it, the first thing you will probably want to know is where I was born, and what my lousy childhood was like.\\" (Catcher in the Rye)\\n\\n• The Contrast Hook: Juxtapose two unexpected elements. \\"The morning she was scheduled for execution, Martha decided to bake a pie.\\""}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🚫 Openings to Avoid", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "• Alarm clock openings: \\"The alarm went off at 6 AM...\\" — Overdone and boring.\\n• Weather reports: \\"It was a dark and stormy night...\\" — Unless the weather is crucial.\\n• Dream sequences: Starting with a dream that turns out to be fake feels like cheating.\\n• Lengthy description: Pages of world-building before anything happens.\\n• Throat-clearing: The author warms up for several paragraphs before the real story begins. Often the true opening is on page three — delete everything before it."}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "Why do editors call unnecessary early paragraphs \\"throat-clearing\\"?", "options": ["Because they describe the character is voice", "Because the author is warming up — the real story has not started yet", "Because they contain coughing characters", "Because they clear up confusion"], "correctIndex": 1, "explanation": "Throat-clearing paragraphs are where the author is finding their footing — setting up context, describing backgrounds, or easing into the story. Like a speaker clearing their throat before talking, these paragraphs delay the real content. Cut them and start where the action begins."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "💡 The Promise of the Opening", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Your opening is a promise to the reader about what kind of experience they are in for. A funny opening promises humor. A suspenseful opening promises thrills. A lyrical opening promises beautiful prose. Make sure your story delivers on whatever your opening promises.\\n\\nWrite your opening last. Once you know your whole story, you will know exactly what promise to make — and exactly which moment is the most compelling place to begin."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why do many writers write their opening line last?", "options": ["Because they forget to write it first", "Because once you know the full story, you can craft the perfect promise and hook", "Because openings are not important", "Because editors always change the first line"], "correctIndex": 1, "explanation": "Writing the opening last lets you craft it with full knowledge of the story. You know the themes, the ending, the tone — so you can write an opening that perfectly sets up everything to come and makes exactly the right promise to the reader."}')
        `, [hooksLesson.rows[0].id]);
        
        // Practice for Level 4
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: Voice & Style Workshop', 'exercise', 4)
        `, [level4Id]);
      }
    }
    
    // Update course counts
    await client.query(`UPDATE courses SET lesson_count = 16, exercise_count = 36 WHERE id = $1`, [courseId]);
    
    console.log('✅ Creative Writing course expanded!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (all with full content)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (all with full content)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (NEW - Setting & World-Building)');
    console.log('   📖 Level 4: 3 lessons + 1 exercise (NEW - Voice & Style)');
    
  } catch (error) {
    console.error('❌ Failed to expand Writing course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedExpandWriting().catch(console.error);
