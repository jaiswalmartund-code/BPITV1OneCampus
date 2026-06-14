import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  TrendingUp,
  Plus,
  ChevronDown,
  LogOut,
  Clock,
  Calendar,
  Check,
  X,
  Sun,
  Moon
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import api from '../services/api.js';
import EmptyState from '../components/EmptyState.jsx';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // States
  const [attendanceType, setAttendanceType] = useState('Theory');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [scoresExamType, setScoresExamType] = useState('Mid Sem 1');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Data states
  const [cgpaData, setCgpaData] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [midSemMarks, setMidSemMarks] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  // Fetch all dashboard data
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [cgpaRes, attendanceRes, deadlinesRes, marksRes] = await Promise.allSettled([
          api.get('/academics/cgpa'),
          api.get('/attendance/summary'),
          api.get('/deadlines'),
          user._id ? api.get(`/marks/student/${user._id}`) : Promise.resolve({ data: { marks: {} } }),
        ]);

        if (cgpaRes.status === 'fulfilled') setCgpaData(cgpaRes.value.data);
        if (attendanceRes.status === 'fulfilled') setAttendanceSummary(attendanceRes.value.data);
        if (deadlinesRes.status === 'fulfilled') setDeadlines(deadlinesRes.value.data.deadlines || []);
        if (marksRes.status === 'fulfilled') {
          // Group marks by examType
          const marksArr = marksRes.value.data.marks || marksRes.value.data || [];
          const grouped = {};
          if (Array.isArray(marksArr)) {
            marksArr.forEach(m => {
              if (!grouped[m.examType]) grouped[m.examType] = [];
              grouped[m.examType].push(m);
            });
          } else {
            Object.assign(grouped, marksArr);
          }
          setMidSemMarks(grouped);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, [user]);

  const handleToggleDeadline = async (id) => {
    try {
      const res = await api.patch(`/deadlines/${id}/toggle`);
      setDeadlines(prev => prev.map(d => d._id === id ? { ...d, isCompleted: res.data.isCompleted } : d));
    } catch (err) {
      console.error('Toggle deadline error:', err);
    }
  };

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;
    try {
      const res = await api.post('/deadlines', {
        title: newTitle,
        subject: newSubject || 'General',
        dueDate: newDueDate,
        type: 'File Assignment',
      });
      // Re-fetch deadlines
      const updated = await api.get('/deadlines');
      setDeadlines(updated.data.deadlines || []);
      setNewTitle('');
      setNewSubject('');
      setNewDueDate('');
      setIsAdding(false);
    } catch (err) {
      console.error('Add deadline error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get day of week abbreviation
  const getDayName = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  const getDateStr = () => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Current semester from user
  const currentSem = user?.semester || user?.currentSemester || '—';

  // Week Progress calculations (Apple-style calendar row)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const dayLetters = ['M', 'T', 'W', 'T', 'F'];
  const weekDays = dayLetters.map((letter, i) => {
    const diff = (i + 1) - dayOfWeek;
    const d = new Date(now);
    d.setDate(now.getDate() + diff);
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;
    return { letter, date: d.getDate(), isToday, isPast };
  });
  const doneCount = weekDays.filter(d => d.isPast).length;

  // Attendance stats
  const overallAttendance = attendanceSummary?.overall;
  const theorySubjects = (attendanceSummary?.subjects || []).filter(s => !s.subjectCode?.toLowerCase().includes('lab'));
  const labSubjects = (attendanceSummary?.subjects || []).filter(s => s.subjectCode?.toLowerCase().includes('lab'));
  const displaySubjects = attendanceType === 'Theory' ? theorySubjects : labSubjects;

  const maxAttSubject = (attendanceSummary?.subjects || []).reduce((max, s) => s.percent > (max?.percent || 0) ? s : max, null);
  const minAttSubject = (attendanceSummary?.subjects || []).reduce((min, s) => s.percent < (min?.percent || 100) ? s : min, null);

  // CGPA stats
  const cgpa = cgpaData?.cgpa || 0;
  const sgpaList = cgpaData?.sgpaList || [];
  const latestSgpa = sgpaList.length > 0 ? sgpaList[sgpaList.length - 1]?.sgpa : null;

  // Mid sem marks for selected exam type
  const currentExamScores = midSemMarks[scoresExamType] || [];
  const examMaxMarks = { 'Mid Sem 1': 30, 'Mid Sem 2': 30 };
  const maxM = examMaxMarks[scoresExamType] || 30;

  // Deadlines stats
  const completedCount = deadlines.filter(d => d.isCompleted).length;
  const totalCount = deadlines.length;

  const getDeadlineDayInfo = (dueDate) => {
    const d = new Date(dueDate);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return { dayNum: d.getDate(), dayName: days[d.getDay()] };
  };

  const getDeadlineColor = (priority) => {
    if (priority === 'Urgent') return '#ff453a';
    if (priority === 'Upcoming') return '#ff9f0a';
    return '#5e5ce6';
  };

  // User initials
  const initials = user?.name ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div style={{ backgroundColor: 'var(--bg-body)', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, sans-serif", color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>

      {/* Main Body Wrapper */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-body)', minHeight: '100vh', transition: 'background-color 0.3s ease' }}>

        {/* Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '10px 40px', 
          backgroundColor: 'var(--bg-body)',
          borderBottom: '1px solid var(--border-dim)',
          zIndex: 100,
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}>
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px', width: '18px', height: '18px' }}>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#5e5ce6' }}></div>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#30d158' }}></div>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#ff9f0a' }}></div>
            </div>
            <span>OneCampus</span>
          </div>

          {/* Navigation Pill Menu */}
          <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'var(--bg-nav-pill-outer)', 
            border: '1px solid var(--border-nav-pill)',
            padding: '6px', 
            borderRadius: '9999px', 
            gap: '6px',
            transition: 'background-color 0.3s ease, border-color 0.3s ease'
          }}>
            <div style={{ position: 'relative' }}>
              <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-active-pill)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Overview
              </button>
              <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: '#5e5ce6', borderRadius: '50%' }}></span>
            </div>

            <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => navigate('/academics')}>
              Academics
            </button>

            <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => navigate('/attendance')}>
              Attendance
            </button>

            <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => navigate('/deadlines')}>
              Deadlines
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle */}
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'transform 0.2s ease, color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <button style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <Bell size={18} />
            </button>

            {/* User Profile Avatar */}
            <div style={{ position: 'relative' }}>
              <div
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#5e5ce6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {initials}
              </div>

              {showProfileDropdown && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: 'var(--bg-dropdown)', border: '1px solid var(--border-dim)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)', padding: '6px 0', minWidth: '160px', zIndex: 150 }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Student</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>
                      {user?.name || '—'}
                    </p>
                    {user?.enrollmentNo && (
                      <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: '1px 0 0 0' }}>{user.enrollmentNo}</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: '#ef4444', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header Greeting Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                  {getDateStr()}{currentSem !== '—' ? ` · Semester ${currentSem}` : ''}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0 0 0', letterSpacing: '-0.6px' }}>
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}
                </h1>
              </div>
              {cgpaData && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                    CGPA
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>
                    <span style={{ color: '#5e5ce6' }}>{cgpa.toFixed(2)}</span>{' '}
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: '500', fontSize: '12px' }}>
                      cumulative
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.9fr', gap: '24px', alignItems: 'stretch' }}>
              
              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                 {/* Week Progress Calendar Row — Apple-style */}
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  {weekDays.map((d, idx) => {
                    const dotCounts = [2, 2, 3, 2, 0];
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          background: d.isToday
                            ? 'linear-gradient(145deg, #f97316 0%, #e7081b 100%)'
                            : 'var(--bg-card)',
                          border: `1px solid ${d.isToday ? 'transparent' : 'var(--border-card)'}`,
                          borderRadius: '16px',
                          padding: '12px 6px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          boxShadow: d.isToday ? '0 6px 20px rgba(231,8,27,0.25)' : 'var(--shadow-card)',
                          transition: 'all 0.25s ease',
                          minHeight: '90px',
                        }}
                      >
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: d.isToday ? 'rgba(255,255,255,0.75)' : 'var(--text-tertiary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>{d.letter}</span>
                        <span style={{
                          fontSize: '26px',
                          fontWeight: '800',
                          color: d.isToday ? '#ffffff' : d.isPast ? 'var(--text-secondary)' : 'var(--text-primary)',
                          lineHeight: 1,
                          letterSpacing: '-1px'
                        }}>{d.date}</span>
                        {/* Dot indicators */}
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '6px' }}>
                          {Array.from({ length: dotCounts[idx] }).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: d.isToday ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
                                opacity: d.isToday ? 1 : 0.6
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CGPA & Attendance Row */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                  
                  {/* CGPA Card */}
                  <div style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '20px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '220px',
                    height: '220px',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-card)',
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        CGPA
                      </span>
                      {currentSem !== '—' && (
                        <span style={{ fontSize: '9px', fontWeight: '800', color: '#5e5ce6', backgroundColor: 'rgba(94, 92, 230, 0.08)', border: '1px solid rgba(94, 92, 230, 0.15)', padding: '2px 6px', borderRadius: '6px' }}>
                          Sem {currentSem}
                        </span>
                      )}
                    </div>

                    <div style={{ margin: '14px 0' }}>
                      {cgpa > 0 ? (
                        <>
                          <div style={{ fontSize: '44px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                            {cgpa.toFixed(2)}
                          </div>
                          <span style={{ fontSize: '9.5px', fontWeight: '700', color: cgpa >= 8.5 ? '#30d158' : cgpa >= 7 ? '#ff9f0a' : '#ff453a', backgroundColor: cgpa >= 8.5 ? 'rgba(48, 209, 88, 0.08)' : cgpa >= 7 ? 'rgba(255, 159, 10, 0.08)' : 'rgba(255, 69, 58, 0.08)', border: `1px solid ${cgpa >= 8.5 ? 'rgba(48, 209, 88, 0.15)' : cgpa >= 7 ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 69, 58, 0.15)'}`, padding: '2px 6px', borderRadius: '6px', display: 'inline-block', marginTop: '6px' }}>
                            • {cgpa >= 8.5 ? 'Excellent' : cgpa >= 7 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </>
                      ) : (
                        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '8px' }}>No results yet</div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px' }}>
                        <span>Latest SGPA</span>
                        <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{latestSgpa !== null ? latestSgpa.toFixed(2) : '—'}</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-dim)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((cgpa / 10) * 100, 100)}%`, height: '100%', backgroundColor: '#5e5ce6', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Card */}
                  <div style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '20px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: '220px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Calendar size={14} style={{ color: '#5e5ce6' }} />
                        <span>Attendance</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-nav-pill-outer)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                        {['Theory', 'Lab'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setAttendanceType(type)}
                            style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', border: 'none', color: attendanceType === type ? 'var(--bg-body)' : 'var(--text-secondary)', backgroundColor: attendanceType === type ? 'var(--text-primary)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lab shows empty state with the owl image, scaled to fit inside the card */}
                    {attendanceType === 'Lab' ? (
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 0',
                        textAlign: 'center',
                        gap: '4px'
                      }}>
                        <img
                          src="/empty-owl.png"
                          alt="No data"
                          style={{
                            width: '60px',
                            height: 'auto',
                            opacity: 0.9,
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                            animation: 'owlFloat 3s ease-in-out infinite',
                          }}
                          draggable={false}
                        />
                        <p style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          letterSpacing: '-0.1px'
                        }}>
                          No Lab Attendance
                        </p>
                        <p style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          margin: 0,
                          maxWidth: '260px',
                          lineHeight: 1.3
                        }}>
                          Lab subjects are tracked as theory globally. No separate lab records available.
                        </p>
                        <style>{`
                          @keyframes owlFloat {
                            0%, 100% { transform: translateY(0px) rotate(-1deg); }
                            50%       { transform: translateY(-4px) rotate(1deg); }
                          }
                        `}</style>
                      </div>
                    ) : overallAttendance ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '8px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ fontSize: '44px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                              {overallAttendance.percent}%
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                Overall
                              </span>
                              <span style={{ fontSize: '8px', fontWeight: '800', color: overallAttendance.percent >= 75 ? '#30d158' : '#ff453a', border: `1px solid ${overallAttendance.percent >= 75 ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)'}`, backgroundColor: overallAttendance.percent >= 75 ? 'rgba(48, 209, 88, 0.05)' : 'rgba(255, 69, 58, 0.05)', padding: '1px 4px', borderRadius: '3px', alignSelf: 'flex-start' }}>
                                {overallAttendance.percent >= 75 ? '• Safe' : '• Low'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', flex: 1 }}>
                            <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '92px' }}>
                              <span style={{ fontSize: '8px', fontWeight: '800', color: '#5e5ce6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL</span>
                              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)' }}>Attended</span>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px' }}>All Classes</span>
                              </div>
                              <span style={{ fontSize: '18px', fontWeight: '800', color: '#5e5ce6', lineHeight: 1, marginTop: '2px' }}>
                                {overallAttendance.attended}/{overallAttendance.total}
                              </span>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '92px' }}>
                              <span style={{ fontSize: '8px', fontWeight: '800', color: '#30d158', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MAX</span>
                              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)' }}>Subject</span>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {maxAttSubject?.subjectCode || '—'}
                                </span>
                              </div>
                              <span style={{ fontSize: '18px', fontWeight: '800', color: '#30d158', lineHeight: 1, marginTop: '2px' }}>
                                {maxAttSubject?.percent || 0}%
                              </span>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '92px' }}>
                              <span style={{ fontSize: '8px', fontWeight: '800', color: '#ff453a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MIN</span>
                              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)' }}>Subject</span>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {minAttSubject?.subjectCode || '—'}
                                </span>
                              </div>
                              <span style={{ fontSize: '18px', fontWeight: '800', color: '#ff453a', lineHeight: 1, marginTop: '2px' }}>
                                {minAttSubject?.percent || 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border-dim)', borderRadius: '2.5px', overflow: 'hidden' }}>
                          <div style={{ width: `${overallAttendance.percent}%`, height: '100%', backgroundColor: overallAttendance.percent >= 75 ? '#30d158' : '#ff453a', borderRadius: '2.5px' }}></div>
                        </div>
                      </>
                    ) : (
                      <EmptyState compact title="No attendance data" message="Attendance records will appear here once teachers mark them." />
                    )}
                  </div>
                </div>

                {/* Subject Scores */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', height: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h3 style={{ fontSize: '21px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Subject scores</h3>
                    
                    <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-nav-pill-outer)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                      {['Mid Sem 1', 'Mid Sem 2'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setScoresExamType(type)}
                          style={{ fontSize: '10px', fontWeight: '700', padding: '4px 12px', borderRadius: '6px', border: 'none', color: scoresExamType === type ? 'var(--bg-body)' : 'var(--text-secondary)', backgroundColor: scoresExamType === type ? 'var(--text-primary)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <span style={{ fontSize: '11px', color: '#5e5ce6', fontWeight: '700', cursor: 'pointer' }} onClick={() => navigate('/academics')}>
                    Details →
                  </span>
                </div>

                {/* Subject Scores Grid */}
                {currentExamScores.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {currentExamScores.map((mark) => {
                      const scoreVal = mark.marksObtained ?? mark.marks ?? 0;
                      const pct = (scoreVal / maxM) * 100;
                      const isPositive = scoreVal >= maxM * 0.6;
                      return (
                        <div
                          key={mark._id || mark.subject}
                          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '132px', boxShadow: 'var(--shadow-card)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{mark.subjectCode || mark.subject}</span>
                            <span style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>{scoresExamType}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '2px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                                {scoreVal}<span style={{ fontSize: '10.5px', fontWeight: '500', color: 'var(--text-tertiary)' }}>/{maxM}</span>
                              </span>
                            </div>
                            <span style={{ fontSize: '9px', color: isPositive ? '#30d158' : '#ff453a', fontWeight: '700', backgroundColor: isPositive ? 'rgba(48, 209, 88, 0.08)' : 'rgba(255, 69, 58, 0.08)', border: `1px solid ${isPositive ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)'}`, padding: '2px 5px', borderRadius: '5px' }}>
                              {pct >= 60 ? '✓ Good' : '⚠ Low'}
                            </span>
                          </div>

                          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-dim)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: isPositive ? '#30d158' : '#ff453a', borderRadius: '2px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState compact title="No marks recorded yet" message="Mid-semester marks will appear here once uploaded by your teacher." />
                )}
              </div>

              {/* RIGHT COLUMN: Deadlines Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
                {/* Week Progress Info (Apple-style calendar placement) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px', marginBottom: '-8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Week progress</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#5e5ce6' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{doneCount}</span>/5 days done
                  </span>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '22px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', boxShadow: 'var(--shadow-card)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Deadlines</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {completedCount} of {totalCount} completed
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#5e5ce6' }}>
                        {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-dim)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                      <div style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`, height: '100%', backgroundColor: '#5e5ce6', borderRadius: '2px', transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {deadlines.length > 0 ? deadlines.slice(0, 5).map((item) => {
                      const { dayNum, dayName } = getDeadlineDayInfo(item.dueDate);
                      const color = getDeadlineColor(item.priority);
                      return (
                        <div
                          key={item._id}
                          onClick={() => handleToggleDeadline(item._id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer', transition: 'all 0.2s ease', opacity: item.isCompleted ? 0.6 : 1 }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
                        >
                          {/* Date icon */}
                          <div style={{ width: '42px', height: '46px', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-card)', flexShrink: 0, filter: item.isCompleted ? 'grayscale(100%)' : 'none' }}>
                            <div style={{ height: '14px', backgroundColor: item.isCompleted ? 'var(--text-tertiary)' : color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '8px', color: '#ffffff', fontWeight: '800', letterSpacing: '0.5px' }}>{dayName}</span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '800' }}>{dayNum}</span>
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h5 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: item.isCompleted ? 'line-through' : 'none' }}>
                              {item.title}
                            </h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subject}</span>
                            </div>
                          </div>

                          <div
                            style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${item.isCompleted ? color : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')}`, backgroundColor: item.isCompleted ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}
                          >
                            {item.isCompleted && <Check size={12} style={{ color: '#ffffff', strokeWidth: 3 }} />}
                          </div>
                        </div>
                      );
                    }) : (
                      <EmptyState compact title="No deadlines yet" message="Your upcoming assignments and tasks will appear here." />
                    )}
                  </div>

                  {/* Add Deadline */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {isAdding ? (
                      <form onSubmit={handleAddDeadline} style={{ backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#5e5ce6', letterSpacing: '0.5px' }}>New Reminder</span>
                          <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}>
                            <X size={16} />
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Task Title (e.g. OS Quiz)"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          required
                          style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                        />

                        <input
                          type="text"
                          placeholder="Subject / Category"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                        />

                        <input
                          type="datetime-local"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          required
                          style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'inherit', colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                        />

                        <button type="submit" style={{ backgroundColor: '#5e5ce6', color: '#ffffff', fontWeight: '700', fontSize: '12px', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4bb3'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e5ce6'}>
                          Add Reminder
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsAdding(true)}
                        style={{ backgroundColor: 'transparent', border: '1.5px dashed var(--border-card)', color: 'var(--text-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '12px', fontFamily: 'inherit', transition: 'all 0.2s ease', marginTop: '4px' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        <Plus size={14} style={{ color: '#5e5ce6' }} />
                        Add reminder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
