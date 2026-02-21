import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedMathCourse() {
  const client = await pool.connect();
  
  try {
    console.log('📐 Adding The Beauty of Calculus course...');
    
    // Get math category
    const mathCat = await client.query(`SELECT id FROM categories WHERE slug = 'math'`);
    const mathCatId = mathCat.rows[0]?.id;
    if (!mathCatId) throw new Error('Math category not found');
    
    // Check if course already exists
    const existing = await client.query(`SELECT id FROM courses WHERE title = 'The Beauty of Calculus'`);
    if (existing.rows[0]?.id) {
      console.log('Course already exists, skipping...');
      return;
    }
    
    // Create the course
    const courseResult = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'The Beauty of Calculus', 'Discover calculus not as a set of rules, but as a way of seeing the world. Understand limits, derivatives, and integrals through intuition and visual thinking.', '#9C27B0', 12, 24, true, 1)
      RETURNING id
    `, [mathCatId]);
    const courseId = courseResult.rows[0].id;
    
    // ==========================================
    // LEVEL 1: The Language of Change
    // ==========================================
    
    const level1Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'The Language of Change', 1) RETURNING id
    `, [courseId]);
    const level1Id = level1Result.rows[0].id;
    
    // Lesson 1: Why Calculus?
    const whyLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Why Calculus Matters', 'lesson', 1) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🌎 The Mathematics of Change", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "The world is in constant motion. Planets orbit, populations grow, temperatures fluctuate, and economies rise and fall. Algebra can describe static situations, but to understand CHANGE — how fast, how much, what direction — we need calculus."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Calculus was independently invented by Isaac Newton and Gottfried Leibniz in the late 1600s, and it has been called the greatest intellectual achievement of the human mind. That might sound dramatic, but consider: without calculus, there would be no smartphones, no GPS, no space travel, no modern medicine, and no internet."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "📊 Two Big Questions", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Calculus answers two fundamental questions:\\n\\n1. DERIVATIVES: At any given instant, how fast is something changing?\\n→ How fast is a car moving right NOW? How quickly is a disease spreading TODAY?\\n\\n2. INTEGRALS: Over a period of time, how much total change accumulates?\\n→ How far did the car travel in total? How many infections occurred over the month?\\n\\nThese two questions turn out to be deeply connected — they are inverse operations, like addition and subtraction."}'),
        (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "What are the two fundamental questions calculus answers?", "options": ["Addition and subtraction", "The rate of change at an instant (derivatives) and total accumulated change (integrals)", "Length and width", "Speed and distance only"], "correctIndex": 1, "explanation": "Derivatives measure the instantaneous rate of change (how fast something is changing right now), while integrals measure accumulated change (the total effect over time). These two concepts form the core of calculus and are connected by the Fundamental Theorem of Calculus."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🚀 Calculus in Your Daily Life", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "You experience calculus every day without realizing it:\\n\\n• Your phone is GPS uses calculus to calculate your position from satellite signals\\n• Weather forecasts use calculus-based differential equations\\n• Streaming algorithms use calculus to optimize video compression\\n• Medical imaging (CT, MRI) reconstructs 3D images using integral calculus\\n• Every bridge, building, and airplane was designed using calculus\\n\\nLearning calculus is not about memorizing formulas — it is about developing a new way of thinking about the world."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🧠 Intuition Over Formulas", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "In this course, we prioritize understanding over memorization. Every formula has a story and a visual meaning. Before we write any equations, we will build intuitions that make the math feel obvious and natural.\\n\\nThe goal is for you to think, \\"Of COURSE that is the derivative — it has to be!\\" rather than \\"I memorized this rule.\\" True understanding makes the formulas unforgettable."}'),
        (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Why was calculus such a revolutionary invention?", "options": ["It made arithmetic faster", "It provided tools to mathematically describe and predict change and motion", "It replaced all previous mathematics", "It was only useful for physics"], "correctIndex": 1, "explanation": "Before calculus, mathematics could describe static situations but had no systematic way to handle change and motion. Calculus gave scientists and engineers the language to describe, predict, and control dynamic systems — from planetary orbits to population growth to electrical circuits."}')
    `, [whyLesson.rows[0].id]);
    
    // Lesson 2: Limits
    const limitsLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Understanding Limits', 'lesson', 2) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🎯 Getting Infinitely Close", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A limit describes what value a function approaches as the input gets closer and closer to some number. It is the mathematical way of saying \\"what happens as we get infinitely close without quite arriving?\\""}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Imagine walking toward a wall, but each step you take covers exactly half the remaining distance. Step 1: halfway there. Step 2: three-quarters. Step 3: seven-eighths. You never quite reach the wall, but you get infinitely close. The LIMIT of your position is the wall."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "We write this as: lim(x→a) f(x) = L\\n\\nThis reads: \\"The limit of f(x) as x approaches a equals L.\\"\\n\\nIt means: as x gets closer and closer to a (from both sides), f(x) gets closer and closer to L."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What does a limit describe?", "options": ["The maximum value of a function", "The value a function approaches as the input gets closer to a specific point", "The speed of a function", "The area under a function"], "correctIndex": 1, "explanation": "A limit describes the value that a function approaches as its input approaches a specific value. Crucially, the function does not need to actually reach that value — limits are about the APPROACH, not the arrival."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔍 Why Limits Matter", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Limits are the foundation that all of calculus is built upon. They allow us to make sense of concepts that seem paradoxical:\\n\\n• Instantaneous speed: How can you have a speed at a single instant when speed requires two time points?\\n• Area under curves: How can you find the area of a shape with curved boundaries?\\n• Infinite sums: Can you add infinitely many numbers and get a finite answer?\\n\\nAll of these require the concept of limits — approaching but never quite reaching infinity or zero."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🧪 An Important Example", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Consider the function f(x) = sin(x)/x. What happens at x = 0?\\n\\nPlugging in: f(0) = sin(0)/0 = 0/0 — undefined! Division by zero!\\n\\nBut watch what happens as x APPROACHES 0:\\nx = 1: f(x) ≈ 0.841\\nx = 0.1: f(x) ≈ 0.998\\nx = 0.01: f(x) ≈ 0.99998\\nx = 0.001: f(x) ≈ 0.9999998\\n\\nThe function approaches 1! So: lim(x→0) sin(x)/x = 1\\n\\nThe limit exists even though the function is undefined at x = 0. This is the power of limits."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Can a limit exist at a point where the function itself is undefined?", "options": ["No — the function must be defined for the limit to exist", "Yes — the limit describes what value the function APPROACHES, not its actual value at that point", "Only for polynomial functions", "Only when the limit equals zero"], "correctIndex": 1, "explanation": "Limits describe the behavior of a function NEAR a point, not AT that point. A function can be undefined at x = a, yet lim(x→a) f(x) can still exist if the function approaches a consistent value as x gets close to a from both sides."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Limits are the bridge between the finite and the infinite. They let us extract precise, finite answers from processes that involve infinitely many steps. This idea — making the infinite precise — is what makes calculus possible."}')
    `, [limitsLesson.rows[0].id]);
    
    // Lesson 3: Continuity
    const contLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Continuity: No Gaps Allowed', 'lesson', 3) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "✏️ Drawing Without Lifting Your Pen", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Intuitively, a continuous function is one you can draw without lifting your pen. No gaps, no jumps, no sudden teleportations. The function flows smoothly from one point to the next."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Formally, a function f is continuous at a point a if three conditions are met:\\n\\n1. f(a) exists (the function is defined at that point)\\n2. lim(x→a) f(x) exists (the limit exists at that point)\\n3. lim(x→a) f(x) = f(a) (the limit equals the function value)\\n\\nIn other words: the function arrives exactly where you would expect it to based on the surrounding values."}'),
        (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "What makes a function continuous at a point?", "options": ["The function must be differentiable", "The function value must equal the limit at that point", "The function must be positive", "The function must be increasing"], "correctIndex": 1, "explanation": "A function is continuous at a point when the function is actual value equals its limit at that point. This means there is no gap, jump, or hole — the function behaves exactly as its surrounding values predict."}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🕳️ Types of Discontinuity", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "When continuity fails, we get discontinuities. There are three types:\\n\\n• Removable (hole): The limit exists but either the function is undefined or its value differs from the limit. Like a pothole — you could fix it by filling in the right value.\\n\\n• Jump: The function approaches different values from the left and right. Like a staircase — the left limit and right limit disagree.\\n\\n• Infinite: The function shoots off toward infinity. Like a vertical asymptote — the function goes haywire near that point."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌊 The Intermediate Value Theorem", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "One of the most beautiful consequences of continuity is the Intermediate Value Theorem (IVT):\\n\\nIf f is continuous on [a, b] and f(a) < k < f(b), then there exists some c in [a, b] where f(c) = k.\\n\\nIn plain language: if a continuous function starts below a value and ends above it, it must pass through that value somewhere in between. You cannot go from below to above without crossing — that is what \\"no gaps\\" means!"}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "The IVT has a surprising practical application: it proves that equations have solutions! If you can show that f(1) = -3 and f(5) = 7, and f is continuous, then f(x) = 0 must have a solution somewhere between 1 and 5. The function MUST cross zero on its way from -3 to 7."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "The temperature at midnight is 2°C and at noon is 25°C. What does the IVT guarantee?", "options": ["The temperature was exactly 15°C at 6 AM", "At some point between midnight and noon, every temperature between 2°C and 25°C was reached", "The temperature increased steadily", "Nothing — the IVT does not apply to temperature"], "correctIndex": 1, "explanation": "Since temperature changes continuously (no instant jumps), the IVT guarantees that every temperature between 2°C and 25°C was reached at some point. We do not know exactly WHEN each temperature occurred, just that it must have happened."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Continuity might seem like a simple concept, but it is remarkably deep. It is the foundation that allows us to take derivatives and integrals — the two pillars of calculus. Without continuity, the machinery of calculus breaks down."}')
    `, [contLesson.rows[0].id]);
    
    // Practice for Level 1
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Limits & Continuity', 'exercise', 4)
    `, [level1Id]);
    
    // ==========================================
    // LEVEL 2: Derivatives
    // ==========================================
    
    const level2Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Derivatives: The Art of Change', 2) RETURNING id
    `, [courseId]);
    const level2Id = level2Result.rows[0].id;
    
    // Lesson 1: What is a Derivative?
    const derivLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'What is a Derivative?', 'lesson', 1) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📈 Capturing the Instant", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Imagine you are driving and glance at your speedometer. It reads 60 mph. But what does that really mean? You are not traveling for a whole hour — you are looking at your speed at a single instant. How can we mathematically define speed at an instant when speed requires two time points?"}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "This is the fundamental problem that derivatives solve. The derivative measures the INSTANTANEOUS rate of change of a function — how fast something is changing at a single, precise moment."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔍 From Average to Instantaneous", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Average speed is easy: distance ÷ time. If you travel 120 miles in 2 hours, your average speed is 60 mph.\\n\\nBut what about speed at exactly t = 1 hour? We can approximate:\\n• From t=1 to t=1.1: average speed ≈ 62 mph\\n• From t=1 to t=1.01: average speed ≈ 60.5 mph\\n• From t=1 to t=1.001: average speed ≈ 60.05 mph\\n\\nAs the time interval shrinks toward zero, the average speed approaches the INSTANTANEOUS speed. This limit IS the derivative!\\n\\nf′(a) = lim(h→0) [f(a+h) - f(a)] / h"}'),
        (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "The derivative at a point represents:", "options": ["The average rate of change over a large interval", "The instantaneous rate of change — the limit of average rates as the interval shrinks to zero", "The maximum value of the function", "The total area under the curve"], "correctIndex": 1, "explanation": "The derivative is defined as the limit of the average rate of change as the interval becomes infinitely small. It captures the precise rate of change at a single instant — solving the seemingly paradoxical problem of defining instantaneous speed."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "📐 Geometric Meaning: Tangent Lines", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Visually, the derivative at a point equals the SLOPE of the tangent line to the curve at that point.\\n\\nA tangent line just barely touches the curve at one point, showing the direction the curve is heading at that instant. Steep tangent = large derivative (rapid change). Flat tangent = small derivative (slow change). The derivative gives us both the rate AND direction of change.\\n\\nWhen the derivative is positive, the function is increasing. When negative, it is decreasing. When zero, the function is momentarily flat — often a peak or valley."}'),
        (gen_random_uuid(), $1, 9, 'image', '{"type": "image", "url": "/images/tangent-line.png", "caption": "The derivative at point P equals the slope of the tangent line at P"}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "If the derivative of a function is zero at a point, what does that mean geometrically?", "options": ["The function equals zero", "The tangent line is horizontal — the function is momentarily flat (possibly a peak or valley)", "The function is discontinuous", "The function is linear"], "correctIndex": 1, "explanation": "A derivative of zero means the tangent line is perfectly horizontal — the function is neither increasing nor decreasing at that instant. This often indicates a local maximum (peak), local minimum (valley), or inflection point."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The derivative transforms a position function into a velocity function, a velocity function into an acceleration function, and a revenue function into a marginal revenue function. It is the universal tool for understanding how things change."}')
    `, [derivLesson.rows[0].id]);
    
    // Lesson 2: Derivative Rules
    const rulesLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'The Rules of Differentiation', 'lesson', 2) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⚡ Shortcuts That Took Centuries to Discover", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Computing derivatives from the limit definition every time would be incredibly tedious. Fortunately, mathematicians have discovered elegant rules that let us differentiate quickly. These rules are not arbitrary — each one has a deep geometric or algebraic reason."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🔢 The Power Rule", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "If f(x) = xⁿ, then f′(x) = nxⁿ⁻¹\\n\\nExamples:\\n• f(x) = x³ → f′(x) = 3x²\\n• f(x) = x⁵ → f′(x) = 5x⁴\\n• f(x) = √x = x^(1/2) → f′(x) = (1/2)x^(-1/2)\\n• f(x) = 1/x = x⁻¹ → f′(x) = -x⁻² = -1/x²\\n\\nThe power rule works for ANY exponent — positive, negative, fractional. It is the workhorse of differentiation."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Using the power rule, what is the derivative of f(x) = x⁴?", "options": ["x³", "4x³", "4x⁴", "3x⁴"], "correctIndex": 1, "explanation": "The power rule says: bring down the exponent as a coefficient, then reduce the exponent by 1. So x⁴ becomes 4x³. The 4 comes down in front, and the exponent drops from 4 to 3."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔗 The Chain Rule", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "What about composite functions like f(x) = (3x + 1)⁵? The chain rule handles this:\\n\\nIf y = f(g(x)), then dy/dx = f′(g(x)) · g′(x)\\n\\nIn words: differentiate the outer function, keeping the inner function unchanged, then multiply by the derivative of the inner function.\\n\\nFor (3x + 1)⁵:\\nOuter: ( )⁵ → 5( )⁴\\nInner: 3x + 1 → 3\\nResult: 5(3x + 1)⁴ · 3 = 15(3x + 1)⁴"}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Think of the chain rule like a chain of gears. If gear A turns gear B, and gear B turns gear C, the overall rate of turning is the product of each connection is rate. Each function in the composition contributes its own rate of change."}'),
        (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "The chain rule is used when you need to differentiate:", "options": ["A constant", "A sum of two functions", "A composite function (a function inside another function)", "A polynomial"], "correctIndex": 2, "explanation": "The chain rule handles composite functions — when one function is nested inside another. Whenever you see a function applied to something more complex than just x, you need the chain rule to account for the inner function is rate of change."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "📦 Product and Quotient Rules", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Product Rule: d/dx[f(x) · g(x)] = f′(x)·g(x) + f(x)·g′(x)\\n\\nThe derivative of a product is NOT the product of the derivatives! You must account for both functions changing simultaneously.\\n\\nQuotient Rule: d/dx[f(x)/g(x)] = [f′(x)·g(x) - f(x)·g′(x)] / [g(x)]²\\n\\nA handy mnemonic: \\"Low d-high minus high d-low, over the square of what is below.\\""}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why is the derivative of f(x)·g(x) NOT simply f′(x)·g′(x)?", "options": ["It is — that is the correct formula", "Because both functions are changing simultaneously, so we must account for each one is change while the other holds", "Because multiplication does not work with derivatives", "It only works for constants"], "correctIndex": 1, "explanation": "When two functions are multiplied, both are changing at the same time. The product rule accounts for this: the change in f·g comes from f changing while g stays (f′·g) PLUS g changing while f stays (f·g′). This is similar to how the area of a rectangle changes when both sides grow."}')
    `, [rulesLesson.rows[0].id]);
    
    // Lesson 3: Applications of Derivatives
    const appLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Applications: Optimization & Motion', 'lesson', 3) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🏆 Finding the Best Possible Answer", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "One of the most powerful applications of derivatives is optimization — finding the maximum or minimum value of a function. Businesses maximize profit. Engineers minimize material usage. Nature minimizes energy. Derivatives give us the exact tools to find these optimal points."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The key insight: at a maximum or minimum, the derivative equals zero. The function is momentarily flat before switching direction. So finding optimal points becomes: set f′(x) = 0 and solve!\\n\\nBut f′(x) = 0 could give a maximum, minimum, or neither. The second derivative test tells us which:\\n• f″(x) < 0 → concave down → it is a MAXIMUM ∩\\n• f″(x) > 0 → concave up → it is a MINIMUM ∪"}'),
        (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "How do derivatives help find maximum and minimum values?", "options": ["By finding where the function equals zero", "By finding where the derivative equals zero — indicating flat points where the function changes direction", "By calculating the average value", "By finding where the function is steepest"], "correctIndex": 1, "explanation": "At maximum and minimum points, the derivative equals zero because the function momentarily stops increasing or decreasing. Setting f′(x) = 0 finds these critical points, then the second derivative determines whether each is a max or min."}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🎯 A Classic Optimization Problem", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "You have 100 meters of fence. What is the largest rectangular area you can enclose?\\n\\nLet width = x, then length = (100 - 2x)/2 = 50 - x\\nArea: A(x) = x(50 - x) = 50x - x²\\n\\nDerivative: A′(x) = 50 - 2x\\nSet to zero: 50 - 2x = 0 → x = 25\\n\\nSo width = 25, length = 25 — a square! Area = 625 m².\\n\\nThis elegant result (a square maximizes area for a given perimeter) was known to the ancient Greeks, but calculus provides the proof."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🚗 Motion and Velocity", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "If s(t) gives the position of an object at time t, then:\\n\\n• s′(t) = velocity (rate of change of position)\\n• s″(t) = acceleration (rate of change of velocity)\\n\\nExample: A ball thrown upward has position s(t) = -16t² + 48t + 5 feet\\nVelocity: v(t) = s′(t) = -32t + 48\\nAcceleration: a(t) = s″(t) = -32 (constant gravity!)\\n\\nThe ball reaches its peak when v(t) = 0: -32t + 48 = 0 → t = 1.5 seconds\\nMaximum height: s(1.5) = -16(2.25) + 48(1.5) + 5 = 41 feet"}'),
        (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "If position is s(t) = t³ - 6t², what is the velocity function?", "options": ["t³ - 6t²", "3t² - 12t", "6t - 12", "t⁴/4 - 2t³"], "correctIndex": 1, "explanation": "Velocity is the derivative of position. Using the power rule: d/dt(t³) = 3t² and d/dt(-6t²) = -12t. So velocity v(t) = 3t² - 12t. This tells us how fast and in what direction the object is moving at any time t."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "💡 Related Rates", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "When multiple quantities change simultaneously and are related by an equation, we can find how fast one changes in terms of the others. This technique, called related rates, solves fascinating real-world problems:\\n\\n• How fast is a shadow lengthening as you walk away from a streetlight?\\n• How fast is the water level rising in a conical tank being filled?\\n• How fast is the distance between two moving ships changing?\\n\\nThe key: differentiate the relationship equation with respect to time, using the chain rule."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why are derivatives essential for optimization problems?", "options": ["They tell us the function is value", "They identify critical points where maxima and minima occur by finding where the rate of change is zero", "They calculate the average value", "They are not actually needed — you can guess the answer"], "correctIndex": 1, "explanation": "Optimization requires finding where a function reaches its highest or lowest value. Derivatives identify these critical points (where f′ = 0) with mathematical precision, turning an infinite search into a finite algebraic problem."}')
    `, [appLesson.rows[0].id]);
    
    // Practice for Level 2
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Derivatives', 'exercise', 4)
    `, [level2Id]);
    
    // ==========================================
    // LEVEL 3: Integrals
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Integrals: Accumulation & Area', 3) RETURNING id
    `, [courseId]);
    const level3Id = level3Result.rows[0].id;
    
    // Lesson 1: What is an Integral?
    const integralLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'What is an Integral?', 'lesson', 1) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📊 Adding Up Infinitely Many Tiny Pieces", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "If derivatives answer \\"how fast is it changing?,\\" integrals answer the reverse: \\"how much has accumulated?\\" The integral adds up infinitely many infinitely small quantities to find a total — a concept that seemed impossible before calculus."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The visual meaning is beautiful: the integral of f(x) from a to b equals the AREA under the curve of f(x) between x = a and x = b. Areas below the x-axis count as negative.\\n\\nWe write: ∫ₐᵇ f(x) dx\\n\\nThe ∫ symbol (an elongated S) stands for \\"summation\\" — Leibniz chose it because integration is a continuous version of adding things up."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/integral-area.png", "caption": "The definite integral represents the area under the curve between the bounds a and b"}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What does the definite integral ∫ₐᵇ f(x) dx represent geometrically?", "options": ["The slope of the curve", "The area under the curve of f(x) from x = a to x = b", "The maximum value of f(x)", "The average of a and b"], "correctIndex": 1, "explanation": "The definite integral gives the signed area between the curve f(x) and the x-axis, from x = a to x = b. Areas above the x-axis are positive, areas below are negative. This geometric interpretation makes integrals visually intuitive."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🧱 Riemann Sums: The Building Blocks", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "How do we calculate the area under a curve? By approximating it with rectangles!\\n\\n1. Divide the interval into n equal pieces\\n2. In each piece, draw a rectangle whose height matches the curve\\n3. Add up all rectangle areas: Σ f(xᵢ)·Δx\\n\\nWith 5 rectangles: rough approximation\\nWith 100 rectangles: pretty good\\nWith 1,000,000 rectangles: nearly perfect\\nWith infinitely many: EXACT! That limit IS the integral."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "This idea — approximating with simple shapes and taking the limit to perfection — is one of the deepest ideas in mathematics. Archimedes used a similar technique over 2,000 years ago to find the area of a circle, making him arguably the first person to use integral calculus."}'),
        (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "What happens to a Riemann sum as the number of rectangles approaches infinity?", "options": ["It becomes less accurate", "It diverges to infinity", "It converges to the exact value of the integral", "Nothing changes"], "correctIndex": 2, "explanation": "As we use more and more rectangles (each getting thinner), the sum better approximates the actual area under the curve. In the limit of infinitely many infinitely thin rectangles, the Riemann sum equals the exact integral. This is the definition of the definite integral."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🔗 The Fundamental Theorem of Calculus", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The most important theorem in calculus connects derivatives and integrals as inverse operations:\\n\\nIf F′(x) = f(x), then ∫ₐᵇ f(x) dx = F(b) - F(a)\\n\\nThis is astonishing: to find the area under a curve, you just need to find an antiderivative (a function whose derivative is f(x)) and evaluate it at the endpoints!\\n\\nNo infinite sums needed. No rectangles. Just find F, plug in b and a, and subtract. This theorem transformed calculus from a theoretical curiosity into a practical tool that changed the world."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "The Fundamental Theorem of Calculus shows that:", "options": ["Derivatives and integrals are unrelated", "Integration is the reverse process of differentiation — they are inverse operations", "All functions can be integrated", "Calculus only works for polynomials"], "correctIndex": 1, "explanation": "The Fundamental Theorem of Calculus reveals that differentiation and integration are inverse processes — two sides of the same coin. Finding an integral reduces to finding an antiderivative (reversing differentiation), elegantly connecting the two branches of calculus."}')
    `, [integralLesson.rows[0].id]);
    
    // Lesson 2: Integration Techniques
    const techLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Integration Techniques', 'lesson', 2) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🧰 The Integrator is Toolkit", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "While differentiation is algorithmic (follow the rules and you always get an answer), integration is more of an art. Not every function has a nice closed-form antiderivative, and finding one often requires clever tricks and pattern recognition."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🔄 U-Substitution (Reverse Chain Rule)", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "The most common technique. When you see a composite function, substitute the inner part:\\n\\n∫ 2x·cos(x²) dx\\n\\nLet u = x², then du = 2x dx\\n\\n∫ cos(u) du = sin(u) + C = sin(x²) + C\\n\\nThe 2x dx \\"pairs up\\" perfectly with the derivative of x². U-substitution works whenever you can spot a function and its derivative appearing together."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "U-substitution is essentially the reverse of which differentiation rule?", "options": ["Power rule", "Product rule", "Chain rule", "Quotient rule"], "correctIndex": 2, "explanation": "U-substitution reverses the chain rule. The chain rule differentiates composite functions; u-substitution integrates them. Spotting the inner function (u) and its derivative (du) in the integrand is the key skill."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🧩 Integration by Parts", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "The reverse of the product rule. When the integrand is a product of two functions:\\n\\n∫ u dv = uv - ∫ v du\\n\\nExample: ∫ x·eˣ dx\\nLet u = x → du = dx\\nLet dv = eˣ dx → v = eˣ\\n\\nResult: x·eˣ - ∫ eˣ dx = x·eˣ - eˣ + C = eˣ(x - 1) + C\\n\\nThe trick is choosing u and dv wisely. A common mnemonic (LIATE): choose u from this priority: Logs, Inverse trig, Algebraic, Trig, Exponential."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🎨 Pattern Recognition", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Many integrals fall into recognizable patterns:\\n\\n• ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C (power rule in reverse)\\n• ∫ 1/x dx = ln|x| + C\\n• ∫ eˣ dx = eˣ + C\\n• ∫ sin(x) dx = -cos(x) + C\\n• ∫ cos(x) dx = sin(x) + C\\n\\nThese basic forms are the building blocks. More complex integrals are reduced to these forms using substitution, parts, or other techniques."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Why is integration generally harder than differentiation?", "options": ["Integrals use bigger numbers", "There is no systematic algorithm — integration requires pattern recognition and creative technique selection", "Integration was discovered later", "It is actually easier"], "correctIndex": 1, "explanation": "Differentiation follows mechanical rules that always produce an answer. Integration has no such guaranteed algorithm — you must recognize patterns, choose the right technique, and sometimes accept that no closed-form answer exists. This is why integration is often called an art."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Do not be discouraged if integration feels harder than differentiation — it IS harder! Even experienced mathematicians sometimes cannot find closed-form antiderivatives. In practice, numerical methods (using computers to approximate integrals) are just as important as analytical techniques."}')
    `, [techLesson.rows[0].id]);
    
    // Lesson 3: Applications of Integrals
    const intAppLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Applications: Areas, Volumes & More', 'lesson', 3) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🌐 Integrals Are Everywhere", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Integrals compute far more than just area under curves. Any time you need to accumulate a quantity that varies continuously, integration is the tool. The applications span every field of science and engineering."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "📏 Area Between Curves", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "The area between two curves f(x) and g(x) from a to b (where f is above g) is:\\n\\nArea = ∫ₐᵇ [f(x) - g(x)] dx\\n\\nThis subtracts the lower area from the upper area. It is used in economics (consumer and producer surplus), physics (work), and any field where the difference between two quantities matters."}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🏺 Volumes of Revolution", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Spin a curve around an axis and you create a 3D solid. Integration can find its volume!\\n\\nThe disk method slices the solid into thin circular disks:\\nV = π ∫ₐᵇ [f(x)]² dx\\n\\nImagine slicing a vase into thousands of thin circular wafers, calculating each tiny volume, and adding them all up. That is exactly what this integral does — in the limit where the slices are infinitely thin."}'),
        (gen_random_uuid(), $1, 7, 'question', '{"type": "question", "question": "What does ∫ₐᵇ [f(x) - g(x)] dx calculate when f(x) ≥ g(x)?", "options": ["The average of two functions", "The area trapped between the curves f(x) and g(x)", "The volume of a solid", "The derivative of both functions"], "correctIndex": 1, "explanation": "When f(x) ≥ g(x), the integral of their difference gives the area of the region trapped between the two curves from x = a to x = b. This is one of the most common applications of definite integrals."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "📊 Average Value and Probability", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "The average value of a function f on [a,b] is:\\n\\nf_avg = (1/(b-a)) ∫ₐᵇ f(x) dx\\n\\nThis generalizes the idea of averaging discrete values to averaging a continuously changing quantity. It is the foundation of probability and statistics — the expected value of a continuous random variable is an integral of x times its probability density."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "⚡ Physics Applications", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Physics is built on integrals:\\n\\n• Work: W = ∫ F(x) dx (force × distance when force varies)\\n• Center of mass: x̄ = ∫ x·ρ(x) dx / ∫ ρ(x) dx\\n• Electric field from a charge distribution\\n• Gravitational potential energy\\n• Fluid pressure on surfaces\\n\\nWhenever a physical quantity accumulates along a path, across a surface, or throughout a volume, integration is the mathematical tool that computes it."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Why are integrals fundamental to physics?", "options": ["Physics only uses calculus", "Physical quantities often accumulate continuously, and integration is the tool for computing continuous accumulation", "Integrals are simpler than algebra", "They are only used in theoretical physics"], "correctIndex": 1, "explanation": "Many physical quantities (work, energy, charge, mass) are distributed continuously rather than concentrated at points. Integration provides the mathematical framework to compute these accumulated quantities, making it indispensable in physics and engineering."}')
    `, [intAppLesson.rows[0].id]);
    
    // Practice for Level 3
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Integration', 'exercise', 4)
    `, [level3Id]);
    
    console.log('✅ The Beauty of Calculus course created!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (The Language of Change)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (Derivatives)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (Integrals)');
    
  } catch (error) {
    console.error('❌ Failed to create Math course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedMathCourse().catch(console.error);
