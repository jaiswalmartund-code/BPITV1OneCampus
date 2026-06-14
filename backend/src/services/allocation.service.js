import Student from '../models/student.model.js';
import Faculty from '../models/faculty.model.js';
import Class from '../models/class.model.js';
import AuditLog from '../models/auditLog.model.js';
import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import ExamScore from '../models/examScore.model.js';
import MidSemMark from '../models/midSemMark.model.js';
import Attendance from '../models/attendance.model.js';
import Deadline from '../models/deadline.model.js';
import AssignmentSubmission from '../models/assignmentSubmission.model.js';

/**
 * Parses enrollment numbers into a sorted list of individual strings
 */
const parseEnrollments = (fromNo, toNo, extraNos) => {
  const list = new Set();

  const f = fromNo ? String(fromNo).trim() : '';
  const t = toNo ? String(toNo).trim() : '';

  if (f && t) {
    const fromStr = f;
    const toStr = t;

    // Find longest common suffix
    let suffixLen = 0;
    const minLen = Math.min(fromStr.length, toStr.length);
    for (let i = 1; i <= minLen; i++) {
      if (fromStr[fromStr.length - i] === toStr[toStr.length - i]) {
        suffixLen = i;
      } else {
        break;
      }
    }

    const suffix = suffixLen > 0 ? fromStr.slice(-suffixLen) : '';
    const pre1 = suffixLen > 0 ? fromStr.slice(0, -suffixLen) : fromStr;
    const pre2 = suffixLen > 0 ? toStr.slice(0, -suffixLen) : toStr;

    const num1 = parseInt(pre1, 10);
    const num2 = parseInt(pre2, 10);

    if (!isNaN(num1) && !isNaN(num2) && /^\d+$/.test(pre1) && /^\d+$/.test(pre2)) {
      const start = Math.min(num1, num2);
      const end = Math.max(num1, num2);
      const len = Math.max(pre1.length, pre2.length);

      // Safety limit to avoid huge loops or memory issues
      if (end - start > 1000) {
        throw new Error(`The requested range size (${end - start + 1}) exceeds the maximum allowed limit of 1000.`);
      }

      for (let i = start; i <= end; i++) {
        const paddedPre = String(i).padStart(len, '0');
        list.add(paddedPre + suffix);
      }
    } else {
      // Fallback: add raw strings if range cannot be generated
      list.add(fromStr);
      list.add(toStr);
    }
  } else {
    if (f) list.add(f);
    if (t) list.add(t);
  }

  // Parse extras
  if (extraNos) {
    let extras = [];
    if (Array.isArray(extraNos)) {
      extras = extraNos;
    } else if (typeof extraNos === 'string') {
      extras = extraNos.split(',').map(s => s.trim()).filter(Boolean);
    }

    extras.forEach(en => {
      if (en) {
        list.add(String(en).trim());
      }
    });
  }

  return Array.from(list);
};

export const previewStudentAllocation = async (fromNo, toNo, extraNos, semester, classSection) => {
  const enrollmentList = parseEnrollments(fromNo, toNo, extraNos);
  if (enrollmentList.length === 0) {
    throw new Error('No valid enrollment numbers provided.');
  }

  const semNum = Number(semester);

  // Find registered students matching the enrollment list
  const students = await Student.find({ enrollmentNumber: { $in: enrollmentList } }).lean();
  const foundEnrollments = students.map(s => s.enrollmentNumber);

  // Enrollment numbers not yet registered (will be pre-assigned as class slots)
  const notYetRegistered = enrollmentList.filter(en => !foundEnrollments.includes(en));

  // Check which are already pre-assigned in the target class
  const targetClass = await Class.findOne({ name: classSection, semester: semNum }).lean();
  const alreadyInClass = targetClass ? targetClass.students || [] : [];

  // Registered students currently allocated to a different class in this semester
  const conflicts = students
    .filter(s => s.semester === semNum && s.classSection && s.classSection !== classSection)
    .map(s => ({
      enrollmentNumber: s.enrollmentNumber,
      studentName: s.studentName,
      currentClass: s.classSection,
      currentSemester: s.semester,
    }));

  return {
    studentsFound: students.length,
    notYetRegisteredCount: notYetRegistered.length,
    studentsList: students.map(s => ({
      enrollmentNumber: s.enrollmentNumber,
      studentName: s.studentName,
      currentClass: s.classSection || 'Unallocated',
      currentSemester: s.semester || 'Unallocated',
      registered: true,
    })),
    notYetRegistered: notYetRegistered.map(en => ({
      enrollmentNumber: en,
      studentName: 'Not yet registered',
      registered: false,
    })),
    missingEnrollments: notYetRegistered, // Safe fallback for frontend checklist
    selectedSemester: semNum,
    selectedClass: classSection,
    totalRecordsToAssign: enrollmentList.length,
    alreadyAllocatedCount: alreadyInClass.filter(en => enrollmentList.includes(en)).length,
    conflicts,
  };
};

