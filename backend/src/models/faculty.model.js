import mongoose from 'mongoose';

const facultyAssignmentSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  classSection: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    required: true,
    trim: true,
  },
  subjectTaught: {
    type: String,
    required: true,
    trim: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

const facultySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    teacherName: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Assistant Professor',
    },
    assignedClasses: [facultyAssignmentSchema],
  },
  {
    timestamps: true,
  }
);

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
