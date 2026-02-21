import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function seedCSCourse() {
  const client = await pool.connect();
  
  try {
    console.log('💻 Adding Algorithms & Data Structures course...');
    
    // Get CS category
    const csCat = await client.query(`SELECT id FROM categories WHERE slug = 'cs'`);
    const csCatId = csCat.rows[0]?.id;
    if (!csCatId) throw new Error('CS category not found');
    
    // Check if course already exists
    const existing = await client.query(`SELECT id FROM courses WHERE title = 'Algorithms & Data Structures'`);
    if (existing.rows[0]?.id) {
      console.log('Course already exists, skipping...');
      return;
    }
    
    // Create the course
    const courseResult = await client.query(`
      INSERT INTO courses (id, category_id, title, description, theme_color, lesson_count, exercise_count, is_recommended, order_index)
      VALUES (gen_random_uuid(), $1, 'Algorithms & Data Structures', 'Learn to think like a computer scientist. Master the fundamental data structures and algorithms that power every application, from search engines to social networks.', '#2196F3', 12, 24, true, 1)
      RETURNING id
    `, [csCatId]);
    const courseId = courseResult.rows[0].id;
    
    // ==========================================
    // LEVEL 1: Thinking Like a Programmer
    // ==========================================
    
    const level1Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Thinking Like a Programmer', 1) RETURNING id
    `, [courseId]);
    const level1Id = level1Result.rows[0].id;
    
    // Lesson 1: What is an Algorithm?
    const algoLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'What is an Algorithm?', 'lesson', 1) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🗺️ Recipes for Solving Problems", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "An algorithm is simply a step-by-step procedure for solving a problem. You already use algorithms every day without realizing it — following a recipe, giving someone driving directions, or even your morning routine is an algorithm."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "In computer science, algorithms are precise, unambiguous instructions that a computer can follow. They take some input, process it through a defined sequence of steps, and produce an output. Every app on your phone, every search result on Google, every recommendation on Netflix is powered by algorithms."}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "📋 Properties of Good Algorithms", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "A well-designed algorithm must be:\\n\\n• Correct: Produces the right answer for all valid inputs\\n• Finite: Eventually terminates (does not run forever)\\n• Unambiguous: Each step is precisely defined with no room for interpretation\\n• Efficient: Uses as few resources (time and memory) as possible\\n\\nTwo algorithms might solve the same problem but differ enormously in efficiency. Finding the BEST algorithm for a problem is one of the central challenges of computer science."}'),
        (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "Which of the following best describes an algorithm?", "options": ["A programming language", "A step-by-step procedure for solving a problem that always terminates", "Any computer program", "A mathematical equation"], "correctIndex": 1, "explanation": "An algorithm is a finite, unambiguous, step-by-step procedure for solving a problem. It must always terminate (no infinite loops) and produce the correct output. Algorithms exist independent of any programming language — they are the underlying logic."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "⏱️ Why Efficiency Matters", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Imagine searching for a name in a phone book with 1 million entries:\\n\\nAlgorithm A (Linear Search): Check every entry from the beginning. Worst case: 1,000,000 checks.\\n\\nAlgorithm B (Binary Search): Open to the middle, determine which half the name is in, and repeat. Worst case: just 20 checks!\\n\\nBoth solve the same problem, but Algorithm B is 50,000 times faster. At Google scale (billions of queries per day), this difference is the difference between instant results and hours of waiting."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "📈 Big O Notation", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Computer scientists describe algorithm efficiency using Big O notation — a way of expressing how the running time grows as the input size increases:\\n\\n• O(1) — Constant: Same time regardless of input size. Like looking up a value by index.\\n• O(log n) — Logarithmic: Doubles in input only add one more step. Binary search.\\n• O(n) — Linear: Time grows proportionally to input. Scanning every element.\\n• O(n log n) — Efficient sorting algorithms like mergesort.\\n• O(n²) — Quadratic: Time grows with the square. Nested loops.\\n• O(2ⁿ) — Exponential: Doubles with each new element. Impractical for large inputs."}'),
        (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "If a linear search takes 1,000,000 steps for a million items, how many steps does binary search take?", "options": ["500,000", "1,000", "About 20", "100"], "correctIndex": 2, "explanation": "Binary search has O(log₂ n) complexity. log₂(1,000,000) ≈ 20. Each step eliminates half the remaining possibilities, so it only takes about 20 steps to search through a million items. This logarithmic efficiency is extraordinarily powerful."}'),
        (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "Understanding algorithms and their efficiency is the difference between a program that works on 100 items and one that scales to billions. It is the foundation of all software engineering."}')
    `, [algoLesson.rows[0].id]);
    
    // Lesson 2: Arrays and Linked Lists
    const arraysLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Arrays and Linked Lists', 'lesson', 2) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📦 Storing Data: Two Fundamental Approaches", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Before we can solve problems, we need ways to organize data. Data structures are the containers that hold and organize information in memory. The two most fundamental data structures — arrays and linked lists — represent two very different philosophies."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "📏 Arrays: The Bookshelf", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "An array stores elements in contiguous (side-by-side) memory locations, like books lined up on a shelf. Each element has an index (position number), starting from 0.\\n\\n[42, 17, 93, 8, 56]\\n  0   1   2  3   4\\n\\nStrengths:\\n• Instant access by index: O(1) — jump directly to any position\\n• Great cache performance (elements are next to each other in memory)\\n\\nWeaknesses:\\n• Inserting/deleting in the middle: O(n) — must shift all subsequent elements\\n• Fixed size (in many languages) — cannot grow easily"}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What is the time complexity of accessing element at index 5 in an array?", "options": ["O(n)", "O(log n)", "O(1) — constant time", "O(n²)"], "correctIndex": 2, "explanation": "Arrays provide O(1) random access because elements are stored contiguously in memory. The computer can calculate the exact memory address of any element using: base_address + (index × element_size). No searching needed — just arithmetic."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔗 Linked Lists: The Treasure Hunt", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "A linked list stores each element in a separate node that contains the data AND a pointer to the next node. Elements can be scattered anywhere in memory — each node just knows where the next one is, like clues in a treasure hunt.\\n\\n[42|→] → [17|→] → [93|→] → [8|→] → [56|∅]\\n\\nStrengths:\\n• Insertion/deletion anywhere: O(1) — just redirect pointers\\n• Dynamic size — grows and shrinks freely\\n\\nWeaknesses:\\n• No random access: O(n) — must follow pointers from the start\\n• Extra memory for storing pointers"}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "⚖️ When to Use Which?", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Use an array when:\\n• You need fast random access by position\\n• The size is known or changes rarely\\n• You are iterating through all elements sequentially\\n\\nUse a linked list when:\\n• You frequently insert or delete elements from the middle\\n• You do not know the size in advance\\n• You do not need random access\\n\\nMany modern languages offer dynamic arrays (ArrayList, Vec, list) that combine the best of both worlds — array-like access with automatic resizing."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "You need to frequently insert and remove items from the middle of a collection. Which is better?", "options": ["Array — because it has faster access", "Linked list — because insertions and deletions only require pointer changes", "Both are equally efficient", "Neither can handle this task"], "correctIndex": 1, "explanation": "Linked lists excel at insertions and deletions because they only require changing a few pointers — O(1) once you have found the position. Arrays require shifting all subsequent elements — O(n). When frequent mid-collection changes are needed, linked lists win."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Choosing the right data structure is often more important than choosing the right algorithm. A clever algorithm with the wrong data structure can be slower than a simple algorithm with the right one. This is why understanding data structures deeply is essential for every programmer."}')
    `, [arraysLesson.rows[0].id]);
    
    // Lesson 3: Stacks and Queues
    const stacksLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Stacks and Queues', 'lesson', 3) RETURNING id
    `, [level1Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📚 Organized Access Patterns", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Sometimes we do not need to access data randomly — we just need to add and remove items in a specific order. Stacks and queues are data structures that restrict access to enforce a particular pattern, and they are surprisingly powerful."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🥞 Stacks: Last In, First Out (LIFO)", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "A stack works like a stack of plates. You can only add (push) to the top and remove (pop) from the top. The last plate placed on the stack is the first one you take off.\\n\\nOperations (all O(1)):\\n• push(item): Add to the top\\n• pop(): Remove from the top\\n• peek(): Look at the top without removing\\n\\nReal-world uses: Undo/redo in text editors, the back button in browsers, function call tracking in every programming language, and expression evaluation in calculators."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "If you push A, B, C onto a stack and then pop twice, what remains?", "options": ["B and C", "A and B", "Only A", "Only C"], "correctIndex": 2, "explanation": "The stack after pushes: bottom [A, B, C] top. First pop removes C (the most recent). Second pop removes B. Only A remains. This Last-In-First-Out order is the fundamental property of stacks."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🚶 Queues: First In, First Out (FIFO)", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "A queue works like a line at a store. People join at the back (enqueue) and leave from the front (dequeue). First come, first served.\\n\\nOperations (all O(1)):\\n• enqueue(item): Add to the back\\n• dequeue(): Remove from the front\\n• front(): Look at the front without removing\\n\\nReal-world uses: Print job scheduling, web server request handling, breadth-first search in graphs, message queues in distributed systems, and any situation where fairness (first-come, first-served) matters."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🔄 The Call Stack: Why Every Programmer Should Care", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Every time your code calls a function, the computer pushes information about that call onto the call stack. When the function returns, it pops off. This is how the computer knows where to return to after a function finishes.\\n\\nThis is also why infinite recursion crashes your program — each recursive call pushes onto the stack, and eventually you run out of stack memory. This is called a stack overflow (yes, that is where the website got its name!)."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "A web server processes requests in the order they arrive. Which data structure models this?", "options": ["Stack (LIFO)", "Queue (FIFO)", "Array", "Linked list"], "correctIndex": 1, "explanation": "A queue (First-In-First-Out) is the natural choice when items should be processed in the order they arrive. The first request to arrive is the first to be processed, ensuring fairness — exactly what a web server needs."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "🎯 Priority Queues", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 12, 'text', '{"type": "text", "text": "A priority queue is a special queue where elements have priorities. Instead of FIFO, the highest-priority item is always dequeued first — like an emergency room where critical patients are treated before those with minor issues, regardless of arrival time.\\n\\nPriority queues power Dijkstra is shortest path algorithm, task scheduling in operating systems, and event simulation. They are typically implemented using a data structure called a heap."}')
    `, [stacksLesson.rows[0].id]);
    
    // Practice for Level 1
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Fundamental Structures', 'exercise', 4)
    `, [level1Id]);
    
    // ==========================================
    // LEVEL 2: Trees and Graphs
    // ==========================================
    
    const level2Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Trees & Graphs', 2) RETURNING id
    `, [courseId]);
    const level2Id = level2Result.rows[0].id;
    
    // Lesson 1: Trees
    const treesLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Trees: Hierarchical Data', 'lesson', 1) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🌳 Data That Branches", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Many real-world structures are hierarchical — file systems, organization charts, HTML documents, family trees. The tree data structure captures this hierarchy perfectly.\\n\\nA tree has a root node at the top, and each node can have children. Nodes with no children are called leaves. Unlike real trees, computer science trees grow downward!"}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Key terminology:\\n• Root: The topmost node\\n• Parent/Child: A node is parent is directly above it; its children are directly below\\n• Leaf: A node with no children\\n• Depth: How many levels down from the root\\n• Height: The longest path from root to any leaf"}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "🔍 Binary Search Trees (BST)", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "A binary search tree is a tree where each node has at most two children, and: every value in the left subtree is LESS than the node, and every value in the right subtree is GREATER.\\n\\nThis organization makes searching incredibly efficient — at each node, you can eliminate half the remaining tree, just like binary search on an array.\\n\\nSearch, insert, and delete are all O(log n) on average — searching through a million items takes only about 20 steps!"}'),
        (gen_random_uuid(), $1, 6, 'question', '{"type": "question", "question": "In a binary search tree, where would you find values smaller than the root?", "options": ["In the right subtree", "In the left subtree", "At the leaves only", "It varies randomly"], "correctIndex": 1, "explanation": "In a BST, the left subtree always contains values less than the node, and the right subtree contains values greater. This ordering property is what makes searching efficient — you always know which direction to go."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌲 Tree Traversals", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Visiting every node in a tree is called traversal. There are three main orders:\\n\\n• In-order (Left, Root, Right): Visits BST nodes in sorted order! Used to get sorted data from a BST.\\n• Pre-order (Root, Left, Right): Visits the root first. Useful for copying a tree or prefix notation.\\n• Post-order (Left, Right, Root): Visits children before parents. Useful for deletion or calculating folder sizes.\\n\\nEach traversal visits every node exactly once — O(n)."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "🏗️ Real-World Tree Structures", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Trees are everywhere in computing:\\n\\n• File systems: Folders contain files and subfolders → tree structure\\n• HTML/DOM: Web pages are trees of nested elements\\n• Databases: B-trees enable fast lookups in databases with billions of records\\n• Compression: Huffman trees power ZIP and JPEG compression\\n• AI: Decision trees make predictions by following branches of yes/no questions\\n• Compilers: Parse trees represent the structure of your code"}'),
        (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "What is the average time complexity of searching for a value in a balanced BST with n nodes?", "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"], "correctIndex": 1, "explanation": "In a balanced BST, each comparison eliminates roughly half the remaining nodes, giving O(log n) search time. For 1 billion nodes, that is only about 30 comparisons! However, if the tree becomes unbalanced (degenerates into a linked list), search becomes O(n)."}')
    `, [treesLesson.rows[0].id]);
    
    // Lesson 2: Graphs
    const graphsLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Graphs: Connected Data', 'lesson', 2) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🕸️ Connections Are Everything", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "A graph is a collection of nodes (vertices) connected by edges. Unlike trees, graphs can have cycles, and any node can connect to any other. Graphs model relationships — social networks, road maps, the internet, molecular structures, and more."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "Graphs come in varieties:\\n\\n• Directed vs Undirected: Are connections one-way (Twitter follow) or two-way (Facebook friend)?\\n• Weighted vs Unweighted: Do edges have values (road distances) or not?\\n• Connected vs Disconnected: Can you reach every node from every other node?\\n• Cyclic vs Acyclic: Does the graph contain loops?"}'),
        (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "A social network where \\"following\\" is one-directional (A follows B, but B may not follow A) is best modeled as:", "options": ["An undirected graph", "A directed graph", "A tree", "An array"], "correctIndex": 1, "explanation": "A directed graph (digraph) is perfect here because relationships are one-way. An edge from A to B means A follows B, but there is no automatic edge from B to A. Twitter is a directed graph; Facebook (friendships are mutual) is undirected."}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🔍 Graph Traversal: BFS and DFS", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "Two fundamental ways to explore a graph:\\n\\nBreadth-First Search (BFS): Explore all neighbors first, then their neighbors, expanding outward like ripples in a pond. Uses a QUEUE. Perfect for finding shortest paths in unweighted graphs.\\n\\nDepth-First Search (DFS): Dive as deep as possible along one path before backtracking. Uses a STACK (or recursion). Perfect for maze solving, cycle detection, and topological sorting.\\n\\nBoth visit every reachable node — O(V + E) where V = vertices and E = edges."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🗺️ Dijkstra is Shortest Path Algorithm", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "When edges have weights (like distances between cities), BFS is not enough. Dijkstra is algorithm finds the shortest path from a starting node to all other nodes in a weighted graph.\\n\\nIt works by greedily expanding the closest unvisited node, updating distances as shorter paths are discovered. This is how Google Maps finds the fastest route to your destination — running a variant of Dijkstra on a graph of roads, intersections, and travel times."}'),
        (gen_random_uuid(), $1, 9, 'question', '{"type": "question", "question": "Google Maps finding the fastest route between two cities is an application of:", "options": ["Sorting algorithms", "Graph shortest-path algorithms (like Dijkstra is)", "Binary search", "Stack operations"], "correctIndex": 1, "explanation": "Navigation systems model the road network as a weighted graph (intersections = nodes, roads = edges, travel times = weights) and use shortest-path algorithms to find the optimal route. Dijkstra is algorithm and its variants (like A*) power modern GPS navigation."}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "🌐 Graphs Power the Modern World", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "• The World Wide Web: Pages are nodes, hyperlinks are edges. Google is PageRank treats the web as a graph.\\n• Social Networks: Facebook has over 2 billion nodes in its social graph.\\n• Recommendation Systems: Netflix models movies and users as a bipartite graph.\\n• GPS Navigation: Road networks are weighted graphs.\\n• Biology: Protein interaction networks, metabolic pathways, neural networks.\\n• Epidemiology: Tracking disease spread through contact networks.\\n\\nIf you can model something as a graph, you can apply decades of graph algorithms to solve problems about it."}'),
        (gen_random_uuid(), $1, 12, 'question', '{"type": "question", "question": "Which traversal method explores nodes in expanding circles from the start, finding shortest paths?", "options": ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Binary Search", "In-order traversal"], "correctIndex": 1, "explanation": "BFS explores nodes level by level — first all nodes 1 step away, then 2 steps, then 3, etc. This guarantees that when BFS first reaches a node, it has found the shortest path (in terms of number of edges). It uses a queue to manage this layer-by-layer exploration."}')
    `, [graphsLesson.rows[0].id]);
    
    // Lesson 3: Hash Tables
    const hashLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Hash Tables: Instant Lookup', 'lesson', 3) RETURNING id
    `, [level2Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "⚡ The Fastest Data Structure", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "What if you could look up any piece of data in constant time — O(1) — regardless of how much data you have? Hash tables (also called hash maps or dictionaries) make this possible and are arguably the most important data structure in practical programming."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🎯 How Hashing Works", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "A hash function takes a key (like a name or word) and converts it into an array index. This lets us store and retrieve data by key in O(1) time.\\n\\nExample: hash(\\"Alice\\") → 42\\n\\nWe store Alice is data at index 42 in our array. To retrieve it, we hash the key again, get 42, and jump directly there. No searching required!\\n\\nThis is like a magical filing system where you can instantly calculate exactly which drawer contains what you are looking for."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "What is the average time complexity of looking up a value in a hash table?", "options": ["O(n)", "O(log n)", "O(1) — constant time", "O(n²)"], "correctIndex": 2, "explanation": "Hash tables provide O(1) average-case lookup by using a hash function to compute the exact storage location from the key. No matter if you have 100 items or 100 million, the lookup takes the same (constant) time on average."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "💥 Handling Collisions", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "What happens when two keys hash to the same index? This is called a collision, and it is inevitable (there are infinite possible keys but finite array positions).\\n\\nTwo common solutions:\\n\\n• Chaining: Each array position holds a linked list. Colliding elements are added to the same list. Lookups within the list are O(k) where k is the chain length.\\n\\n• Open Addressing: If a position is taken, probe other positions according to a rule (linear probing, quadratic probing) until an empty spot is found.\\n\\nA good hash function distributes keys evenly, minimizing collisions."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🌍 Hash Tables Are Everywhere", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Hash tables power more of computing than you might realize:\\n\\n• Dictionaries/Objects: Python dicts, JavaScript objects, Java HashMaps\\n• Database indexing: Fast lookups by primary key\\n• Caching: Web browsers cache pages using URL hashes\\n• Symbol tables: Compilers track variable names using hash tables\\n• Spell checkers: Quickly check if a word exists in the dictionary\\n• Blockchain: Cryptographic hash functions secure every transaction\\n• De-duplication: Detecting duplicate files or records"}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What is a hash collision?", "options": ["When a hash table runs out of memory", "When two different keys produce the same hash value and map to the same index", "When a hash function is too slow", "When data is corrupted"], "correctIndex": 1, "explanation": "A collision occurs when two different keys produce the same hash value, meaning they would be stored at the same array position. Since this is inevitable, hash tables must have a collision resolution strategy (like chaining or open addressing) to handle these situations."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The trade-off of hash tables is space for speed — they use more memory than strictly necessary to keep the table sparse (reducing collisions). A good hash table typically keeps about 70% of its capacity empty. But in most applications, memory is cheap and time is precious, making hash tables the default choice for key-value storage."}')
    `, [hashLesson.rows[0].id]);
    
    // Practice for Level 2
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Trees, Graphs & Hash Tables', 'exercise', 4)
    `, [level2Id]);
    
    // ==========================================
    // LEVEL 3: Sorting and Searching
    // ==========================================
    
    const level3Result = await client.query(`
      INSERT INTO levels (id, course_id, title, order_index) 
      VALUES (gen_random_uuid(), $1, 'Sorting & Algorithm Design', 3) RETURNING id
    `, [courseId]);
    const level3Id = level3Result.rows[0].id;
    
    // Lesson 1: Sorting Algorithms
    const sortLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'The Art of Sorting', 'lesson', 1) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "📊 Putting Things in Order", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Sorting — arranging items in a specific order — is one of the most studied problems in computer science. It sounds simple, but the differences between sorting algorithms are profound. A naive approach might take days to sort a large dataset, while an optimal algorithm handles it in seconds."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🐌 Simple Sorts: Bubble, Selection, Insertion", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "Bubble Sort: Repeatedly walk through the list, swapping adjacent elements that are out of order. Like bubbles rising to the surface. O(n²) — simple but slow.\\n\\nSelection Sort: Find the minimum element and move it to the front. Repeat for the remaining elements. O(n²) — always the same speed regardless of input.\\n\\nInsertion Sort: Build the sorted list one element at a time, inserting each new element into its correct position. O(n²) worst case, but O(n) if the data is nearly sorted — making it excellent for small or almost-sorted datasets."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Why are O(n²) sorting algorithms considered slow for large datasets?", "options": ["n² grows very slowly", "For 1 million items, n² = 1 trillion operations — far too many for practical use", "They use too much memory", "They only work on numbers"], "correctIndex": 1, "explanation": "O(n²) means doubling the input quadruples the work. For n = 1,000,000, that is 10¹² operations. At 1 billion operations per second, that takes about 16 minutes. An O(n log n) algorithm would finish in about 0.02 seconds. The difference is dramatic at scale."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🚀 Merge Sort: Divide and Conquer", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "Merge sort uses the divide-and-conquer strategy:\\n\\n1. DIVIDE: Split the array in half\\n2. CONQUER: Recursively sort each half\\n3. COMBINE: Merge the two sorted halves\\n\\nMerging two sorted arrays is simple and efficient — just compare the front elements and take the smaller one, advancing through both arrays.\\n\\nTime complexity: O(n log n) — ALWAYS. No matter the input.\\nSpace: O(n) — needs extra space for merging.\\n\\nThis is guaranteed efficient performance — merge sort never has a bad day."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "⚡ Quick Sort: The Practical Champion", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "Quick sort is often the fastest sorting algorithm in practice:\\n\\n1. Choose a pivot element\\n2. Partition: Move everything smaller than pivot to the left, everything larger to the right\\n3. Recursively sort the left and right partitions\\n\\nAverage case: O(n log n). Worst case: O(n²) — but this is rare with good pivot selection.\\n\\nQuick sort is faster than merge sort in practice because it sorts in-place (no extra space needed) and has excellent cache behavior. Most standard library sorting functions (like Python is sort()) use variants of quick sort."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What is the theoretical lower bound for comparison-based sorting?", "options": ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], "correctIndex": 1, "explanation": "It has been mathematically proven that any comparison-based sorting algorithm must make at least O(n log n) comparisons in the worst case. Merge sort and heap sort achieve this bound — they are optimally efficient. You cannot do better using comparisons."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "The story of sorting algorithms teaches a broader lesson: simple problems can have sophisticated solutions, and understanding the trade-offs between different approaches (speed, memory, stability, best/worst case) is at the heart of algorithm design."}')
    `, [sortLesson.rows[0].id]);
    
    // Lesson 2: Recursion
    const recursionLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Recursion: Functions That Call Themselves', 'lesson', 2) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "🪞 The Mirror That Reflects Itself", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Recursion is when a function calls itself. It sounds like it should cause an infinite loop, but with a base case (a condition that stops the recursion), it becomes one of the most elegant and powerful techniques in programming."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "The classic example — factorial:\\n\\nfactorial(5) = 5 × factorial(4)\\n           = 5 × 4 × factorial(3)\\n           = 5 × 4 × 3 × factorial(2)\\n           = 5 × 4 × 3 × 2 × factorial(1)\\n           = 5 × 4 × 3 × 2 × 1  ← base case!\\n           = 120\\n\\nThe function keeps calling itself with a smaller input until it reaches the base case, then all the results cascade back up."}'),
        (gen_random_uuid(), $1, 4, 'question', '{"type": "question", "question": "What happens if a recursive function has no base case?", "options": ["It returns zero", "It causes infinite recursion until the program crashes (stack overflow)", "It automatically stops after 100 calls", "Nothing — it works normally"], "correctIndex": 1, "explanation": "Without a base case, the function calls itself endlessly. Each call adds a frame to the call stack, eventually exhausting memory and causing a stack overflow crash. The base case is what makes recursion finite and safe."}'),
        (gen_random_uuid(), $1, 5, 'text', '{"type": "text", "text": "🧩 Thinking Recursively", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "The key to recursion is trusting that the recursive call solves a smaller version of the problem. You only need to think about:\\n\\n1. Base case: What is the simplest version of this problem? (For factorial: factorial(1) = 1)\\n2. Recursive case: How can I express this problem in terms of a smaller version of itself? (factorial(n) = n × factorial(n-1))\\n3. Progress: Am I always moving toward the base case? (n decreases by 1 each call)\\n\\nIf these three conditions are met, the recursion will work correctly."}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "🌳 Recursion Shines with Recursive Structures", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "Recursion is the natural choice when the data structure itself is recursive:\\n\\n• Trees: A tree is a node with subtrees → process node, then recurse on subtrees\\n• File systems: A directory contains files and subdirectories → process files, recurse on subdirectories\\n• Fractals: Self-similar patterns at every scale\\n• Nested structures: JSON, HTML, mathematical expressions\\n\\nIterating over these structures without recursion requires complex manual stack management. With recursion, the code practically writes itself."}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "⚖️ Recursion vs. Iteration", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 10, 'text', '{"type": "text", "text": "Every recursive solution can be rewritten as an iterative one (using loops and an explicit stack), and vice versa. So when should you use which?\\n\\nUse recursion when:\\n• The problem has a natural recursive structure\\n• The code is cleaner and easier to understand\\n• You are working with trees or recursive data\\n\\nUse iteration when:\\n• Performance is critical (recursion has function call overhead)\\n• Stack depth might be too large\\n• The problem is naturally iterative (processing a sequence)"}'),
        (gen_random_uuid(), $1, 11, 'question', '{"type": "question", "question": "Why is recursion particularly well-suited for tree data structures?", "options": ["Trees are always small", "Trees are inherently recursive — each subtree is itself a tree, matching recursive function structure perfectly", "Iteration cannot work on trees", "Recursion is always faster than iteration"], "correctIndex": 1, "explanation": "Trees have a naturally recursive definition: a tree is a root node connected to smaller subtrees, each of which is also a tree. This self-similar structure maps directly to recursive functions, making recursive code for trees clean, intuitive, and elegant."}')
    `, [recursionLesson.rows[0].id]);
    
    // Lesson 3: Dynamic Programming
    const dpLesson = await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Dynamic Programming', 'lesson', 3) RETURNING id
    `, [level3Id]);
    
    await client.query(`
      INSERT INTO lesson_content (id, lesson_id, order_index, content_type, content_data) VALUES
        (gen_random_uuid(), $1, 1, 'text', '{"type": "text", "text": "💡 Remember, Don''t Recompute", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 2, 'text', '{"type": "text", "text": "Dynamic programming (DP) is an optimization technique based on a simple idea: if you have already solved a subproblem, save the answer and reuse it instead of solving it again. This can transform exponential-time algorithms into polynomial-time ones — a dramatic improvement."}'),
        (gen_random_uuid(), $1, 3, 'text', '{"type": "text", "text": "🐰 The Fibonacci Example", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 4, 'text', '{"type": "text", "text": "The Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...\\nRule: fib(n) = fib(n-1) + fib(n-2)\\n\\nNaive recursion: fib(50) makes over 10 BILLION function calls because it recomputes the same values millions of times. fib(3) alone is computed 12 billion times!\\n\\nWith DP (memoization): Store each result in an array. fib(50) now takes just 50 steps. From 10 billion to 50 — that is the power of dynamic programming."}'),
        (gen_random_uuid(), $1, 5, 'question', '{"type": "question", "question": "Why is naive recursive Fibonacci so slow?", "options": ["Fibonacci numbers are very large", "The same subproblems are computed exponentially many times", "Recursion is inherently slow", "The base case is wrong"], "correctIndex": 1, "explanation": "Naive Fibonacci recursion creates an exponentially branching tree of calls where the same values are recomputed over and over. fib(5) calls fib(3) twice, fib(2) three times, etc. Dynamic programming eliminates this redundancy by storing and reusing results."}'),
        (gen_random_uuid(), $1, 6, 'text', '{"type": "text", "text": "🔑 When to Use Dynamic Programming", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 7, 'text', '{"type": "text", "text": "A problem is a good candidate for DP when it has two properties:\\n\\n1. Optimal Substructure: The optimal solution contains optimal solutions to subproblems. (The shortest path from A to C through B requires the shortest paths A→B and B→C.)\\n\\n2. Overlapping Subproblems: The same subproblems appear many times. (Fibonacci recomputes the same values.)\\n\\nIf both properties are present, DP can likely provide a dramatic speedup."}'),
        (gen_random_uuid(), $1, 8, 'text', '{"type": "text", "text": "🎒 Classic DP: The Knapsack Problem", "formatting": {"bold": true}}'),
        (gen_random_uuid(), $1, 9, 'text', '{"type": "text", "text": "You have a backpack that holds 10 kg. You have items with different weights and values:\\n\\nItem A: 3 kg, $40 | Item B: 4 kg, $50 | Item C: 5 kg, $60 | Item D: 2 kg, $20\\n\\nWhich items maximize total value without exceeding 10 kg?\\n\\nTrying all combinations: 2ⁿ possibilities (exponential).\\nWith DP: Build a table of best values for each weight limit, reusing previous results. Polynomial time!\\n\\nThis problem models resource allocation, investment portfolios, cargo loading, and many real-world optimization challenges."}'),
        (gen_random_uuid(), $1, 10, 'question', '{"type": "question", "question": "What does \\"memoization\\" mean in dynamic programming?", "options": ["Writing notes in the code", "Storing the results of subproblems so they can be reused instead of recomputed", "Memorizing the algorithm", "Using more memory to store data"], "correctIndex": 1, "explanation": "Memoization (a play on \\"memorandum\\") means caching the results of function calls. When the function is called again with the same arguments, the stored result is returned immediately instead of recomputing it. This transforms exponential recursion into efficient computation."}'),
        (gen_random_uuid(), $1, 11, 'text', '{"type": "text", "text": "Dynamic programming is widely considered one of the most important algorithmic techniques. It appears in coding interviews, competitive programming, and real applications from spell-checking (edit distance) to bioinformatics (DNA sequence alignment) to finance (option pricing)."}')
    `, [dpLesson.rows[0].id]);
    
    // Practice for Level 3
    await client.query(`
      INSERT INTO lessons (id, level_id, title, type, order_index)
      VALUES (gen_random_uuid(), $1, 'Practice: Algorithm Design', 'exercise', 4)
    `, [level3Id]);
    
    console.log('✅ Algorithms & Data Structures course created!');
    console.log('   📖 Level 1: 3 lessons + 1 exercise (Thinking Like a Programmer)');
    console.log('   📖 Level 2: 3 lessons + 1 exercise (Trees & Graphs)');
    console.log('   📖 Level 3: 3 lessons + 1 exercise (Sorting & Algorithm Design)');
    
  } catch (error) {
    console.error('❌ Failed to create CS course:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCSCourse().catch(console.error);