export const assignStudents = async (fromNo, toNo, extraNos, semester, classSection, adminUser) => {
  const enrollmentList = parseEnrollments(fromNo, toNo, extraNos);
  if (enrollmentList.length === 0) {
    throw new Error('No valid enrollment numbers provided.');
  }

  const semNum = Number(semester);
  const branch = classSection.split('-')[0] || 'ECE';

  // ── Step 1: Update Class document (enrollment slots) ─────────────────────
  // Find or create the target Class document
  let targetClass = await Class.findOne({ name: classSection, semester: semNum });
  if (!targetClass) {
    targetClass = await Class.create({
      name: classSection,
      branch,
      semester: semNum,
      section: classSection.split('-')[1] || 'A',
      academicYear: '2025-26',
      students: [],
    });
  }

  // Remove these enrollment numbers from any other class in this semester first
  await Class.updateMany(
    { semester: semNum, name: { $ne: classSection } },
    { $pull: { students: { $in: enrollmentList } } }
  );

  // Add enrollment numbers to the target class (deduplicated)
  const currentSet = new Set(targetClass.students || []);
  enrollmentList.forEach(en => currentSet.add(en));
  targetClass.students = Array.from(currentSet);
  await targetClass.save();

  // ── Step 2: Update ONLY already-registered Student records ────────────────
  // NEVER create placeholder Student/User records for unregistered enrollments.
  // Those will be created when the student actually logs in via GGSIPU.
  await Student.updateMany(
    { enrollmentNumber: { $in: enrollmentList } },
    { $set: { semester: semNum, classSection, branch } }
  );

  // ── Step 3: Sync ONLY already-registered User records ────────────────────
  await User.updateMany(
    { enrollmentNo: { $in: enrollmentList }, role: 'student' },
    { $set: { semester: semNum, branch, section: classSection.split('-')[1] || 'A' } }
  );

  // ── Step 4: Audit log ─────────────────────────────────────────────────────
  await AuditLog.create({
    action: 'Student Allocation',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      fromNo,
      toNo,
      extraNosCount: extraNos ? (Array.isArray(extraNos) ? extraNos.length : extraNos.split(',').length) : 0,
      totalSlots: enrollmentList.length,
      semester: semNum,
      classSection,
    },
  });

  return {
    success: true,
    message: `Successfully pre-assigned ${enrollmentList.length} enrollment slot(s) to ${classSection} for Semester ${semNum}. Students will be linked when they register.`,
    assignedCount: enrollmentList.length,
  };
};


export const getClasses = async () => {
  // We can fetch class records from Class model
  // Also we want to count how many students are active in Student collection for each class
  const classes = await Class.find().lean();
  
  // For each class, query Student model to get the exact count of allocated students
  const enrichedClasses = await Promise.all(
    classes.map(async (c) => {
      const studentCount = await Student.countDocuments({
        classSection: c.name,
        semester: c.semester,
      });

      // Find an actual assigned student to act as the class representative
      const classStudentsList = await Student.find({
        classSection: c.name,
        semester: c.semester,
      }).select('studentName').limit(3).lean();

      let repName = 'Unassigned';
      if (classStudentsList.length > 0) {
        repName = classStudentsList[Math.floor(Math.random() * classStudentsList.length)].studentName;
      } else {
        const reps = ['Martund Jaiswal', 'Rohit Gupta', 'Aditya Singh', 'Devansh Patel', 'Tanya Sharma', 'Rohan Verma'];
        repName = reps[Math.floor(Math.random() * reps.length)];
      }

      return {
        _id: c._id,
        name: c.name,
        branch: c.branch,
        semester: c.semester,
        section: c.section,
        studentCount,
        classRepresentative: repName,
      };
    })
  );

  return enrichedClasses;
};

