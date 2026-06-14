import mongoose from 'mongoose';

// Deadlines/assignments — created by teachers (for a whole class) or students (personal)
const deadlineSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isTeacherCreated: {
      type: Boolean,
      default: false,
    },
    // For teacher-created deadlines — which class sees this
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null, // null = personal student deadline
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'General',
    },
    subjectCode: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['File Assignment', 'Project', 'Quiz', 'Lab File', 'Other'],
      default: 'File Assignment',
    },
    maxMarks: {
      type: Number,
      default: 10,
    },
    attachment: {
      type: String,
      default: '',
    },
    // Students who have marked this as complete (for teacher-created deadlines)
    completedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // For personal student deadlines — simple boolean
    isCompleted: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['Urgent', 'Upcoming', 'Later'],
      default: 'Upcoming',
    },
  },
  {
    timestamps: true,
  }
);

// Index for student deadline queries: class deadlines + personal
deadlineSchema.index({ class: 1, dueDate: 1 });
deadlineSchema.index({ createdBy: 1, isTeacherCreated: 1 });

const Deadline = mongoose.model('Deadline', deadlineSchema);
export default Deadline;
