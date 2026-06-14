import mongoose from 'mongoose';
import User from './models/user.model.js';
import ExamScore from './models/examScore.model.js';

const getGP = (total) => {
  if (total >= 90) return 10;
  if (total >= 80) return 9;
  if (total >= 70) return 8;
  if (total >= 60) return 7;
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
      total: s.total,
      gp: getGP(s.total)
    });
  });

  for (const sem of [1, 2, 3]) {
    console.log(`\nSemester ${sem} subjects:`);
    let sumGP = 0;
    semGroups[sem].forEach(s => {
      console.log(`  Code: ${s.code}, Name: ${s.name}, Total: ${s.total}, GP: ${s.gp}`);
      sumGP += s.gp;
    });
    console.log(`  Count: ${semGroups[sem].length}, Simple Average GP: ${(sumGP / semGroups[sem].length).toFixed(4)}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
