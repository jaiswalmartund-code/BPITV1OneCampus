import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Trash2,
  ArrowLeftRight,
  Clock,
  X,
  ChevronRight,
  Plus,
  Filter,
  Download,
  LogOut,
  UserCheck,
  Building,
  UserMinus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import api from '../services/api.js';

const AdminPortal = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'faculty'

  // Student Allocation Form State
  const [fromEnrollment, setFromEnrollment] = useState('');
  const [toEnrollment, setToEnrollment] = useState('');
  const [extraEnrollmentInput, setExtraEnrollmentInput] = useState('');
  const [extraEnrollments, setExtraEnrollments] = useState([]); // array of tags
  const [semester, setSemester] = useState('4');
  const [classSection, setClassSection] = useState('ECE-A');

  // Preview State
  const [previewData, setPreviewData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);

  // Class Records State
  const [classes, setClasses] = useState([]);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('All');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Selected Class & Students Drawer State
  const [selectedClassRecord, setSelectedClassRecord] = useState(null); // the class we are viewing students for
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentsDrawer, setShowStudentsDrawer] = useState(false);

  // Transfer / Move Student State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState(null);
  const [transferSemester, setTransferSemester] = useState('4');
  const [transferClassSection, setTransferClassSection] = useState('ECE-A');
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  // Allocation History State
  const [auditLogs, setAuditLogs] = useState([]);

  // Faculty Allocation State
  const [facultyList, setFacultyList] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherDepartmentFilter, setTeacherDepartmentFilter] = useState('All');
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');

  // Faculty Assignment inputs (local states per faculty row)
  const [rowSemesters, setRowSemesters] = useState({}); // employeeId -> semester
  const [rowClasses, setRowClasses] = useState({}); // employeeId -> classSection
  const [rowSubjects, setRowSubjects] = useState({}); // employeeId -> subjectTaught
  const [subjectsList, setSubjectsList] = useState([]);

  // Faculty Reassign Modal State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [assignmentToReassign, setAssignmentToReassign] = useState(null); // { employeeId, assignmentId, ... }
  const [reassignSemester, setReassignSemester] = useState('4');
  const [reassignClassSection, setReassignClassSection] = useState('ECE-A');
  const [reassignSubjectTaught, setReassignSubjectTaught] = useState('');
  const [loadingReassign, setLoadingReassign] = useState(false);

  // Notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Guard routing
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load Initial Data
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchClasses();
      fetchAuditLogs();
      fetchFacultyData();
      fetchFacultyAssignments();
      fetchSubjects();
    }
  }, [user]);

  // Fetch Class Records
  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/admin/classes');
      const classArray = Array.isArray(data) ? data : (data && Array.isArray(data.classes) ? data.classes : []);
      setClasses(classArray);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch class records', 'error');
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const { data } = await api.get('/admin/audit-logs');
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.logs) ? data.logs : []);
      setAuditLogs(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Faculty List
  const fetchFacultyData = async () => {
    try {
      const { data } = await api.get('/admin/faculty');
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.faculty) ? data.faculty : []);
      setFacultyList(list);
      // Initialize row selectors
      const sems = {};
      const cls = {};
      list.forEach(f => {
        if (f.employeeId) {
          sems[f.employeeId] = '4';
          cls[f.employeeId] = (f.department || '') === 'BBA' ? 'BBA-1st shift' : 'ECE-A';
        }
      });
      setRowSemesters(sems);
      setRowClasses(cls);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch faculty list', 'error');
    }
  };

  // Fetch Faculty Assignments
  const fetchFacultyAssignments = async () => {
    try {
      const { data } = await api.get('/admin/faculty/assignments');
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.assignments) ? data.assignments : []);
      setFacultyAssignments(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Subjects Master List
  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/admin/subjects');
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.subjects) ? data.subjects : []);
      setSubjectsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Add extra enrollment number tag
  const handleAddExtraEnrollment = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = extraEnrollmentInput.trim().replace(',', '');
      if (val && !extraEnrollments.includes(val)) {
        setExtraEnrollments([...extraEnrollments, val]);
      }
      setExtraEnrollmentInput('');
    }
  };

  const removeExtraEnrollment = (tag) => {
    setExtraEnrollments(extraEnrollments.filter(t => t !== tag));
  };

  // Preview Student Allocation
  const handlePreviewAllocation = async (e) => {
    e.preventDefault();
    
    let currentExtras = [...extraEnrollments];
    const rawInput = extraEnrollmentInput.trim().replace(/,$/, '');
    if (rawInput && !currentExtras.includes(rawInput)) {
      currentExtras.push(rawInput);
      setExtraEnrollments(currentExtras);
      setExtraEnrollmentInput('');
    }

    if (!fromEnrollment && !toEnrollment && currentExtras.length === 0) {
      showToast('Please enter enrollment range or extra enrollment numbers.', 'error');
      return;
    }

    setLoadingPreview(true);
    try {
      const { data } = await api.post('/admin/allocation/preview', {
        fromEnrollmentNumber: fromEnrollment,
        toEnrollmentNumber: toEnrollment,
        extraEnrollmentNumbers: currentExtras,
        semester,
        classSection
      });
      setPreviewData(data);
      showToast('Preview loaded successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error loading preview.';
      showToast(msg, 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Assign Students
  const handleAssignStudents = async () => {
    setLoadingAssign(true);
    try {
      const { data } = await api.post('/admin/allocation/assign', {
        fromEnrollmentNumber: fromEnrollment,
        toEnrollmentNumber: toEnrollment,
        extraEnrollmentNumbers: extraEnrollments,
        semester,
        classSection
      });
      showToast(data.message || 'Allocation completed successfully!');
      setShowConfirmModal(false);
      setPreviewData(null);
      // Reset form
      setFromEnrollment('');
      setToEnrollment('');
      setExtraEnrollments([]);
      // Refresh list & history
      fetchClasses();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Allocation failed.';
      showToast(msg, 'error');
    } finally {
      setLoadingAssign(false);
    }
  };

  // View Class Students
  const handleViewStudents = async (clsRecord) => {
    setSelectedClassRecord(clsRecord);
    setLoadingStudents(true);
    setShowStudentsDrawer(true);
    try {
      const { data } = await api.get(`/admin/classes/${clsRecord._id}/students`);
      setClassStudents(data.students);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch class students', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Transfer Student Submit
  const handleTransferSubmit = async () => {
    if (!studentToTransfer) return;
    setLoadingTransfer(true);
    try {
      const { data } = await api.post('/admin/students/transfer', {
        enrollmentNumber: studentToTransfer.enrollmentNumber,
        targetClassSection: transferClassSection,
        targetSemester: transferSemester
      });
      showToast(data.message || 'Student transferred successfully!');
      setShowTransferModal(false);
      setStudentToTransfer(null);
      
      // Refresh drawer students
      if (selectedClassRecord) {
        handleViewStudents(selectedClassRecord);
      }
      fetchClasses();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Transfer failed.';
      showToast(msg, 'error');
    } finally {
      setLoadingTransfer(false);
    }
  };

  // Remove Student Allocation
  const handleRemoveStudentAllocation = async (student) => {
    if (!window.confirm(`Are you sure you want to remove ${student.studentName} from all class/semester allocations?`)) {
      return;
    }
    try {
      const { data } = await api.post('/admin/students/remove', {
        enrollmentNumber: student.enrollmentNumber
      });
      showToast(data.message || 'Student removed successfully!');
      
      // Refresh drawer
      if (selectedClassRecord) {
        handleViewStudents(selectedClassRecord);
      }
      fetchClasses();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Removal failed.';
      showToast(msg, 'error');
    }
  };

  // Assign Faculty
  const handleAssignFaculty = async (faculty) => {
    const sem = rowSemesters[faculty.employeeId] || '4';
    const cls = rowClasses[faculty.employeeId] || ((faculty.department || '') === 'BBA' ? 'BBA-1st shift' : 'ECE-A');
    const branch = cls.split('-')[0] || 'ECE';

    // Local helper to filter subjects
    const semNum = Number(sem);
    const available = subjectsList.filter(s => s.semester === semNum && s.branch === branch);

    let subj = rowSubjects[faculty.employeeId];
    if (!subj) {
      if (available.length > 0) {
        subj = available[0].name;
      }
    }

    if (!subj || !subj.trim()) {
      showToast('Please specify a subject taught', 'error');
      return;
    }

    try {
      const { data } = await api.post('/admin/faculty/assign', {
        employeeId: faculty.employeeId,
        semester: sem,
        classSection: cls,
        subjectTaught: subj.trim()
      });
      showToast(data.message || 'Faculty assigned successfully.');
      fetchFacultyData();
      fetchFacultyAssignments();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Faculty assignment failed.';
      showToast(msg, 'error');
    }
  };

  // Delete Teacher completely from database
  const handleDeleteTeacher = async (faculty) => {
    if (!window.confirm(`Are you sure you want to delete ${faculty.teacherName} (EMP ID: ${faculty.employeeId}) and all of their class assignments? This action cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await api.delete(`/admin/faculty/${faculty.employeeId}`);
      showToast(data.message || 'Teacher deleted successfully.');
      fetchFacultyData();
      fetchFacultyAssignments();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete teacher.';
      showToast(msg, 'error');
    }
  };

  // Reassign Faculty Submit
  const handleReassignSubmit = async () => {
    if (!assignmentToReassign) return;
    setLoadingReassign(true);

    const branch = reassignClassSection.split('-')[0] || 'ECE';
    const sem = Number(reassignSemester);
    const available = subjectsList.filter(s => s.semester === sem && s.branch === branch);

    let subj = reassignSubjectTaught;
    if (!subj) {
      if (available.length > 0) {
        subj = available[0].name;
      }
    }

    try {
      const { data } = await api.post('/admin/faculty/reassign', {
        employeeId: assignmentToReassign.employeeId,
        assignmentId: assignmentToReassign.assignmentId,
        semester: reassignSemester,
        classSection: reassignClassSection,
        subjectTaught: subj ? subj.trim() : undefined
      });
      showToast(data.message || 'Faculty reassigned successfully!');
      setShowReassignModal(false);
      setAssignmentToReassign(null);
      fetchFacultyAssignments();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Reassignment failed.';
      showToast(msg, 'error');
    } finally {
      setLoadingReassign(false);
    }
  };

  // Remove Faculty Assignment
  const handleRemoveFacultyAssignment = async (assignObj) => {
    if (!window.confirm(`Remove assignment of ${assignObj.teacherName} to ${assignObj.classSection} (Sem ${assignObj.semester})?`)) {
      return;
    }
    try {
      const { data } = await api.delete(`/admin/faculty/assignment/${assignObj.assignmentId}`, {
        data: { employeeId: assignObj.employeeId }
      });
      showToast(data.message || 'Assignment removed successfully.');
      fetchFacultyAssignments();
      fetchAuditLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove assignment.';
      showToast(msg, 'error');
    }
  };

  // Export Faculty Assignments to CSV
  const handleExportAssignments = () => {
    if (facultyAssignments.length === 0) {
      showToast('No assignments to export', 'error');
      return;
    }

    const headers = ['Faculty Name', 'Department', 'Semester', 'Class Section', 'Assigned On', 'Assigned By'];
    const rows = facultyAssignments.map(a => [
      a.teacherName,
      a.department,
      `Semester ${a.semester}`,
      a.classSection,
      new Date(a.assignedOn).toLocaleString(),
      a.assignedBy
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Faculty_Assignments_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Assignments exported successfully!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter Classes
  const filteredClasses = (classes || []).filter(c => {
    const matchSem = selectedSemesterFilter === 'All' || c.semester === Number(selectedSemesterFilter);
    const matchBranch = selectedBranchFilter === 'All' || c.branch === selectedBranchFilter;
    const matchClass = selectedClassFilter === 'All' || c.name === selectedClassFilter;
    const matchSearch = (c.name || '').toLowerCase().includes((classSearchQuery || '').toLowerCase());
    return matchSem && matchBranch && matchClass && matchSearch;
  });

  // Filter Faculty
  const filteredFaculty = (facultyList || []).filter(f => {
    const matchSearch = (f.teacherName || '').toLowerCase().includes((teacherSearchQuery || '').toLowerCase()) || (f.employeeId || '').toLowerCase().includes((teacherSearchQuery || '').toLowerCase());
    const matchDept = teacherDepartmentFilter === 'All' || f.department === teacherDepartmentFilter;
    return matchSearch && matchDept;
  });

  // Filter Faculty Assignments
  const filteredAssignments = (facultyAssignments || []).filter(a => {
    const matchSearch = (a.teacherName || '').toLowerCase().includes((assignmentSearchQuery || '').toLowerCase()) || (a.classSection || '').toLowerCase().includes((assignmentSearchQuery || '').toLowerCase());
    return matchSearch;
  });

  // Unique lists for filters
  const uniqueBranches = Array.from(new Set((classes || []).map(c => c.branch).filter(Boolean)));
  const uniqueClassNames = Array.from(new Set((classes || []).map(c => c.name).filter(Boolean)));
  const uniqueDepartments = Array.from(new Set((facultyList || []).map(f => f.department).filter(Boolean)));

  // CSS Style Tokens matching premium dashboard architecture
  const style = {
    body: {
      backgroundColor: 'var(--bg-body)',
      minHeight: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 40px',
      backgroundColor: 'var(--bg-body)',
      borderBottom: '1px solid var(--border-dim)',
      zIndex: 100,
      position: 'sticky',
      top: 0
    },
    navPillOuter: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'var(--bg-nav-pill-outer)',
      border: '1px solid var(--border-nav-pill)',
      padding: '4px',
      borderRadius: '9999px',
      gap: '4px'
    },
    tabBtn: (isActive) => ({
      padding: '8px 24px',
      fontSize: '13px',
      fontWeight: '600',
      borderRadius: '9999px',
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--bg-active-pill)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      outline: 'none'
    }),
    container: {
      maxWidth: '1280px',
      width: '100%',
      margin: '0 auto',
      padding: '32px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      boxSizing: 'border-box'
    },
    card: {
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-card)',
      padding: '24px',
      position: 'relative',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.015)',
      border: '1px solid var(--border-dim)',
      borderRadius: '10px',
      padding: '12px 16px',
      color: 'var(--text-primary)',
      fontSize: '13px',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'all 0.25s ease',
      boxSizing: 'border-box',
      width: '100%'
    },
    select: {
      backgroundColor: 'var(--bg-dropdown)',
      border: '1px solid var(--border-dim)',
      borderRadius: '10px',
      padding: '12px 16px',
      color: 'var(--text-primary)',
      fontSize: '13px',
      fontFamily: 'inherit',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
      width: '100%'
    },
    label: {
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      letterSpacing: '0.5px',
      display: 'block'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #5e5ce6 0%, #7c3aed 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 24px',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(94, 92, 230, 0.15)',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      outline: 'none'
    },
    btnSecondary: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-dim)',
      borderRadius: '10px',
      padding: '12px 24px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      outline: 'none'
    },
    tag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      fontWeight: '700',
      backgroundColor: 'rgba(94, 92, 230, 0.08)',
      border: '1px solid rgba(94, 92, 230, 0.15)',
      color: '#c084fc',
      padding: '4px 10px',
      borderRadius: '6px'
    }
  };

  return (
    <div style={style.body}>
      
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderRadius: '12px',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(48, 209, 88, 0.2)'}`,
          backgroundColor: 'var(--bg-dropdown)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          color: toast.type === 'error' ? '#ff453a' : '#30d158',
          backdropFilter: 'blur(16px)',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <AlertTriangle className="w-4.5 h-4.5" /> : <CheckCircle2 className="w-4.5 h-4.5" />}
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{toast.message}</span>
        </div>
      )}

      {/* Header Navbar */}
      <header style={style.header}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px', width: '18px', height: '18px' }}>
            <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
            <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#5e5ce6' }}></div>
            <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#30d158' }}></div>
            <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#ff9f0a' }}></div>
          </div>
          <span>OneCampus</span>
        </div>

        {/* Tab switchers in center */}
        <nav style={style.navPillOuter}>
          <button
            onClick={() => setActiveTab('student')}
            style={style.tabBtn(activeTab === 'student')}
          >
            Student Allocation
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            style={style.tabBtn(activeTab === 'faculty')}
          >
            Faculty Allocation
          </button>
        </nav>

        {/* Profile Card & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Admin</p>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 'bold', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Super Admin</p>
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(94, 92, 230, 0.15)', border: '1px solid rgba(94, 92, 230, 0.3)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
            A
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ff453a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Content container */}
      <main style={style.container}>

        {activeTab === 'student' ? (
          /* ====================================================
             STUDENT ALLOCATION WORKFLOWS
             ==================================================== */
          <>
            
            {/* 1. Allocation Card */}
            <section style={style.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(94, 92, 230, 0.1)', border: '1px solid rgba(94, 92, 230, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>Assign Students to Class</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Allocate students to a class using enrollment number range or add extra students.</p>
                </div>
              </div>

              {/* Form Horizontal Grid */}
              <form onSubmit={handlePreviewAllocation} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
                  
                  {/* From Enrollment */}
                  <div style={{ gridColumn: 'span 3' }}>
                    <label style={{ ...style.label, marginBottom: '6px' }}>From Enrollment Number</label>
                    <input
                      type="text"
                      placeholder="00120802824"
                      value={fromEnrollment}
                      onChange={(e) => setFromEnrollment(e.target.value)}
                      style={style.input}
                    />
                  </div>

                  {/* To Enrollment */}
                  <div style={{ gridColumn: 'span 3' }}>
                    <label style={{ ...style.label, marginBottom: '6px' }}>To Enrollment Number</label>
                    <input
                      type="text"
                      placeholder="06920802824"
                      value={toEnrollment}
                      onChange={(e) => setToEnrollment(e.target.value)}
                      style={style.input}
                    />
                  </div>

                  {/* Tag Input for Extras */}
                  <div style={{ gridColumn: 'span 6' }}>
                    <label style={{ ...style.label, marginBottom: '6px' }}>Extra Enrollment Numbers (Tag Input Field)</label>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      minHeight: '44px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      alignItems: 'center',
                      boxSizing: 'border-box'
                    }}>
                      {extraEnrollments.map(tag => (
                        <div key={tag} style={style.tag}>
                          <span>{tag}</span>
                          <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => removeExtraEnrollment(tag)} />
                        </div>
                      ))}
                      <input
                        type="text"
                        placeholder={extraEnrollments.length === 0 ? "Enter additional enrollment numbers" : ""}
                        value={extraEnrollmentInput}
                        onChange={(e) => setExtraEnrollmentInput(e.target.value)}
                        onKeyDown={handleAddExtraEnrollment}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          flex: 1,
                          minWidth: '150px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Second row: dropdowns and buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <div style={{ width: '180px' }}>
                      <label style={{ ...style.label, marginBottom: '6px' }}>Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        style={style.select}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ width: '180px' }}>
                      <label style={{ ...style.label, marginBottom: '6px' }}>Class / Section</label>
                      <select
                        value={classSection}
                        onChange={(e) => setClassSection(e.target.value)}
                        style={style.select}
                      >
                        {['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D', 'BBA-1st shift', 'BBA-2nd shift'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="submit"
                      disabled={loadingPreview}
                      style={style.btnSecondary}
                    >
                      {loadingPreview ? 'Loading...' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (previewData) {
                          setShowConfirmModal(true);
                        } else {
                          showToast('Please load Preview first to confirm details.', 'error');
                        }
                      }}
                      style={style.btnPrimary}
                    >
                      Assign Students
                    </button>
                  </div>
                </div>
              </form>

              {/* Preview Box Container */}
              {previewData && (
                <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '20px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck className="w-4 h-4 text-[#a855f7]" /> Allocation Preview
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', cursor: 'pointer' }} onClick={() => setPreviewData(null)}>Clear</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px 16px' }}>
                      <span style={style.label}>Students Found</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>{previewData.studentsFound}</span>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px 16px' }}>
                      <span style={style.label}>Selected Semester</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>Sem {previewData.selectedSemester}</span>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px 16px' }}>
                      <span style={style.label}>Selected Class</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#c084fc', display: 'block', marginTop: '4px' }}>{previewData.selectedClass}</span>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px 16px' }}>
                      <span style={style.label}>Total Records To Be Assigned</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>{previewData.totalRecordsToAssign}</span>
                    </div>
                  </div>

                  {previewData.conflicts.length > 0 && (
                    <div style={{ backgroundColor: 'rgba(255, 159, 10, 0.06)', border: '1px solid rgba(255, 159, 10, 0.15)', borderRadius: '10px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#ff9f0a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle className="w-4 h-4" /> Overlapping Ranges ({previewData.conflicts.length} students already assigned)
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                        {previewData.conflicts.map(c => (
                          <span key={c.enrollmentNumber} style={{ fontSize: '10px', backgroundColor: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.15)', color: '#ff9f0a', padding: '2px 6px', borderRadius: '4px' }}>
                            {c.studentName} ({c.currentClass})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewData.missingEnrollments.length > 0 && (
                    <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.06)', border: '1px solid rgba(255, 69, 58, 0.15)', borderRadius: '10px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#ff453a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle className="w-4 h-4" /> Missing Student Records ({previewData.missingEnrollments.length} IDs)
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '80px', overflowY: 'auto' }}>
                        {previewData.missingEnrollments.map(en => (
                          <span key={en} style={{ fontSize: '10px', backgroundColor: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.15)', color: '#ff453a', padding: '2px 6px', borderRadius: '4px' }}>
                            {en}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 2. Class Records Cards */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>Class Records</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>View and manage all active class assignments.</p>
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Semester Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Semester</span>
                    <select
                      value={selectedSemesterFilter}
                      onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: '700' }}
                    >
                      <option value="All">All</option>
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Branch</span>
                    <select
                      value={selectedBranchFilter}
                      onChange={(e) => setSelectedBranchFilter(e.target.value)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: '700' }}
                    >
                      <option value="All">All</option>
                      {uniqueBranches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    boxSizing: 'border-box'
                  }}>
                    <Search className="w-3.5 h-3.5 opacity-40 mr-2" />
                    <input
                      type="text"
                      placeholder="Search class or student..."
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        width: '160px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Roster Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                {filteredClasses.length === 0 ? (
                  <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>No matching class records found.</p>
                  </div>
                ) : (
                  filteredClasses.map((cls) => (
                    <div
                      key={cls._id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-card)',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '20px',
                        position: 'relative'
                      }}
                    >
                      {/* Top elements */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(94, 92, 230, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                          <Users className="w-4 h-4" />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: '6px' }}>
                          Semester {cls.semester}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{cls.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)' }}>{cls.studentCount}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allocated Students</span>
                        </div>
                      </div>

                      {/* Rep Detail */}
                      <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.5px' }}>Class Representative</span>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>{cls.classRepresentative}</p>
                      </div>

                      {/* View button */}
                      <button
                        onClick={() => handleViewStudents(cls)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-nav-pill-outer)',
                          border: '1px solid var(--border-nav-pill)',
                          borderRadius: '10px',
                          padding: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill-outer)'; }}
                      >
                        View Students <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 3. Recent allocations audit list */}
            <section style={style.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock className="w-4.5 h-4.5 text-[#5e5ce6]" />
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Allocation History (Audit Trail)</h3>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '240px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Timestamp</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Admin</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Action</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          No recent allocation history available.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '12px 0', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{log.adminName}</td>
                          <td style={{ padding: '12px 0' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              backgroundColor: log.action.includes('Allocation') ? 'rgba(94, 92, 230, 0.08)' : log.action.includes('Transfer') ? 'rgba(255, 159, 10, 0.08)' : 'rgba(255, 69, 58, 0.08)',
                              border: `1px solid ${log.action.includes('Allocation') ? 'rgba(94, 92, 230, 0.15)' : log.action.includes('Transfer') ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 69, 58, 0.15)'}`,
                              color: log.action.includes('Allocation') ? '#c084fc' : log.action.includes('Transfer') ? '#ff9f0a' : '#ff453a',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '12px 0', fontSize: '12.5px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                            {log.action === 'Student Allocation' && log.details && `Assigned students to ${log.details.classSection} (Sem ${log.details.semester})`}
                            {log.action === 'Student Transfer' && log.details && `Transferred ${log.details.studentName} (${log.details.enrollmentNumber}) from ${log.details.fromClass} to ${log.details.toClass}`}
                            {log.action === 'Student Removal' && log.details && `Removed ${log.details.studentName} (${log.details.enrollmentNumber}) from ${log.details.removedFromClass}`}
                            {log.action === 'Faculty Assignment' && log.details && `Assigned ${log.details.teacherName} to ${log.details.classSection} (Sem ${log.details.semester})`}
                            {log.action === 'Faculty Reassignment' && log.details && `Reassigned ${log.details.teacherName} to ${log.details.toClass} (Sem ${log.details.toSemester})`}
                            {log.action === 'Faculty Removal' && log.details && `Removed ${log.details.teacherName} from ${log.details.removedClassSection}`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </>
        ) : (
          /* ====================================================
             FACULTY ALLOCATION WORKFLOWS
             ==================================================== */
          <>
            
            {/* Header / Filters Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.6px' }}>Faculty Allocation</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '3px', display: 'block' }}>Assign teachers to classes and semesters.</span>
              </div>

              {/* Filters Row */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                
                {/* Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  boxSizing: 'border-box'
                }}>
                  <Search className="w-3.5 h-3.5 opacity-40 mr-2" />
                  <input
                    type="text"
                    placeholder="Search teacher..."
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      width: '160px'
                    }}
                  />
                </div>

                {/* Department Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>
                  <Building className="w-3.5 h-3.5 opacity-40" />
                  <select
                    value={teacherDepartmentFilter}
                    onChange={(e) => setTeacherDepartmentFilter(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: '700' }}
                  >
                    <option value="All">All Departments</option>
                    {uniqueDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportAssignments}
                  style={style.btnSecondary}
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>

              </div>
            </div>

            {/* Grouped Faculty List */}
            <section style={style.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users className="w-4.5 h-4.5 text-[#5e5ce6]" />
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Faculty List</h3>
              </div>

              {filteredFaculty.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0', margin: 0 }}>No teachers found.</p>
              ) : (
                uniqueDepartments
                  .filter(dept => teacherDepartmentFilter === 'All' || dept === teacherDepartmentFilter)
                  .map(dept => {
                    const deptFaculty = filteredFaculty.filter(f => f.department === dept);
                    if (deptFaculty.length === 0) return null;

                    return (
                      <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '20px', marginBottom: '8px' }}>
                        <h4 style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#c084fc',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: '0 0 4px 0'
                        }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#5e5ce6' }}></span>
                          {dept}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {deptFaculty.map((fac) => (
                            <div
                              key={fac.employeeId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '20px',
                                padding: '14px 16px',
                                backgroundColor: 'var(--bg-subcard)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '12px',
                                boxSizing: 'border-box'
                              }}
                            >
                              {/* Left Info */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                  {(fac.teacherName || '').split(' ').slice(-1)[0]?.slice(0, 2).toUpperCase() || 'TR'}
                                </div>
                                <div>
                                  <h5 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{fac.teacherName}</h5>
                                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', margin: '3px 0 0 0' }}>
                                    {fac.designation} &bull; <span style={{ fontFamily: 'monospace' }}>EMP ID: {fac.employeeId}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Right inputs */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                
                                {/* Semester Select */}
                                <div style={{ width: '120px' }}>
                                  <select
                                    value={rowSemesters[fac.employeeId] || '4'}
                                    onChange={(e) => setRowSemesters({ ...rowSemesters, [fac.employeeId]: e.target.value })}
                                    style={{ ...style.select, padding: '8px 12px', fontSize: '12px' }}
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                      <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Class Section Select */}
                                <div style={{ width: '120px' }}>
                                  <select
                                    value={rowClasses[fac.employeeId] || ((fac.department || '') === 'BBA' ? 'BBA-1st shift' : 'ECE-A')}
                                    onChange={(e) => setRowClasses({ ...rowClasses, [fac.employeeId]: e.target.value })}
                                    style={{ ...style.select, padding: '8px 12px', fontSize: '12px' }}
                                  >
                                    {['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D', 'BBA-1st shift', 'BBA-2nd shift'].map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Subject Taught Select/Input */}
                                <div style={{ width: '160px' }}>
                                  {(() => {
                                    const sem = Number(rowSemesters[fac.employeeId] || '4');
                                    const classSec = rowClasses[fac.employeeId] || ((fac.department || '') === 'BBA' ? 'BBA-1st shift' : 'ECE-A');
                                    const branch = classSec.split('-')[0] || 'ECE';
                                    const available = subjectsList.filter(s => s.semester === sem && s.branch === branch);
                                    const selectedSubject = rowSubjects[fac.employeeId] || '';

                                    if (available.length > 0) {
                                      return (
                                        <select
                                          value={selectedSubject || available[0]?.name || ''}
                                          onChange={(e) => setRowSubjects({ ...rowSubjects, [fac.employeeId]: e.target.value })}
                                          style={{ ...style.select, padding: '8px 12px', fontSize: '12px' }}
                                        >
                                          {available.map(sub => (
                                            <option key={sub._id} value={sub.name}>{sub.name} ({sub.code})</option>
                                          ))}
                                        </select>
                                      );
                                    } else {
                                      return (
                                        <input
                                          type="text"
                                          placeholder="Subject Taught"
                                          value={selectedSubject}
                                          onChange={(e) => setRowSubjects({ ...rowSubjects, [fac.employeeId]: e.target.value })}
                                          style={{ ...style.input, padding: '8px 12px', fontSize: '12px' }}
                                        />
                                      );
                                    }
                                  })()}
                                </div>

                                <button
                                  onClick={() => handleAssignFaculty(fac)}
                                  style={{
                                    ...style.btnPrimary,
                                    padding: '8px 18px',
                                    fontSize: '11.5px',
                                    boxShadow: 'none'
                                  }}
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => handleDeleteTeacher(fac)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(255, 69, 58, 0.3)',
                                    borderRadius: '10.5px',
                                    padding: '8px 12px',
                                    color: '#ff453a',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.08)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  title="Delete Teacher"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </section>

            {/* Assignments Table List */}
            <section style={style.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck className="w-4.5 h-4.5 text-[#5e5ce6]" />
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Current Faculty Assignments</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0 0 0', fontWeight: 'bold' }}>Review and manage active teacher class listings.</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-subcard)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '6px 12px'
                }}>
                  <Search className="w-3.5 h-3.5 opacity-40 mr-2" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={assignmentSearchQuery}
                    onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      width: '150px'
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Teacher Name</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Semester</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Branch</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Class</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Subject Taught</th>
                      <th style={{ padding: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          No active faculty assignments found.
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((a) => (
                        <tr key={`${a.employeeId}-${a.assignmentId}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'rgba(94, 92, 230, 0.08)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>
                              {(a.teacherName || '').split(' ').slice(-1)[0]?.slice(0, 2).toUpperCase() || 'TR'}
                            </div>
                            {a.teacherName}
                          </td>
                          <td style={{ padding: '12px 0', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Semester {a.semester}</td>
                          <td style={{ padding: '12px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>{a.branch || a.classSection.split('-')[0] || 'ECE'}</td>
                          <td style={{ padding: '12px 0', fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)' }}>{a.classSection}</td>
                          <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: '700', color: '#c084fc' }}>{a.subjectTaught || 'Not Specified'}</td>
                          <td style={{ padding: '12px 0', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setAssignmentToReassign(a);
                                  setReassignSemester(String(a.semester));
                                  setReassignClassSection(a.classSection);
                                  setReassignSubjectTaught(a.subjectTaught || '');
                                  setShowReassignModal(true);
                                }}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-dim)',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <ArrowLeftRight className="w-3 h-3" /> Reassign
                              </button>
                              <button
                                onClick={() => handleRemoveFacultyAssignment(a)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid rgba(255, 69, 58, 0.2)',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#ff453a',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Trash2 className="w-3 h-3" /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        borderTop: '1px solid var(--border-dim)',
        marginTop: 'auto'
      }}>
        &copy; {new Date().getFullYear()} OneCampus Admin Portal. All rights reserved.
      </footer>

      {/* ====================================================
         MODALS & DRAWER LAYERS (WITH PREMIUM BACKDROP BLUR)
         ==================================================== */}

      {/* 1. Preview Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '16px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck className="w-5 h-5 text-[#5e5ce6]" /> Confirm Student Allocation
            </h3>

            <div style={{
              backgroundColor: 'var(--bg-subcard)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Class Section</span>
                <span style={{ fontWeight: '800', color: '#c084fc' }}>{classSection}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Academic Semester</span>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Semester {semester}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border-dim)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Total Assigned</span>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '16px' }}>{previewData?.totalRecordsToAssign}</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Confirming this assignment updates all students within the specified range to {classSection} for Semester {semester}. Any prior semester class records will be safely updated.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={style.btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStudents}
                disabled={loadingAssign}
                style={style.btnPrimary}
              >
                {loadingAssign ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Slide Drawer: Class Students list */}
      {showStudentsDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 900,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            height: '100%',
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'var(--bg-card)',
            borderLeft: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '32px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{selectedClassRecord?.name} Students</h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px', display: 'block' }}>Semester {selectedClassRecord?.semester}</span>
                </div>
                <button
                  onClick={() => setShowStudentsDrawer(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {loadingStudents ? (
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>Loading students roster...</p>
              ) : classStudents.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>No students assigned to this section yet.</p>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {classStudents.map(student => (
                    <div
                      key={student.enrollmentNumber}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-subcard)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{student.studentName}</p>
                        <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>{student.enrollmentNumber}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setStudentToTransfer(student);
                            setTransferSemester(String(student.semester));
                            setTransferClassSection(student.classSection);
                            setShowTransferModal(true);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-dim)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                          title="Transfer"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveStudentAllocation(student)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(255, 69, 58, 0.2)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            color: '#ff453a',
                            cursor: 'pointer'
                          }}
                          title="Remove"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total: {classStudents.length} Students</span>
              <button
                onClick={() => setShowStudentsDrawer(false)}
                style={style.btnSecondary}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Transfer Student Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '16px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeftRight className="w-5 h-5 text-[#5e5ce6]" /> Transfer Student
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px' }}>
                <span style={style.label}>Student details</span>
                <p style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>{studentToTransfer?.studentName}</p>
                <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>{studentToTransfer?.enrollmentNumber}</p>
              </div>

              {/* Semester select */}
              <div>
                <label style={{ ...style.label, marginBottom: '6px' }}>Target Semester</label>
                <select
                  value={transferSemester}
                  onChange={(e) => setTransferSemester(e.target.value)}
                  style={style.select}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Class section select */}
              <div>
                <label style={{ ...style.label, marginBottom: '6px' }}>Target Class Section</label>
                <select
                  value={transferClassSection}
                  onChange={(e) => setTransferClassSection(e.target.value)}
                  style={style.select}
                >
                  {['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D', 'BBA-1st shift', 'BBA-2nd shift'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => { setShowTransferModal(false); setStudentToTransfer(null); }}
                style={style.btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={loadingTransfer}
                style={style.btnPrimary}
              >
                {loadingTransfer ? 'Moving...' : 'Transfer Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Faculty Reassign Modal */}
      {showReassignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '16px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeftRight className="w-5 h-5 text-[#5e5ce6]" /> Reassign Faculty Slot
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px' }}>
                <span style={style.label}>Teacher details</span>
                <p style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>{assignmentToReassign?.teacherName}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 'bold', margin: '2px 0 0 0' }}>{assignmentToReassign?.department}</p>
              </div>

              {/* Semester select */}
              <div>
                <label style={{ ...style.label, marginBottom: '6px' }}>New Semester</label>
                <select
                  value={reassignSemester}
                  onChange={(e) => setReassignSemester(e.target.value)}
                  style={style.select}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Class section select */}
              <div>
                <label style={{ ...style.label, marginBottom: '6px' }}>New Class Section</label>
                <select
                  value={reassignClassSection}
                  onChange={(e) => setReassignClassSection(e.target.value)}
                  style={style.select}
                >
                  {['ECE-A', 'ECE-B', 'ECE-C', 'ECE-D', 'BBA-1st shift', 'BBA-2nd shift'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Subject select */}
              <div>
                <label style={{ ...style.label, marginBottom: '6px' }}>New Subject Taught</label>
                {(() => {
                  const branch = reassignClassSection.split('-')[0] || 'ECE';
                  const sem = Number(reassignSemester);
                  const available = subjectsList.filter(s => s.semester === sem && s.branch === branch);

                  if (available.length > 0) {
                    return (
                      <select
                        value={reassignSubjectTaught || available[0]?.name || ''}
                        onChange={(e) => setReassignSubjectTaught(e.target.value)}
                        style={style.select}
                      >
                        {available.map(sub => (
                          <option key={sub._id} value={sub.name}>{sub.name} ({sub.code})</option>
                        ))}
                      </select>
                    );
                  } else {
                    return (
                      <input
                        type="text"
                        placeholder="Subject Taught"
                        value={reassignSubjectTaught}
                        onChange={(e) => setReassignSubjectTaught(e.target.value)}
                        style={style.input}
                      />
                    );
                  }
                })()}
              </div>

            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => { setShowReassignModal(false); setAssignmentToReassign(null); }}
                style={style.btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleReassignSubmit}
                disabled={loadingReassign}
                style={style.btnPrimary}
              >
                {loadingReassign ? 'Saving...' : 'Reassign Slots'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
