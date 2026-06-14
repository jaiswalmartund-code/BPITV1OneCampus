import mongoose from 'mongoose';
import ExamScore from './models/examScore.model.js';

const getGP = (total) => {
  if (total >= 90) return 10;
  if (total >= 75) return 9;
  if (total >= 65) return 8;
  if (total >= 55) return 7;
  if (total >= 50) return 6;
  if (total >= 45) return 5;
  if (total >= 40) return 4;
  return 0;
};

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/bpit_v1');
  const scores = await ExamScore.find({ enrollmentNo: '00620802824' }).lean();
  
  const semGroups = {};
  scores.forEach(s => {
    if (!semGroups[s.semester]) semGroups[s.semester] = [];
    semGroups[s.semester].push({
      code: s.paperCode,
      name: s.subjectName,
      gp: getGP(s.total)
    });
  });

  // Solve Sem 1 (target: 8.680, total credits: 25)
  console.log('--- Solving Sem 1 ---');
  solveSemester(semGroups[1], 25, 8.680);

  // Solve Sem 2 (target: 9.000, total credits: 25)
  console.log('--- Solving Sem 2 ---');
  solveSemester(semGroups[2], 25, 9.000);

  // Solve Sem 3 (target: 8.385, total credits: 26)
  console.log('--- Solving Sem 3 ---');
  solveSemester(semGroups[3], 26, 8.385);

  await mongoose.disconnect();
}

function solveSemester(subjects, targetCredits, targetSGPA) {
  const possibleCredits = [1, 2, 3, 4];
  const n = subjects.length;
  
  function recurse(index, currentCredits, currentCP, path) {
    if (index === n) {
      if (currentCredits === targetCredits) {
        const sgpa = currentCP / currentCredits;
        if (Math.abs(sgpa - targetSGPA) < 0.005) {
          console.log(`Found solution! SGPA: ${sgpa.toFixed(4)}`);
          subjects.forEach((sub, i) => {
            console.log(`  Code: ${sub.code}, Name: ${sub.name}, GP: ${sub.gp}, Credits: ${path[i]}`);
          });
          return true;
        }
      }
      return false;
    }

    // Heuristics: Labs (usually papercode containing 150+ or 250+ or starting with 15 or 25 or containing LAB/PRACTICAL) are 1 or 2 credits
    const name = subjects[index].name.toUpperCase();
    const code = subjects[index].code.toUpperCase();
    let choices = possibleCredits;
    
    const isLab = name.includes('LAB') || name.includes('PRACTICAL') || code.includes('15') || code.includes('25');
    if (isLab) {
      choices = [1, 2];
    } else {
      choices = [2, 3, 4];
    }

    for (const c of choices) {
      path.push(c);
      const solved = recurse(index + 1, currentCredits + c, currentCP + (subjects[index].gp * c), path);
      path.pop();
      if (solved) return true;
    }
    return false;
  }

  const solved = recurse(0, 0, 0, []);
  if (!solved) {
    console.log('No exact solution found with constraints.');
  }
}

run().catch(console.error);
