import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedExpandLogic() {
  const client = await pool.connect();
  
  try {
    console.log('🧠 Expanding Introduction to Logic course...');
    
    // Get logic category
    const logicCat = await client.query(`SELECT id FROM categories WHERE slug = 'logic'`);
    const logicCatId = logicCat.rows[0]?.id;
    if (!logicCatId) throw new Error('Logic category not found');
    
    // Get the course
    const courseResult = await client.query(`SELECT id FROM courses WHERE title = 'Introduction to Logic'`);
    const courseId = courseResult.rows[0]?.id;
    if (!courseId) throw new Error('Logic course not found');
    
    // Get existing levels
    const levelsResult = await client.query(`SELECT id, title, order_index FROM levels WHERE course_id = $1 ORDER BY order_index`, [courseId]);
    const level1Id = levelsResult.rows[0]?.id; // Introduction
    const level2Id = levelsResult.rows[1]?.id; // Basic Reasoning
    
    // ==========================================
    // LEVEL 1: Fill in missing lesson content
    // ==========================================
    
    // --- Lesson: "Statements and Truth" ---
    const statementsLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Statements and Truth'`, [level1Id]);
    const statementsLessonId = statementsLesson.rows[0]?.id;
    
    if (statementsLessonId) {
      // Check if content already exists
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [statementsLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📝 What is a Statement?", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "In logic, a statement (or proposition) is a sentence that is either true or false — never both, never neither. This is the fundamental building block of all logical reasoning."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "For example:\\n\\n✅ \\"The Earth orbits the Sun\\" — This is a statement (it is true).\\n✅ \\"2 + 2 = 5\\" — This is a statement (it is false).\\n❌ \\"Close the door!\\" — This is NOT a statement (it is a command).\\n❌ \\"What time is it?\\" — This is NOT a statement (it is a question)."}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "Which of the following is a logical statement?", "options": ["\\"Please sit down.\\"", "\\"Is it raining?\\"", "\\"7 is a prime number.\\"", "\\"Wow, what a day!\\""], "correctIndex": 2, "explanation": "\\"7 is a prime number\\" is a declarative sentence that is definitively true. Commands, questions, and exclamations are not statements because they cannot be assigned a truth value."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "⚖️ Truth Values", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Every statement has exactly one truth value: True (T) or False (F). In logic, we often use the letters p, q, and r to represent statements, just like algebra uses x and y for numbers."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Let p = \\"It is raining\\"\\nLet q = \\"The ground is wet\\"\\n\\nOn a rainy day: p is True, q is True.\\nOn a sunny day with dry ground: p is False, q is False."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🧩 Simple vs. Compound Statements", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "A simple statement contains a single idea: \\"The sky is blue.\\"\\n\\nA compound statement combines simple statements using logical connectives: \\"The sky is blue AND the grass is green.\\"\\n\\nLogical connectives like AND, OR, NOT, and IF...THEN are the glue that holds complex arguments together."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Understanding compound statements is crucial because most real-world reasoning involves combining multiple facts. When a doctor says \\"If you have a fever AND a cough, THEN you might have the flu,\\" they are using compound logic."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "\\"If it is Tuesday, then we have a meeting\\" is an example of what?", "options": ["A simple statement", "A compound statement", "A question", "A paradox"], "correctIndex": 1, "explanation": "This is a compound statement because it combines two simple statements (\\"it is Tuesday\\" and \\"we have a meeting\\") using the logical connective IF...THEN."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "🎭 Beware of Paradoxes!", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "Some sentences seem like statements but create logical contradictions. The famous Liar Paradox: \\"This sentence is false.\\" If it is true, then it must be false. But if it is false, then it must be true! Logicians have spent centuries wrestling with such puzzles."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "Why is \\"This statement is false\\" problematic in logic?", "options": ["It is too short to be meaningful", "It creates a contradiction — it can be neither true nor false consistently", "It uses incorrect grammar", "Statements about themselves are always false"], "correctIndex": 1, "explanation": "The Liar Paradox creates an unresolvable contradiction: if the statement is true, it must be false (because that is what it claims), and vice versa. This violates the fundamental rule that statements must be either true or false."}')
        `, [statementsLessonId]);
      }
    }
    
    // --- Lesson: "Logical Operators" ---
    const operatorsLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Logical Operators'`, [level1Id]);
    const operatorsLessonId = operatorsLesson.rows[0]?.id;
    
    if (operatorsLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [operatorsLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔗 The Five Fundamental Operators", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Logical operators (also called connectives) are the tools we use to combine and modify statements. There are five fundamental operators that form the backbone of all logical reasoning."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "1️⃣ NOT (¬) — Negation\\n\\nThe NOT operator flips a statement is truth value.\\nIf p is true, then ¬p (NOT p) is false.\\nIf p is false, then ¬p is true.\\n\\nExample: p = \\"It is sunny.\\" → ¬p = \\"It is NOT sunny.\\""}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "2️⃣ AND (∧) — Conjunction\\n\\nThe AND operator combines two statements. The result is true ONLY when BOTH statements are true.\\n\\np ∧ q is true only when p is true AND q is true.\\n\\nExample: \\"It is warm AND it is sunny\\" — only true when both conditions hold."}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "If p is TRUE and q is FALSE, what is p ∧ q (p AND q)?", "options": ["True", "False", "Unknown", "Both true and false"], "correctIndex": 1, "explanation": "AND requires BOTH statements to be true. Since q is false, p ∧ q is false. Even one false component makes the entire AND expression false."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "3️⃣ OR (∨) — Disjunction\\n\\nThe OR operator is true when AT LEAST ONE statement is true. In logic, OR is inclusive — it is also true when both statements are true (unlike everyday English where \\"or\\" often implies \\"one or the other, but not both\\").\\n\\nExample: \\"I will have tea OR coffee\\" — logically true if you have tea, coffee, or both."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "4️⃣ IF...THEN (→) — Implication\\n\\nThe conditional is perhaps the most important and trickiest operator. \\"If p, then q\\" (p → q) is false ONLY when p is true but q is false.\\n\\nSurprisingly, \\"If pigs fly, then the moon is made of cheese\\" is logically TRUE — because a false premise can imply anything!"}'),
            (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "When is \\"If p, then q\\" (p → q) FALSE?", "options": ["When p is false and q is true", "When both p and q are false", "When p is true and q is false", "When both p and q are true"], "correctIndex": 2, "explanation": "An implication p → q is false ONLY when the premise p is true but the conclusion q is false. In all other cases (including when p is false), the implication is considered true. A false premise cannot break a promise."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "5️⃣ IF AND ONLY IF (↔) — Biconditional\\n\\nThe biconditional is true when both statements have the SAME truth value — both true or both false.\\n\\n\\"You pass IF AND ONLY IF you score above 60%\\" means passing requires the score, and the score guarantees passing. It works both ways."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🏗️ Building Complex Expressions", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Just like in arithmetic, we can combine operators to build complex logical expressions. Parentheses control the order of operations:\\n\\n(p ∧ q) → r means: \\"If (p AND q), then r\\"\\n¬(p ∨ q) means: \\"NOT (p OR q)\\" — neither p nor q is true\\n\\nThese compound expressions let us model sophisticated real-world reasoning."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "💡 Real-World Applications", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "Logical operators power the digital world. Every computer chip uses AND, OR, and NOT gates to process information. Search engines use AND/OR to filter results. Programming languages use these operators for decision-making in every application you use daily."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "What does the expression ¬(p ∧ q) mean?", "options": ["NOT p AND NOT q", "It is NOT the case that both p and q are true", "p OR q", "Neither — the expression is invalid"], "correctIndex": 1, "explanation": "¬(p ∧ q) negates the entire conjunction. It means it is NOT the case that both p and q are true. Note: this is different from (¬p ∧ ¬q), which means both are false. This distinction is captured by De Morgan is Laws, which you will learn later!"}')
        `, [operatorsLessonId]);
      }
    }
    
    // ==========================================
    // LEVEL 2: Fill in missing lesson content
    // ==========================================
    
    // --- Lesson: "Deductive Reasoning" ---
    const deductiveLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Deductive Reasoning'`, [level2Id]);
    const deductiveLessonId = deductiveLesson.rows[0]?.id;
    
    if (deductiveLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [deductiveLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎯 Reasoning from General to Specific", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Deductive reasoning starts with general premises and draws specific, guaranteed conclusions. When the premises are true and the logic is valid, the conclusion MUST be true. There is no wiggle room — it is the most certain form of reasoning."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The classic example:\\n\\nPremise 1: All mammals are warm-blooded.\\nPremise 2: Dogs are mammals.\\nConclusion: Therefore, dogs are warm-blooded.\\n\\nIf both premises are true, the conclusion is guaranteed to be true."}'),
            (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/deductive-flow.png", "caption": "Deductive reasoning flows from general principles to specific conclusions"}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Which is a valid deductive argument?", "options": ["Most birds fly, so penguins probably fly", "All squares have 4 sides. This shape is a square. Therefore it has 4 sides.", "It rained yesterday, so it will rain today", "Scientists think the universe is expanding"], "correctIndex": 1, "explanation": "This follows the deductive pattern perfectly: a general rule (all squares have 4 sides) applied to a specific case (this shape is a square) yields a guaranteed conclusion (it has 4 sides). The other options use probability or observation, not deduction."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🏛️ The Syllogism", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "The most famous form of deductive reasoning is the syllogism, developed by Aristotle over 2,300 years ago. A syllogism has exactly three parts:\\n\\n1. Major Premise: A general statement\\n2. Minor Premise: A specific statement\\n3. Conclusion: What necessarily follows\\n\\nThis simple structure is the foundation of mathematical proofs, legal arguments, and scientific theorems."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🔍 Validity vs. Soundness", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "An argument is VALID if the conclusion follows logically from the premises, regardless of whether the premises are actually true.\\n\\nAn argument is SOUND if it is both valid AND its premises are actually true.\\n\\nConsider: \\"All fish can fly. Salmon are fish. Therefore, salmon can fly.\\" This argument is VALID (the logic works) but NOT SOUND (the first premise is false)."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What is the difference between a valid and a sound argument?", "options": ["They mean the same thing", "Valid means the logic works; sound means the logic works AND the premises are true", "Sound arguments are shorter than valid ones", "Valid arguments use numbers; sound arguments use words"], "correctIndex": 1, "explanation": "A valid argument has correct logical structure — if the premises were true, the conclusion would have to be true. A sound argument goes further: it is valid AND its premises are actually true. Soundness guarantees the conclusion is true."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "⚡ Modus Ponens and Modus Tollens", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Two crucial deductive patterns:\\n\\nModus Ponens (Affirming the Antecedent):\\nIf P, then Q. P is true. Therefore, Q is true.\\n\\"If it rains, the ground gets wet. It is raining. Therefore, the ground is wet.\\"\\n\\nModus Tollens (Denying the Consequent):\\nIf P, then Q. Q is false. Therefore, P is false.\\n\\"If it rains, the ground gets wet. The ground is dry. Therefore, it did not rain.\\""}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "These two patterns appear everywhere — in detective work (Sherlock Holmes used modus tollens constantly), in medical diagnosis, in debugging computer programs, and in everyday problem-solving."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "\\"If the alarm rings, then class is over. Class is not over. Therefore...\\"", "options": ["The alarm rang", "The alarm did not ring", "Class might be over", "We cannot determine anything"], "correctIndex": 1, "explanation": "This is Modus Tollens. We know: If alarm → class over. We know class is NOT over. Therefore, the alarm did NOT ring. Denying the consequent lets us deny the antecedent."}')
        `, [deductiveLessonId]);
      }
    }
    
    // --- Lesson: "Inductive Reasoning" ---
    const inductiveLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Inductive Reasoning'`, [level2Id]);
    const inductiveLessonId = inductiveLesson.rows[0]?.id;
    
    if (inductiveLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [inductiveLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔭 Reasoning from Specific to General", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "While deductive reasoning goes from general to specific, inductive reasoning works in the opposite direction. It observes specific examples and draws general conclusions. This is how science works — we observe patterns and form theories."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Example of inductive reasoning:\\n\\nObservation 1: The sun rose this morning.\\nObservation 2: The sun rose yesterday morning.\\nObservation 3: The sun has risen every morning in recorded history.\\nInductive conclusion: The sun will rise tomorrow morning.\\n\\nThis seems reasonable, but it is not GUARANTEED — it is highly probable."}'),
            (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "How does inductive reasoning differ from deductive reasoning?", "options": ["Inductive reasoning is always wrong", "Inductive reasoning moves from specific observations to general conclusions", "Inductive reasoning only works in mathematics", "There is no difference"], "correctIndex": 1, "explanation": "Inductive reasoning observes specific instances and generalizes. Unlike deduction (which guarantees conclusions), induction produces probable but not certain conclusions. Most scientific theories are based on inductive reasoning."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "📊 Strength of Inductive Arguments", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Inductive arguments are not valid or invalid — they are strong or weak. The strength depends on:\\n\\n• Sample size: More observations = stronger argument\\n• Diversity of examples: Varied evidence is more convincing\\n• Absence of counterexamples: No contradicting evidence\\n• Relevance: The observations must actually relate to the conclusion"}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Consider the famous \\"black swan\\" problem. For centuries, Europeans observed only white swans and concluded \\"All swans are white.\\" This seemed like a strong induction — until black swans were discovered in Australia! This shows that inductive conclusions can always be overturned by new evidence."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🔬 Types of Inductive Reasoning", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "1. Generalization: Observing a sample and applying it to a population. \\"Every cat I have met purrs, so all cats probably purr.\\"\\n\\n2. Statistical: Using data to draw conclusions. \\"90% of tested patients responded to the treatment, so it is likely effective.\\"\\n\\n3. Causal: Inferring cause from correlation. \\"Every time I water the plant, it grows. Watering probably causes growth.\\"\\n\\n4. Analogical: If two things are similar in some ways, they might be similar in others."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "A researcher tests 10,000 people and finds 95% respond to a drug. She concludes the drug is effective for the general population. What type of reasoning is this?", "options": ["Deductive reasoning", "Inductive generalization from a sample", "A logical fallacy", "Analogical reasoning"], "correctIndex": 1, "explanation": "This is inductive generalization — observing a pattern in a sample (10,000 people) and extending it to the population. The large sample size and high percentage make this a strong (but still not certain) inductive argument."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "🌉 The Bridge Between Induction and Deduction", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "In practice, the best reasoning combines both methods. Scientists use induction to form hypotheses from observations, then use deduction to test those hypotheses by predicting specific outcomes. This cycle of induction → hypothesis → deduction → testing is the foundation of the scientific method."}'),
            (gen_random_uuid(), $1, 13, 'question', '{"type": "question", "question": "Why are inductive conclusions never 100% certain?", "options": ["Because they use faulty logic", "Because new observations could always provide a counterexample", "Because induction is not a real form of reasoning", "Because they only work in science"], "correctIndex": 1, "explanation": "No matter how many confirming observations we have, there is always the possibility that a future observation could contradict our conclusion — like the black swan problem. Inductive conclusions are probable, not guaranteed."}')
        `, [inductiveLessonId]);
      }
    }
    
    // --- Lesson: "Common Fallacies" ---
    const fallaciesLesson = await client.query(`SELECT id FROM lessons WHERE level_id = $1 AND title = 'Common Fallacies'`, [level2Id]);
    const fallaciesLessonId = fallaciesLesson.rows[0]?.id;
    
    if (fallaciesLessonId) {
      const existingContent = await client.query(`SELECT COUNT(*) FROM lesson_content WHERE lesson_id = $1`, [fallaciesLessonId]);
      if (parseInt(existingContent.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⚠️ When Good Reasoning Goes Wrong", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A logical fallacy is an error in reasoning that makes an argument invalid. Fallacies can be surprisingly persuasive — they often feel right even when they are logically flawed. Learning to spot them is one of the most valuable skills you can develop."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Fallacies come in two types:\\n\\n• Formal fallacies: Errors in the logical structure of the argument\\n• Informal fallacies: Errors in the content, context, or delivery of the argument\\n\\nBoth types can fool us if we are not careful."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🎯 Ad Hominem (Attack the Person)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Instead of addressing someone is argument, you attack their character.\\n\\n\\"You cannot trust Dr. Smith is research on climate change — she was late to the conference!\\"\\n\\nBeing late has nothing to do with the quality of her research. The argument should be evaluated on its own merits, not the character of the person making it."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Which is an example of an ad hominem fallacy?", "options": ["\\"Your math proof has an error in step 3\\"", "\\"You failed math class, so your proof must be wrong\\"", "\\"This proof contradicts a known theorem\\"", "\\"I disagree with your conclusion based on the evidence\\""], "correctIndex": 1, "explanation": "Attacking someone is past grades instead of examining their actual proof is ad hominem. A failed student could still produce a valid proof. Arguments must be judged on their logical content, not the person presenting them."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🐟 Red Herring (Distraction)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Introducing an irrelevant topic to divert attention from the original issue.\\n\\n\\"Why should we discuss pollution in our city? There are children starving in other countries!\\"\\n\\nBoth are important issues, but child hunger is unrelated to the discussion about local pollution. The red herring attempts to derail the conversation by appealing to emotions about a different topic."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🎪 Straw Man (Misrepresenting an Argument)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Distorting someone is argument to make it easier to attack.\\n\\nPerson A: \\"I think we should have stricter food safety regulations.\\"\\nPerson B: \\"So you want to shut down all restaurants and make everyone cook at home? That is ridiculous!\\"\\n\\nPerson B has created a distorted version (a straw man) of Person A is actual position, which was much more moderate."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "What makes a \\"straw man\\" fallacy?", "options": ["Using straw as evidence", "Making an argument in a field", "Misrepresenting someone else is argument to make it easier to attack", "Building up a strong argument"], "correctIndex": 2, "explanation": "The straw man fallacy works by replacing the opponent is actual argument with a weaker, distorted version. It is like building a \\"straw man\\" that is easy to knock down, instead of engaging with the real argument."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "🎰 Appeal to Popularity (Bandwagon)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "Arguing that something is true or good because many people believe or do it.\\n\\n\\"Millions of people believe in astrology, so it must be valid.\\"\\n\\nPopularity does not determine truth. Millions of people once believed the Earth was flat. The number of believers is irrelevant to whether a claim is actually true."}'),
            (gen_random_uuid(), $1, 14, 'text', '{"type": "text", "text": "🔄 Circular Reasoning (Begging the Question)", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 15, 'text', '{"type": "text", "text": "Using the conclusion as one of the premises — essentially saying \\"X is true because X is true.\\"\\n\\n\\"This news source is reliable because it says so on their website.\\"\\n\\nThe reliability of the source is what we are trying to establish, so we cannot use the source itself as evidence. The argument goes in a circle without actually proving anything."}'),
            (gen_random_uuid(), $1, 16, 'question', '{"type": "question", "question": "\\"We should trust this book because it says it is trustworthy.\\" What fallacy is this?", "options": ["Ad hominem", "Red herring", "Circular reasoning", "Straw man"], "correctIndex": 2, "explanation": "This is circular reasoning — the conclusion (the book is trustworthy) is used as a premise to support itself. The argument assumes what it is trying to prove, going around in a logical circle."}')
        `, [fallaciesLessonId]);
      }
    }
    
    // ==========================================
    // LEVEL 3: Advanced Logic (NEW)
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Formal Logic', 3) 
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [courseId]);
    
    let level3Id = level3Result.rows[0]?.id;
    if (!level3Id) {
      const existing = await client.query(`SELECT id FROM levels WHERE course_id = $1 AND order_index = 3`, [courseId]);
      level3Id = existing.rows[0]?.id;
    }
    
    if (level3Id) {
      // Check if lessons already exist
      const existingLessons = await client.query(`SELECT COUNT(*) FROM lessons WHERE level_id = $1`, [level3Id]);
      if (parseInt(existingLessons.rows[0].count) === 0) {
        
        // Lesson 1: Truth Tables
        const ttLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Truth Tables', 'lesson', 1) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📋 Mapping Every Possibility", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A truth table is a powerful tool that systematically lists every possible combination of truth values for a logical expression. It is like a complete map of an argument — showing exactly when the expression is true and when it is false."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "For a simple NOT operation on p:\\n\\n| p | ¬p |\\n|---|-----|\\n| T | F |\\n| F | T |\\n\\nThis captures everything NOT does — it flips the truth value."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "For AND (p ∧ q), we need all four combinations of p and q:\\n\\n| p | q | p ∧ q |\\n|---|---|-------|\\n| T | T | T |\\n| T | F | F |\\n| F | T | F |\\n| F | F | F |\\n\\nAND is only true when BOTH inputs are true."}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "How many rows does a truth table need for an expression with 3 variables (p, q, r)?", "options": ["3 rows", "6 rows", "8 rows", "9 rows"], "correctIndex": 2, "explanation": "Each variable can be T or F (2 possibilities). With 3 variables: 2 × 2 × 2 = 2³ = 8 rows. In general, n variables require 2ⁿ rows. This exponential growth is why truth tables become impractical for many variables."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔍 Using Truth Tables to Test Validity", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Truth tables can definitively prove whether a logical argument is valid. An argument is valid if there is NO row where all premises are true but the conclusion is false.\\n\\nLet us test Modus Ponens: If p then q (p → q). p is true. Therefore q.\\n\\n| p | q | p → q | Premises both true? | Conclusion q |\\n|---|---|-------|-------------------|-------------|\\n| T | T | T | ✅ Yes | T ✅ |\\n| T | F | F | ❌ No (p→q is F) | — |\\n| F | T | T | ❌ No (p is F) | — |\\n| F | F | T | ❌ No (p is F) | — |\\n\\nIn the only row where both premises are true, the conclusion is also true. Valid!"}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "⚡ Tautologies and Contradictions", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "A tautology is a statement that is ALWAYS true, no matter what. Example: p ∨ ¬p (\\"It is raining or it is not raining\\"). Every row in its truth table shows T.\\n\\nA contradiction is ALWAYS false. Example: p ∧ ¬p (\\"It is raining and it is not raining\\"). Every row shows F.\\n\\nA contingency is sometimes true and sometimes false — most statements fall into this category."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What is a tautology?", "options": ["A statement that is always false", "A statement that is always true regardless of the truth values of its components", "A statement that cannot be evaluated", "A statement with exactly one true row in its truth table"], "correctIndex": 1, "explanation": "A tautology is true in every possible scenario. Its truth table has T in every row of the final column. The classic example is p ∨ ¬p — any statement OR its negation is always true."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "🎨 De Morgan is Laws", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Two elegant and incredibly useful equivalences discovered by Augustus De Morgan:\\n\\n¬(p ∧ q) ≡ (¬p ∨ ¬q) — NOT (p AND q) = (NOT p) OR (NOT q)\\n¬(p ∨ q) ≡ (¬p ∧ ¬q) — NOT (p OR q) = (NOT p) AND (NOT q)\\n\\nIn everyday language: \\"It is not the case that I like BOTH coffee and tea\\" means \\"I dislike coffee OR I dislike tea.\\"\\n\\nYou can verify these with truth tables — both sides produce identical columns!"}'),
            (gen_random_uuid(), $1, 13, 'question', '{"type": "question", "question": "According to De Morgan is Laws, ¬(A ∨ B) is equivalent to:", "options": ["¬A ∨ ¬B", "¬A ∧ ¬B", "A ∧ B", "A ∨ B"], "correctIndex": 1, "explanation": "De Morgan is Law states that negating an OR flips it to AND, and negates both components: ¬(A ∨ B) = ¬A ∧ ¬B. \\"It is NOT the case that A or B\\" means \\"NOT A and NOT B\\" — neither is true."}')
        `, [ttLesson.rows[0].id]);
        
        // Lesson 2: Symbolic Logic
        const symbolicLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Symbolic Logic & Translation', 'lesson', 2) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔤 From English to Symbols", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "One of logic is greatest powers is translating messy, ambiguous everyday language into precise symbolic notation. Once translated, we can apply mechanical rules to determine truth — no interpretation needed."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Translation guide:\\n\\n\\"and\\" / \\"but\\" / \\"also\\" / \\"moreover\\" → ∧ (conjunction)\\n\\"or\\" / \\"either...or\\" → ∨ (disjunction)\\n\\"not\\" / \\"it is false that\\" / \\"it is not the case\\" → ¬ (negation)\\n\\"if...then\\" / \\"implies\\" / \\"whenever\\" / \\"only if\\" → → (conditional)\\n\\"if and only if\\" / \\"exactly when\\" → ↔ (biconditional)"}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Example: \\"If it is sunny and warm, then I will go to the beach or the park.\\"\\n\\nLet S = sunny, W = warm, B = go to beach, P = go to park\\n\\nSymbolic: (S ∧ W) → (B ∨ P)\\n\\nNow we can analyze this precisely using truth tables or logical rules!"}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Translate: \\"If you study hard, then you will pass the exam.\\" (Let S = study hard, P = pass)", "options": ["S ∧ P", "S ∨ P", "S → P", "P → S"], "correctIndex": 2, "explanation": "\\"If...then\\" is the conditional (→). \\"If you study hard\\" is the condition (S), and \\"you will pass\\" is the result (P). So the translation is S → P."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "⚠️ Tricky Translations", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "English is full of traps! Consider these:\\n\\n\\"I will go unless it rains\\" = \\"If it does NOT rain, I will go\\" = ¬R → G\\n\\n\\"You can have cake only if you eat your vegetables\\" = C → V (NOT V → C!)\\nThe \\"only if\\" reverses the direction from what you might expect.\\n\\n\\"Neither rain nor snow stops the mail\\" = ¬R ∧ ¬S (neither...nor = not this AND not that)"}'),
            (gen_random_uuid(), $1, 8, 'question', '{"type": "question", "question": "\\"You can drive only if you have a license.\\" Let D = drive, L = license. What is the correct translation?", "options": ["L → D", "D → L", "D ∧ L", "D ∨ L"], "correctIndex": 1, "explanation": "\\"P only if Q\\" translates to P → Q, not Q → P. Having a license does not FORCE you to drive, but driving REQUIRES a license. So driving implies having a license: D → L."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🏗️ Logical Equivalences", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Two expressions are logically equivalent if they have the same truth value in every possible scenario. Key equivalences to know:\\n\\nDouble Negation: ¬(¬p) ≡ p\\nContrapositive: (p → q) ≡ (¬q → ¬p)\\nImplication: (p → q) ≡ (¬p ∨ q)\\nDe Morgan: ¬(p ∧ q) ≡ (¬p ∨ ¬q)\\n\\nThe contrapositive is especially useful: \\"If it rains, the ground is wet\\" is equivalent to \\"If the ground is not wet, it did not rain.\\""}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Understanding equivalences lets you transform arguments into simpler or more useful forms — a skill essential in mathematics, programming, and legal reasoning."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "The contrapositive of \\"If it is a dog, then it is an animal\\" is:", "options": ["\\"If it is an animal, then it is a dog\\"", "\\"If it is not an animal, then it is not a dog\\"", "\\"If it is not a dog, then it is not an animal\\"", "\\"Dogs and animals are the same\\""], "correctIndex": 1, "explanation": "The contrapositive of \\"If P, then Q\\" is \\"If NOT Q, then NOT P.\\" It reverses the direction AND negates both parts. Crucially, the contrapositive is always logically equivalent to the original statement."}')
        `, [symbolicLesson.rows[0].id]);
        
        // Lesson 3: Logical Proofs
        const proofsLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Introduction to Proofs', 'lesson', 3) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📜 What is a Proof?", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A proof is a sequence of logical steps that demonstrates a conclusion must be true, given certain premises. Each step must follow from previous steps using established rules of inference. Proofs are the gold standard of certainty — when you prove something, it is settled forever."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Proofs have been used for over 2,000 years. Euclid proved geometric theorems around 300 BC that are still valid today. A mathematical proof, once verified, never expires or becomes outdated."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🧱 Proof by Direct Reasoning", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "A direct proof starts with known facts and applies logical rules step by step to reach the conclusion.\\n\\nExample — Prove: If n is even, then n² is even.\\n\\nStep 1: Assume n is even. (Premise)\\nStep 2: Then n = 2k for some integer k. (Definition of even)\\nStep 3: n² = (2k)² = 4k² = 2(2k²). (Algebra)\\nStep 4: Since n² = 2(2k²), n² is a multiple of 2. (Definition of even)\\nStep 5: Therefore n² is even. ∎"}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "In a direct proof, you:", "options": ["Start with the conclusion and work backwards", "Start with premises and apply logical rules to reach the conclusion", "Use trial and error to find the answer", "Always use contradiction"], "correctIndex": 1, "explanation": "A direct proof moves forward from known premises, applying rules of inference at each step, until the desired conclusion is reached. Each step must be justified by a logical rule or previously established fact."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🔄 Proof by Contradiction", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Sometimes the most elegant approach is to assume the OPPOSITE of what you want to prove, then show that this assumption leads to an impossible contradiction. Since the assumption led to nonsense, it must be false — and therefore the original statement must be true."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Famous example — Prove: √2 is irrational.\\n\\nAssume √2 IS rational (the opposite of what we want to prove).\\nThen √2 = a/b where a/b is in lowest terms (fully reduced).\\nSquaring: 2 = a²/b², so a² = 2b².\\nThis means a² is even, so a must be even. Let a = 2c.\\nThen (2c)² = 2b², giving 4c² = 2b², so b² = 2c².\\nThis means b is also even.\\nBut if both a and b are even, a/b is NOT in lowest terms — CONTRADICTION!\\nTherefore our assumption was wrong: √2 is irrational. ∎"}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "In proof by contradiction, what do you do first?", "options": ["Prove the statement directly", "Assume the opposite of what you want to prove", "Create a truth table", "Find a counterexample"], "correctIndex": 1, "explanation": "Proof by contradiction (reductio ad absurdum) begins by assuming the negation of the statement you wish to prove. You then show this assumption leads to a logical impossibility, proving the assumption false and the original statement true."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "🎓 Why Proofs Matter", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Proofs are not just academic exercises. They underpin all of mathematics, which in turn supports science, engineering, and technology. Cryptographic security (protecting your bank transactions) relies on mathematical proofs. Computer algorithms are proven correct before being trusted with critical systems like aircraft autopilots."}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "The ability to construct logical proofs also strengthens everyday reasoning. It teaches you to build arguments methodically, identify hidden assumptions, and recognize when a claim truly follows from the evidence."}'),
            (gen_random_uuid(), $1, 14, 'question', '{"type": "question", "question": "Which proof technique involves assuming the opposite and finding a contradiction?", "options": ["Direct proof", "Proof by contradiction", "Proof by induction", "Proof by example"], "correctIndex": 1, "explanation": "Proof by contradiction (also called reductio ad absurdum) assumes the opposite of the desired conclusion, then derives a logical impossibility. This technique is especially useful when direct proof is difficult."}')
        `, [proofsLesson.rows[0].id]);
        
        // Practice lesson for level 3
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: Formal Logic', 'exercise', 4)
        `, [level3Id]);
      }
    }
    
    // Update course counts
    await client.query(`UPDATE courses SET lesson_count = 12, exercise_count = 30 WHERE id = $1`, [courseId]);
    
    console.log('✅ Logic course expanded!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (all with full content)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (all with full content)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (NEW - Formal Logic)');
    
  } catch (error) {
    console.error('❌ Failed to expand Logic course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedExpandLogic().catch(console.error);
