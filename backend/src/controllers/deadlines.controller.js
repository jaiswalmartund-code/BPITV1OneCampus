import Deadline from '../models/deadline.model.js';
import Class from '../models/class.model.js';
import AssignmentSubmission from '../models/assignmentSubmission.model.js';

// Helper: compute priority from dueDate
function computePriority(dueDate) {
  const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 2) return 'Urgent';
  if (daysLeft <= 7) return 'Upcoming';
  return 'Later';
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/deadlines?type=File Assignment
// All deadlines: teacher-created for student's class + student's personal ones
// ─────────────────────────────────────────────────────────────────────────────
export const getDeadlines = async (req, res, next) => {
  try {
    const { type } = req.query;

    // Find student's class
    const studentClass = await Class.findOne({
      students: req.user.enrollmentNo,
    }).select('_id');

    const filter = { ...(type ? { type } : {}) };
    const orConditions = [{ createdBy: req.user._id, isTeacherCreated: false }];

    if (studentClass) {
      orConditions.push({ class: studentClass._id, isTeacherCreated: true });
    }

    const deadlines = await Deadline.find({ ...filter, $or: orConditions })
      .sort({ dueDate: 1 })
      .lean();

    // Fetch student's assignment submissions to enrich status
    const submissions = await AssignmentSubmission.find({
      enrollmentNo: req.user.enrollmentNo
    }).lean();

    const subMap = Object.fromEntries(
      submissions.map(sub => [sub.assignment.toString(), sub])
    );

    // Add priority + completion status for this student
    const enriched = deadlines.map(d => {
      const sub = subMap[d._id.toString()];
      return {
        ...d,
        priority: computePriority(d.dueDate),
        isCompleted: d.isTeacherCreated
          ? (sub ? true : d.completedBy.some(id => id.toString() === req.user._id.toString()))
          : d.isCompleted,
        submission: sub || null,
      };
    });

    res.json({ deadlines: enriched, total: enriched.length });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/deadlines
// Student creates a personal deadline
// ─────────────────────────────────────────────────────────────────────────────
export const createDeadline = async (req, res, next) => {
  try {
    const { title, subject, dueDate, type, description } = req.body;

    if (!title || !dueDate) {
      res.status(400);
      throw new Error('Title and due date are required.');
    }

    const deadline = await Deadline.create({
      createdBy: req.user._id,
      isTeacherCreated: false,
      title,
      subject: subject || 'General',
      dueDate: new Date(dueDate),
      type: type || 'File Assignment',
      description: description || '',
      priority: computePriority(dueDate),
    });

    res.status(201).json(deadline);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/deadlines/:id/toggle
// Toggle completion for a deadline
// ─────────────────────────────────────────────────────────────────────────────
export const toggleDeadline = async (req, res, next) => {
  try {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
      res.status(404);
      throw new Error('Deadline not found.');
    }

    if (deadline.isTeacherCreated) {
      // Toggle in completedBy array
      const userId = req.user._id;
      const idx = deadline.completedBy.findIndex(id => id.toString() === userId.toString());
      if (idx > -1) {
        deadline.completedBy.splice(idx, 1);
      } else {
        deadline.completedBy.push(userId);
      }
    } else {
      // Must be own deadline
      if (deadline.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this deadline.');
      }
      deadline.isCompleted = !deadline.isCompleted;
    }

    await deadline.save();
    res.json(deadline);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/deadlines/:id
// Delete student's own personal deadline
// ─────────────────────────────────────────────────────────────────────────────
export const deleteDeadline = async (req, res, next) => {
  try {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
      res.status(404);
      throw new Error('Deadline not found.');
    }
    if (deadline.isTeacherCreated) {
      res.status(403);
      throw new Error('Cannot delete a teacher-created deadline.');
    }
    if (deadline.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this deadline.');
    }

    await deadline.deleteOne();
    res.json({ message: 'Deadline deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/deadlines/:id/submit
// Student submits an assignment (creates or updates AssignmentSubmission)
// ─────────────────────────────────────────────────────────────────────────────
export const submitAssignment = async (req, res, next) => {
  try {
    const { id: deadlineId } = req.params;
    const { fileUrl } = req.body;

    if (!fileUrl) {
      res.status(400);
      throw new Error('Google Drive link is required.');
    }

    const deadline = await Deadline.findById(deadlineId);
    if (!deadline) {
      res.status(404);
      throw new Error('Assignment not found.');
    }

    if (!deadline.isTeacherCreated) {
      res.status(400);
      throw new Error('Cannot submit to a personal deadline.');
    }

    // Check if class has student
    const classDoc = await Class.findById(deadline.class);
    if (!classDoc || !classDoc.students.includes(req.user.enrollmentNo)) {
      res.status(403);
      throw new Error('You are not in the class for this assignment.');
    }

    // Check if submission already exists
    let submission = await AssignmentSubmission.findOne({
      assignment: deadlineId,
      enrollmentNo: req.user.enrollmentNo,
    });

    if (submission) {
      if (submission.status === 'Graded') {
        res.status(400);
        throw new Error('Cannot resubmit a graded assignment.');
      }
      submission.fileUrl = fileUrl;
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = await AssignmentSubmission.create({
        assignment: deadlineId,
        student: req.user._id,
        enrollmentNo: req.user.enrollmentNo,
        studentName: req.user.name,
        fileUrl,
        submittedAt: new Date(),
        status: 'Submitted',
      });
    }

    // Add student to completedBy of the deadline if not already there
    if (!deadline.completedBy.includes(req.user._id)) {
      deadline.completedBy.push(req.user._id);
      await deadline.save();
    }

    res.json({ message: 'Assignment submitted successfully.', submission });
  } catch (error) {
    next(error);
  }
};
