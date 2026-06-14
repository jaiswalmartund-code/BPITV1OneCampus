import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Flame,
  Award,
  Sparkles,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import api from '../services/api.js';
import EmptyState from '../components/EmptyState.jsx';

const Attendance = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Data states
  const [summary, setSummary] = useState(null);
  const [calendarData, setCalendarData] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Calendar state
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch attendance summary
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const { data } = await api.get('/attendance/summary');
        setSummary(data);
        if (data.subjects && data.subjects.length > 0) {
          setSelectedSubject(data.subjects[0].subjectCode);
        }
      } catch (err) {
        console.error('Attendance summary error:', err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch calendar data when subject/month/year changes
  useEffect(() => {
    if (!selectedSubject) return;
    const fetchCalendar = async () => {
      setLoadingCalendar(true);
      try {
        const { data } = await api.get('/attendance/calendar', {
          params: { subject: selectedSubject, month: viewMonth + 1, year: viewYear }
        });
        setCalendarData(data.calendar || {});
      } catch (err) {
        console.error('Calendar fetch error:', err);
        setCalendarData({});
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchCalendar();
  }, [selectedSubject, viewMonth, viewYear]);

  // Generate calendar days for current view
  const generateCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Monday-based: 0=Mon,...,6=Sun
    let startDayOfWeek = firstDay.getDay(); // 0=Sun,1=Mon,...
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // convert to Mon=0

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    // Next month padding (fill to complete 6 rows = 42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const getDayStatus = (dayObj, index) => {
    if (!dayObj.isCurrentMonth) return null;
    const colIndex = index % 7; // 0=Mon,...,6=Sun
    if (colIndex === 5 || colIndex === 6) return 'weekend';
    const status = calendarData[dayObj.day];
    if (!status) return 'no-data';
    if (status === 'Present' || status === 'Late') return 'present';
    if (status === 'Absent') return 'absent';
    if (status === 'Weekend') return 'weekend';
    return 'no-class';
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Summary counts from calendar
  const getSummaryCounts = () => {
    let held = 0, present = 0, absent = 0;
    Object.values(calendarData).forEach(status => {
      if (status === 'Present' || status === 'Absent' || status === 'Late') {
        held++;
        if (status === 'Present' || status === 'Late') present++;
        else absent++;
      }
    });
    return { held, present, absent };
  };

  const calSummary = getSummaryCounts();

  // Overall stats
  const overallData = summary?.overall || { percent: 0, attended: 0, total: 0 };
  const subjects = summary?.subjects || [];
  const theorySubjects = subjects.filter(s => !s.subjectCode?.toLowerCase().includes('lab'));
  const labSubjects = subjects.filter(s => s.subjectCode?.toLowerCase().includes('lab'));
  const theoryPercent = theorySubjects.length > 0 ? Math.round(theorySubjects.reduce((a, s) => a + s.percent, 0) / theorySubjects.length) : 0;
  const labPercent = labSubjects.length > 0 ? Math.round(labSubjects.reduce((a, s) => a + s.percent, 0) / labSubjects.length) : 0;

  const mutedText = 'var(--text-secondary)';
  const dimText = 'var(--text-tertiary)';

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-card)',
    transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
  };

  // User initials
  const initials = user?.name ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div style={{ backgroundColor: 'var(--bg-body)', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif", color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-body)', minHeight: '100vh', transition: 'background-color 0.3s ease' }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 40px', backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-dim)', zIndex: 100, transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px', width: '18px', height: '18px' }}>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#5e5ce6' }}></div>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#30d158' }}></div>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#ff9f0a' }}></div>
            </div>
            <span>OneCampus</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', padding: '6px', borderRadius: '9999px', gap: '6px', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
            <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: mutedText, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = mutedText; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => navigate('/dashboard')}>Overview</button>

            <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: mutedText, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = mutedText; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => navigate('/academics')}>Academics</button>

            <div style={{ position: 'relative' }}>
              <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-active-pill)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Attendance
              </button>
              <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: '#5e5ce6', borderRadius: '50%' }}></span>
            </div>

            <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: mutedText, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = mutedText; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => navigate('/deadlines')}>Deadlines</button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: mutedText, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'transform 0.2s ease, color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = mutedText; }}
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button style={{ position: 'relative', background: 'none', border: 'none', color: mutedText, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <Bell size={18} />
            </button>

            <div style={{ position: 'relative' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#5e5ce6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {initials}
              </div>

              {showProfileDropdown && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: 'var(--bg-dropdown)', border: '1px solid var(--border-dim)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)', padding: '6px 0', minWidth: '160px', zIndex: 150 }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: '9px', color: dimText, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Student</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>{user?.name || '—'}</p>
                  </div>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: '#ef4444', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div style={{ flex: 1, padding: '24px 40px 10px 40px', overflowY: 'auto' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.6px' }}>Attendance</h1>
                <span style={{ fontSize: '13px', color: mutedText, fontWeight: '500', marginTop: '3px', display: 'block' }}>Track your presence. Every day counts.</span>
              </div>
              <div style={{ backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', borderRadius: '10px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Award size={14} style={{ color: '#5e5ce6' }} />
                {user?.semester ? `Semester ${user.semester}` : 'Current Semester'}
              </div>
            </div>

            {loadingSummary ? (
              <EmptyState title="Loading attendance data..." message="Please wait while we fetch your records." />
            ) : subjects.length === 0 ? (
              <EmptyState title="No attendance records yet" message="Your attendance data will appear here once your teacher starts marking attendance." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.9fr', gap: '24px', alignItems: 'stretch' }}>

                {/* Column 1: Calendar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Calendar Card */}
                  <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={prevMonth} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: mutedText }}><ChevronLeft size={16} /></button>
                            <button onClick={nextMonth} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: mutedText }}><ChevronRight size={16} /></button>
                          </div>
                        </div>

                        {/* Subject Dropdown */}
                        <div style={{ position: 'relative' }}>
                          <div
                            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                            style={{ backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', borderRadius: '10px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}
                          >
                            <span>Subject: {selectedSubject || 'All'}</span>
                            <ChevronDown size={14} style={{ opacity: 0.6 }} />
                          </div>

                          {showSubjectDropdown && (
                            <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', backgroundColor: 'var(--bg-dropdown)', border: '1px solid var(--border-dim)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)', padding: '6px', minWidth: '170px', zIndex: 120 }}>
                              {subjects.map((sub) => (
                                <div
                                  key={sub.subjectCode}
                                  onClick={() => { setSelectedSubject(sub.subjectCode); setShowSubjectDropdown(false); }}
                                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', color: selectedSubject === sub.subjectCode ? 'var(--text-primary)' : mutedText, backgroundColor: selectedSubject === sub.subjectCode ? 'var(--bg-active-pill)' : 'transparent', cursor: 'pointer' }}
                                >
                                  {sub.subjectCode}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: '700', color: mutedText }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#30d158' }}></span>
                          <span>Present</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: '#ff453a', fontSize: '10px', fontWeight: 'bold' }}>✕</span>
                          <span>Absent</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', border: '1px solid var(--text-tertiary)', backgroundColor: 'transparent' }}></span>
                          <span>No Class</span>
                        </div>
                      </div>
                    </div>

                    {/* Calendar Grid Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', borderBottom: '1px solid var(--border-dim)', marginBottom: '8px' }}>
                      {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(dayName => (
                        <span key={dayName} style={{ fontSize: '10.5px', fontWeight: '700', color: dimText, paddingBottom: '6px' }}>{dayName}</span>
                      ))}
                    </div>

                    {/* Calendar Dates Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px 6px', textAlign: 'center' }}>
                      {calendarDays.map((dayObj, index) => {
                        const status = getDayStatus(dayObj, index);
                        const isToday = dayObj.isCurrentMonth && dayObj.day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
                        
                        return (
                          <div key={index} style={{ height: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', opacity: dayObj.isCurrentMonth ? 1 : 0.25 }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? '#5e5ce6' : 'transparent', color: isToday ? '#ffffff' : 'var(--text-primary)', fontSize: '11.5px', fontWeight: isToday ? '800' : '600', transition: 'all 0.2s ease' }}>
                              {dayObj.day}
                            </div>
                            <div style={{ height: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                              {status === 'present' && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#30d158' }}></span>}
                              {status === 'absent' && <span style={{ color: '#ff453a', fontSize: '8px', fontWeight: '900', lineHeight: 1 }}>✕</span>}
                              {status === 'no-class' && <span style={{ width: '4px', height: '4px', borderRadius: '50%', border: `1px solid ${dimText}` }}></span>}
                              {status === 'weekend' && null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Stats Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderTop: '1px solid var(--border-dim)', marginTop: '20px', paddingTop: '16px', fontSize: '12px', fontWeight: '700', color: mutedText }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} style={{ color: '#5e5ce6' }} />
                        <span>Classes held: <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{calSummary.held}</span></span>
                      </div>
                      <span style={{ color: 'var(--border-dim)' }}>|</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#30d158' }}>●</span>
                        <span>Present: <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{calSummary.present}</span></span>
                      </div>
                      <span style={{ color: 'var(--border-dim)' }}>|</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#ff453a' }}>✕</span>
                        <span>Absent: <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{calSummary.absent}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Streak Widget */}
                  <div style={{ ...cardStyle, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 69, 58, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Flame size={16} style={{ color: '#ff453a' }} />
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: dimText, fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Status</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {overallData.percent >= 75 ? 'On Track ✓' : 'Needs Attention ⚠'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 159, 10, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Award size={16} style={{ color: '#ff9f0a' }} />
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: dimText, fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Overall</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{overallData.percent}% attendance</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: '#5e5ce6' }} />
                      <span style={{ fontSize: '12px', color: mutedText, fontWeight: '600', fontStyle: 'italic' }}>Consistency today, success tomorrow.</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Stats & Subject List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Overall Stats Card */}
                  <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Attendance</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '6px' }}>
                        <span style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{overallData.percent}</span>
                        <span style={{ fontSize: '24px', fontWeight: '700', color: dimText }}>%</span>
                      </div>
                      <span style={{ fontSize: '11px', color: mutedText, fontWeight: '600', display: 'block', marginTop: '4px' }}>{overallData.attended} out of {overallData.total} classes</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-dim)', paddingTop: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Theory</span>
                          <span>{theoryPercent}%</span>
                        </div>
                        <div style={{ height: '5px', backgroundColor: 'var(--border-dim)', borderRadius: '2.5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${theoryPercent}%`, backgroundColor: '#5e5ce6', borderRadius: '2.5px' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Labs</span>
                          <span>{labPercent}%</span>
                        </div>
                        <div style={{ height: '5px', backgroundColor: 'var(--border-dim)', borderRadius: '2.5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${labPercent}%`, backgroundColor: '#5e5ce6', borderRadius: '2.5px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* By Subject Card */}
                  <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <span style={{ fontSize: '11px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>By Subject</span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {subjects.map((sub) => {
                        const isSelected = selectedSubject === sub.subjectCode;
                        const color = sub.percent >= 75 ? '#30d158' : sub.percent >= 60 ? '#ff9f0a' : '#ff453a';

                        return (
                          <div
                            key={sub.subjectCode}
                            onClick={() => setSelectedSubject(isSelected ? null : sub.subjectCode)}
                            style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '10px', border: `1px solid ${isSelected ? color : 'transparent'}`, backgroundColor: isSelected ? 'var(--bg-nav-pill-outer)' : 'transparent', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill-outer)'; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color }}>
                                    {sub.subjectCode?.slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>{sub.subjectCode}</span>
                                  <span style={{ fontSize: '10px', color: dimText, fontWeight: '600' }}>{sub.attended} / {sub.total} classes</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)' }}>{sub.percent}%</span>
                                <ChevronRight size={14} style={{ opacity: 0.4 }} />
                              </div>
                            </div>

                            <div style={{ height: '4px', backgroundColor: 'var(--border-dim)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${sub.percent}%`, backgroundColor: color, borderRadius: '2px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
