/**
 * Clear ALL data from the database for a fresh manual start.
 * Drops: users, classes, subjects, attendance, midsemmarks,
 *        deadlines, examscores, assignmentsubmissions, teacherremarks, auditlogs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bpit_v1';

const clearAll = async () => {
  try {
    console.log('\n🔴 Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📋 Found ${collections.length} collections to clear:`);
    for (const col of collections) {
      const result = await db.collection(col.name).deleteMany({});
      console.log(`   🗑  ${col.name}: deleted ${result.deletedCount} documents`);
    }

    console.log('\n✅ Database completely cleared. Ready for manual data entry.');
    console.log('   → Admin account must be created via seed or direct insert.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Clear failed:', err.message);
    process.exit(1);
  }
};

clearAll();
