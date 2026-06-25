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
      password: 'admin123',
      role: 'admin',
    });
    console.log('Admin user created successfully.');

    // 2. Seed Faculty Details
    console.log('Seeding faculty HR details...');
    const seededFaculty = await Faculty.insertMany([
      {
        employeeId: 'CS1021',
        teacherName: 'Dr. Rahul Sharma',
        department: 'Computer Science Department',
        designation: 'Professor',
        assignedClasses: [
          { semester: 4, classSection: 'ECE-A', branch: 'ECE', subjectTaught: 'Microprocessors & Microcontrollers' },
          { semester: 4, classSection: 'ECE-B', branch: 'ECE', subjectTaught: 'Probability Statistics & Linear Programming' },
          { semester: 4, classSection: 'ECE-C', branch: 'ECE', subjectTaught: 'Digital Communication' }
        ],
      },
      {
        employeeId: 'EC1008',
        teacherName: 'Dr. Priya Verma',
        department: 'Electronics Department',
        designation: 'Professor',
        assignedClasses: [
          { semester: 4, classSection: 'ECE-D', branch: 'ECE', subjectTaught: 'Control Systems' }
        ],
      },
      {
        employeeId: 'CS1045',
        teacherName: 'Dr. Sneha Kulkarni',
        department: 'Computer Science Department',
        designation: 'Associate Professor',
        assignedClasses: [],
      },
      {
        employeeId: 'CS1077',
        teacherName: 'Dr. Vivek Nair',
        department: 'Computer Science Department',
        designation: 'Assistant Professor',
        assignedClasses: [],
      },
      {
        employeeId: 'EC1033',
        teacherName: 'Dr. Arjun Khanna',
        department: 'Electronics Department',
        designation: 'Associate Professor',
        assignedClasses: [],
      },
    ]);
    console.log(`Seeded ${seededFaculty.length} faculty details.`);

    // 3. Seed Teacher User Accounts
    console.log('Seeding teacher user login credentials...');
    const rahulTeacher = await User.create({
      name: 'Dr. Rahul Sharma',
      email: 'rahul@onecampus.edu',
      password: 'password123',
      role: 'teacher',
    });
    const priyaTeacher = await User.create({
      name: 'Dr. Priya Verma',
      email: 'priya@onecampus.edu',
      password: 'password123',
      role: 'teacher',
    });
    console.log('Teacher login credentials seeded.');

    // 4. Seed Student Roster
    console.log('Seeding students...');
    const names = [
      'Aarav Sharma', 'Aditya Singh', 'Amit Kumar', 'Anjali Gupta', 'Ananya Sen',
      'Arjun Khanna', 'Ayush Goel', 'Bhumika Joshi', 'Chirag Sethi', 'Devansh Patel',
      'Deepak Mishra', 'Divya Yadav', 'Gaurav Jain', 'Harsh Vardhan', 'Ishita Kapoor',
      'Jatin Arora', 'Kartik Mittal', 'Komal Preet', 'Martund Jaiswal', 'Mehak Sobti',
      'Nikhil Malhotra', 'Nisha Rawat', 'Pranav Aggarwal', 'Prachi Deshmukh', 'Priyanshu Verma',
      'Rahul Roy', 'Rohit Gupta', 'Rohan Sharma', 'Sajal Chawla', 'Sanya Narang',
      'Shreya Goswami', 'Siddharth Bose', 'Sneha Deshpande', 'Tanmay Arora', 'Tanya Bajaj',
      'Uday Kiran', 'Varun Dhawan', 'Vikas Oberoi', 'Yash Wardhan', 'Zoya Sheikh'
    ];
    
    const fathers = [
      'Rajesh Sharma', 'Vijay Singh', 'Sanjay Kumar', 'Ramesh Gupta', 'Pradeep Sen',
      'Anil Khanna', 'Sunil Goel', 'Karan Joshi', 'Rakesh Sethi', 'Bharat Patel',
      'Harish Mishra', 'Vinod Yadav', 'Satish Jain', 'Yogesh Vardhan', 'Pankaj Kapoor',
      'Suresh Arora', 'Alok Mittal', 'Jaswant Preet', 'Manoj Jaiswal', 'Sanjiv Sobti',
      'Vijay Malhotra', 'Devendra Rawat', 'Rajeev Aggarwal', 'Milind Deshmukh', 'Ashok Verma',
      'Subrata Roy', 'Kamal Gupta', 'Kailash Sharma', 'Dinesh Chawla', 'Navin Narang',
      'Swarup Goswami', 'Dev Bose', 'Dilip Deshpande', 'Satish Arora', 'Naresh Bajaj',
      'Krishna Kiran', 'David Dhawan', 'Anand Oberoi', 'Prem Wardhan', 'Salim Sheikh'
    ];

    const studentEnrollments = [];
    const studentUserDocs = [];
    const studentInfoDocs = [];

    for (let i = 1; i <= 40; i++) {
      const enrollNo = String(i).padStart(3, '0') + '20802824';
      const name = names[(i - 1) % names.length];
      const father = fathers[(i - 1) % fathers.length];
      
      studentEnrollments.push(enrollNo);

      // Determine class section and branch
      let classSection = 'ECE-A';
      if (i > 15 && i <= 30) classSection = 'ECE-B';
      if (i > 30) classSection = 'ECE-C';

      studentInfoDocs.push({
        enrollmentNumber: enrollNo,
        studentName: name,
        fatherName: father,
        semester: 4,
        classSection: classSection,
        branch: 'ECE',
      });

      // Create student user account for instant login mapping
      studentUserDocs.push({
        name: name,
        email: `${name.toLowerCase().replace(' ', '')}@onecampus.edu`,
        password: 'student123',
        role: 'student',
        enrollmentNo: enrollNo,
        branch: 'ECE',
        semester: 4,
        section: classSection.split('-')[1],
        institute: 'BPIT',
        programme: 'B.Tech - Electronics & Communication Engg.',
        cgpa: 8.5,
      });
    }

    // Add extra student Vikas Kumar
    studentInfoDocs.push({
      enrollmentNumber: '06920802835',
      studentName: 'Vikas Kumar',
      fatherName: 'Dhananjay Kumar',
      semester: 4,
      classSection: 'ECE-C',
      branch: 'ECE'
    });
    studentUserDocs.push({
      name: 'Vikas Kumar',
      email: 'vikas@onecampus.edu',
      password: 'student123',
      role: 'student',
      enrollmentNo: '06920802835',
      branch: 'ECE',
      semester: 4,
      section: 'C',
      institute: 'BPIT',
      programme: 'B.Tech - Electronics & Communication Engg.',
      cgpa: 7.9,
    });
    studentEnrollments.push('06920802835');

    await Student.insertMany(studentInfoDocs);
    await User.insertMany(studentUserDocs);
    console.log(`Seeded ${studentInfoDocs.length} student profiles and user accounts.`);

    // 5. Seed Classes and assigned subjects
    console.log('Seeding classes and teacher assignments...');
    const eceAStudents = studentEnrollments.slice(0, 15);
    const eceBStudents = studentEnrollments.slice(15, 30);
    const eceCStudents = studentEnrollments.slice(30);

    const classes = await Class.insertMany([
      {
        name: 'ECE-A',
        branch: 'ECE',
        semester: 4,
        section: 'A',
        academicYear: '2025-26',
        students: eceAStudents,
        teacherAssignments: [
          {
            teacher: rahulTeacher._id,
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
        students: eceBStudents,
        teacherAssignments: [
          {
            teacher: rahulTeacher._id,
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
        students: eceCStudents,
        teacherAssignments: [
          {
            teacher: rahulTeacher._id,
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
            teacher: priyaTeacher._id,
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
