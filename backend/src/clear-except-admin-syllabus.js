import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import Student from './models/student.model.js';
import Faculty from './models/faculty.model.js';
import Class from './models/class.model.js';
import Attendance from './models/attendance.model.js';
import Deadline from './models/deadline.model.js';
import ExamScore from './models/examScore.model.js';
import MidSemMark from './models/midSemMark.model.js';
import AssignmentSubmission from './models/assignmentSubmission.model.js';
import TeacherRemark from './models/teacherRemark.model.js';
import AuditLog from './models/auditLog.model.js';
import Subject from './models/subject.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bpit_v1';

const run = async () => {
  try {
    console.log('🏁 Resetting database (Keeping only Admin and Syllabus Recommendations)...\n');
    console.log('Connecting to database:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Delete all students, faculties, classes, attendance, deadlines, marks, etc.
    console.log('Clearing student profiles...');
    await Student.deleteMany({});
    
    console.log('Clearing faculty profiles...');
    await Faculty.deleteMany({});
    
    console.log('Clearing classes...');
    await Class.deleteMany({});
    
    console.log('Clearing attendance...');
    await Attendance.deleteMany({});
    
    console.log('Clearing deadlines...');
    await Deadline.deleteMany({});
    
    console.log('Clearing exam scores...');
    await ExamScore.deleteMany({});
    
    console.log('Clearing mid-sem marks...');
    await MidSemMark.deleteMany({});
    
    console.log('Clearing assignment submissions...');
    await AssignmentSubmission.deleteMany({});
    
    console.log('Clearing teacher remarks...');
    await TeacherRemark.deleteMany({});
    
    console.log('Clearing audit logs...');
    await AuditLog.deleteMany({});
    
    console.log('Clearing subjects...');
    await Subject.deleteMany({});

    // 2. Delete all users except admin@onecampus.edu
    console.log('Clearing all users whose email is not admin@onecampus.edu...');
    await User.deleteMany({ email: { $ne: 'admin@onecampus.edu' } });
    
    // Also delete any user that has no email (like students with enrollmentNo only)
    console.log('Clearing student logins (users without email field)...');
    await User.deleteMany({ email: { $exists: false } });

    // 3. Upsert the admin user with password 'admin@1615'
    const adminEmail = 'admin@onecampus.edu';
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log('Admin user found, updating details and password...');
      admin.password = 'admin@1615';
      admin.name = 'Admin Super Admin';
      admin.role = 'admin';
      await admin.save();
    } else {
      console.log('Admin user not found, creating new admin with lock credentials...');
      await User.create({
        name: 'Admin Super Admin',
        email: adminEmail,
        password: 'admin@1615',
        role: 'admin'
      });
    }

    console.log('\n🎉 Database reset complete! Admin credentials locked & syllabus recommendations preserved.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
};

run();
