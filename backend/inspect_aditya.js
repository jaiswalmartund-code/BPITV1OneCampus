import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import Student from './src/models/student.model.js';
import Class from './src/models/class.model.js';

const dbURI = 'mongodb://127.0.0.1:27017/bpit_v1';

async function run() {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to DB.');

    const user = await User.findOne({ enrollmentNo: '04435201725' }).lean();
    const student = await Student.findOne({ enrollmentNumber: '04435201725' }).lean();
    const classDocs = await Class.find({ students: '04435201725' }).lean();

    console.log('User found:', user);
    console.log('Student found:', student);
    console.log('Classes found in:', classDocs.map(c => c.name));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