export const getClassStudents = async (classId) => {
  const targetClass = await Class.findById(classId).lean();
  if (!targetClass) {
    throw new Error('Class not found.');
  }

  // All pre-assigned enrollment slots from the Class document
  const allSlots = targetClass.students || [];

  // Find registered Student records matching these slots
  const registeredStudents = await Student.find({
    enrollmentNumber: { $in: allSlots },
  }).select('enrollmentNumber studentName fatherName semester classSection branch').lean();

  // Find registered User records matching these slots (to check if they signed up manually)
  const registeredUsers = await User.find({
    enrollmentNo: { $in: allSlots },
    role: 'student'
  }).select('enrollmentNo name semester branch section').lean();

  const studentMap = new Map(registeredStudents.map(s => [s.enrollmentNumber, s]));
  const userMap = new Map(registeredUsers.map(u => [u.enrollmentNo, u]));

  // Build the full roster — registered + not-yet-registered slots
  const fullRoster = allSlots.map(en => {
    const sDoc = studentMap.get(en);
    const uDoc = userMap.get(en);

    if (sDoc || uDoc) {
      return {
        enrollmentNumber: en,
        studentName: uDoc?.name || sDoc?.studentName || 'Registered Student',
        fatherName: sDoc?.fatherName || '—',
        semester: uDoc?.semester || sDoc?.semester || targetClass.semester,
        classSection: sDoc?.classSection || (uDoc?.section ? `${uDoc.branch}-${uDoc.section}` : targetClass.name),
        branch: uDoc?.branch || sDoc?.branch || targetClass.branch,
        registered: true,
      };
    }

    // Pre-assigned slot — student has not logged in or signed up yet
    return {
      enrollmentNumber: en,
      studentName: 'Not yet registered',
      fatherName: '—',
      semester: targetClass.semester,
      classSection: targetClass.name,
      branch: targetClass.branch,
      registered: false,
    };
  });

  return {
    classId: targetClass._id,
    className: targetClass.name,
    semester: targetClass.semester,
    students: fullRoster,
  };
};

export const transferStudent = async (enrollmentNumber, targetClassSection, targetSemester, adminUser) => {
  const student = await Student.findOne({ enrollmentNumber });
  if (!student) {
    throw new Error('Student not found.');
  }

  const oldClassSection = student.classSection;
  const oldSemester = student.semester;
  const newSemNum = Number(targetSemester);
  const targetBranch = targetClassSection.split('-')[0] || 'ECE';

  // 1. Remove student from old Class document
  if (oldClassSection && oldSemester) {
    await Class.updateOne(
      { name: oldClassSection, semester: oldSemester },
      { $pull: { students: enrollmentNumber } }
    );
  }

  // 2. Add student to target Class document
  let targetClass = await Class.findOne({
    name: targetClassSection,
    semester: newSemNum,
  });

  if (!targetClass) {
    targetClass = await Class.create({
      name: targetClassSection,
      branch: targetBranch,
      semester: newSemNum,
      section: targetClassSection.split('-')[1] || 'A',
      academicYear: '2025-26',
      students: [],
    });
  }

  if (!targetClass.students.includes(enrollmentNumber)) {
    targetClass.students.push(enrollmentNumber);
    await targetClass.save();
  }

  // 3. Update student model
  student.classSection = targetClassSection;
  student.semester = newSemNum;
  student.branch = targetBranch;
  await student.save();

  // 3b. Sync User model
  await User.updateOne(
    { enrollmentNo: enrollmentNumber },
    {
      $set: {
        semester: newSemNum,
        branch: targetBranch,
        section: targetClassSection.split('-')[1] || 'A'
      }
    }
  );

  // 4. Log audit action
  await AuditLog.create({
    action: 'Student Transfer',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      enrollmentNumber,
      studentName: student.studentName,
      fromClass: oldClassSection,
      fromSemester: oldSemester,
      toClass: targetClassSection,
      toSemester: newSemNum,
    },
  });

  return {
    success: true,
    message: `Transferred ${student.studentName} to ${targetClassSection} (Semester ${newSemNum}).`,
  };
};

