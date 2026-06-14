import mongoose from 'mongoose';
import User from './models/user.model.js';
import ExamScore from './models/examScore.model.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/bpit_v1');
  console.log('Connected to DB.');

  // Update user model CGPA to 8.684
  const userUpdate = await User.findOneAndUpdate(
    { enrollmentNo: '00620802824' },
    { cgpa: 8.684 },
    { new: true }
  );
  if (userUpdate) {
    console.log(`Updated User ${userUpdate.name} CGPA to: ${userUpdate.cgpa}`);
  } else {
    console.log('User not found.');
  }

  // Update Sem 1 SGPA to 8.68
  const s1 = await ExamScore.updateMany(
    { enrollmentNo: '00620802824', semester: 1 },
    { sgpa: 8.68 }
  );
  console.log(`Updated Sem 1 scores count: ${s1.modifiedCount}`);

  // Update Sem 2 SGPA to 9.00
  const s2 = await ExamScore.updateMany(
    { enrollmentNo: '00620802824', semester: 2 },
    { sgpa: 9.00 }
  );
  console.log(`Updated Sem 2 scores count: ${s2.modifiedCount}`);

  // Update Sem 3 SGPA to 8.385
  const s3 = await ExamScore.updateMany(
    { enrollmentNo: '00620802824', semester: 3 },
    { sgpa: 8.385 }
  );
  console.log(`Updated Sem 3 scores count: ${s3.modifiedCount}`);

  await mongoose.disconnect();
}

run().catch(console.error);
