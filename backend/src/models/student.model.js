import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    enrollmentNumber: {
      type: String,
      required: [true, 'Enrollment number is required'],
      unique: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    classSection: {
      type: String, // e.g. "ECE-A"
      trim: true,
    },
    branch: {
      type: String, // e.g. "ECE", "CSE"
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ classSection: 1, semester: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