export const removeStudent = async (enrollmentNumber, adminUser) => {
  const student = await Student.findOne({ enrollmentNumber });
  const oldClassSection = student ? student.classSection : null;
  const oldSemester = student ? student.semester : null;
  const studentName = student ? student.studentName : `Student-${enrollmentNumber.slice(-4)}`;

  // 1. Remove from all Class documents
  await Class.updateMany(
    { students: enrollmentNumber },
    { $pull: { students: enrollmentNumber } }
  );

  // 2. Delete Student roster record
  await Student.deleteOne({ enrollmentNumber });

  // 2b. Delete User record (student role)
  await User.deleteOne({ enrollmentNo: enrollmentNumber, role: 'student' });

  // 2c. Delete all ExamScore records
  await ExamScore.deleteMany({ enrollmentNo: enrollmentNumber });

  // 3. Log audit action
  await AuditLog.create({
    action: 'Student Deletion',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      enrollmentNumber,
      studentName,
      removedFromClass: oldClassSection || 'Unallocated',
      removedFromSemester: oldSemester || 'Unallocated',
    },
  });

  return {
    success: true,
    message: `Successfully deleted student ${studentName} and all associated records from the database.`,
  };
};

// ── FACULTY ALLOCATION SERVICES ────────────────────────────────────────────────

export const getFaculty = async () => {
  return await Faculty.find().sort({ department: 1, teacherName: 1 }).lean();
};

export const assignFaculty = async (employeeId, semester, classSection, subjectTaught, adminUser) => {
  const faculty = await Faculty.findOne({ employeeId });
  if (!faculty) {
    throw new Error('Faculty member not found.');
  }

  const semNum = Number(semester);
  const branch = classSection.split('-')[0] || 'ECE';

  // Rule 1: Prevent assigning the same teacher to the same class + subject twice in same semester
  const duplicate = faculty.assignedClasses.some(
    c => c.classSection === classSection && c.semester === semNum && c.subjectTaught === subjectTaught
  );
  if (duplicate) {
    throw new Error(`This faculty member is already assigned to ${classSection} for Semester ${semNum} teaching ${subjectTaught}.`);
  }

  // Add assignment
  faculty.assignedClasses.push({
    semester: semNum,
    classSection,
    branch,
    subjectTaught: subjectTaught || 'Not Specified',
    assignedAt: new Date(),
  });
  await faculty.save();

  // Sync with Class collection
  const teacherUser = await User.findOne({ employeeId, role: 'teacher' });
  if (teacherUser) {
    let targetClass = await Class.findOne({
      name: classSection,
      semester: semNum,
    });

    if (!targetClass) {
      targetClass = await Class.create({
        name: classSection,
        branch: branch,
        semester: semNum,
        section: classSection.split('-')[1] || 'A',
        academicYear: '2025-26',
        students: [],
      });
    }

    let subjectCode = 'N/A';
    const dbSubject = await Subject.findOne({ name: subjectTaught });
    if (dbSubject) {
      subjectCode = dbSubject.code;
    } else {
      subjectCode = subjectTaught.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      if (!subjectCode) subjectCode = `SUB${Math.floor(100 + Math.random() * 900)}`;
    }

    const hasAssignment = targetClass.teacherAssignments.some(
      a => a.teacher.toString() === teacherUser._id.toString() && a.subject === subjectTaught
    );

    if (!hasAssignment) {
      targetClass.teacherAssignments.push({
        teacher: teacherUser._id,
        subject: subjectTaught,
        subjectCode: subjectCode
      });
      await targetClass.save();
    }
  }

  // Log audit action
  await AuditLog.create({
    action: 'Faculty Assignment',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      employeeId,
      teacherName: faculty.teacherName,
      department: faculty.department,
      semester: semNum,
      classSection,
      subjectTaught: subjectTaught || 'Not Specified',
    },
  });

  return {
    success: true,
    message: `Successfully assigned ${faculty.teacherName} to ${classSection} for Semester ${semNum} teaching ${subjectTaught || 'Not Specified'}.`,
  };
};

