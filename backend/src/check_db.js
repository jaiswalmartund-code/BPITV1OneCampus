import mongoose from 'mongoose';
import User from './models/user.model.js';
import Student from './models/student.model.js';
import ExamScore from './models/examScore.model.js';

const dbURI = 'mongodb://127.0.0.1:27017/bpit_v1';

async function run() {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to DB.');
    
    const users = await User.find({ role: 'student' }).lean();
    console.log('\n--- Student Users ---');
    users.forEach(u => {
      console.log(`User: ${u.name}, Enroll: ${u.enrollmentNo}, Semester: ${u.semester}, CGPA: ${u.cgpa}`);
    });

    const students = await Student.find().lean();
    console.log('\n--- Student Roster ---');
    students.forEach(s => {
      console.log(`Student: ${s.studentName}, Enroll: ${s.enrollmentNumber}, Father: ${s.fatherName}, CGPA: ${s.cgpa}`);
    });

    const scores = await ExamScore.find({ enrollmentNo: '00620802824' }).lean();
    console.log('\n--- Exam Scores for 00620802824 ---');
    scores.forEach(s => {
      console.log(`Sem: ${s.semester}, Code: ${s.paperCode}, Subject: ${s.subjectName}, Total: ${s.total}, Grade: ${s.grade}, Credits: ${s.credits}, SGPA: ${s.sgpa}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
