import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bpit_v1';

const clearAll = async () => {
  try {
    console.log('\nConnecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\nFound ${collections.length} collections to clear:`);
    for (const col of collections) {
      const result = await db.collection(col.name).deleteMany({});
      console.log(`   Deleted from ${col.name}: ${result.deletedCount} documents`);
    }

    console.log('\nDatabase completely cleared. Ready for fresh data entry.');
    process.exit(0);
  } catch (err) {
    console.error('Clear failed:', err.message);
    process.exit(1);
  }
};

clearAll();
