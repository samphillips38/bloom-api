/**
 * Master seed script that runs all course expansion seeds in sequence.
 * 
 * This script:
 * 1. Expands the Logic course (fills missing content + adds Level 3: Formal Logic)
 * 2. Expands the Creative Writing course (fills missing content + adds Levels 3-4)
 * 3. Expands the Musical Harmonies course (adds Levels 2-3)
 * 4. Expands the Quantum Computing course (adds Levels 2-3)
 * 5. Creates new Math course: The Beauty of Calculus (3 levels)
 * 6. Creates new Science course: The Living Cell (3 levels)
 * 7. Creates new CS course: Algorithms & Data Structures (3 levels)
 * 
 * Run individual seed files if you only need to seed specific courses:
 *   npm run db:seed-expand-logic
 *   npm run db:seed-expand-writing
 *   npm run db:seed-expand-music
 *   npm run db:seed-expand-quantum
 *   npm run db:seed-new-math
 *   npm run db:seed-new-science
 *   npm run db:seed-new-cs
 */

async function runAllSeeds() {
  console.log('🌱 Running all expanded course seeds...');
  console.log('=' .repeat(50));
  
  const { execSync } = await import('child_process');
  const path = await import('path');
  
  const seedScripts = [
    { name: 'seed-expand-logic.ts',    npmScript: 'db:seed-expand-logic' },
    { name: 'seed-expand-writing.ts',  npmScript: 'db:seed-expand-writing' },
    { name: 'seed-expand-music.ts',    npmScript: 'db:seed-expand-music' },
    { name: 'seed-expand-quantum.ts',  npmScript: 'db:seed-expand-quantum' },
    { name: 'seed-new-math.ts',        npmScript: 'db:seed-new-math' },
    { name: 'seed-new-science.ts',     npmScript: 'db:seed-new-science' },
    { name: 'seed-new-cs.ts',          npmScript: 'db:seed-new-cs' },
  ];
  
  const projectRoot = path.join(__dirname, '..', '..');
  
  for (const { name, npmScript } of seedScripts) {
    console.log(`\n📦 Running ${name}...`);
    try {
      execSync(`npm run ${npmScript}`, { 
        stdio: 'inherit',
        cwd: projectRoot,
      });
      console.log(`✅ ${name} completed`);
    } catch (error) {
      console.error(`❌ Failed running ${name}`);
      throw error;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 All course seeds completed!');
  console.log('\nCourse Summary:');
  console.log('  🧠 Introduction to Logic — 3 levels, 12 lessons (EXPANDED)');
  console.log('  ✍️  Creative Writing Fundamentals — 4 levels, 16 lessons (EXPANDED)');
  console.log('  🎵 The Art of Musical Harmonies — 3 levels, 12 lessons (EXPANDED)');
  console.log('  ⚛️  Quantum Computing — 3 levels, 12 lessons (EXPANDED)');
  console.log('  📐 The Beauty of Calculus — 3 levels, 12 lessons (NEW)');
  console.log('  🔬 The Living Cell — 3 levels, 12 lessons (NEW)');
  console.log('  💻 Algorithms & Data Structures — 3 levels, 12 lessons (NEW)');
  console.log('\n  Total: 7 courses, 22 levels, 88 lessons');
}

runAllSeeds().catch(console.error);
