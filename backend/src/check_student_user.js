import mongoose from 'mongoose';
import User from './models/user.model.js';
import MidSemMark from './models/midSemMark.model.js';
import Attendance from './models/attendance.model.js';

const dbURI = 'mongodb://127.0.0.1:27017/bpit_v1';

async function run() {
  await mongoose.connect(dbURI);
  const u = await User.findOne({ enrollmentNo: '00620802824' }).lean();
  console.log('--- USER ---');
  console.log(u);
  
  if (u) {
    const midsems = await MidSemMark.find({ student: u._id }).lean();
    console.log('\n--- MIDSEMS ---');
    console.log(midsems.map(m => ({ examType: m.examType, subject: m.subject, subjectCode: m.subjectCode, marks: m.marksObtained ?? m.marks })));

    const attendances = await Attendance.find({ student: u._id }).lean();
    console.log('\n--- ATTENDANCES ---');
    console.log(attendances.map(a => ({ subject: a.subject, subjectCode: a.subjectCode, totalClasses: a.totalClasses, attendedClasses: a.attendedClasses })));
  }

  await mongoose.disconnect();
}
run();

