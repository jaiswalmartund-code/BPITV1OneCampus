import mongoose from 'mongoose';
import Class from '../models/class.model.js';
import User from '../models/user.model.js';
import Student from '../models/student.model.js';
import Attendance from '../models/attendance.model.js';
import MidSemMark from '../models/midSemMark.model.js';
import Deadline from '../models/deadline.model.js';
import TeacherRemark from '../models/teacherRemark.model.js';
import AssignmentSubmission from '../models/assignmentSubmission.model.js';

// ── GET /api/teacher/classes ──────────────────────────────────────────────────
export const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({
      'teacherAssignments.teacher': req.user._id,
    }).lean();

    const result = [];
    classes.forEach(c => {
      const userAssignments = c.teacherAssignments.filter(
        a => a.teacher.toString() === req.user._id.toString()
      );
      userAssignments.forEach(assignment => {
        result.push({
          _id: c._id,
          className: c.name,
          semester: c.semester,
          subject: assignment.subject,
          subjectCode: assignment.subjectCode,
          studentCount: c.students.length,
        });
      });
    });

    res.json({ classes: result });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/teacher/class/:id/students ────────────────────────────────────────
export const getClassStudents = async (req, res, next) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      res.status(404);
      throw new Error('Class not found.');
    }

    const assignment = classDoc.teacherAssignments.find(
      a => a.teacher.toString() === req.user._id.toString()
    );
    if (!assignment) {
      res.status(403);
      throw new Error('Not authorized for this class.');
    }

    const students = await Student.find({
      enrollmentNumber: { $in: classDoc.students },
    }).sort({ enrollmentNumber: 1 }).lean();

    res.json({
      class: {
        _id: classDoc._id,
        className: classDoc.name,
        semester: classDoc.semester,
        subject: assignment.subject,
        subjectCode: assignment.subjectCode,
      },
      students: students.map(s => ({
        enrollmentNumber: s.enrollmentNumber,
        studentName: s.studentName,
        fatherName: s.fatherName,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/attendance/save ─────────────────────────────────────────────────
export const saveAttendance = async (req, res, next) => {
  try {
    const { classId, date, subjectCode, attendance } = req.body;

    if (!classId || !date || !subjectCode || !Array.isArray(attendance)) {
      res.status(400);
      throw new Error('classId, date, subjectCode, and attendance array are required.');
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      res.status(404);
      throw new Error('Class not found.');
    }

    const assignment = classDoc.teacherAssignments.find(
      a => a.teacher.toString() === req.user._id.toString() && a.subjectCode === subjectCode
    );
    if (!assignment) {
      res.status(403);
      throw new Error('You are not assigned to this subject in this class.');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const ops = await Promise.all(
      attendance.map(async record => {
        let studentUser = await User.findOne({
          enrollmentNo: record.enrollmentNo,
          role: 'student',
        });
        
        if (!studentUser) {
          const studentRecord = await Student.findOne({ enrollmentNumber: record.enrollmentNo });
          if (studentRecord) {
            studentUser = await User.create({
              name: studentRecord.studentName || record.enrollmentNo,
              role: 'student',
              enrollmentNo: record.enrollmentNo,
              branch: studentRecord.branch || classDoc.branch,
              semester: studentRecord.semester || classDoc.semester,
              section: studentRecord.classSection ? studentRecord.classSection.split('-')[1] : classDoc.section,
              institute: 'BPIT',
              programme: studentRecord.branch ? `B.Tech - ${studentRecord.branch}` : '',
            });
          } else {
            studentUser = await User.create({
              name: record.enrollmentNo,
              role: 'student',
              enrollmentNo: record.enrollmentNo,
              semester: classDoc.semester,
              branch: classDoc.branch,
              section: classDoc.section,
              institute: 'BPIT',
            });
          }
        }

        return Attendance.findOneAndUpdate(
          {
            student: studentUser._id,
            subjectCode,
            date: attendanceDate,
          },
          {
            student: studentUser._id,
            enrollmentNo: record.enrollmentNo,
            class: classDoc._id,
            markedBy: req.user._id,
            subject: assignment.subject,
            subjectCode,
            date: attendanceDate,
            status: record.status || 'Absent',
            semester: classDoc.semester,
            branch: classDoc.branch,
          },
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      message: `Attendance saved successfully for ${ops.filter(Boolean).length} students.`,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/attendance/:classId ──────────────────────────────────────────────
export const getAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date, subjectCode } = req.query;

    if (date && subjectCode) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const records = await Attendance.find({
        class: classId,
        subjectCode,
        date: attendanceDate,
      }).lean();

      return res.json({ attendance: records });
    }

    // Otherwise return conducted dates summary history
    const history = await Attendance.aggregate([
      {
        $match: {
          class: new mongoose.Types.ObjectId(classId),
          markedBy: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: {
            date: '$date',
            subjectCode: '$subjectCode',
          },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          subjectCode: '$_id.subjectCode',
          presentCount: 1,
          absentCount: 1,
          totalCount: 1,
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.json({ history });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/attendance/update ────────────────────────────────────────────────
export const updateAttendance = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      res.status(400);
      throw new Error('Attendance record ID and status are required.');
    }

    const record = await Attendance.findById(id);
    if (!record) {
      res.status(404);
      throw new Error('Attendance record not found.');
    }

    if (record.markedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this record.');
    }

    record.status = status;
    await record.save();

    res.json({ message: 'Attendance status updated.', record });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/marks/save ──────────────────────────────────────────────────────
export const saveMarks = async (req, res, next) => {
  try {
    const { classId, subjectCode, examType, marks } = req.body;

    if (!classId || !subjectCode || !examType || !Array.isArray(marks)) {
      res.status(400);
      throw new Error('classId, subjectCode, examType, and marks array are required.');
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      res.status(404);
      throw new Error('Class not found.');
    }

    const assignment = classDoc.teacherAssignments.find(
      a => a.teacher.toString() === req.user._id.toString() && a.subjectCode === subjectCode
    );
    if (!assignment) {
      res.status(403);
      throw new Error('You are not assigned to this subject in this class.');
    }

    const ops = await Promise.all(
      marks.map(async record => {
        let studentUser = await User.findOne({
          enrollmentNo: record.enrollmentNo,
          role: 'student',
        });
        
        if (!studentUser) {
          const studentRecord = await Student.findOne({ enrollmentNumber: record.enrollmentNo });
          if (studentRecord) {
            studentUser = await User.create({
              name: studentRecord.studentName || record.enrollmentNo,
              role: 'student',
              enrollmentNo: record.enrollmentNo,
              branch: studentRecord.branch || classDoc.branch,
              semester: studentRecord.semester || classDoc.semester,
              section: studentRecord.classSection ? studentRecord.classSection.split('-')[1] : classDoc.section,
              institute: 'BPIT',
              programme: studentRecord.branch ? `B.Tech - ${studentRecord.branch}` : '',
            });
          } else {
            studentUser = await User.create({
              name: record.enrollmentNo,
              role: 'student',
              enrollmentNo: record.enrollmentNo,
              semester: classDoc.semester,
              branch: classDoc.branch,
              section: classDoc.section,
              institute: 'BPIT',
            });
          }
        }

        return MidSemMark.findOneAndUpdate(
          {
            student: studentUser._id,
            subjectCode,
            examType,
          },
          {
            student: studentUser._id,
            enrollmentNo: record.enrollmentNo,
            class: classDoc._id,
            addedBy: req.user._id,
            subject: assignment.subject,
            subjectCode,
            examType,
            marks: record.score,
            remark: record.remark || '',
            maxMarks: 30,
            semester: classDoc.semester,
            branch: classDoc.branch,
          },
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      message: `Marks saved successfully for ${ops.filter(Boolean).length} students.`,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/marks/update ─────────────────────────────────────────────────────
export const updateMarks = async (req, res, next) => {
  try {
    const { id, marks: score, remark } = req.body;

    const record = await MidSemMark.findById(id);
    if (!record) {
      res.status(404);
      throw new Error('Marks record not found.');
    }

    if (record.addedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this record.');
    }

    if (score !== undefined) record.marks = score;
    if (remark !== undefined) record.remark = remark;

    await record.save();

    res.json({ message: 'Marks record updated.', record });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/marks/class/:id ──────────────────────────────────────────────────
export const getMarksByClass = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const { subjectCode, examType } = req.query;

    if (!subjectCode || !examType) {
      res.status(400);
      throw new Error('subjectCode and examType query parameters are required.');
    }

    const records = await MidSemMark.find({
      class: classId,
      subjectCode,
      examType,
    }).lean();

    res.json({ marks: records });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/marks/student/:id ────────────────────────────────────────────────
export const getMarksByStudent = async (req, res, next) => {
  try {
    const records = await MidSemMark.find({
      student: req.params.id,
    }).lean();

    res.json({ marks: records });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/assignment/create ───────────────────────────────────────────────
export const createAssignment = async (req, res, next) => {
  try {
    const { classId, subjectCode, title, description, dueDate, maxMarks, attachment } = req.body;

    if (!classId || !subjectCode || !title || !dueDate) {
      res.status(400);
      throw new Error('classId, subjectCode, title, and dueDate are required.');
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      res.status(404);
      throw new Error('Class not found.');
    }

    const assignmentInfo = classDoc.teacherAssignments.find(
      a => a.teacher.toString() === req.user._id.toString() && a.subjectCode === subjectCode
    );
    if (!assignmentInfo) {
      res.status(403);
      throw new Error('Not authorized to assign work to this class.');
    }

    const deadline = await Deadline.create({
      createdBy: req.user._id,
      isTeacherCreated: true,
      class: classDoc._id,
      title,
      description: description || '',
      subject: assignmentInfo.subject,
      subjectCode,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks || 10,
      attachment: attachment || '',
      type: 'File Assignment',
    });

    res.status(201).json(deadline);
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/assignment/update ────────────────────────────────────────────────
export const updateAssignment = async (req, res, next) => {
  try {
    const { id, title, description, dueDate, maxMarks, attachment } = req.body;

    const deadline = await Deadline.findById(id);
    if (!deadline) {
      res.status(404);
      throw new Error('Assignment not found.');
    }

    if (deadline.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this assignment.');
    }

    if (title) deadline.title = title;
    if (description !== undefined) deadline.description = description;
    if (dueDate) deadline.dueDate = new Date(dueDate);
    if (maxMarks !== undefined) deadline.maxMarks = maxMarks;
    if (attachment !== undefined) deadline.attachment = attachment;

    await deadline.save();

    res.json({ message: 'Assignment updated.', assignment: deadline });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/assignment/:id ────────────────────────────────────────────────
export const deleteAssignment = async (req, res, next) => {
  try {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) {
      res.status(404);
      throw new Error('Assignment not found.');
    }

    if (deadline.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this assignment.');
    }

    await deadline.deleteOne();

    // Clean up corresponding submissions
    await AssignmentSubmission.deleteMany({ assignment: req.params.id });

    res.json({ message: 'Assignment and related submissions deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/assignment/class/:id ─────────────────────────────────────────────
export const getAssignmentsByClass = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const { subjectCode } = req.query;

    if (!subjectCode) {
      res.status(400);
      throw new Error('subjectCode query parameter is required.');
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      res.status(404);
      throw new Error('Class not found.');
    }

    const assignments = await Deadline.find({
      class: classId,
      subjectCode,
      isTeacherCreated: true,
    }).lean();

    const studentTotal = classDoc.students.length;

    const enriched = await Promise.all(
      assignments.map(async a => {
        const submittedCount = await AssignmentSubmission.countDocuments({
          assignment: a._id,
        });

        return {
          ...a,
          submittedCount,
          pendingCount: Math.max(0, studentTotal - submittedCount),
        };
      })
    );

    res.json({ assignments: enriched });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/assignment/:id/submissions ───────────────────────────────────────
export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { id: assignmentId } = req.params;
    const deadline = await Deadline.findById(assignmentId);
    if (!deadline) {
      res.status(404);
      throw new Error('Assignment not found.');
    }

    if (deadline.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized.');
    }

    const classDoc = await Class.findById(deadline.class);
    if (!classDoc) {
      res.status(404);
      throw new Error('Class records not found.');
    }

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
    }).lean();

    const students = await Student.find({
      enrollmentNumber: { $in: classDoc.students },
    }).sort({ enrollmentNumber: 1 }).lean();

    const subMap = Object.fromEntries(
      submissions.map(sub => [sub.enrollmentNo, sub])
    );

    const fullRoster = students.map(s => {
      const sub = subMap[s.enrollmentNumber];
      return {
        enrollmentNo: s.enrollmentNumber,
        studentName: s.studentName,
        submissionId: sub?._id || null,
        fileUrl: sub?.fileUrl || null,
        submittedAt: sub?.submittedAt || null,
        marks: sub?.marks ?? null,
        remark: sub?.remark || '',
        status: sub ? sub.status : 'Pending',
      };
    });

    res.json({ submissions: fullRoster, assignment: deadline });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/assignment/review ───────────────────────────────────────────────
export const reviewSubmission = async (req, res, next) => {
  try {
    const { submissionId, marks, remark, assignmentId, enrollmentNo } = req.body;

    let sub;
    if (submissionId) {
      sub = await AssignmentSubmission.findById(submissionId);
    } else if (assignmentId && enrollmentNo) {
      // Find submission or create stub if grading pending
      sub = await AssignmentSubmission.findOne({ assignment: assignmentId, enrollmentNo });
      if (!sub) {
        let studentUser = await User.findOne({ enrollmentNo, role: 'student' });
        const studentRecord = await Student.findOne({ enrollmentNumber: enrollmentNo });
        
        if (!studentUser) {
          if (studentRecord) {
            studentUser = await User.create({
              name: studentRecord.studentName || enrollmentNo,
              role: 'student',
              enrollmentNo,
              branch: studentRecord.branch,
              semester: studentRecord.semester,
              section: studentRecord.classSection ? studentRecord.classSection.split('-')[1] : undefined,
              institute: 'BPIT',
              programme: studentRecord.branch ? `B.Tech - ${studentRecord.branch}` : '',
            });
          }
        }
        
        const studentName = studentRecord?.studentName || enrollmentNo;
        sub = new AssignmentSubmission({
          assignment: assignmentId,
          student: studentUser?._id || new mongoose.Types.ObjectId(),
          enrollmentNo,
          studentName,
          fileUrl: 'N/A',
          status: 'Submitted'
        });
      }
    }

    if (!sub) {
      res.status(404);
      throw new Error('Submission record not found.');
    }

    sub.marks = marks;
    sub.remark = remark || '';
    sub.status = 'Graded';

    await sub.save();

    res.json({ message: 'Submission reviewed & graded.', submission: sub });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/teacher/remarks ─────────────────────────────────────────────────
export const saveGeneralRemark = async (req, res, next) => {
  try {
    const { enrollmentNo, subjectCode, remark } = req.body;

    if (!enrollmentNo || !subjectCode || !remark) {
      res.status(400);
      throw new Error('enrollmentNo, subjectCode, and remark are required.');
    }

    let studentUser = await User.findOne({ enrollmentNo, role: 'student' });
    if (!studentUser) {
      const studentRecord = await Student.findOne({ enrollmentNumber: enrollmentNo });
      if (studentRecord) {
        studentUser = await User.create({
          name: studentRecord.studentName || enrollmentNo,
          role: 'student',
          enrollmentNo,
          branch: studentRecord.branch,
          semester: studentRecord.semester,
          section: studentRecord.classSection ? studentRecord.classSection.split('-')[1] : undefined,
          institute: 'BPIT',
          programme: studentRecord.branch ? `B.Tech - ${studentRecord.branch}` : '',
        });
      } else {
        res.status(404);
        throw new Error('Student user not found.');
      }
    }

    const remarkDoc = await TeacherRemark.create({
      student: studentUser._id,
      enrollmentNo,
      teacher: req.user._id,
      teacherName: req.user.name,
      subject: subjectCode, // placeholder or expand
      subjectCode,
      remark,
    });

    res.status(201).json({ message: 'General remark saved.', remark: remarkDoc });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/teacher/remarks/:studentId ───────────────────────────────────────
export const getGeneralRemarks = async (req, res, next) => {
  try {
    const remarks = await TeacherRemark.find({
      student: req.params.studentId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ remarks });
  } catch (error) {
    next(error);
  }
};