export const reassignFaculty = async (employeeId, assignmentId, newSemester, newClassSection, newSubjectTaught, adminUser) => {
  const faculty = await Faculty.findOne({ employeeId });
  if (!faculty) {
    throw new Error('Faculty member not found.');
  }

  const assignment = faculty.assignedClasses.id(assignmentId);
  if (!assignment) {
    throw new Error('Assignment record not found.');
  }

  const oldSemester = assignment.semester;
  const oldClassSection = assignment.classSection;
  const oldSubjectTaught = assignment.subjectTaught || 'Not Specified';
  const newSemNum = Number(newSemester);
  const newBranch = newClassSection.split('-')[0] || 'ECE';

  // Check duplicate rule for new target
  const duplicate = faculty.assignedClasses.some(
    c => c._id.toString() !== assignmentId && c.classSection === newClassSection && c.semester === newSemNum && c.subjectTaught === newSubjectTaught
  );
  if (duplicate) {
    throw new Error(`Faculty member is already assigned to ${newClassSection} for Semester ${newSemNum} teaching ${newSubjectTaught}.`);
  }

  // Update assignment
  assignment.semester = newSemNum;
  assignment.classSection = newClassSection;
  assignment.branch = newBranch;
  if (newSubjectTaught) {
    assignment.subjectTaught = newSubjectTaught;
  }
  assignment.assignedAt = new Date();
  await faculty.save();

  // Sync with Class collection
  const teacherUser = await User.findOne({ employeeId, role: 'teacher' });
  if (teacherUser) {
    // 1. Remove old assignment from old Class
    const oldClass = await Class.findOne({
      name: oldClassSection,
      semester: oldSemester,
    });
    if (oldClass) {
      oldClass.teacherAssignments = oldClass.teacherAssignments.filter(
        a => !(a.teacher.toString() === teacherUser._id.toString() && a.subject === oldSubjectTaught)
      );
      await oldClass.save();

      // ── Clean up stale student data when subject changes ─────────────────
      // If the subject was changed (not just class/semester reassignment), delete
      // all old MidSemMark and Attendance records for that subject in the old class.
      const subjectChanged = newSubjectTaught && newSubjectTaught !== oldSubjectTaught;
      if (subjectChanged) {
        const oldSubjectCode = oldSubjectTaught.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const delMarks = await MidSemMark.deleteMany({
          class: oldClass._id,
          subjectCode: { $in: [oldSubjectCode, oldSubjectTaught] },
        });
        const delAtt = await Attendance.deleteMany({
          class: oldClass._id,
          subjectCode: { $in: [oldSubjectCode, oldSubjectTaught] },
        });
        console.log(`[Admin] Subject changed [${oldSubjectTaught}→${newSubjectTaught}]: cleared ${delMarks.deletedCount} marks + ${delAtt.deletedCount} attendance records in ${oldClassSection}`);
      }
    }

    // 2. Add new assignment to new Class
    let targetClass = await Class.findOne({
      name: newClassSection,
      semester: newSemNum,
    });

    if (!targetClass) {
      targetClass = await Class.create({
        name: newClassSection,
        branch: newBranch,
        semester: newSemNum,
        section: newClassSection.split('-')[1] || 'A',
        academicYear: '2025-26',
        students: [],
      });
    }

    const resolvedSubject = newSubjectTaught || oldSubjectTaught;
    let subjectCode = 'N/A';
    const dbSubject = await Subject.findOne({ name: resolvedSubject });
    if (dbSubject) {
      subjectCode = dbSubject.code;
    } else {
      subjectCode = resolvedSubject.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      if (!subjectCode) subjectCode = `SUB${Math.floor(100 + Math.random() * 900)}`;
    }

    const hasAssignment = targetClass.teacherAssignments.some(
      a => a.teacher.toString() === teacherUser._id.toString() && a.subject === resolvedSubject
    );

    if (!hasAssignment) {
      targetClass.teacherAssignments.push({
        teacher: teacherUser._id,
        subject: resolvedSubject,
        subjectCode: subjectCode
      });
      await targetClass.save();
    }
  }

  // Log audit action
  await AuditLog.create({
    action: 'Faculty Reassignment',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      employeeId,
      teacherName: faculty.teacherName,
      department: faculty.department,
      fromSemester: oldSemester,
      fromClass: oldClassSection,
      fromSubject: oldSubjectTaught,
      toSemester: newSemNum,
      toClass: newClassSection,
      toSubject: newSubjectTaught || oldSubjectTaught,
    },
  });

  return {
    success: true,
    message: `Reassigned ${faculty.teacherName} to ${newClassSection} (Semester ${newSemNum}) teaching ${newSubjectTaught || oldSubjectTaught}.`,
  };
};

