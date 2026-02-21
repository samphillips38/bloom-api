import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedScienceCourse() {
  const client = await pool.connect();
  
  try {
    console.log('🔬 Adding The Living Cell course...');
    
    // Get science category
    const sciCat = await client.query(`SELECT id FROM categories WHERE slug = 'science'`);
    const sciCatId = sciCat.rows[0]?.id;
    if (!sciCatId) throw new Error('Science category not found');
    
    // Check if course already exists
    const existing = await client.query(`SELECT id FROM courses WHERE title = 'The Living Cell'`);
    if (existing.rows[0]?.id) {
      console.log('Course already exists, skipping...');
      return;
    }
    
    // Create the course
    const courseResult = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'The Living Cell', 'Explore the microscopic world that makes life possible. From DNA to proteins, from membranes to mitochondria — discover the astonishing machinery inside every living cell.', '#4CAF50', 12, 24, true, 1)
      RETURNING id
    `, [sciCatId]);
    const courseId = courseResult.rows[0].id;
    
    // ==========================================
    // LEVEL 1: Cell Basics
    // ==========================================
    
    const level1Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'The Cell: Life''s Building Block', 1) RETURNING id
    `, [courseId]);
    const level1Id = level1Result.rows[0].id;
    
    // Lesson 1: Introduction to Cells
    const introLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Welcome to the Cellular World', 'lesson', 1) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔬 The Smallest Unit of Life", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Every living thing — from the bacteria in your gut to the blue whale in the ocean — is made of cells. You yourself are a walking colony of about 37 TRILLION cells, each one a miniature factory more complex than any machine ever built by humans."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The cell is the fundamental unit of life. Nothing smaller than a cell is considered alive. Atoms are not alive. Molecules are not alive. But arrange the right molecules in the right way inside a membrane, and something remarkable happens: life emerges."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "📏 How Small is a Cell?", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "A typical human cell is about 10 micrometers (μm) across — about 10 times smaller than the width of a human hair. You could fit about 10,000 cells on the head of a pin.\\n\\nBut do not let their size fool you. Inside each cell is a world of staggering complexity: billions of molecules working together, molecular machines that read DNA, power plants that generate energy, and communication networks that coordinate it all."}'),
        (gen_random_uuid(), $1, 6, 'image', '{"type": "image", "url": "/images/cell-overview.png", "caption": "A typical animal cell with its major organelles — each one performs a specialized function"}'),
        (gen_random_uuid(), $1, 7, 'question', '{"type": "question", "question": "Why is the cell considered the fundamental unit of life?", "options": ["Because cells are the smallest things that exist", "Because nothing smaller than a cell exhibits all the properties of life", "Because Robert Hooke said so", "Because cells cannot be divided further"], "correctIndex": 1, "explanation": "The cell is the smallest entity that displays all the characteristics of life: metabolism, reproduction, response to stimuli, and homeostasis. Individual molecules and organelles cannot sustain life on their own — only the organized system of a complete cell can."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🏛️ Two Great Kingdoms of Cells", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "All cells fall into two categories:\\n\\nProkaryotic cells (bacteria and archaea): Small, simple, no nucleus. Their DNA floats freely in the cytoplasm. These were the first life forms on Earth, appearing about 3.8 billion years ago.\\n\\nEukaryotic cells (plants, animals, fungi, protists): Larger, more complex, with a nucleus that houses the DNA. They contain specialized compartments called organelles. Eukaryotic cells evolved about 2 billion years ago — probably when one prokaryote engulfed another in a partnership that changed evolution forever."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What is the key structural difference between prokaryotic and eukaryotic cells?", "options": ["Prokaryotes are bigger", "Eukaryotes have a membrane-bound nucleus; prokaryotes do not", "Prokaryotes have organelles; eukaryotes do not", "There is no structural difference"], "correctIndex": 1, "explanation": "The defining feature of eukaryotic cells is the nucleus — a membrane-bound compartment containing the cell is DNA. Prokaryotes lack this nucleus; their DNA exists in the cytoplasm. Eukaryotic cells also have other membrane-bound organelles (mitochondria, ER, etc.) that prokaryotes lack."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "In the lessons ahead, we will explore the incredible machinery inside eukaryotic cells — the membranes, the powerhouses, the protein factories, and the genetic blueprints that make complex life possible."}')
    `, [introLesson.rows[0].id]);
    
    // Lesson 2: Cell Membrane
    const membraneLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'The Cell Membrane', 'lesson', 2) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🛡️ The Gatekeeper of Life", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "The cell membrane is a remarkably thin barrier — only about 7-8 nanometers thick (that is 10,000 times thinner than a sheet of paper). Yet this ultra-thin film is the boundary between life and non-life. It decides what enters the cell, what leaves, and how the cell communicates with the outside world."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🧈 The Phospholipid Bilayer", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "The membrane is made primarily of phospholipids — molecules with a water-loving (hydrophilic) head and two water-fearing (hydrophobic) tails. In water, they spontaneously arrange into a double layer:\\n\\n• Hydrophilic heads face outward (toward water on both sides)\\n• Hydrophobic tails face inward (hiding from water)\\n\\nThis bilayer forms automatically — no instructions needed. It is one of the most elegant examples of self-assembly in nature. Life literally organizes itself."}'),
        (gen_random_uuid(), $1, 5, 'image', '{"type": "image", "url": "/images/phospholipid-bilayer.png", "caption": "The phospholipid bilayer with proteins embedded — the foundation of all cell membranes"}'),
        (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Why do phospholipids form a bilayer in water?", "options": ["They are forced together by enzymes", "Their hydrophobic tails naturally hide from water while hydrophilic heads face the water", "They are attracted by electrical charges", "It is a random arrangement"], "correctIndex": 1, "explanation": "Phospholipids have dual nature: hydrophilic heads that love water and hydrophobic tails that avoid it. In water, they spontaneously organize into a bilayer where tails face inward (away from water) and heads face outward (toward water). This self-assembly is driven by physics, not biological instructions."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🚪 Membrane Proteins: The Cell is Doors and Windows", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Embedded in the lipid bilayer are thousands of proteins that serve as the membrane is functional machinery:\\n\\n• Channel proteins: Form tiny tunnels that allow specific ions or molecules to pass through\\n• Transport proteins: Actively pump molecules across the membrane, even against concentration gradients\\n• Receptor proteins: Detect signals from outside the cell (hormones, neurotransmitters)\\n• Enzymes: Catalyze chemical reactions right at the membrane surface\\n\\nWithout these proteins, the membrane would be an impenetrable wall. With them, it becomes a sophisticated control center."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🌊 The Fluid Mosaic Model", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "The membrane is not rigid — it is a fluid, dynamic structure. Lipids and proteins constantly drift and move within the plane of the membrane, like icebergs floating in a sea of lipids. This fluidity is essential for cell function: it allows the membrane to flex, self-repair, and reorganize its proteins as needed.\\n\\nCholesterol molecules embedded in the membrane act as fluidity regulators — keeping the membrane from becoming too rigid in cold temperatures or too fluid in warm temperatures. It is like the cell is thermostat."}'),
        (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "What role do channel proteins play in the cell membrane?", "options": ["They provide structural support", "They form specific tunnels allowing certain molecules to cross the membrane", "They store energy", "They produce proteins"], "correctIndex": 1, "explanation": "Channel proteins create selective passageways through the membrane. Each channel is shaped to allow only specific ions or molecules through (like sodium, potassium, or water), giving the cell precise control over what enters and exits."}'),
        (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "The cell membrane is a masterpiece of molecular engineering. It maintains the delicate internal environment that life requires while still allowing the cell to interact with its surroundings. Every drug, every signal, every nutrient must negotiate this remarkable barrier."}')
    `, [membraneLesson.rows[0].id]);
    
    // Lesson 3: Organelles
    const organellesLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Organelles: The Cell''s Machinery', 'lesson', 3) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⚙️ A City Inside Every Cell", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A eukaryotic cell is like a tiny city. Each organelle is a specialized department performing essential functions. Just as a city needs a government, power plants, factories, transportation, and waste management, a cell needs analogous systems to survive."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🏛️ The Nucleus: Command Center", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "The nucleus is the cell is headquarters, housing nearly all of its DNA. A double membrane (nuclear envelope) protects this genetic library, with nuclear pores acting as guarded checkpoints that control what enters and exits.\\n\\nInside the nucleus, DNA is organized into chromosomes. When the cell needs to produce a protein, it copies the relevant gene into a message (mRNA), which exits through the pores to be read by ribosomes outside."}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "⚡ Mitochondria: The Powerhouses", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Mitochondria are the cell is power plants. They convert the chemical energy from food (glucose) into ATP — the universal energy currency that powers virtually every cellular process.\\n\\nA single cell can contain hundreds to thousands of mitochondria, depending on its energy needs. Muscle cells and brain cells, which are energy-hungry, are packed with them.\\n\\nFascinating fact: mitochondria have their own DNA, inherited only from your mother. This supports the endosymbiotic theory — that mitochondria were once free-living bacteria that were engulfed by an ancestral cell about 2 billion years ago."}'),
        (gen_random_uuid(), $1, 7, 'question', '{"type": "question", "question": "What is the primary function of mitochondria?", "options": ["Storing DNA", "Producing ATP (cellular energy) from glucose", "Making proteins", "Digesting waste"], "correctIndex": 1, "explanation": "Mitochondria are the cell is energy generators. Through cellular respiration, they break down glucose and produce ATP — the molecule that provides energy for nearly every cellular process, from muscle contraction to protein synthesis."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🏭 The Endoplasmic Reticulum and Golgi Apparatus", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "The Rough Endoplasmic Reticulum (rough ER) is studded with ribosomes and manufactures proteins — especially those destined for export or the cell membrane. Think of it as the factory floor.\\n\\nThe Smooth ER lacks ribosomes and specializes in lipid synthesis, detoxification, and calcium storage.\\n\\nThe Golgi Apparatus is the cell is post office. It receives proteins from the ER, modifies and packages them, then ships them to their correct destinations — whether inside the cell, in the membrane, or outside the cell entirely."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🗑️ Lysosomes: The Recycling Center", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Lysosomes are membrane-bound sacs filled with powerful digestive enzymes. They break down worn-out organelles, food particles, and invading bacteria. They are the cell is recycling and defense system.\\n\\nLysosomes maintain a highly acidic interior (pH ~5) — necessary for their enzymes to work. If a lysosome ruptures, these enzymes can damage the cell. This controlled demolition system is crucial for keeping cells clean and functional."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Which organelle modifies, packages, and ships proteins to their destinations?", "options": ["Nucleus", "Mitochondria", "Golgi Apparatus", "Lysosome"], "correctIndex": 2, "explanation": "The Golgi Apparatus is the cell is processing and distribution center. It receives proteins from the ER, adds chemical tags and modifications, sorts them into vesicles, and ships them to their correct destinations — inside the cell, to the membrane, or outside the cell."}'),
        (gen_random_uuid(), $1, 13, 'text', '{"type": "text", "text": "Every organelle is essential. Remove the mitochondria and the cell starves. Remove the nucleus and it cannot make new proteins. Remove the lysosomes and cellular waste accumulates. The cell is an integrated system where every part depends on every other part."}')
    `, [organellesLesson.rows[0].id]);
    
    // Practice for Level 1
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Cell Structure', 'exercise', 4)
    `, [level1Id]);
    
    // ==========================================
    // LEVEL 2: DNA & Proteins
    // ==========================================
    
    const level2Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'DNA & The Code of Life', 2) RETURNING id
    `, [courseId]);
    const level2Id = level2Result.rows[0].id;
    
    // Lesson 1: DNA Structure
    const dnaLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'The Double Helix', 'lesson', 1) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🧬 The Molecule of Life", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "DNA (deoxyribonucleic acid) is the instruction manual for building and running every living organism. Your DNA contains about 3 billion base pairs encoding roughly 20,000 genes. If you unwound all the DNA from a single cell, it would stretch about 2 meters long — yet it is coiled so tightly that it fits inside a nucleus just 6 micrometers wide."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "DNA has a beautiful double helix structure — two strands wound around each other like a twisted ladder. The rungs of this ladder are made of base pairs: Adenine (A) pairs with Thymine (T), and Guanine (G) pairs with Cytosine (C). Always. No exceptions.\\n\\nA—T and G—C: These specific pairings are the key to DNA replication, repair, and reading."}'),
        (gen_random_uuid(), $1, 4, 'image', '{"type": "image", "url": "/images/dna-helix.png", "caption": "The DNA double helix with its four bases: A pairs with T, G pairs with C"}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "In DNA, adenine (A) always pairs with:", "options": ["Cytosine (C)", "Guanine (G)", "Thymine (T)", "Uracil (U)"], "correctIndex": 2, "explanation": "DNA base pairing follows strict rules: Adenine always pairs with Thymine (A-T), and Guanine always pairs with Cytosine (G-C). These complementary pairs are held together by hydrogen bonds and are essential for accurate DNA replication and protein synthesis."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "📖 The Genetic Code", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "DNA uses a four-letter alphabet (A, T, G, C) to write instructions in three-letter words called codons. Each codon specifies one amino acid — the building blocks of proteins.\\n\\nWith 4 letters in groups of 3, there are 4³ = 64 possible codons, coding for just 20 amino acids plus stop signals. This means the code has redundancy — multiple codons can specify the same amino acid, providing a buffer against mutations.\\n\\nThis code is nearly universal across all life on Earth — from bacteria to humans — strong evidence that all life shares a common ancestor."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🔄 DNA Replication", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Before a cell divides, it must copy its entire DNA. The double helix unzips, and each strand serves as a template for building a new complementary strand. Since A always pairs with T and G with C, each strand contains all the information needed to reconstruct the other.\\n\\nThis process is remarkably accurate — only about 1 error per billion bases copied. Special proofreading enzymes check the work and correct mistakes in real time. Without this accuracy, life as we know it could not exist."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Why is DNA replication called \\"semi-conservative\\"?", "options": ["It conserves energy", "Each new DNA molecule contains one original strand and one newly built strand", "Only half the DNA is copied", "It happens slowly to conserve resources"], "correctIndex": 1, "explanation": "In semi-conservative replication, the double helix unzips and each original strand serves as a template for a new strand. The result: two DNA molecules, each containing one old strand and one new strand — half of the original is conserved in each copy."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The discovery of DNA structure by Watson, Crick, Franklin, and Wilkins in 1953 is one of the most important scientific breakthroughs in history. It opened the door to modern genetics, biotechnology, forensic science, and our understanding of what makes each of us unique."}')
    `, [dnaLesson.rows[0].id]);
    
    // Lesson 2: From DNA to Protein
    const proteinLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'From Gene to Protein', 'lesson', 2) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🏗️ Building the Molecular Machines", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "DNA is the blueprint, but proteins are the workers. They do almost everything in a cell: catalyze reactions (enzymes), provide structure (collagen), transport molecules (hemoglobin), fight infections (antibodies), and transmit signals (hormones like insulin).\\n\\nThe process of turning DNA instructions into functional proteins involves two major steps: transcription and translation."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "📝 Step 1: Transcription (DNA → mRNA)", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "In the nucleus, an enzyme called RNA polymerase reads a gene on the DNA and builds a complementary messenger RNA (mRNA) copy. Think of it as photocopying a page from a library book — the original (DNA) stays safe in the library (nucleus), while the copy (mRNA) goes out to be used.\\n\\nmRNA uses the same bases as DNA except Uracil (U) replaces Thymine (T). So A pairs with U in RNA.\\n\\nThe mRNA then exits the nucleus through nuclear pores and heads to the ribosomes."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What is the purpose of transcription?", "options": ["To copy the entire genome", "To create an mRNA copy of a gene that can leave the nucleus", "To replicate DNA before cell division", "To repair damaged DNA"], "correctIndex": 1, "explanation": "Transcription creates a mobile messenger RNA copy of a gene. Since DNA is too precious to leave the nucleus, the mRNA serves as a portable copy of the instructions that ribosomes can read to build proteins."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔨 Step 2: Translation (mRNA → Protein)", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Ribosomes are the cell is protein-building machines. They read the mRNA three letters (one codon) at a time. For each codon, a transfer RNA (tRNA) brings the matching amino acid.\\n\\nThe ribosome links amino acids together like beads on a string, building the protein chain one amino acid at a time. A typical protein might be 300-500 amino acids long.\\n\\nThis process is fast — ribosomes can add about 20 amino acids per second. And multiple ribosomes can read the same mRNA simultaneously, like multiple readers on one scroll."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🎭 Protein Folding: Shape Determines Function", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Once built, the amino acid chain folds into a specific 3D shape — and this shape determines everything about what the protein does. A hemoglobin molecule is shaped perfectly to grab oxygen. An antibody is shaped to lock onto a specific pathogen. An enzyme is shaped to catalyze a specific reaction.\\n\\nMisfolded proteins can cause devastating diseases: Alzheimer is, Parkinson is, and mad cow disease all involve proteins that fold incorrectly and clump together."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Why is protein folding so important?", "options": ["Folding makes proteins smaller", "A protein is 3D shape determines its function — incorrect folding can cause disease", "Folding is just for storage", "It is not important"], "correctIndex": 1, "explanation": "A protein is 3D shape is what allows it to perform its specific function. The shape determines which molecules it can interact with, which reactions it can catalyze, and where in the cell it works. Misfolding can render proteins nonfunctional or toxic."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "This flow of information — DNA → RNA → Protein — is called the Central Dogma of molecular biology. It is the fundamental process by which genetic information becomes biological function. Understanding it is key to understanding medicine, genetics, and biotechnology."}')
    `, [proteinLesson.rows[0].id]);
    
    // Lesson 3: Cell Division
    const divisionLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Cell Division & Reproduction', 'lesson', 3) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🔄 How Life Multiplies", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "You started as a single cell. Through cell division, that one cell became two, then four, then eight... continuing until you became the 37 trillion cells you are today. Cell division is how organisms grow, heal wounds, and replace worn-out cells. Your body produces about 3.8 million new cells every second."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🧬 Mitosis: Growing and Repairing", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Mitosis produces two identical daughter cells from one parent cell. It is used for growth and repair.\\n\\n1. Prophase: Chromosomes condense and become visible. The nuclear envelope begins to dissolve.\\n2. Metaphase: Chromosomes line up along the cell is equator.\\n3. Anaphase: Sister chromatids are pulled apart to opposite poles.\\n4. Telophase: Nuclear envelopes reform around each set of chromosomes.\\n5. Cytokinesis: The cell physically divides in two.\\n\\nThe result: two cells with identical DNA — perfect copies of the original."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What is the purpose of mitosis?", "options": ["To produce sex cells", "To produce two genetically identical cells for growth and repair", "To reduce chromosome number", "To create genetic diversity"], "correctIndex": 1, "explanation": "Mitosis creates two genetically identical daughter cells. This is essential for growth (adding new cells), repair (replacing damaged cells), and maintenance (replacing old cells). Every non-reproductive cell division in your body uses mitosis."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🎲 Meiosis: Mixing the Genetic Deck", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Meiosis is specialized cell division that produces sex cells (gametes) — sperm and eggs. Unlike mitosis, meiosis:\\n\\n• Divides TWICE, producing four cells instead of two\\n• Halves the chromosome number (from 46 to 23 in humans)\\n• Introduces genetic variation through crossing over and random assortment\\n\\nWhen a sperm (23 chromosomes) fertilizes an egg (23 chromosomes), the resulting zygote has the full 46 chromosomes — half from each parent."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🎨 The Source of Your Uniqueness", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "During meiosis, crossing over shuffles genes between chromosomes like shuffling a deck of cards. Combined with the random assortment of chromosomes, this means each gamete is genetically unique.\\n\\nThe number of possible chromosome combinations from one person is 2²³ = about 8.4 million. When you combine two parents, the possibilities become 8.4 million × 8.4 million = over 70 trillion unique combinations. Add crossing over, and the number is essentially infinite.\\n\\nThis is why you are genetically unique — a combination that has never existed before and will never exist again."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "How does meiosis create genetic diversity?", "options": ["By making perfect copies of DNA", "Through crossing over and random chromosome assortment, which shuffle genetic material", "By adding mutations deliberately", "By combining DNA from three parents"], "correctIndex": 1, "explanation": "Meiosis generates diversity through two mechanisms: crossing over (exchanging segments between chromosomes) and random assortment (each gamete gets a random mix of maternal and paternal chromosomes). Together, these ensure every gamete is genetically unique."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "⚠️ When Division Goes Wrong", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Cell division is tightly controlled by checkpoints that verify everything is correct before proceeding. When these controls fail, cells can divide uncontrollably — this is cancer.\\n\\nCancer is essentially a disease of cell division gone wrong. Mutations in genes that control the cell cycle (oncogenes and tumor suppressors) remove the brakes, allowing runaway division. Understanding cell division at the molecular level is key to developing cancer treatments."}')
    `, [divisionLesson.rows[0].id]);
    
    // Practice for Level 2
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: DNA & Proteins', 'exercise', 4)
    `, [level2Id]);
    
    // ==========================================
    // LEVEL 3: Cell Energy & Communication
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Energy & Communication', 3) RETURNING id
    `, [courseId]);
    const level3Id = level3Result.rows[0].id;
    
    // Lesson 1: Cellular Respiration
    const respLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Cellular Respiration', 'lesson', 1) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⚡ Powering Life", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Every second, your cells are burning glucose to produce ATP — the molecule that powers nearly everything your body does. This process, cellular respiration, is happening in the mitochondria of all your 37 trillion cells right now."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The overall equation is elegant:\\n\\nC₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36 ATP\\n(glucose + oxygen → carbon dioxide + water + energy)\\n\\nThis is essentially the reverse of photosynthesis! Plants capture sunlight to build glucose; your cells break glucose down to release that stored solar energy. The energy cycle of life."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔥 The Three Stages", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "1. Glycolysis (cytoplasm): Glucose is split into two pyruvate molecules. Net gain: 2 ATP. This ancient process does not require oxygen — it evolved before Earth had an oxygen atmosphere.\\n\\n2. Krebs Cycle (mitochondrial matrix): Pyruvate is further broken down, releasing CO₂ and capturing energy in electron carriers (NADH, FADH₂). Net gain: 2 ATP.\\n\\n3. Electron Transport Chain (inner mitochondrial membrane): The big payoff! Electron carriers donate electrons through a chain of proteins, driving proton pumps that power ATP synthase. Net gain: ~32 ATP."}'),
        (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Which stage of cellular respiration produces the most ATP?", "options": ["Glycolysis", "Krebs Cycle", "Electron Transport Chain", "All produce equal amounts"], "correctIndex": 2, "explanation": "The Electron Transport Chain produces about 32 of the ~36 total ATP molecules — the vast majority. Glycolysis and the Krebs Cycle produce only 2 ATP each directly. The ETC is why oxygen is so essential — it is the final electron acceptor that keeps the chain running."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌀 ATP Synthase: Nature is Smallest Motor", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "ATP synthase is an actual rotating molecular motor — one of the most remarkable machines in biology. Protons flow through it like water through a turbine, causing it to physically spin and catalyze the attachment of a phosphate group to ADP, creating ATP.\\n\\nThis tiny motor spins at about 9,000 RPM and produces roughly 100-200 ATP molecules per second. Your body produces (and uses) about 40 kg of ATP per day — roughly your own body weight!"}'),
        (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "Why is oxygen essential for cellular respiration?", "options": ["It helps glucose dissolve", "It is the final electron acceptor in the electron transport chain, without which the chain stops", "It is needed for glycolysis", "Oxygen is not actually essential"], "correctIndex": 1, "explanation": "Oxygen serves as the final electron acceptor at the end of the electron transport chain. Without oxygen, electrons have nowhere to go, the chain stalls, proton pumping stops, and ATP synthesis via oxidative phosphorylation halts. This is why you cannot survive without breathing."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "This is why you breathe: to deliver oxygen to your mitochondria for the electron transport chain, and to remove the carbon dioxide waste produced by the Krebs cycle. Every breath you take is powering trillions of tiny molecular motors inside your cells."}')
    `, [respLesson.rows[0].id]);
    
    // Lesson 2: Cell Signaling
    const signalLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'How Cells Communicate', 'lesson', 2) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📡 The Cell is Communication Network", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Your 37 trillion cells do not work in isolation — they are in constant communication. Cells send and receive chemical signals to coordinate everything from growth to immunity to emotions. Without cell signaling, your body would be chaos — billions of cells doing their own thing."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🔑 The Lock-and-Key Model", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Cell signaling works like a lock and key:\\n\\n1. Signal molecule (ligand): The key. Hormones, neurotransmitters, or growth factors.\\n2. Receptor protein: The lock. Sits on the cell surface, shaped to bind a specific signal.\\n3. When the key fits the lock, it triggers a cascade of events inside the cell.\\n\\nThis specificity is crucial — adrenaline affects heart cells because they have adrenaline receptors. Cells without the right receptor ignore the signal. It is targeted communication in a crowded cellular city."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Why does adrenaline affect heart cells but not all cells equally?", "options": ["Adrenaline only reaches the heart", "Heart cells have specific adrenaline receptors; cells without these receptors are unaffected", "All cells respond the same way", "The heart is closer to the adrenal glands"], "correctIndex": 1, "explanation": "Cell signaling is specific: a signal molecule only affects cells that have the matching receptor protein. Heart cells express adrenaline (epinephrine) receptors, so they respond strongly. Cells lacking these receptors are unaffected by the signal."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "📣 Types of Signaling", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "• Endocrine signaling: Long-distance via hormones in the bloodstream. Like sending a letter through the postal system. (Insulin from pancreas to body cells)\\n\\n• Paracrine signaling: Short-distance to nearby cells. Like talking to your neighbor. (Inflammation signals at a wound site)\\n\\n• Autocrine signaling: A cell signals itself. Like leaving yourself a note. (Immune cells boosting their own activity)\\n\\n• Synaptic signaling: Neurotransmitters cross a tiny gap between nerve cells. Like a text message — fast and targeted."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "⚡ Signal Amplification", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "One of the most remarkable features of cell signaling is amplification. A single signal molecule binding to a receptor can trigger a cascade that activates thousands of molecules inside the cell.\\n\\nExample: When one adrenaline molecule binds to a receptor on a liver cell, it activates a cascade that ultimately releases about 100 million molecules of glucose into the bloodstream. One molecule in, 100 million molecules out. This amplification is how a tiny amount of hormone can produce a massive physiological response."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "Why is signal amplification important in cell signaling?", "options": ["It makes signals louder", "A tiny amount of signal molecule can produce a massive cellular response through cascading activation", "It prevents signals from being lost", "It speeds up the signal"], "correctIndex": 1, "explanation": "Signal amplification means each step in the signaling cascade activates multiple molecules in the next step, creating an exponential increase in response. This allows the body to mount large physiological responses from very small amounts of signaling molecules."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Understanding cell signaling is critical for medicine. Most drugs work by either mimicking signals (agonists), blocking signals (antagonists), or modifying the signaling cascade. When you take an antihistamine for allergies, you are blocking histamine signaling. When you drink coffee, caffeine blocks adenosine receptors that make you feel sleepy."}')
    `, [signalLesson.rows[0].id]);
    
    // Lesson 3: Immune System at the Cellular Level
    const immuneLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'The Immune System: Cellular Defenders', 'lesson', 3) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🛡️ Your Body is Army", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Right now, your immune system is fighting off attacks you will never know about. Bacteria, viruses, fungi, and parasites constantly try to invade your body. Your immune system is a sophisticated defense network of specialized cells and molecules that identifies, targets, and destroys these threats."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🏰 Innate Immunity: The First Line", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Your innate immune system provides immediate, non-specific defense:\\n\\n• Physical barriers: Skin, mucous membranes, stomach acid\\n• Phagocytes: White blood cells that literally EAT invaders (macrophages and neutrophils)\\n• Inflammation: Increases blood flow to damaged areas, bringing more immune cells\\n• Natural Killer cells: Destroy virus-infected cells and cancer cells on sight\\n\\nThis system responds within minutes but treats all threats the same — it does not remember past infections."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What is a macrophage?", "options": ["A type of virus", "A white blood cell that engulfs and digests foreign particles and pathogens", "A type of antibody", "A signaling molecule"], "correctIndex": 1, "explanation": "Macrophages (literally \\"big eaters\\") are white blood cells that patrol the body, engulfing bacteria, dead cells, and debris. They are part of the innate immune system and also play a key role in activating the adaptive immune response by presenting pathogen fragments to T cells."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🎯 Adaptive Immunity: The Smart Response", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "The adaptive immune system is what makes you immune to diseases you have already fought:\\n\\n• B cells produce antibodies — Y-shaped proteins that mark specific pathogens for destruction. Each B cell produces antibodies for exactly ONE type of pathogen.\\n\\n• T cells come in two main types: Helper T cells coordinate the immune response, and Killer T cells directly destroy infected cells.\\n\\n• Memory cells: After an infection, some B and T cells become memory cells that persist for years or decades. If the same pathogen returns, the response is swift and overwhelming. This is why you rarely get chickenpox twice."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "💉 Vaccines: Training Without the Battle", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Vaccines work by showing the immune system a harmless version of a pathogen (weakened, killed, or just a fragment). The immune system mounts a response and creates memory cells — all without you actually getting sick.\\n\\nWhen the real pathogen arrives, the memory cells recognize it immediately and launch a rapid, powerful response before the disease can take hold. It is like a fire drill — practice for the real emergency."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "How do vaccines provide immunity without causing disease?", "options": ["They kill all pathogens in the body", "They expose the immune system to harmless pathogen components, triggering memory cell creation", "They strengthen physical barriers like skin", "They increase body temperature to kill viruses"], "correctIndex": 1, "explanation": "Vaccines present harmless pathogen components to the immune system, triggering an immune response that produces memory cells. These memory cells persist and enable a rapid, powerful response if the real pathogen is encountered — providing immunity without the dangers of the actual disease."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The immune system is a masterpiece of biological engineering — it must distinguish millions of foreign substances from your own cells, respond proportionally (not too little, not too much), and remember past encounters. When it works well, you barely notice it. When it malfunctions, the consequences — autoimmune diseases, allergies, immunodeficiency — can be devastating."}')
    `, [immuneLesson.rows[0].id]);
    
    // Practice for Level 3
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Energy & Communication', 'exercise', 4)
    `, [level3Id]);
    
    console.log('✅ The Living Cell course created!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (Cell Basics)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (DNA & Proteins)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (Energy & Communication)');
    
  } catch (error) {
    console.error('❌ Failed to create Science course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedScienceCourse().catch(console.error);
