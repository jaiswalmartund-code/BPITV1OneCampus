import mongoose from 'mongoose';

const teacherAssignmentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
});

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. "ECE-4-A" — auto-generated or admin-defined
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
    section: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: '2024-25',
      trim: true,
    },
    // List of enrollment numbers belonging to this class
    // Stored as strings (not ObjectId refs) for easy admin bulk upload
    students: [
      {
        type: String,
        trim: true,
      },
    ],
    // Which teacher teaches which subject in this class
    teacherAssignments: [teacherAssignmentSchema],
  },
  {
    timestamps: true,
  }
);

// Auto-generate name if not provided
classSchema.pre('save', async function () {
  if (!this.name) {
    this.name = `${this.branch}-${this.semester}-${this.section}`;
  }
});

// Index for fast lookups
classSchema.index({ branch: 1, semester: 1, section: 1, academicYear: 1 });
classSchema.index({ students: 1 }); // find class by enrollment number

const Class = mongoose.model('Class', classSchema);
export default Class;
