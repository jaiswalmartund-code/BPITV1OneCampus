import mongoose from 'mongoose';

// Mid-Semester marks entered manually by teachers in the teacher portal
const midSemMarkSchema = new mongoose.Schema(
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
    addedBy: {
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
    examType: {
      type: String,
      enum: ['Mid Sem 1', 'Mid Sem 2'],
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      default: 30, // GGSIPU standard mid-sem max
    },
    remark: {
      type: String,
      default: '',
      trim: true,
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

// One mid-sem record per student per subject per exam type
midSemMarkSchema.index(
  { student: 1, subjectCode: 1, examType: 1 },
  { unique: true }
);

const MidSemMark = mongoose.model('MidSemMark', midSemMarkSchema);
export default MidSemMark;
