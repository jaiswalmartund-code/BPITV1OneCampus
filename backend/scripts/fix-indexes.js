import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bpit_v1';

const fixIndexes = async () => {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const indexes = await usersCollection.listIndexes().toArray();
    console.log('\nCurrent indexes on users collection:');
    indexes.forEach(idx => console.log(' -', JSON.stringify(idx)));

    const emailIdx = indexes.find(i => i.name === 'email_1');
    if (emailIdx) {
      if (!emailIdx.sparse) {
        console.log('\nDropping non-sparse email_1 index...');
        await usersCollection.dropIndex('email_1');
        console.log('email_1 dropped');
      } else {
        console.log('\nemail_1 is already sparse - no action needed');
      }
    } else {
      console.log('\nemail_1 does not exist');
    }

    const enrollIdx = indexes.find(i => i.name === 'enrollmentNo_1');
    if (enrollIdx) {
      if (!enrollIdx.sparse) {
        console.log('Dropping non-sparse enrollmentNo_1 index...');
        await usersCollection.dropIndex('enrollmentNo_1');
        console.log('enrollmentNo_1 dropped');
      } else {
        console.log('enrollmentNo_1 is already sparse - no action needed');
      }
    } else {
      console.log('enrollmentNo_1 does not exist');
    }

    const delResult = await usersCollection.deleteMany({});
    console.log(`\nCleared ${delResult.deletedCount} leftover user documents`);

    console.log('\nIndex fix complete. You can now run: npm run seed');
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err.message);
    process.exit(1);
  }
};

fixIndexes();
