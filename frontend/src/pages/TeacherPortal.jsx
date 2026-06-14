import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  Users, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText, 
  CheckCircle, 
  LogOut, 
  ArrowLeft, 
  Sun, 
  Moon, 
  Info, 
  Download, 
  ExternalLink,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import api from '../services/api.js';
import './TeacherPortal.css';

const TeacherPortal = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Basic Routing Guard
  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
  }, [user, navigate]);

  // General States
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [currentTab, setCurrentTab] = useState('attendance'); // 'attendance', 'marks', 'assignments'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Attendance States
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({}); // enrollmentNo -> 'Present' | 'Absent'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  
  // Custom Calendar Month & Year
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  // Marks States
  const [examType, setExamType] = useState('Mid Sem 1'); // 'Mid Sem 1' | 'Mid Sem 2'
  const [marksMap, setMarksMap] = useState({}); // enrollmentNo -> { score: '', remark: '' }

  // Assignments States
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 10,
    attachment: ''
  });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionGrades, setSubmissionGrades] = useState({}); // enrollmentNo -> { score: '', remark: '' }

  // General Student Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteStudent, setNoteStudent] = useState(null);
  const [generalNoteText, setGeneralNoteText] = useState('');

  // Open Note Modal for a specific student
  const handleOpenNoteModal = (student) => {
    setNoteStudent(student);
    setGeneralNoteText('');
    setShowNoteModal(true);
  };

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Date Formatting Helper (Timezone Safe Local Format)
  const formatDateLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Get greeting phrase based on hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Month Names Array
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Teacher's Classes
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teacher/classes');
      setClasses(data.classes || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch assigned classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchClasses();
    }
  }, [user]);

  // Load Class Workspace Data
  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setCurrentTab('attendance');
    setLoading(true);
    try {
      // Fetch roster
      const { data } = await api.get(`/teacher/class/${cls._id}/students`);
      setStudents(data.students || []);

      // Fetch attendance history
      await fetchAttendanceHistory(cls._id);

      // Set date to today and pull attendance records if any exist
      const todayStr = formatDateLocal(new Date());
      setAttendanceDate(todayStr);
      await fetchAttendanceForDate(cls._id, todayStr, cls.subjectCode, data.students);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load class roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Records for Date
  const fetchAttendanceForDate = async (classId, dateVal, subjectCode, roster = students) => {
    try {
      const { data } = await api.get(`/attendance/${classId}`, {
        params: { date: dateVal, subjectCode }
      });

      const newMap = {};
      roster.forEach(s => {
        newMap[s.enrollmentNumber] = 'Present';
      });

      if (data.attendance && data.attendance.length > 0) {
        data.attendance.forEach(rec => {
          newMap[rec.enrollmentNo] = rec.status;
        });
      }
      setAttendanceMap(newMap);
    } catch (err) {
      showToast('Error loading attendance for selected date', 'error');
    }
  };

  // Fetch Class Attendance History
  const fetchAttendanceHistory = async (classId) => {
    try {
      const { data } = await api.get(`/attendance/${classId}`);
      setAttendanceHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load attendance history', err);
    }
  };

  // Save Attendance (Submit/Update)
  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const payload = {
        classId: selectedClass._id,
        date: attendanceDate,
        subjectCode: selectedClass.subjectCode,
        attendance: Object.entries(attendanceMap).map(([enrollmentNo, status]) => ({
          enrollmentNo,
          status
        }))
      };

      const { data } = await api.post('/attendance/save', payload);
      showToast(data.message || 'Attendance saved successfully', 'success');
      await fetchAttendanceHistory(selectedClass._id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save General Remark/Student Note
  const handleSaveGeneralNote = async () => {
    if (!noteStudent || !generalNoteText.trim()) {
      showToast('Note content cannot be empty', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        enrollmentNo: noteStudent.enrollmentNumber || noteStudent.enrollmentNo,
        subjectCode: selectedClass.subjectCode,
        remark: generalNoteText.trim()
      };
      await api.post('/teacher/remarks', payload);
      showToast(`General note saved for ${noteStudent.studentName}`, 'success');
      setShowNoteModal(false);
      setNoteStudent(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save student note', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Marks for Class & Mid Sem Selection
  const fetchMarks = async (classId, subjectCode, examTypeVal) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/marks/class/${classId}`, {
        params: { subjectCode, examType: examTypeVal }
      });

      const newMarksMap = {};
      students.forEach(s => {
        newMarksMap[s.enrollmentNumber] = { score: '', remark: '' };
      });

      if (data.marks && data.marks.length > 0) {
        data.marks.forEach(rec => {
          newMarksMap[rec.enrollmentNo] = {
            score: rec.marks ?? '',
            remark: rec.remark || ''
          };
        });
      }
      setMarksMap(newMarksMap);
    } catch (err) {
      showToast('Failed to load marks roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sync Marks fetching
  useEffect(() => {
    if (selectedClass && currentTab === 'marks') {
      fetchMarks(selectedClass._id, selectedClass.subjectCode, examType);
    }
  }, [selectedClass, currentTab, examType]);

  // Save Marks (Submit/Save Draft)
  const handleSaveMarks = async () => {
    if (!selectedClass) return;
    
    const marksArray = [];
    let isValid = true;

    for (const s of students) {
      const entry = marksMap[s.enrollmentNumber] || { score: '', remark: '' };
      const scoreVal = entry.score;

      if (scoreVal !== '' && (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 30)) {
        showToast(`Score for ${s.studentName} must be between 0 and 30`, 'error');
        isValid = false;
        break;
      }

      marksArray.push({
        enrollmentNo: s.enrollmentNumber,
        score: scoreVal === '' ? 0 : Number(scoreVal),
        remark: entry.remark
      });
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const payload = {
        classId: selectedClass._id,
        subjectCode: selectedClass.subjectCode,
        examType,
        marks: marksArray
      };
      const { data } = await api.post('/marks/save', payload);
      showToast(data.message || 'Marks updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save student marks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Class Assignments
  const fetchAssignments = async (classId, subjectCode) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/assignment/class/${classId}`, {
        params: { subjectCode }
      });
      setAssignments(data.assignments || []);
    } catch (err) {
      showToast('Failed to load assignments list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && currentTab === 'assignments') {
      fetchAssignments(selectedClass._id, selectedClass.subjectCode);
    }
  }, [selectedClass, currentTab]);

  // Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;

    const { title, description, dueDate, maxMarks, attachment } = newAssignment;
    if (!title || !dueDate) {
      showToast('Assignment Title and Due Date are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        classId: selectedClass._id,
        subjectCode: selectedClass.subjectCode,
        title,
        description,
        dueDate,
        maxMarks: Number(maxMarks),
        attachment
      };

      await api.post('/assignment/create', payload);
      showToast('Assignment created successfully.', 'success');

      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        maxMarks: 10,
        attachment: ''
      });

      await fetchAssignments(selectedClass._id, selectedClass.subjectCode);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (assignmentId, e) => {
    e.stopPropagation(); // Stop drawer opening
    if (!window.confirm('Are you sure you want to delete this assignment and all its student submissions?')) return;
    
    setLoading(true);
    try {
      const { data } = await api.delete(`/assignment/${assignmentId}`);
      showToast(data.message || 'Assignment deleted successfully', 'success');
      await fetchAssignments(selectedClass._id, selectedClass.subjectCode);
    } catch (err) {
      showToast('Failed to delete assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Submissions inside Drawer
  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    try {
      const { data } = await api.get(`/assignment/${assignment._id}/submissions`);
      setSubmissions(data.submissions || []);
    } catch (err) {
      showToast('Failed to fetch student submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sync grading input state
  useEffect(() => {
    if (submissions.length > 0) {
      const initialGrades = {};
      submissions.forEach(sub => {
        initialGrades[sub.enrollmentNo] = {
          score: sub.marks ?? '',
          remark: sub.remark || ''
        };
      });
      setSubmissionGrades(initialGrades);
    }
  }, [submissions]);

  // Grade Student Submission
  const handleGradeSubmission = async (studentSub) => {
    const grade = submissionGrades[studentSub.enrollmentNo] || { score: '', remark: '' };

    if (grade.score === '') {
      showToast('Please enter a grade score', 'error');
      return;
    }

    if (isNaN(grade.score) || grade.score < 0 || grade.score > (selectedAssignment?.maxMarks || 10)) {
      showToast(`Score must be between 0 and ${selectedAssignment?.maxMarks || 10}`, 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        submissionId: studentSub.submissionId,
        assignmentId: selectedAssignment._id,
        enrollmentNo: studentSub.enrollmentNo,
        marks: Number(grade.score),
        remark: grade.remark
      };

      await api.post('/assignment/review', payload);
      showToast(`Submission graded for ${studentSub.studentName}`, 'success');

      // Refresh roster list
      const { data } = await api.get(`/assignment/${selectedAssignment._id}/submissions`);
      setSubmissions(data.submissions || []);
      
      // Update background assignments count
      if (selectedClass) {
        fetchAssignments(selectedClass._id, selectedClass.subjectCode);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit grade review', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Custom Calendar Render Days
  const getDaysInMonth = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dVal = daysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, dVal);
      cells.push({
        day: dVal,
        monthType: 'other-month',
        dateStr: formatDateLocal(dateObj),
        monthVal: month - 1,
        yearVal: year,
      });
    }

    // Current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateObj = new Date(year, month, i);
      cells.push({
        day: i,
        monthType: 'current-month',
        dateStr: formatDateLocal(dateObj),
        monthVal: month,
        yearVal: year,
      });
    }

    // Next month padding (make it 42 cells)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const dateObj = new Date(year, month + 1, i);
      cells.push({
        day: i,
        monthType: 'other-month',
        dateStr: formatDateLocal(dateObj),
        monthVal: month + 1,
        yearVal: year,
      });
    }

    return cells;
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="teacher-body">
      {/* Toast Notifier */}
      {toast && (
        <div className="teacher-toast">
          <div className="toast-icon">
            {toast.type === 'success' ? (
              <CheckCircle size={18} color="#30d158" />
            ) : (
              <Info size={18} color="#ff453a" />
            )}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="teacher-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {selectedClass && (
            <button 
              onClick={() => setSelectedClass(null)} 
              className="btn-workspace-secondary" 
              style={{ padding: '8px 12px' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
              <span className="hide-on-mobile">Classes</span>
            </button>
          )}
          <Link to={selectedClass ? "#" : "/teacher"} style={{ textDecoration: 'none' }} onClick={() => setSelectedClass(null)}>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              OneCampus <span style={{ color: '#f97316', fontSize: '12px', fontWeight: 600, verticalAlign: 'super', marginLeft: '4px' }}>FACULTY</span>
            </span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }} className="hide-on-mobile">
              {user.name}
            </span>
          )}
          <button 
            onClick={toggleTheme} 
            className="btn-workspace-secondary" 
            style={{ padding: '8px', borderRadius: '50%' }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button 
            onClick={handleLogout} 
            className="btn-workspace-red" 
            style={{ padding: '8px 12px', gap: '6px' }}
          >
            <LogOut size={14} />
            <span className="hide-on-mobile">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="teacher-container">
        
        {/* 1. DASHBOARD VIEW */}
        {!selectedClass ? (
          <>
            <div className="teacher-glass-card" style={{ padding: '32px 40px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.04) 0%, rgba(231, 8, 27, 0.04) 100%)' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                {getGreeting()}, {user?.name || 'Professor'} <span className="waving-hand">👋</span>
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Manage your classrooms, student attendance, semester marks, and assignments in a modern unified space.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} color="#f97316" />
                  Assigned Subjects & Classes
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  {classes.length} Total Classes
                </span>
              </div>

              {loading && classes.length === 0 ? (
                <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="loader-spinner" style={{ margin: '0 auto 16px auto' }}></div>
                  Loading assigned classes...
                </div>
              ) : classes.length === 0 ? (
                <div className="teacher-glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No classes assigned to you. Contact the administrator to assign classes to your profile.
                </div>
              ) : (
                <div className="classes-grid">
                  {classes.map((c) => (
                    <div key={c._id} className="class-card">
                      <div className="class-card-left">
                        <div className="class-icon-box" style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)', color: '#f97316' }}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h3 className="class-card-title">{c.subject}</h3>
                          <p className="class-card-meta">
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.className}</span>
                            <span style={{ margin: '0 8px', opacity: 0.3 }}>•</span>
                            <span>Semester {c.semester}</span>
                            {c.subjectCode && (
                              <>
                                <span style={{ margin: '0 8px', opacity: 0.3 }}>•</span>
                                <code style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{c.subjectCode}</code>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div className="class-card-students">
                          <div className="students-badge-circle">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="students-count-text">{c.studentCount}</p>
                            <p className="students-label-text">Students</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => selectClass(c)} 
                          className="btn-workspace-primary"
                        >
                          Open Workspace →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer style={{ marginTop: 'auto', padding: '40px 0 20px 0', textAlign: 'center', borderTop: '1px solid var(--border-dim)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
                Teach. Inspire. Empower.
              </p>
            </footer>
          </>
        ) : (
          
          /* 2. CLASS WORKSPACE VIEW */
          <>
            {/* Class Header Information Card */}
            <div className="teacher-glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: '#f97316' }}>
                  Class Workspace
                </span>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 4px 0', letterSpacing: '-0.3px' }}>
                  {selectedClass.subject}
                </h1>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Class: <strong style={{ color: 'var(--text-primary)' }}>{selectedClass.className}</strong>
                  <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                  Semester: <strong style={{ color: 'var(--text-primary)' }}>{selectedClass.semester}</strong>
                  <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                  Subject Code: <code style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px' }}>{selectedClass.subjectCode}</code>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{students.length}</p>
                  <p style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, margin: 0 }}>Total Enrolled</p>
                </div>
              </div>
            </div>

            {/* Navigation Switch Tabs */}
            <div className="workspace-nav-pills">
              <button 
                onClick={() => setCurrentTab('attendance')} 
                className={`workspace-pill ${currentTab === 'attendance' ? 'active' : ''}`}
              >
                Attendance
              </button>
              <button 
                onClick={() => setCurrentTab('marks')} 
                className={`workspace-pill ${currentTab === 'marks' ? 'active' : ''}`}
              >
                Mid Sem Marks
              </button>
              <button 
                onClick={() => setCurrentTab('assignments')} 
                className={`workspace-pill ${currentTab === 'assignments' ? 'active' : ''}`}
              >
                Assignments & Grades
              </button>
            </div>

            {/* 2A. ATTENDANCE TAB PANEL */}
            {currentTab === 'attendance' && (
              <div className="attendance-grid">
                
                {/* Roster Attendance Editor */}
                <div className="teacher-glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700 }}>Session Date:</label>
                      <input 
                        type="date" 
                        value={attendanceDate}
                        onChange={(e) => {
                          setAttendanceDate(e.target.value);
                          fetchAttendanceForDate(selectedClass._id, e.target.value, selectedClass.subjectCode);
                        }}
                        className="teacher-input"
                        style={{ width: '150px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = {};
                          students.forEach(s => { updated[s.enrollmentNumber] = 'Present'; });
                          setAttendanceMap(updated);
                        }} 
                        className="btn-workspace-green"
                        style={{ padding: '8px 12px', fontSize: '11.5px' }}
                      >
                        All Present
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = {};
                          students.forEach(s => { updated[s.enrollmentNumber] = 'Absent'; });
                          setAttendanceMap(updated);
                        }} 
                        className="btn-workspace-red"
                        style={{ padding: '8px 12px', fontSize: '11.5px' }}
                      >
                        All Absent
                      </button>
                    </div>
                  </div>

                  <div className="custom-scrollbar" style={{ overflowX: 'auto', maxHeight: '480px' }}>
                    <table className="teacher-table">
                      <thead>
                        <tr>
                          <th>Enrollment No</th>
                          <th>Student Name</th>
                          <th>Status Toggle</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.enrollmentNumber}>
                            <td style={{ fontWeight: 600 }}>{student.enrollmentNumber}</td>
                            <td>{student.studentName}</td>
                            <td>
                              <div className="toggle-btn-group">
                                <button 
                                  type="button" 
                                  className={`toggle-btn-present ${attendanceMap[student.enrollmentNumber] === 'Present' ? 'active' : ''}`}
                                  onClick={() => setAttendanceMap(prev => ({ ...prev, [student.enrollmentNumber]: 'Present' }))}
                                >
                                  Present
                                </button>
                                <button 
                                  type="button" 
                                  className={`toggle-btn-absent ${attendanceMap[student.enrollmentNumber] === 'Absent' ? 'active' : ''}`}
                                  onClick={() => setAttendanceMap(prev => ({ ...prev, [student.enrollmentNumber]: 'Absent' }))}
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                            <td>
                              <button 
                                type="button" 
                                onClick={() => handleOpenNoteModal(student)} 
                                className="btn-workspace-secondary" 
                                style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Add academic note / AI remark"
                              >
                                <MessageSquare size={12} />
                                <span>Note</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSaveAttendance} 
                      className="btn-workspace-primary"
                      disabled={loading}
                    >
                      <CheckCircle size={15} />
                      {loading ? 'Saving...' : 'Save Attendance Log'}
                    </button>
                  </div>
                </div>

                {/* Calendar Tracker & Recent Sessions Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Calendar Widget */}
                  <div className="calendar-card">
                    <div className="calendar-header">
                      <span className="calendar-month-title">
                        {monthNames[calendarMonth]} {calendarYear}
                      </span>
                      <div className="calendar-arrows">
                        <button onClick={handlePrevMonth} className="calendar-arrow-btn" aria-label="Previous Month">
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={handleNextMonth} className="calendar-arrow-btn" aria-label="Next Month">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="calendar-days-grid">
                      {/* Week Labels */}
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div key={day} className="calendar-weekday-label">{day}</div>
                      ))}

                      {/* Day cells */}
                      {getDaysInMonth(calendarYear, calendarMonth).map((cell, idx) => {
                        const isSelected = cell.dateStr === attendanceDate;
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              setAttendanceDate(cell.dateStr);
                              // Sync calendar month when selecting other month days
                              if (cell.monthVal !== calendarMonth) {
                                setCalendarMonth(cell.monthVal);
                                setCalendarYear(cell.yearVal);
                              }
                              fetchAttendanceForDate(selectedClass._id, cell.dateStr, selectedClass.subjectCode);
                            }}
                            className={`calendar-day-cell ${cell.monthType} ${isSelected ? 'selected' : ''}`}
                          >
                            {cell.day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conducted History widget */}
                  <div className="calendar-card">
                    <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClipboardList size={14} color="#f97316" />
                      Recent Conducted Sessions
                    </h3>

                    {attendanceHistory.length === 0 ? (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                        No attendance logs recorded yet.
                      </p>
                    ) : (
                      <div className="conducted-list-container custom-scrollbar">
                        {attendanceHistory.map((session, index) => {
                          const sessionDateStr = formatDateLocal(new Date(session.date));
                          return (
                            <div 
                              key={index} 
                              className="conducted-session-row"
                              style={{ cursor: 'pointer', border: sessionDateStr === attendanceDate ? '1px solid rgba(249, 115, 22, 0.4)' : '' }}
                              onClick={() => {
                                setAttendanceDate(sessionDateStr);
                                fetchAttendanceForDate(selectedClass._id, sessionDateStr, selectedClass.subjectCode);
                              }}
                            >
                              <div>
                                <p className="conducted-session-date">
                                  {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="conducted-session-counts">
                                  {session.presentCount} / {session.totalCount} Present
                                </p>
                              </div>
                              <span className="conducted-session-badge">
                                Active
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* 2B. MARKS TAB PANEL */}
            {currentTab === 'marks' && (
              <div className="teacher-glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setExamType('Mid Sem 1')}
                      className="btn-workspace-secondary"
                      style={{ 
                        borderColor: examType === 'Mid Sem 1' ? '#f97316' : 'var(--border-dim)',
                        backgroundColor: examType === 'Mid Sem 1' ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                        color: examType === 'Mid Sem 1' ? '#ff9f0a' : 'var(--text-primary)'
                      }}
                    >
                      Mid Sem 1 (Max 30)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setExamType('Mid Sem 2')}
                      className="btn-workspace-secondary"
                      style={{ 
                        borderColor: examType === 'Mid Sem 2' ? '#f97316' : 'var(--border-dim)',
                        backgroundColor: examType === 'Mid Sem 2' ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                        color: examType === 'Mid Sem 2' ? '#ff9f0a' : 'var(--text-primary)'
                      }}
                    >
                      Mid Sem 2 (Max 30)
                    </button>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    Automatically syncs with Student Dashboard
                  </span>
                </div>

                <div className="custom-scrollbar" style={{ overflowX: 'auto', maxHeight: '500px' }}>
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Enrollment No</th>
                        <th>Student Name</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Score (Out of 30)</th>
                        <th>Academic Remarks / Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const entry = marksMap[student.enrollmentNumber] || { score: '', remark: '' };
                        return (
                          <tr key={student.enrollmentNumber}>
                            <td style={{ fontWeight: 600 }}>{student.enrollmentNumber}</td>
                            <td>{student.studentName}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="number" 
                                min="0" 
                                max="30"
                                value={entry.score}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMarksMap(prev => ({
                                    ...prev,
                                    [student.enrollmentNumber]: {
                                      ...prev[student.enrollmentNumber],
                                      score: val === '' ? '' : Number(val)
                                    }
                                  }));
                                }}
                                className="marks-score-input"
                                placeholder="0"
                              />
                            </td>
                            <td>
                              <input 
                                type="text"
                                value={entry.remark}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMarksMap(prev => ({
                                    ...prev,
                                    [student.enrollmentNumber]: {
                                      ...prev[student.enrollmentNumber],
                                      remark: val
                                    }
                                  }));
                                }}
                                className="teacher-input"
                                placeholder="e.g. Excellent presentation skills, mock-viva outstanding"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    onClick={handleSaveMarks} 
                    className="btn-workspace-primary"
                    disabled={loading}
                  >
                    <CheckCircle size={15} />
                    {loading ? 'Saving...' : 'Submit & Save Marks'}
                  </button>
                </div>
              </div>
            )}

            {/* 2C. ASSIGNMENTS TAB PANEL */}
            {currentTab === 'assignments' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '20px', alignItems: 'stretch' }} className="attendance-grid">
                
                {/* Create Assignment Form Panel */}
                <div className="teacher-glass-card">
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} color="#f97316" />
                    Create Assignment
                  </h3>

                  <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Assignment Title
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Lab Report 4: 8085 Assembly Programs"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                        className="teacher-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Description / Instructions
                      </label>
                      <textarea 
                        rows="3"
                        placeholder="Provide task instructions, guidelines, and reference links..."
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                        className="teacher-input custom-scrollbar"
                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Due Date & Time
                        </label>
                        <input 
                          type="datetime-local" 
                          required
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment(p => ({ ...p, dueDate: e.target.value }))}
                          className="teacher-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Max Marks
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          max="100"
                          value={newAssignment.maxMarks}
                          onChange={(e) => setNewAssignment(p => ({ ...p, maxMarks: Number(e.target.value) }))}
                          className="teacher-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Attachment Link (Optional URL)
                      </label>
                      <input 
                        type="url" 
                        placeholder="https://drive.google.com/..."
                        value={newAssignment.attachment}
                        onChange={(e) => setNewAssignment(p => ({ ...p, attachment: e.target.value }))}
                        className="teacher-input"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn-workspace-primary" 
                      style={{ marginTop: '6px' }}
                      disabled={loading}
                    >
                      <Plus size={15} />
                      {loading ? 'Creating...' : 'Publish Assignment'}
                    </button>
                  </form>
                </div>

                {/* Published Assignments Cards List */}
                <div className="teacher-glass-card">
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={16} color="#f97316" />
                    Published Class Assignments
                  </h3>

                  {assignments.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      No assignments created yet. Use the panel on the left to publish homework.
                    </div>
                  ) : (
                    <div className="assignment-cards-container custom-scrollbar" style={{ overflowY: 'auto', maxHeight: '480px', paddingRight: '4px' }}>
                      {assignments.map((assignment) => (
                        <div 
                          key={assignment._id} 
                          className="assignment-card"
                          onClick={() => handleViewSubmissions(assignment)}
                          title="Click to view submissions & grade"
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 className="assignment-card-title">{assignment.title}</h4>
                              <button 
                                onClick={(e) => handleDeleteAssignment(assignment._id, e)} 
                                className="btn-workspace-red" 
                                style={{ padding: '4px 8px', fontSize: '10px' }}
                                title="Delete Assignment"
                              >
                                Delete
                              </button>
                            </div>
                            <p className="assignment-card-date">
                              Due: {new Date(assignment.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className="assignment-card-stats">
                            <div>
                              <span className="assignment-stat-number">{assignment.submittedCount}</span>
                              <span className="assignment-stat-label">Submitted</span>
                            </div>
                            <div>
                              <span className="assignment-stat-number" style={{ color: '#ff453a' }}>{assignment.pendingCount}</span>
                              <span className="assignment-stat-label">Pending</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}
      </main>

      {/* Roster Assignment Submissions Review Slide Drawer */}
      {selectedAssignment && (
        <div className="portal-modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="portal-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f97316', fontWeight: 800 }}>
                  Submissions & Grading
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                  {selectedAssignment.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAssignment(null)} 
                className="btn-workspace-secondary" 
                style={{ padding: '6px 10px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Submissions List */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              {submissions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px 0' }}>
                  No submissions found for this assignment.
                </p>
              ) : (
                submissions.map((sub) => {
                  const grades = submissionGrades[sub.enrollmentNo] || { score: '', remark: '' };
                  return (
                    <div 
                      key={sub.enrollmentNo} 
                      className="teacher-glass-card" 
                      style={{ padding: '16px', backgroundColor: 'var(--bg-subcard)', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{sub.studentName}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{sub.enrollmentNo}</p>
                        </div>

                        {/* Status Badge */}
                        <span 
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            backgroundColor: sub.status === 'Graded' ? 'rgba(249, 115, 22, 0.12)' : (sub.status === 'Submitted' ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 69, 58, 0.08)'),
                            color: sub.status === 'Graded' ? '#ff9f0a' : (sub.status === 'Submitted' ? '#30d158' : '#ff453a'),
                            border: sub.status === 'Graded' ? '1px solid rgba(249, 115, 22, 0.2)' : (sub.status === 'Submitted' ? '1px solid rgba(48, 209, 88, 0.2)' : '1px solid rgba(255, 69, 58, 0.15)')
                          }}
                        >
                          {sub.status}
                        </span>
                      </div>

                      {/* File Submission display */}
                      {sub.fileUrl && sub.fileUrl !== 'N/A' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}>
                          <FileText size={16} color="#f97316" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '11.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0, fontWeight: 600 }}>
                              Shared Google Drive Link
                            </p>
                            {sub.submittedAt && (
                              <p style={{ fontSize: '9px', color: 'var(--text-tertiary)', margin: 0 }}>
                                Submitted: {new Date(sub.submittedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <a 
                            href={sub.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-workspace-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px', textDecoration: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}
                          >
                            <ExternalLink size={12} />
                            <span>View Link</span>
                          </a>
                        </div>
                      ) : (
                        <p style={{ fontSize: '11.5px', fontStyle: 'italic', color: 'var(--text-tertiary)', margin: 0 }}>
                          No submission link shared yet.
                        </p>
                      )}

                      {/* Grade inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Score (Max {selectedAssignment.maxMarks})
                          </label>
                          <input 
                            type="number"
                            min="0"
                            max={selectedAssignment.maxMarks}
                            value={grades.score}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSubmissionGrades(p => ({
                                ...p,
                                [sub.enrollmentNo]: {
                                  ...p[sub.enrollmentNo],
                                  score: val === '' ? '' : Number(val)
                                }
                              }));
                            }}
                            className="marks-score-input"
                            style={{ width: '100%' }}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Remarks
                          </label>
                          <input 
                            type="text"
                            value={grades.remark}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSubmissionGrades(p => ({
                                ...p,
                                [sub.enrollmentNo]: {
                                  ...p[sub.enrollmentNo],
                                  remark: val
                                }
                              }));
                            }}
                            className="teacher-input"
                            placeholder="e.g. Correct approach, needs optimization"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button 
                          onClick={() => handleGradeSubmission(sub)} 
                          className="btn-workspace-primary"
                          style={{ padding: '6px 14px', fontSize: '11.5px', gap: '4px' }}
                          disabled={loading}
                        >
                          <Check size={12} />
                          <span>Submit Grade</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedAssignment(null)} className="btn-workspace-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Student Note / Remark Dialog Modal Popup */}
      {showNoteModal && noteStudent && (
        <div className="portal-modal-center-container" onClick={() => setShowNoteModal(false)}>
          <div className="portal-modal-center-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="#f97316" />
                Add Student Note
              </h3>
              <button 
                onClick={() => setShowNoteModal(false)} 
                className="btn-workspace-secondary" 
                style={{ padding: '4px', borderRadius: '50%' }}
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                Create a permanent record note for <strong style={{ color: 'var(--text-primary)' }}>{noteStudent.studentName}</strong> ({noteStudent.enrollmentNumber || noteStudent.enrollmentNo}) regarding <span style={{ color: '#ff9f0a', fontWeight: 600 }}>{selectedClass.subject}</span>. This will be shared with the AI Mentor profile.
              </p>
              
              <textarea 
                rows="4"
                placeholder="Write academic performance details, behavior logs, areas of concern, or generic mentorship notes..."
                value={generalNoteText}
                onChange={(e) => setGeneralNoteText(e.target.value)}
                className="teacher-input custom-scrollbar"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => setShowNoteModal(false)} 
                className="btn-workspace-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveGeneralNote} 
                className="btn-workspace-primary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Student Note'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherPortal;
