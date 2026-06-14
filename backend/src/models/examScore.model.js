import mongoose from 'mongoose';

// End-Semester results fetched from GGSIPU examweb portal on every student login
const examScoreSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrollmentNo: {
      type: String,
      required: true,
      index: true, // fast lookup without populating
    },
    semester: {
      type: Number,
      required: true,
    },
    paperCode: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    subjectName: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    internal: {
      type: Number, // Minor marks
      default: 0,
    },
    external: {
      type: Number, // Major marks
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    credits: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    sgpa: {
      type: Number, // Stored per semester (same value for all subjects in a sem)
      default: 0,
    },
    examSession: {
      type: String, // e.g. "Nov-Dec 2024"
      trim: true,
    },
    declaredDate: {
      type: String,
      trim: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one record per student per subject per semester
examScoreSchema.index({ student: 1, semester: 1, paperCode: 1 }, { unique: true });

const ExamScore = mongoose.model('ExamScore', examScoreSchema);
export default ExamScore;
