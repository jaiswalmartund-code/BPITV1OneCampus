import User from '../models/user.model.js';
import Class from '../models/class.model.js';
import Subject from '../models/subject.model.js';

// ── Teacher CRUD ──────────────────────────────────────────────────────────────

export const getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password').lean();
    res.json({ teachers, total: teachers.length });
  } catch (error) { next(error); }
};

export const createTeacher = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400); throw new Error('name, email, and password are required.');
    }
    const exists = await User.findOne({ email });
    if (exists) { res.status(400); throw new Error('Email already registered.'); }

    const teacher = await User.create({ name, email, password, role: 'teacher' });
    res.status(201).json({ _id: teacher._id, name: teacher.name, email: teacher.email, role: teacher.role });
  } catch (error) { next(error); }
};

export const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) { res.status(404); throw new Error('Teacher not found.'); }
    const { name, email } = req.body;
    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (req.body.password) teacher.password = req.body.password;
    await teacher.save();
    res.json({ _id: teacher._id, name: teacher.name, email: teacher.email });
  } catch (error) { next(error); }
};

export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' });
    if (!teacher) { res.status(404); throw new Error('Teacher not found.'); }
    // Remove teacher from all class assignments
    await Class.updateMany(
      {},
      { $pull: { teacherAssignments: { teacher: teacher._id } } }
    );
    res.json({ message: 'Teacher deleted.' });
  } catch (error) { next(error); }
};

// ── Class CRUD ────────────────────────────────────────────────────────────────

export const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find()
      .populate('teacherAssignments.teacher', 'name email')
      .lean();
    res.json({ classes, total: classes.length });
  } catch (error) { next(error); }
};

export const createClass = async (req, res, next) => {
  try {
    const { name, branch, semester, section, academicYear } = req.body;
    if (!branch || !semester || !section) {
      res.status(400); throw new Error('branch, semester, and section are required.');
    }
    const cls = await Class.create({ name, branch, semester, section, academicYear: academicYear || '2024-25' });
    res.status(201).json(cls);
  } catch (error) { next(error); }
};

export const updateClass = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cls) { res.status(404); throw new Error('Class not found.'); }
    res.json(cls);
  } catch (error) { next(error); }
};

export const deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }
    res.json({ message: 'Class deleted.' });
  } catch (error) { next(error); }
};

// ── Enrollment Management ─────────────────────────────────────────────────────

export const getClassStudents = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }
    // Get registered students for extra info
    const registered = await User.find({
      enrollmentNo: { $in: cls.students }, role: 'student'
    }).select('name enrollmentNo branch semester cgpa').lean();
    const regMap = Object.fromEntries(registered.map(s => [s.enrollmentNo, s]));
    const students = cls.students.map(en => regMap[en] || { enrollmentNo: en, name: 'Not registered yet' });
    res.json({ students, className: cls.name, total: students.length });
  } catch (error) { next(error); }
};

export const addStudentsToClass = async (req, res, next) => {
  try {
    const { enrollmentNos } = req.body; // array of strings
    if (!Array.isArray(enrollmentNos) || enrollmentNos.length === 0) {
      res.status(400); throw new Error('enrollmentNos array is required.');
    }
    const cls = await Class.findById(req.params.id);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }

    // Add only new enrollment numbers
    const newNos = enrollmentNos.filter(en => !cls.students.includes(en.trim()));
    cls.students.push(...newNos.map(en => en.trim()));
    await cls.save();
    res.json({ message: `${newNos.length} students added.`, added: newNos });
  } catch (error) { next(error); }
};

export const removeStudentFromClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }
    cls.students = cls.students.filter(en => en !== req.params.enrollmentNo);
    await cls.save();
    res.json({ message: 'Student removed from class.' });
  } catch (error) { next(error); }
};

// ── Teacher Assignments ───────────────────────────────────────────────────────

export const assignTeacherToClass = async (req, res, next) => {
  try {
    const { teacherId, subject, subjectCode } = req.body;
    if (!teacherId || !subject || !subjectCode) {
      res.status(400); throw new Error('teacherId, subject, and subjectCode are required.');
    }
    const cls = await Class.findById(req.params.id);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) { res.status(404); throw new Error('Teacher not found.'); }

    // Prevent duplicate assignment
    const exists = cls.teacherAssignments.some(
      a => a.teacher.toString() === teacherId && a.subjectCode === subjectCode
    );
    if (exists) { res.status(400); throw new Error('This teacher is already assigned to this subject in this class.'); }

    cls.teacherAssignments.push({ teacher: teacherId, subject, subjectCode });
    await cls.save();
    res.status(201).json({ message: 'Teacher assigned.', assignment: { teacher: teacher.name, subject, subjectCode } });
  } catch (error) { next(error); }
};

export const removeTeacherAssignment = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) { res.status(404); throw new Error('Class not found.'); }
    cls.teacherAssignments = cls.teacherAssignments.filter(
      a => a._id.toString() !== req.params.assignmentId
    );
    await cls.save();
    res.json({ message: 'Assignment removed.' });
  } catch (error) { next(error); }
};

// ── Subject Master ────────────────────────────────────────────────────────────

export const getSubjects = async (req, res, next) => {
  try {
    const { branch, semester } = req.query;
    const filter = {};
    if (branch) filter.branch = branch;
    if (semester) filter.semester = parseInt(semester, 10);
    const subjects = await Subject.find(filter).sort({ semester: 1, code: 1 }).lean();
    res.json({ subjects, total: subjects.length });
  } catch (error) { next(error); }
};

export const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) { next(error); }
};

export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) { res.status(404); throw new Error('Subject not found.'); }
    res.json(subject);
  } catch (error) { next(error); }
};

export const deleteSubject = async (req, res, next) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted.' });
  } catch (error) { next(error); }
};

// ── Admin Dashboard Stats ─────────────────────────────────────────────────────

export const getDashboardStats = async (req, res, next) => {
  try {
    const [students, teachers, classes, subjects] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Class.countDocuments(),
      Subject.countDocuments(),
    ]);
    res.json({ students, teachers, classes, subjects });
  } catch (error) { next(error); }
};
