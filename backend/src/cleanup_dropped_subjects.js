/**
 * Cleans up all Deadlines, AssignmentSubmissions, MidSemMarks, and Attendance
 * for dropped subjects (ACCOUNTS, MANAGEMENT) in BBA-2nd shift class.
 * Run: node src/cleanup_dropped_subjects.js
 */
import mongoose from 'mongoose';
import Deadline from './models/deadline.model.js';
import AssignmentSubmission from './models/assignmentSubmission.model.js';
import MidSemMark from './models/midSemMark.model.js';
import Attendance from './models/attendance.model.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/bpit_v1';
const CLASS_ID = '6a2f26ee6abdf754da1d8ed1'; // BBA-2nd shift
const REMOVED_SUBJECTS = ['ACCOUNTS', 'MANAGEMENT', 'accounts', 'management'];

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const classObjId = new mongoose.Types.ObjectId(CLASS_ID);

  // 1. Find all Deadlines for the removed subjects in this class
  const deadlines = await Deadline.find({
    class: classObjId,
    subjectCode: { $in: REMOVED_SUBJECTS },
    isTeacherCreated: true,
  }).lean();

  console.log(`Found ${deadlines.length} deadline(s) to delete:`);
  deadlines.forEach(d => console.log(`  - [${d.subjectCode}] "${d.title}" (due: ${d.dueDate?.toDateString()})`));

  if (deadlines.length > 0) {
    const deadlineIds = deadlines.map(d => d._id);

    // 2. Delete all submissions for these deadlines
    const delSubs = await AssignmentSubmission.deleteMany({ assignment: { $in: deadlineIds } });
    console.log(`\n  🗑️  Deleted ${delSubs.deletedCount} assignment submission(s)`);

    // 3. Delete the deadlines themselves
    const delDead = await Deadline.deleteMany({ _id: { $in: deadlineIds } });
    console.log(`  🗑️  Deleted ${delDead.deletedCount} deadline/assignment record(s)`);
  }

  // 4. Also clean any remaining MidSemMarks (in case there are some left)
  const delMarks = await MidSemMark.deleteMany({
    class: classObjId,
    subjectCode: { $in: REMOVED_SUBJECTS },
  });
  console.log(`  🗑️  Deleted ${delMarks.deletedCount} remaining MidSemMark record(s)`);

  // 5. Also clean any remaining Attendance records
  const delAtt = await Attendance.deleteMany({
    class: classObjId,
    subjectCode: { $in: REMOVED_SUBJECTS },
  });
  console.log(`  🗑️  Deleted ${delAtt.deletedCount} remaining Attendance record(s)`);

  console.log('\n✅ Cleanup complete.');
  await mongoose.disconnect();
  process.exit(0);
}

cleanup().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
