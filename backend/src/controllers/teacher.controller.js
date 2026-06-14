import Class from '../models/class.model.js';
import User from '../models/user.model.js';
import Attendance from '../models/attendance.model.js';
import MidSemMark from '../models/midSemMark.model.js';
import Deadline from '../models/deadline.model.js';

// ── GET /api/teacher/my-classes ───────────────────────────────────────────────
// Return only the classes where this teacher has an assignment
export const getMyClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({
      'teacherAssignments.teacher': req.user._id,
    }).lean();

    // Filter teacherAssignments to only show this teacher's subjects
    const filtered = classes.map(c => ({
      ...c,
      teacherAssignments: c.teacherAssignments.filter(
        a => a.teacher.toString() === req.user._id.toString()
      ),
    }));

    res.json({ classes: filtered });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/teacher/class/:id/students ──────────────────────────────────────
export const getClassStudents = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id || req.params.classId);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }

    // Verify this teacher belongs to the class
    const isAssigned = cls.teacherAssignments.some(
      a => a.teacher.toString() === req.user._id.toString()
    );
    if (!isAssigned) { res.status(403); throw new Error('Not your class.'); }

    const students = await User.find({
      enrollmentNo: { $in: cls.students },
      role: 'student',
    }).select('name enrollmentNo branch semester section cgpa').lean();

    // Preserve class roll order and normalize field names
    // TeacherPortal expects both enrollmentNumber (old) and enrollmentNo (new)
    const ordered = cls.students.map(en => {
      const s = students.find(st => st.enrollmentNo === en) || { enrollmentNo: en, name: 'Not registered' };
      return {
        ...s,
        enrollmentNumber: s.enrollmentNo,  // alias for backward compat with TeacherPortal
        studentName:      s.name,          // alias for backward compat with TeacherPortal
      };
    });

    res.json({ students: ordered, class: { name: cls.name, semester: cls.semester } });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/teacher/attendance/bulk ─────────────────────────────────────────
// Mark attendance for an entire class on a given date + subject
export const markBulkAttendance = async (req, res, next) => {
  try {
    const { classId, subjectCode, subject, date, records } = req.body;
    // records: [{ enrollmentNo, status }]

    if (!classId || !subjectCode || !date || !Array.isArray(records)) {
      res.status(400); throw new Error('classId, subjectCode, date, and records are required.');
    }

    const cls = await Class.findById(classId);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }

    const isAssigned = cls.teacherAssignments.some(
      a => a.teacher.toString() === req.user._id.toString() && a.subjectCode === subjectCode
    );
    if (!isAssigned) { res.status(403); throw new Error('You are not assigned to this subject in this class.'); }

    const attendanceDate = new Date(date);

    // Bulk upsert using updateOne with upsert: true
    const ops = await Promise.all(records.map(async ({ enrollmentNo, status }) => {
      const student = await User.findOne({ enrollmentNo, role: 'student' }).select('_id');
      if (!student) return null;

      return Attendance.updateOne(
        { student: student._id, subjectCode, date: attendanceDate },
        {
          $set: {
            student:     student._id,
            enrollmentNo,
            class:       cls._id,
            markedBy:    req.user._id,
            subject:     subject || subjectCode,
            subjectCode,
            date:        attendanceDate,
            status,
            semester:    cls.semester,
            branch:      cls.branch,
          },
        },
        { upsert: true }
      );
    }));

    res.json({ message: `Attendance marked for ${ops.filter(Boolean).length} students.` });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/teacher/attendance/:id ──────────────────────────────────────────
export const updateAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) { res.status(404); throw new Error('Record not found.'); }
    if (record.markedBy.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not your record.');
    }
    record.status = req.body.status || record.status;
    await record.save();
    res.json(record);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/teacher/marks/midsem ───────────────────────────────────────────
// Bulk add/update mid-sem marks for a class
export const addMidSemMarks = async (req, res, next) => {
  try {
    const { classId, subjectCode, subject, examType, maxMarks, marks } = req.body;
    // marks: [{ enrollmentNo, marks }]

    if (!classId || !subjectCode || !examType || !Array.isArray(marks)) {
      res.status(400); throw new Error('classId, subjectCode, examType, and marks array are required.');
    }

    const cls = await Class.findById(classId);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }

    const isAssigned = cls.teacherAssignments.some(
      a => a.teacher.toString() === req.user._id.toString() && a.subjectCode === subjectCode
    );
    if (!isAssigned) { res.status(403); throw new Error('You are not assigned to this subject.'); }

    const ops = await Promise.all(marks.map(async ({ enrollmentNo, marks: score }) => {
      const student = await User.findOne({ enrollmentNo, role: 'student' }).select('_id');
      if (!student) return null;

      return MidSemMark.updateOne(
        { student: student._id, subjectCode, examType },
        {
          $set: {
            student:     student._id,
            enrollmentNo,
            class:       cls._id,
            addedBy:     req.user._id,
            subject:     subject || subjectCode,
            subjectCode,
            examType,
            marks:       score,
            maxMarks:    maxMarks || 30,
            semester:    cls.semester,
            branch:      cls.branch,
          },
        },
        { upsert: true }
      );
    }));

    res.json({ message: `Marks saved for ${ops.filter(Boolean).length} students.` });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/teacher/marks/midsem/:id ────────────────────────────────────────
export const updateMidSemMark = async (req, res, next) => {
  try {
    const mark = await MidSemMark.findById(req.params.id);
    if (!mark) { res.status(404); throw new Error('Record not found.'); }
    if (mark.addedBy.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized.');
    }
    mark.marks = req.body.marks ?? mark.marks;
    mark.maxMarks = req.body.maxMarks ?? mark.maxMarks;
    await mark.save();
    res.json(mark);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/teacher/deadlines ───────────────────────────────────────────────
export const createClassDeadline = async (req, res, next) => {
  try {
    const { classId, title, subject, subjectCode, dueDate, type, description } = req.body;
    if (!classId || !title || !dueDate) {
      res.status(400); throw new Error('classId, title, and dueDate are required.');
    }

    const cls = await Class.findById(classId);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }

    const isAssigned = cls.teacherAssignments.some(
      a => a.teacher.toString() === req.user._id.toString()
    );
    if (!isAssigned) { res.status(403); throw new Error('Not your class.'); }

    const deadline = await Deadline.create({
      createdBy: req.user._id,
      isTeacherCreated: true,
      class: cls._id,
      title,
      subject: subject || 'General',
      subjectCode: subjectCode || '',
      dueDate: new Date(dueDate),
      type: type || 'File Assignment',
      description: description || '',
    });

    res.status(201).json(deadline);
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/teacher/deadlines/:id ────────────────────────────────────────
export const deleteClassDeadline = async (req, res, next) => {
  try {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Not found.'); }
    if (deadline.createdBy.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not your deadline.');
    }
    await deadline.deleteOne();
    res.json({ message: 'Deadline removed.' });
  } catch (error) {
    next(error);
  }
};