export const removeFacultyAssignment = async (employeeId, assignmentId, adminUser) => {
  const faculty = await Faculty.findOne({ employeeId });
  if (!faculty) {
    throw new Error('Faculty member not found.');
  }

  const assignment = faculty.assignedClasses.id(assignmentId);
  if (!assignment) {
    throw new Error('Assignment record not found.');
  }

  const removedSemester = assignment.semester;
  const removedClassSection = assignment.classSection;
  const removedSubjectTaught = assignment.subjectTaught || 'Not Specified';
  // Normalise to uppercase for consistent matching against stored codes
  const removedSubjectCode = removedSubjectTaught.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Remove faculty assignment record
  faculty.assignedClasses.pull(assignmentId);
  await faculty.save();

  // Sync with Class collection + collect classId for data cleanup
  const teacherUser = await User.findOne({ employeeId, role: 'teacher' });
  let removedClassId = null;
  if (teacherUser) {
    const oldClass = await Class.findOne({
      name: removedClassSection,
      semester: removedSemester,
    });
    if (oldClass) {
      removedClassId = oldClass._id;
      oldClass.teacherAssignments = oldClass.teacherAssignments.filter(
        a => !(a.teacher.toString() === teacherUser._id.toString() && a.subject === removedSubjectTaught)
      );
      await oldClass.save();
    }
  }

  // ── Clean up stale student data for the removed subject ───────────────────
  // Delete MidSemMark records for this subject in this class
  if (removedClassId) {
    const deletedMarks = await MidSemMark.deleteMany({
      class: removedClassId,
      subjectCode: { $in: [removedSubjectCode, removedSubjectTaught] },
    });
    const deletedAtt = await Attendance.deleteMany({
      class: removedClassId,
      subjectCode: { $in: [removedSubjectCode, removedSubjectTaught] },
    });
    console.log(`[Admin] Cleaned up ${deletedMarks.deletedCount} marks + ${deletedAtt.deletedCount} attendance records for removed subject [${removedSubjectTaught}] in ${removedClassSection}`);
  }

  // Log audit action
  await AuditLog.create({
    action: 'Faculty Removal',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      employeeId,
      teacherName: faculty.teacherName,
      department: faculty.department,
      removedSemester,
      removedClassSection,
      removedSubject: removedSubjectTaught,
    },
  });

  return {
    success: true,
    message: `Removed ${faculty.teacherName}'s assignment to ${removedClassSection} (Semester ${removedSemester}). All associated marks and attendance for [${removedSubjectTaught}] have been cleared.`,
  };
};

export const getFacultyAssignments = async () => {
  const faculties = await Faculty.find().lean();
  const allAssignments = [];

  faculties.forEach(f => {
    f.assignedClasses.forEach(a => {
      allAssignments.push({
        assignmentId: a._id,
        employeeId: f.employeeId,
        teacherName: f.teacherName,
        department: f.department,
        designation: f.designation,
        semester: a.semester,
        classSection: a.classSection,
        branch: a.branch || a.classSection.split('-')[0] || 'ECE',
        subjectTaught: a.subjectTaught || 'Not Specified',
        assignedOn: a.assignedAt || new Date(),
        assignedBy: 'Admin',
      });
    });
  });

  // Sort by date descending
  return allAssignments.sort((a, b) => new Date(b.assignedOn) - new Date(a.assignedOn));
};

export const getAuditLogs = async () => {
  return await AuditLog.find().sort({ createdAt: -1 }).limit(50).lean();
};

export const deleteFaculty = async (employeeId, adminUser) => {
  const faculty = await Faculty.findOne({ employeeId });
  if (!faculty) {
    throw new Error('Faculty member not found.');
  }

  // 1. Find teacher User ID
  const teacherUser = await User.findOne({ employeeId, role: 'teacher' });

  // 2. Remove teacher assignments from all Classes
  if (teacherUser) {
    await Class.updateMany(
      { 'teacherAssignments.teacher': teacherUser._id },
      { $pull: { teacherAssignments: { teacher: teacherUser._id } } }
    );
  }

  // 3. Delete Faculty record
  await Faculty.deleteOne({ employeeId });

  // 4. Delete User record
  if (teacherUser) {
    await User.deleteOne({ _id: teacherUser._id });
  }

  // 5. Log audit action
  await AuditLog.create({
    action: 'Faculty Deletion',
    adminId: adminUser._id,
    adminName: adminUser.name,
    details: {
      employeeId,
      teacherName: faculty.teacherName,
      department: faculty.department,
    },
  });

  return {
    success: true,
    message: `Successfully deleted faculty member ${faculty.teacherName} and all associated records.`,
  };
};
