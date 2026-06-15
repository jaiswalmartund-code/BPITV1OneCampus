import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const process = fork(scriptPath);
    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });
  });
};

const main = async () => {
  try {
    console.log('🏁 Starting Complete Database Seeding...\n');
    
    console.log('👉 Step 1: Seeding Users, Classes, and Students...');
    await runScript(path.join(__dirname, 'utils', 'seed.js'));
    console.log('✅ Step 1 complete!\n');
    
    console.log('👉 Step 2: Seeding Syllabus Recommendations (Important topics, study plans)...');
    await runScript(path.join(__dirname, 'seed_recommendations.js'));
    console.log('✅ Step 2 complete!\n');
    
    console.log('🎉 Complete database seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

main();
