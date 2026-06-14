import mongoose from 'mongoose';

// Daily attendance records marked by teachers in the teacher portal
const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrollmentNo: {
      type: String,
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // teacher
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Holiday', 'Late'],
      required: true,
      default: 'Absent',
    },
    semester: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per student per subject per date
attendanceSchema.index(
  { student: 1, subjectCode: 1, date: 1 },
  { unique: true }
);

// Index for teacher bulk operations (class + subject + date)
attendanceSchema.index({ class: 1, subjectCode: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
