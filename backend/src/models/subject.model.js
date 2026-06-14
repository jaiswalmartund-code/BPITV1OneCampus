import mongoose from 'mongoose';

// Admin-defined subject master list (optional reference — used for dropdowns in teacher portal)
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    branch: {
      type: String,
      required: true,
      enum: ['ECE', 'BBA'],
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    type: {
      type: String,
      enum: ['Theory', 'Lab', 'Practical', 'Tutorial'],
      default: 'Theory',
    },
    credits: {
      type: Number,
      default: 4,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ branch: 1, semester: 1 });
subjectSchema.index({ code: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
