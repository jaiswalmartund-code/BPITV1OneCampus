import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deadline',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    enrollmentNo: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    marks: {
      type: Number,
      min: 0,
    },
    remark: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Graded'],
      default: 'Submitted',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
export default AssignmentSubmission;
