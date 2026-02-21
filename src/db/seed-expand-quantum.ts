import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedExpandQuantum() {
  const client = await pool.connect();
  
  try {
    console.log('⚛️ Expanding Quantum Computing course...');
    
    // Get the course
    const courseResult = await client.query(`SELECT id FROM courses WHERE title = 'Quantum Computing: A New Paradigm'`);
    const courseId = courseResult.rows[0]?.id;
    if (!courseId) throw new Error('Quantum Computing course not found');
    
    // ==========================================
    // LEVEL 2: Quantum Operations (NEW)
    // ==========================================
    
    const level2Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Quantum Operations', 2) 
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
        
        // Lesson 1: Quantum Gates
        const gatesLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Quantum Gates', 'lesson', 1) RETURNING id
        `, [level2Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🚪 The Building Blocks of Quantum Computation", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Just as classical computers use logic gates (AND, OR, NOT) to process bits, quantum computers use quantum gates to manipulate qubits. But quantum gates are far more powerful — they can create superposition, entangle qubits, and perform transformations that have no classical equivalent."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Unlike classical gates that are irreversible (you cannot figure out the input from the output of an AND gate), all quantum gates are reversible. Every transformation can be undone. This is a fundamental property of quantum mechanics."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔄 The Pauli Gates", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "The simplest quantum gates are named after physicist Wolfgang Pauli:\\n\\nX Gate (NOT): Flips |0⟩ to |1⟩ and vice versa. The quantum equivalent of a classical NOT gate.\\n\\nZ Gate (Phase Flip): Leaves |0⟩ unchanged but flips the phase of |1⟩ to -|1⟩. Has no classical equivalent — it changes the quantum phase without changing the measurement outcome.\\n\\nY Gate: Combines X and Z effects with a phase rotation. Flips the qubit while also rotating its phase."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "What does the X gate do to a qubit?", "options": ["Creates superposition", "Flips |0⟩ to |1⟩ and |1⟩ to |0⟩, like a classical NOT gate", "Entangles two qubits", "Measures the qubit"], "correctIndex": 1, "explanation": "The X gate (also called the Pauli-X or quantum NOT gate) flips the qubit state: |0⟩ becomes |1⟩ and |1⟩ becomes |0⟩. It is the quantum version of the classical NOT gate and is one of the simplest quantum operations."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌀 The Hadamard Gate — Creating Superposition", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "The Hadamard gate (H gate) is perhaps the most important gate in quantum computing. It takes a definite state and puts it into an equal superposition:\\n\\nH|0⟩ = (|0⟩ + |1⟩)/√2  — Equal chance of 0 or 1\\nH|1⟩ = (|0⟩ - |1⟩)/√2  — Equal chance but with opposite phase\\n\\nApplying H to every qubit at the start of a computation creates a superposition of ALL possible inputs simultaneously — this is how quantum parallelism begins!"}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🔗 The CNOT Gate — Creating Entanglement", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "The Controlled-NOT (CNOT) gate operates on TWO qubits: a control qubit and a target qubit. It flips the target qubit ONLY if the control qubit is |1⟩.\\n\\nWhen combined with the Hadamard gate, CNOT creates entanglement:\\n\\n1. Apply H to qubit 1: creates superposition\\n2. Apply CNOT with qubit 1 as control: now the qubits are entangled!\\n\\nThis simple two-step process is the foundation of almost every quantum algorithm."}'),
            (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "What makes the Hadamard gate so important?", "options": ["It measures qubits", "It creates superposition, enabling quantum parallelism", "It destroys quantum states", "It is the fastest quantum gate"], "correctIndex": 1, "explanation": "The Hadamard gate is crucial because it transforms definite states into superpositions, which is the starting point for quantum parallelism. By applying H to n qubits, you create a superposition of all 2ⁿ possible states — the foundation of quantum computational advantage."}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "With just the Hadamard and CNOT gates, you have the essential tools for quantum computation. In fact, mathematicians have proven that a small set of quantum gates can approximate ANY quantum operation to arbitrary precision — just as any classical computation can be built from NAND gates."}')
        `, [gatesLesson.rows[0].id]);
        
        // Lesson 2: Quantum Circuits
        const circuitsLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Quantum Circuits', 'lesson', 2) RETURNING id
        `, [level2Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📐 Designing Quantum Programs", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Quantum circuits are the visual language of quantum computing — they show how qubits are initialized, what gates are applied, and in what order. Reading a quantum circuit is like reading a musical score: time flows from left to right, and each horizontal line represents a qubit."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "A basic quantum circuit has three phases:\\n\\n1. Initialization: Set all qubits to a known state (usually |0⟩)\\n2. Operations: Apply a sequence of quantum gates\\n3. Measurement: Observe the qubits, collapsing superpositions into definite answers\\n\\nThe art of quantum programming is designing the right sequence of gates so that the correct answer has the highest probability when measured."}'),
            (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/quantum-circuit.png", "caption": "A simple quantum circuit: H gate creates superposition, CNOT creates entanglement, then measurement"}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "In a quantum circuit, what do horizontal lines represent?", "options": ["Wires connecting physical components", "Individual qubits evolving through time from left to right", "Classical bits", "Electrical connections"], "correctIndex": 1, "explanation": "Each horizontal line in a quantum circuit represents a single qubit. Time progresses from left to right, so gates further to the right are applied later. This notation makes it easy to visualize the sequence of operations applied to each qubit."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🎯 Quantum Interference", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Here is the crucial secret of quantum computing: it is not just about trying all answers at once. The real power comes from quantum interference — manipulating the phases of quantum states so that wrong answers cancel out and correct answers reinforce each other.\\n\\nThink of it like waves in a pond. When two wave peaks align, they create a bigger wave (constructive interference). When a peak meets a trough, they cancel out (destructive interference). Quantum algorithms orchestrate this interference so the correct answer has the highest probability."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "⚡ The Measurement Problem", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "When you measure a qubit, its superposition collapses to either |0⟩ or |1⟩, and the quantum information is destroyed. You only get one shot!\\n\\nThis is why quantum algorithm design is so subtle. You cannot just put qubits in superposition and measure — you will get a random answer. The circuit must be carefully designed so that interference amplifies the correct answer is probability before measurement.\\n\\nMany quantum algorithms run the circuit multiple times and use statistics to identify the correct answer with high confidence."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Why can you not simply put qubits in superposition and immediately measure to get the answer?", "options": ["Qubits are too fragile", "Measurement gives a random result — you need interference to amplify the correct answer first", "Superposition does not actually compute anything", "You can — that is exactly how quantum computers work"], "correctIndex": 1, "explanation": "Superposition alone gives a random result upon measurement. The power of quantum computing comes from carefully designed gate sequences that create interference — amplifying the probability of correct answers and suppressing wrong ones — BEFORE measurement."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "🖥️ Real Quantum Programming", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Today, you can actually program real quantum computers! IBM is Qiskit, Google is Cirq, and Amazon is Braket are open-source frameworks that let you design quantum circuits and run them on real quantum hardware over the cloud.\\n\\nThese tools use Python to describe circuits:\\n\\n1. Create a circuit with n qubits\\n2. Add gates: circuit.h(0), circuit.cx(0, 1)\\n3. Add measurements\\n4. Send to a real quantum processor or simulator\\n5. Analyze the results\\n\\nQuantum programming is no longer science fiction — it is something you can try right now!"}')
        `, [circuitsLesson.rows[0].id]);
        
        // Lesson 3: Quantum Algorithms
        const algoLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Quantum Algorithms', 'lesson', 3) RETURNING id
        `, [level2Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🧮 Algorithms That Change Everything", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Quantum algorithms are carefully designed procedures that exploit superposition, entanglement, and interference to solve problems faster than any classical algorithm. Not every problem benefits from quantum computing — but for those that do, the speedup can be astronomical."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🔍 Grover is Search Algorithm", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Imagine searching an unsorted database of 1 million entries. A classical computer must check entries one by one — on average 500,000 checks. Grover is algorithm finds the answer in only about 1,000 steps!\\n\\nHow? It uses a technique called amplitude amplification:\\n1. Create a superposition of all possible inputs\\n2. Mark the correct answer (flip its phase)\\n3. Amplify the marked answer is amplitude using interference\\n4. Repeat steps 2-3 about √N times\\n5. Measure — the correct answer appears with high probability\\n\\nThe speedup is quadratic: √N instead of N. For large databases, this is enormous."}'),
            (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "If a classical search needs 1,000,000 steps, roughly how many steps does Grover is algorithm need?", "options": ["500,000 steps", "1,000 steps (√1,000,000)", "100 steps", "10 steps"], "correctIndex": 1, "explanation": "Grover is algorithm provides a quadratic speedup: √N steps instead of N steps. √1,000,000 = 1,000. While not as dramatic as Shor is exponential speedup, this is still enormously useful for search and optimization problems."}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔐 Shor is Factoring Algorithm", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Shor is algorithm can factor large numbers exponentially faster than any known classical algorithm. Why does this matter? Modern internet encryption (RSA) relies on the fact that factoring large numbers is practically impossible for classical computers.\\n\\nA number with 2,048 digits would take a classical supercomputer millions of years to factor. A sufficiently powerful quantum computer could do it in hours using Shor is algorithm.\\n\\nThis has profound implications for cybersecurity. Post-quantum cryptography — encryption methods safe from quantum attacks — is now an active field of research worldwide."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🧪 Quantum Simulation", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Richard Feynman originally proposed quantum computers in 1982 specifically for this purpose: simulating quantum systems.\\n\\nSimulating how molecules interact quantum mechanically is impossibly hard for classical computers. But a quantum computer can naturally represent quantum states, making it ideal for:\\n\\n• Drug discovery: Simulate how drug molecules interact with proteins\\n• Materials science: Design new superconductors, batteries, and catalysts\\n• Chemistry: Understand complex chemical reactions at the quantum level\\n\\nThis could be quantum computing is first \\"killer app\\" — solving problems that directly improve human life."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Why might quantum simulation be quantum computing is first practical application?", "options": ["It is the easiest algorithm to program", "Quantum computers naturally represent quantum systems, solving problems classical computers fundamentally cannot", "Simulations do not need many qubits", "It was discovered first"], "correctIndex": 1, "explanation": "Quantum simulation is a natural fit because the thing being simulated (quantum molecular behavior) and the tool doing the simulation (a quantum computer) operate by the same physical laws. This makes quantum computers inherently suited for molecular simulation, potentially revolutionizing drug discovery and materials science."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "⚡ Quantum Advantage", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Not every problem is better on a quantum computer. Quantum computers excel when:\\n\\n• The problem has a structure that quantum interference can exploit\\n• The search space is exponentially large\\n• There is a known quantum algorithm for the problem class\\n\\nFor everyday tasks like browsing the web, editing documents, or watching videos, classical computers are and will remain superior. Quantum computing is a specialized tool for specific, extraordinarily hard problems — not a replacement for your laptop."}')
        `, [algoLesson.rows[0].id]);
        
        // Practice for Level 2
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: Quantum Operations', 'exercise', 4)
        `, [level2Id]);
      }
    }
    
    // ==========================================
    // LEVEL 3: The Quantum Future (NEW)
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'The Quantum Future', 3) 
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
        
        // Lesson 1: Quantum Error Correction
        const errorLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Quantum Error Correction', 'lesson', 1) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🛡️ The Biggest Challenge in Quantum Computing", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Qubits are incredibly fragile. The slightest disturbance — a tiny vibration, a stray photon, a minuscule temperature fluctuation — can cause a qubit to lose its quantum state. This phenomenon, called decoherence, is the biggest obstacle to building practical quantum computers."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Current qubits maintain their quantum states for only microseconds to milliseconds. But many useful quantum algorithms need qubits to stay coherent for much longer. The solution? Quantum error correction — using redundant qubits to protect the computation."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔧 The No-Cloning Theorem", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "Here is the catch: quantum mechanics has a fundamental rule called the no-cloning theorem. You CANNOT make a perfect copy of an unknown quantum state. This means classical error correction (which works by copying data) cannot be directly applied to quantum systems.\\n\\nThis seems like an impossible obstacle. But clever physicists found a way around it: instead of copying the quantum state, they spread the information across multiple entangled qubits. If some qubits experience errors, the remaining qubits contain enough information to detect and correct the errors."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Why is classical error correction (making backup copies) impossible in quantum computing?", "options": ["Quantum computers do not have enough memory", "The no-cloning theorem prevents copying unknown quantum states", "Error correction is not needed for quantum computers", "Classical techniques are too slow"], "correctIndex": 1, "explanation": "The no-cloning theorem is a fundamental law of quantum mechanics: it is physically impossible to create an exact copy of an arbitrary unknown quantum state. This forces quantum error correction to use fundamentally different strategies than classical error correction."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "📊 Logical vs. Physical Qubits", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "In quantum error correction, many noisy physical qubits work together to create one reliable logical qubit. Current estimates suggest we might need 1,000 to 10,000 physical qubits for each logical qubit.\\n\\nThis means a quantum computer that needs 100 error-corrected logical qubits might actually need 100,000 to 1,000,000 physical qubits! This is why the race to build quantum computers with millions of qubits is so important."}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Today is quantum computers have between 50-1,000+ physical qubits, but these are noisy — they make errors. This era is called NISQ (Noisy Intermediate-Scale Quantum). The goal is to reach fault-tolerant quantum computing, where error correction enables long, complex computations."}'),
            (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What does NISQ stand for, and what does it describe?", "options": ["Next-Generation Integrated Superconducting Qubits", "Noisy Intermediate-Scale Quantum — the current era of quantum computing with error-prone qubits", "National Institute for Secure Quantum", "Non-Interactive Sequential Qubits"], "correctIndex": 1, "explanation": "NISQ (Noisy Intermediate-Scale Quantum) describes our current era: quantum computers with dozens to thousands of qubits that are too error-prone for long computations. Useful quantum computing will likely require moving beyond the NISQ era through better error correction."}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Despite these challenges, recent breakthroughs have been remarkable. In 2023, Harvard and QuEra demonstrated error-corrected operations on 48 logical qubits. Google, IBM, and Microsoft are all racing toward fault-tolerant quantum computing. The field is advancing faster than many predicted."}')
        `, [errorLesson.rows[0].id]);
        
        // Lesson 2: Quantum Cryptography
        const cryptoLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Quantum Cryptography', 'lesson', 2) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔐 Unbreakable Codes from Quantum Physics", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "While quantum computers threaten to break current encryption, quantum physics also provides the solution: quantum cryptography. Specifically, Quantum Key Distribution (QKD) uses the laws of physics to create communication that is provably secure — not just computationally hard to break, but physically impossible."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The key insight: in quantum mechanics, measuring a system disturbs it. If someone tries to eavesdrop on a quantum-encrypted message, the act of observation changes the quantum states, alerting the communicating parties."}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "📡 BB84 Protocol", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "The first and most famous QKD protocol, BB84 (invented by Bennett and Brassard in 1984), works like this:\\n\\n1. Alice sends Bob photons, each encoded in one of two random bases\\n2. Bob measures each photon in a randomly chosen basis\\n3. They publicly compare which bases they used (but not the results!)\\n4. When they used the same basis, their measurements match — these become the secret key\\n5. If an eavesdropper intercepted photons, the error rate spikes, revealing the intrusion\\n\\nThe beauty is that any eavesdropping attempt is detectable because measuring quantum states inevitably disturbs them."}'),
            (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Why does eavesdropping on quantum communication automatically reveal the spy?", "options": ["Quantum signals are very fast", "Measuring quantum states disturbs them, causing detectable errors", "Quantum encryption uses passwords", "The eavesdropper must identify themselves"], "correctIndex": 1, "explanation": "This is the fundamental advantage of quantum cryptography: the act of measurement in quantum mechanics inevitably disturbs the quantum state. An eavesdropper cannot observe the photons without introducing detectable errors in the communication, alerting both parties."}'),
            (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌐 Post-Quantum Cryptography", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "While QKD offers physics-guaranteed security, it requires special hardware. A more practical near-term solution is post-quantum cryptography: classical encryption algorithms that are believed to be secure even against quantum attacks.\\n\\nIn 2022, NIST selected new standard algorithms based on mathematical problems that quantum computers cannot efficiently solve — like lattice-based cryptography (problems involving high-dimensional geometric structures).\\n\\nOrganizations worldwide are already transitioning to these new standards because encrypted data stolen today could be decrypted by future quantum computers — a threat called \\"harvest now, decrypt later.\\""}'),
            (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "What is the \\"harvest now, decrypt later\\" threat?", "options": ["A farming term used in computing", "Adversaries collect encrypted data today, planning to decrypt it with future quantum computers", "A quantum algorithm for data collection", "A method of quantum key distribution"], "correctIndex": 1, "explanation": "The harvest now, decrypt later threat is very real: adversaries can intercept and store encrypted data today, then decrypt it years later when powerful quantum computers become available. This is why the transition to post-quantum cryptography is urgent, even before large-scale quantum computers exist."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🛰️ Quantum Internet", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Scientists are working toward a quantum internet that would connect quantum computers using entangled photons. This would enable:\\n\\n• Perfectly secure global communication\\n• Distributed quantum computing (linking many quantum processors)\\n• Ultra-precise global clock synchronization (important for GPS and finance)\\n• Quantum sensor networks for detecting gravitational waves\\n\\nChina has already launched a quantum satellite (Micius) that demonstrated QKD between ground stations 1,200 km apart. The quantum internet is not science fiction — the first pieces are being built today."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "What would a quantum internet enable that the classical internet cannot?", "options": ["Faster download speeds", "Physics-guaranteed secure communication and distributed quantum computing", "Free internet access for everyone", "Instant data transfer faster than light"], "correctIndex": 1, "explanation": "A quantum internet would enable communication provably secured by the laws of physics (not just computational difficulty), distributed quantum computing where multiple quantum processors work together, and quantum-enhanced sensing. It would complement, not replace, the classical internet."}')
        `, [cryptoLesson.rows[0].id]);
        
        // Lesson 3: The Future of Quantum
        const futureLesson = await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'The Future of Quantum Computing', 'lesson', 3) RETURNING id
        `, [level3Id]);
        
        await client.query(`
          INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
            (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔮 Where Are We Headed?", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Quantum computing is at an inflection point. We have moved from theoretical curiosity to real machines that can perform computations impossible for classical computers. But the most exciting applications are still ahead of us. Let us explore what the quantum future might hold."}'),
            (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "💊 Revolutionizing Medicine", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Drug discovery currently takes 10-15 years and billions of dollars because we cannot accurately simulate molecular interactions. Quantum computers could simulate how drug candidates interact with target proteins at the quantum level, dramatically accelerating the process.\\n\\nImagine designing a custom medication by simulating exactly how it interacts with your specific genetic markers. Quantum-powered personalized medicine could transform healthcare within our lifetimes."}'),
            (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🌱 Solving Climate Change", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Quantum computers could help address climate change by:\\n\\n• Designing better catalysts for carbon capture\\n• Optimizing renewable energy grids for maximum efficiency\\n• Simulating new materials for better batteries and solar cells\\n• Modeling climate systems with unprecedented accuracy\\n• Discovering efficient processes for producing clean hydrogen fuel\\n\\nThe nitrogen fixation process (Haber-Bosch) consumes 1-2% of global energy. Quantum simulation might help discover a catalyst that works at room temperature, saving enormous amounts of energy."}'),
            (gen_random_uuid(), $1, 7, 'question', '{"type": "question", "question": "How could quantum computing help address climate change?", "options": ["By replacing fossil fuel power plants", "By simulating molecular interactions to design better catalysts, batteries, and materials", "By predicting the weather more accurately", "It cannot help with climate change"], "correctIndex": 1, "explanation": "Quantum computing is molecular simulation capabilities could lead to breakthroughs in catalysis, energy storage, and materials science — all critical for developing clean energy technologies. Understanding chemical reactions at the quantum level could unlock currently impossible efficiencies."}'),
            (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🤖 Quantum Machine Learning", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "The intersection of quantum computing and artificial intelligence is called quantum machine learning. Quantum computers might accelerate AI by:\\n\\n• Processing high-dimensional data more efficiently\\n• Finding optimal solutions in complex optimization landscapes\\n• Speeding up training of neural networks\\n• Enabling new kinds of quantum neural networks\\n\\nWhile this field is still in its early stages, the potential is enormous. If quantum computers can even modestly speed up AI training, the impact on technology development would be profound."}'),
            (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🏁 The Quantum Race", "formatting": {"bold": true}}'),
            (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Major players in the quantum race:\\n\\n• IBM: Targeting 100,000+ qubit systems by 2033\\n• Google: Achieved \\"quantum supremacy\\" in 2019; pursuing error correction\\n• Microsoft: Betting on topological qubits for inherent error resistance\\n• Amazon: Providing quantum cloud access via AWS Braket\\n• China: Massive government investment, leading in quantum communication\\n• Startups: IonQ, Rigetti, QuEra, PsiQuantum, and dozens more\\n\\nBillions of dollars are flowing into quantum computing. The question is not if quantum computers will transform technology — it is when."}'),
            (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "What is the most realistic near-term application of quantum computing?", "options": ["Replacing all classical computers", "Molecular simulation for drug discovery and materials science", "Running video games faster", "Instant communication across the universe"], "correctIndex": 1, "explanation": "Molecular simulation is widely considered the most promising near-term application because it is naturally suited to quantum hardware and addresses real-world problems (drug discovery, clean energy). Full-scale quantum computers for cryptography or optimization may take longer to achieve."}'),
            (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "You are learning about quantum computing at the perfect time. The field is young enough that the pioneers are still working, yet mature enough that real hardware exists. Whether you become a quantum programmer, a quantum-aware policymaker, or simply an informed citizen, understanding these ideas will matter increasingly in the decades ahead."}')
        `, [futureLesson.rows[0].id]);
        
        // Practice for Level 3
        await client.query(`
          INSERT INTO lessons (id, level_id, title, type, order_index)
          VALUES (gen_random_uuid(), $1, 'Practice: The Quantum Frontier', 'exercise', 4)
        `, [level3Id]);
      }
    }
    
    // Update course counts
    await client.query(`UPDATE courses SET lesson_count = 12, exercise_count = 24 WHERE id = $1`, [courseId]);
    
    console.log('✅ Quantum Computing course expanded!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (existing)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (NEW - Quantum Operations)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (NEW - The Quantum Future)');
    
  } catch (error) {
    console.error('❌ Failed to expand Quantum course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedExpandQuantum().catch(console.error);
