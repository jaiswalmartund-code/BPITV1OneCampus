import * as allocationService from '../services/allocation.service.js';

export const previewAllocation = async (req, res, next) => {
  try {
    const { fromEnrollmentNumber, toEnrollmentNumber, extraEnrollmentNumbers, semester, classSection } = req.body;
    if (!semester || !classSection) {
      res.status(400);
      throw new Error('Semester and Class / Section are required for preview.');
    }

    const preview = await allocationService.previewStudentAllocation(
      fromEnrollmentNumber,
      toEnrollmentNumber,
      extraEnrollmentNumbers,
      semester,
      classSection
    );
    res.json(preview);
  } catch (error) {
    next(error);
  }
};

export const assignStudents = async (req, res, next) => {
  try {
    const { fromEnrollmentNumber, toEnrollmentNumber, extraEnrollmentNumbers, semester, classSection } = req.body;
    if (!semester || !classSection) {
      res.status(400);
      throw new Error('Semester and Class / Section are required for allocation.');
    }

    const result = await allocationService.assignStudents(
      fromEnrollmentNumber,
      toEnrollmentNumber,
      extraEnrollmentNumbers,
      semester,
      classSection,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (req, res, next) => {
  try {
    const classes = await allocationService.getClasses();
    res.json(classes);
  } catch (error) {
    next(error);
  }
};

export const getClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await allocationService.getClassStudents(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const transferStudent = async (req, res, next) => {
  try {
    const { enrollmentNumber, targetClassSection, targetSemester } = req.body;
    if (!enrollmentNumber || !targetClassSection || !targetSemester) {
      res.status(400);
      throw new Error('Enrollment number, target class section, and target semester are required.');
    }

    const result = await allocationService.transferStudent(
      enrollmentNumber,
      targetClassSection,
      targetSemester,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const removeStudent = async (req, res, next) => {
  try {
    const { enrollmentNumber } = req.body;
    if (!enrollmentNumber) {
      res.status(400);
      throw new Error('Enrollment number is required to remove student.');
    }

    const result = await allocationService.removeStudent(enrollmentNumber, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFaculty = async (req, res, next) => {
  try {
    const faculty = await allocationService.getFaculty();
    res.json(faculty);
  } catch (error) {
    next(error);
  }
};

export const assignFaculty = async (req, res, next) => {
  try {
    const { employeeId, semester, classSection, subjectTaught } = req.body;
    if (!employeeId || !semester || !classSection) {
      res.status(400);
      throw new Error('Employee ID, semester, and class section are required.');
    }

    const result = await allocationService.assignFaculty(
      employeeId,
      semester,
      classSection,
      subjectTaught,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const reassignFaculty = async (req, res, next) => {
  try {
    const { employeeId, assignmentId, semester, classSection, subjectTaught } = req.body;
    if (!employeeId || !assignmentId || !semester || !classSection) {
      res.status(400);
      throw new Error('Employee ID, assignment ID, semester, and class section are required.');
    }

    const result = await allocationService.reassignFaculty(
      employeeId,
      assignmentId,
      semester,
      classSection,
      subjectTaught,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const removeFacultyAssignment = async (req, res, next) => {
  try {
    const { id } = req.params; // assignmentId
    const { employeeId } = req.body; // faculty employeeId
    if (!employeeId || !id) {
      res.status(400);
      throw new Error('Employee ID and Assignment ID are required.');
    }

    const result = await allocationService.removeFacultyAssignment(
      employeeId,
      id,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFacultyAssignments = async (req, res, next) => {
  try {
    const assignments = await allocationService.getFacultyAssignments();
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await allocationService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const deleteFaculty = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      res.status(400);
      throw new Error('Employee ID is required.');
    }

    const result = await allocationService.deleteFaculty(employeeId, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
