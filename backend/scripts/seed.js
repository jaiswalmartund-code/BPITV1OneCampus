import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';
import Student from '../src/models/student.model.js';
import Faculty from '../src/models/faculty.model.js';
import Class from '../src/models/class.model.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bpit_v1';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding.');

    // 0. Clear existing data to allow fresh seed
    console.log('Clearing database collection data...');
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Class.deleteMany({});
    console.log('Cleared existing database records.');

    // 1. Seed Admin User
    console.log('Seeding admin user...');
    const admin = await User.create({
      name: 'Admin Super Admin',
      email: 'admin@onecampus.edu',
      password: 'admin@1615',
      role: 'admin',
    });
    console.log('Admin user created successfully.');

    // 2. Seed Faculty Details (Only the requested prof)
    console.log('Seeding faculty HR details...');
    const seededFaculty = await Faculty.insertMany([
      {
        employeeId: 'CS1021',
        teacherName: 'Prof One',
        department: 'Computer Science Department',
        designation: 'Professor',
        assignedClasses: [
          { semester: 4, classSection: 'ECE-A', branch: 'ECE', subjectTaught: 'Microprocessors & Microcontrollers' },
          { semester: 4, classSection: 'ECE-B', branch: 'ECE', subjectTaught: 'Probability Statistics & Linear Programming' },
          { semester: 4, classSection: 'ECE-C', branch: 'ECE', subjectTaught: 'Digital Communication' },
          { semester: 4, classSection: 'ECE-D', branch: 'ECE', subjectTaught: 'Control Systems' }
        ],
      }
    ]);
    console.log(`Seeded ${seededFaculty.length} faculty details.`);

    // 3. Seed Teacher User Accounts
    console.log('Seeding teacher user login credentials...');
    const profTeacher = await User.create({
      name: 'Prof One',
      email: 'prof1@gmail.com',
      password: 'prof@123',
      role: 'teacher',
    });
    console.log('Teacher login credentials seeded.');

    // 4. Seed Student Roster (Only the requested student)
    console.log('Seeding student roster...');
    await Student.insertMany([
      {
        enrollmentNumber: '00620802824',
        studentName: 'Martund Jaiswal',
        fatherName: 'VIPIN JAISWAL',
        semester: 4,
        classSection: 'ECE-A',
        branch: 'ECE'
      }
    ]);

    await User.create({
      name: 'Martund Jaiswal',
      email: 'martundjaiswal@onecampus.edu',
      password: 'student123',
      role: 'student',
      enrollmentNo: '00620802824',
      branch: 'ECE',
      semester: 4,
      section: 'A',
      institute: 'BPIT',
      programme: 'B.Tech - Electronics & Communication Engg.',
      cgpa: 8.5,
    });
    console.log('Student profile and user account seeded.');

    // 5. Seed Classes and assigned subjects
    console.log('Seeding classes and teacher assignments...');
    const classes = await Class.insertMany([
      {
        name: 'ECE-A',
        branch: 'ECE',
        semester: 4,
        section: 'A',
        academicYear: '2025-26',
        students: ['00620802824'],
        teacherAssignments: [
          {
            teacher: profTeacher._id,
            subject: 'Microprocessors & Microcontrollers',
            subjectCode: 'EC-204',
          }
        ],
      },
      {
        name: 'ECE-B',
        branch: 'ECE',
        semester: 4,
        section: 'B',
        academicYear: '2025-26',
        students: [],
        teacherAssignments: [
          {
            teacher: profTeacher._id,
            subject: 'Probability Statistics & Linear Programming',
            subjectCode: 'MA-202',
          }
        ],
      },
      {
        name: 'ECE-C',
        branch: 'ECE',
        semester: 4,
        section: 'C',
        academicYear: '2025-26',
        students: [],
        teacherAssignments: [
          {
            teacher: profTeacher._id,
            subject: 'Digital Communication',
            subjectCode: 'EC-206',
          }
        ],
      },
      {
        name: 'ECE-D',
        branch: 'ECE',
        semester: 4,
        section: 'D',
        academicYear: '2025-26',
        students: [],
        teacherAssignments: [
          {
            teacher: profTeacher._id,
            subject: 'Control Systems',
            subjectCode: 'EC-208',
          }
        ],
      },
    ]);
    console.log(`Seeded ${classes.length} classes with subject mappings.`);

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
