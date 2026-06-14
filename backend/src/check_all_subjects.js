import mongoose from 'mongoose';
import MidSemMark from './models/midSemMark.model.js';
import Attendance from './models/attendance.model.js';
import Subject from './models/subject.model.js';
import Class from './models/class.model.js';

const dbURI = 'mongodb://127.0.0.1:27017/bpit_v1';

async function run() {
  await mongoose.connect(dbURI);
  
  const midsemCodes = await MidSemMark.distinct('subjectCode');
  const midsemSubjects = await MidSemMark.distinct('subject');
  const attCodes = await Attendance.distinct('subjectCode');
  const attSubjects = await Attendance.distinct('subject');
  
  console.log('MidSem Codes:', midsemCodes);
  console.log('MidSem Subjects:', midsemSubjects);
  console.log('Attendance Codes:', attCodes);
  console.log('Attendance Subjects:', attSubjects);
  
  const subjects = await Subject.find().lean();
  console.log('Subjects Collection Count:', subjects.length);

  const classes = await Class.find().lean();
  console.log('Classes:', JSON.stringify(classes, null, 2));

  await mongoose.disconnect();
}
run();

