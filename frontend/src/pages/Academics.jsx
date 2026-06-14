import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  LogOut,
  Calendar,
  X,
  Database,
  BookOpen,
  ArrowUpRight,
  Sun,
  Moon,
  Loader2,
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import api from '../services/api.js';

const ACCENT    = '#f97316';
const ACCENT_DIM = 'rgba(249,115,22,0.14)';
const DANGER    = '#ff453a';
const SUCCESS   = '#34d399';

const Academics = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const containerRef = useRef(null);

  /* ── state ─────────────────────────────────────────────── */
  const [dynamicSubjectData, setDynamicSubjectData] = useState({});
  const [recommendations,   setRecommendations]     = useState({});
  const [loadingAcademics,  setLoadingAcademics]    = useState(true);
  const [selectedSubject,   setSelectedSubject]      = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showImproveModal,    setShowImproveModal]    = useState(false);
  const [showStudyPlanModal,  setShowStudyPlanModal]  = useState(false);
  const [endSemResults,       setEndSemResults]       = useState([]);
  const [cgpaData,            setCgpaData]            = useState(null);

  /* ── fetch ─────────────────────────────────────────────── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [midsemRes, attendanceRes, endsemRes, cgpaRes, recRes] = await Promise.all([
          api.get('/academics/midsem'),
          api.get('/attendance/summary'),
          api.get('/academics/endsem').catch(() => ({ data: { semesters: [] } })),
          api.get('/academics/cgpa').catch(() => ({ data: { cgpa: 0, sgpaList: [] } })),
          api.get('/academics/recommendations').catch(() => ({ data: { recommendations: {} } })),
        ]);

        const midsemData    = midsemRes.data.marks || {};
        const attendanceData = attendanceRes.data.subjects || [];
        setEndSemResults(endsemRes.data.semesters || []);
        setCgpaData(cgpaRes.data);
        setRecommendations(recRes.data.recommendations || {});

        /* Build subject map */
        const allSubjects = new Set();
        attendanceData.forEach(s => allSubjects.add(s.subjectCode));
        Object.values(midsemData).flat().forEach(m => {
          if (m && (m.subjectCode || m.subject)) {
            allSubjects.add(m.subjectCode || m.subject);
          }
        });

        const newData = {};
        for (const subCode of allSubjects) {
          const attInfo = attendanceData.find(s => s.subjectCode === subCode);
          const mid1Doc = (midsemData['Mid Sem 1'] || []).find(m => (m.subjectCode || m.subject) === subCode);
          const mid2Doc = (midsemData['Mid Sem 2'] || []).find(m => (m.subjectCode || m.subject) === subCode);

          const mid1 = mid1Doc ? (mid1Doc.marksObtained ?? mid1Doc.marks ?? 0) : 0;
          const mid2 = mid2Doc ? (mid2Doc.marksObtained ?? mid2Doc.marks ?? 0) : 0;

          const predicted    = Math.min(60, Math.round((mid1 + mid2) * 1.0));
          const growthVal    = mid2 - mid1;
          const growth       = growthVal >= 0
            ? `+${Math.round((growthVal / Math.max(1, mid1)) * 100)}`
            : `-${Math.round((Math.abs(growthVal) / Math.max(1, mid1)) * 100)}`;

          const attendance   = attInfo ? attInfo.percent : 0;

          // ✅ Flag only if predicted end-sem score < 35 (out of 60)
          const status       = predicted >= 35 ? 'on-track' : 'needs-attention';
          const statusLabel  = predicted >= 35 ? 'On Track' : 'Needs Attention';
          const fullName     = attInfo?.subject || mid1Doc?.subject || mid2Doc?.subject || subCode;

          newData[subCode] = {
            name: subCode,
            fullName,
            mid1,
            mid2,
            predicted,
            growth: `${growth}%`,
            isPositive: growthVal >= 0,
            color:  status === 'on-track' ? SUCCESS : DANGER,
            accent: status === 'on-track' ? 'rgba(52,211,153,0.14)' : 'rgba(255,69,58,0.14)',
            attendance,
            status,
            statusLabel,
            insight: `Your midsem marks for ${fullName}: Mid 1: ${mid1}/30, Mid 2: ${mid2}/30. Predicted end-sem: ${predicted}/60.${predicted < 35 ? ' ⚠️ Your predicted score is below 35. Focus on improving before finals.' : ' Keep up the good performance!'}`,
            weakAreas: ['Review past exam papers', 'Strengthen weak unit topics'],
            strengths: 'Class consistency',
          };
        }

        setDynamicSubjectData(newData);
        const keys = Object.keys(newData);
        if (keys.length > 0) setSelectedSubject(keys[0]);
      } catch (err) {
        console.error('Failed to load academics:', err);
      } finally {
        setLoadingAcademics(false);
      }
    };

    fetchAll();
  }, []);

  /* ── derived ────────────────────────────────────────────── */
  const currentData = dynamicSubjectData[selectedSubject] || Object.values(dynamicSubjectData)[0] || {
    name: '—', fullName: 'Loading…', mid1: 0, mid2: 0, predicted: 0,
    growth: '0%', isPositive: true, color: ACCENT, accent: ACCENT_DIM,
    attendance: 0, status: 'on-track', statusLabel: 'On Track',
    insight: '', weakAreas: [], strengths: '',
  };

  // Normalize subject code for recommendation lookup (remove hyphens / spaces)
  const recKey = selectedSubject.replace(/[-\s]/g, '').toUpperCase();
  const currentRec = recommendations[recKey] || null;

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── styles ─────────────────────────────────────────────── */
  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-card)',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  };
  const mutedText = 'var(--text-secondary)';
  const dimText   = 'var(--text-tertiary)';

  /* ── subject dropdown items ─────────────────────────────── */
  const subjectKeys = Object.keys(dynamicSubjectData);

  /* ── modal content ──────────────────────────────────────── */
  const improvementItems = currentRec?.improvementPlan?.length
    ? currentRec.improvementPlan
    : [
        { title: `Review ${currentData.name} Past Papers`,    description: 'Solve last 5 years PYQs to identify high-frequency topics and exam patterns.' },
        { title: 'Strengthen Weak Unit Topics',               description: 'Spend 2 hours per weak topic, focusing on understanding rather than memorization.' },
        { title: 'Join Study Groups',                         description: 'Discuss concepts with peers to fill gaps and reinforce understanding.' },
      ];

  const studyPlanItems = currentRec?.studyPlan?.length
    ? currentRec.studyPlan
    : [
        { week: 'Week 1', title: 'Foundation Review',         description: 'Cover all Unit I topics thoroughly. Solve 10 textbook exercises.' },
        { week: 'Week 2', title: 'Core Topic Mastery',        description: 'Deep-dive into Units II & III. Focus on problem-solving and numerical practice.' },
        { week: 'Week 3', title: 'Exam Preparation',          description: 'Attempt full mock paper. Revise weak areas, review formulae and definitions.' },
      ];

  const weakAreas = currentRec?.weakAreas?.length ? currentRec.weakAreas : currentData.weakAreas;

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div style={{
      backgroundColor: 'var(--bg-body)',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: 'var(--text-primary)',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-body)', minHeight: '100vh' }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 40px',
          backgroundColor: 'var(--bg-body)',
          borderBottom: '1px solid var(--border-dim)',
          zIndex: 100,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px', width: '18px', height: '18px' }}>
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#f97316' }} />
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#5e5ce6' }} />
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#30d158' }} />
              <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', backgroundColor: '#ff9f0a' }} />
            </div>
            <span>OneCampus</span>
          </div>

          <nav style={{
            display: 'flex', alignItems: 'center',
            backgroundColor: 'var(--bg-nav-pill-outer)',
            padding: '6px', borderRadius: '9999px',
            border: '1px solid var(--border-nav-pill)', gap: '6px',
          }}>
            {[
              { label: 'Overview',   path: '/dashboard' },
              { label: 'Academics',  path: '/academics', active: true },
              { label: 'Attendance', path: '/attendance' },
              { label: 'Deadlines',  path: '/deadlines' },
            ].map(nav => (
              <div key={nav.label} style={{ position: 'relative' }}>
                <button
                  onClick={() => navigate(nav.path)}
                  style={{
                    padding: '8px 24px', fontSize: '13.5px', fontWeight: '600',
                    borderRadius: '9999px',
                    color: nav.active ? 'var(--text-primary)' : mutedText,
                    backgroundColor: nav.active ? 'var(--bg-active-pill)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!nav.active) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}}
                  onMouseLeave={e => { if (!nav.active) { e.currentTarget.style.color = mutedText; e.currentTarget.style.backgroundColor = 'transparent'; }}}
                >
                  {nav.label}
                </button>
                {nav.active && (
                  <span style={{
                    position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
                    width: '4px', height: '4px', backgroundColor: ACCENT, borderRadius: '50%',
                  }} />
                )}
              </div>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={toggleTheme}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'transform 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '2px', right: '2px', width: '5px', height: '5px', backgroundColor: DANGER, borderRadius: '50%' }} />
            </button>

            <div style={{ position: 'relative' }}>
              <div
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'MA'}
              </div>
              {showProfileDropdown && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: 'var(--bg-dropdown)', border: '1px solid var(--border-dim)', borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', padding: '6px 0', minWidth: '160px', zIndex: 150 }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: '9px', color: dimText, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>User</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold', margin: '2px 0 0' }}>{user?.name || 'Student'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: DANGER, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN ───────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '12px 40px 24px', overflowY: 'auto' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Page title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px' }}>
              <div>
                <span style={{ fontSize: '11px', color: dimText, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '3px' }}>
                  Semester {user?.semester || '4'} · {user?.branch || 'ECE'}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.6px' }}>Academics</h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  backgroundColor: 'var(--bg-subcard)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px', padding: '5px 11px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: '600', color: mutedText,
                }}>
                  Semester {user?.semester || '4'} <ChevronDown size={12} style={{ opacity: 0.5 }} />
                </div>
                <div style={{
                  backgroundColor: 'rgba(52,211,153,0.06)',
                  border: '1px solid rgba(52,211,153,0.18)',
                  borderRadius: '8px', padding: '5px 11px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '11px', fontWeight: '700', color: SUCCESS,
                }}>
                  <TrendingUp size={12} />
                  CGPA · {cgpaData?.cgpa ? cgpaData.cgpa.toFixed(2) : (user?.cgpa ? Number(user.cgpa).toFixed(2) : 'N/A')}
                </div>
              </div>
            </div>

            {/* ── TOP ROW: Chart + AI Mentor ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.9fr', gap: '14px', alignItems: 'stretch' }}>

              {/* Performance Chart */}
              <div style={{ ...cardStyle, padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.2px' }}>Performance Trajectory</h3>
                    <span style={{ fontSize: '11px', color: dimText, fontWeight: '500', marginTop: '2px', display: 'block' }}>
                      Progress in&nbsp;<span style={{ color: currentData.color, fontWeight: '700' }}>{currentData.name}</span>
                    </span>
                  </div>

                  {/* Subject Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <div
                      onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                      style={{
                        backgroundColor: 'var(--bg-nav-pill-outer)',
                        border: '1px solid var(--border-nav-pill)',
                        borderRadius: '10px', padding: '5px 10px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      <Database size={12} style={{ opacity: 0.6 }} />
                      {currentData.name}
                      <ChevronDown size={12} style={{ opacity: 0.5 }} />
                    </div>

                    {showSubjectDropdown && (
                      <div style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                        backgroundColor: 'var(--bg-dropdown)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
                        padding: '5px', minWidth: '130px', zIndex: 120,
                      }}>
                        {subjectKeys.map(subKey => (
                          <div
                            key={subKey}
                            onClick={() => { setSelectedSubject(subKey); setShowSubjectDropdown(false); }}
                            style={{
                              padding: '8px 12px', fontSize: '12px', fontWeight: '600',
                              borderRadius: '8px',
                              color: selectedSubject === subKey ? 'var(--text-primary)' : mutedText,
                              backgroundColor: selectedSubject === subKey ? 'var(--bg-active-pill)' : 'transparent',
                              cursor: 'pointer', transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { if (selectedSubject !== subKey) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { if (selectedSubject !== subKey) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            {subKey}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SVG Chart — clean, no glow filters */}
                <div style={{
                  width: '100%', borderRadius: '14px', overflow: 'hidden',
                  background: 'var(--bg-subcard)',
                  border: '1px solid var(--border-card)',
                  padding: '8px 0 0',
                }}>
                  <svg width="100%" viewBox="0 0 500 210" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id={`grad-${selectedSubject}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={currentData.color} stopOpacity="0.18" />
                        <stop offset="100%" stopColor={currentData.color} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 15, 30, 45, 60].map(lvl => {
                      const gy = 175 - (lvl / 60) * 155;
                      return (
                        <g key={lvl}>
                          <line x1="54" y1={gy} x2="490" y2={gy}
                            stroke={lvl === 0 ? 'rgba(128,128,128,0.15)' : 'rgba(128,128,128,0.07)'}
                            strokeWidth="1" strokeDasharray={lvl === 0 ? 'none' : '3 6'} />
                          <text x="48" y={gy + 4} fill="var(--text-tertiary)" fontSize="9" fontWeight="600" textAnchor="end">{lvl}</text>
                        </g>
                      );
                    })}

                    {(() => {
                      const m1x = 80,  m1y = 175 - (currentData.mid1      / 60) * 155;
                      const m2x = 250, m2y = 175 - (currentData.mid2      / 60) * 155;
                      const pdx = 420, pdy = 175 - (currentData.predicted / 60) * 155;
                      const cp1x = (m1x + m2x) / 2, cp1y = (m1y + m2y) / 2;
                      const cp2x = (m2x + pdx) / 2, cp2y = (m2y + pdy) / 2;

                      return (
                        <>
                          {/* Gradient fill area */}
                          <path
                            d={`M ${m1x} 175 L ${m1x} ${m1y} Q ${cp1x} ${cp1y} ${m2x} ${m2y} Q ${cp2x} ${cp2y} ${pdx} ${pdy} L ${pdx} 175 Z`}
                            fill={`url(#grad-${selectedSubject})`}
                          />

                          {/* Solid line Mid1 → Mid2 */}
                          <path
                            d={`M ${m1x} ${m1y} Q ${cp1x} ${cp1y} ${m2x} ${m2y}`}
                            fill="none" stroke="var(--text-primary)" strokeOpacity="0.65"
                            strokeWidth="2" strokeLinecap="round"
                          />

                          {/* Dashed predicted line */}
                          <path
                            d={`M ${m2x} ${m2y} Q ${cp2x} ${cp2y} ${pdx} ${pdy}`}
                            fill="none" stroke={currentData.color}
                            strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round"
                          />

                          {/* Dots */}
                          <circle cx={m1x} cy={m1y} r="5" fill="var(--bg-card)" stroke="var(--text-secondary)" strokeWidth="2.5" />
                          <circle cx={m2x} cy={m2y} r="5" fill="var(--bg-card)" stroke="var(--text-secondary)" strokeWidth="2.5" />
                          <circle cx={pdx}  cy={pdy}  r="6" fill={currentData.color} stroke="var(--bg-card)" strokeWidth="2.5" />

                          {/* Labels */}
                          <text x={m1x} y={m1y - 12} fill="var(--text-primary)" fontSize="12" fontWeight="800" textAnchor="middle">{currentData.mid1}</text>
                          <text x={m2x} y={m2y - 12} fill="var(--text-primary)" fontSize="12" fontWeight="800" textAnchor="middle">{currentData.mid2}</text>
                          <text x={pdx}  y={pdy - 12}  fill={currentData.color}   fontSize="12" fontWeight="800" textAnchor="middle">{currentData.predicted}</text>

                          <text x={m1x} y="192" fill={mutedText} fontSize="9.5" fontWeight="600" textAnchor="middle">Mid Sem 1</text>
                          <text x={m1x} y="203" fill={dimText}   fontSize="8.5" fontWeight="500" textAnchor="middle">{currentData.mid1}/30</text>
                          <text x={m2x} y="192" fill={mutedText} fontSize="9.5" fontWeight="600" textAnchor="middle">Mid Sem 2</text>
                          <text x={m2x} y="203" fill={dimText}   fontSize="8.5" fontWeight="500" textAnchor="middle">{currentData.mid2}/30</text>
                          <text x={pdx}  y="192" fill={currentData.color} fontSize="9.5" fontWeight="700" textAnchor="middle">End Sem (Predicted)</text>
                          <text x={pdx}  y="203" fill={dimText}   fontSize="8.5" fontWeight="500" textAnchor="middle">{currentData.predicted}/60</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', borderTop: '1px solid var(--border-dim)', paddingTop: '14px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', display: 'block' }}>
                      {((currentData.mid1 + currentData.mid2) / 2).toFixed(1)}
                    </span>
                    <span style={{ fontSize: '9px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '2px', display: 'block' }}>Mid Avg</span>
                  </div>
                  <div style={{ height: '24px', backgroundColor: 'var(--border-dim)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: currentData.color, letterSpacing: '-0.5px', display: 'block' }}>
                      {currentData.predicted}<span style={{ fontSize: '11px', color: dimText, fontWeight: '600' }}>/60</span>
                    </span>
                    <span style={{ fontSize: '9px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '2px', display: 'block' }}>Predicted</span>
                  </div>
                  <div style={{ height: '24px', backgroundColor: 'var(--border-dim)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: currentData.isPositive ? SUCCESS : DANGER, letterSpacing: '-0.5px', display: 'block' }}>
                      {currentData.growth}
                    </span>
                    <span style={{ fontSize: '9px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '2px', display: 'block' }}>Growth</span>
                  </div>
                </div>
              </div>

              {/* ── AI Mentor Card ───────────────────────────── */}
              <div style={{ ...cardStyle, padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    backgroundColor: ACCENT_DIM,
                    border: `1px solid rgba(249,115,22,0.25)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={13} color={ACCENT} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Academic Mentor</h3>
                  <span style={{
                    fontSize: '9px', fontWeight: '700', color: ACCENT,
                    backgroundColor: ACCENT_DIM,
                    border: `1px solid rgba(249,115,22,0.22)`,
                    padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>AI</span>
                </div>
                <span style={{ fontSize: '10px', color: dimText, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{currentData.fullName}</span>

                {/* Status + Progress */}
                <div style={{
                  backgroundColor: 'var(--bg-subcard)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px', padding: '12px 13px',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{currentData.fullName}</span>
                    <span style={{
                      fontSize: '9px', fontWeight: '800',
                      color: currentData.status === 'needs-attention' ? '#fbbf24' : SUCCESS,
                      backgroundColor: currentData.status === 'needs-attention' ? 'rgba(251,191,36,0.10)' : 'rgba(52,211,153,0.08)',
                      padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{currentData.statusLabel}</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '10px', color: mutedText, fontWeight: '600' }}>Mid Avg Score</span>
                      <span style={{ fontSize: '10px', color: currentData.color, fontWeight: '700' }}>
                        {((currentData.mid1 + currentData.mid2) / 2).toFixed(1)} / 30
                      </span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-dim)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${((currentData.mid1 + currentData.mid2) / 2 / 30) * 100}%`,
                        borderRadius: '2px',
                        background: currentData.status === 'needs-attention'
                          ? `linear-gradient(90deg, ${DANGER}90, #fbbf24)`
                          : `linear-gradient(90deg, ${SUCCESS}90, ${SUCCESS})`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: mutedText, margin: 0, lineHeight: 1.55, fontWeight: '500' }}>
                    {currentRec?.insight || currentData.insight}
                  </p>

                  {/* Weak areas */}
                  <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '9px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '7px' }}>
                      Focus Before Finals
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {weakAreas.slice(0, 3).map((area, i) => (
                        <div key={area} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          backgroundColor: 'var(--bg-body)',
                          border: '1px solid var(--border-dim)',
                          borderLeft: `3px solid ${currentData.color}`,
                          borderRadius: '7px', padding: '6px 10px',
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: '500', color: dimText, minWidth: '14px' }}>#{i + 1}</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', flex: 1 }}>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    onClick={() => setShowImproveModal(true)}
                    style={{
                      backgroundColor: 'var(--bg-subcard)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '12px', padding: '10px 13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(249,115,22,0.3)`; e.currentTarget.style.backgroundColor = ACCENT_DIM; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.backgroundColor = 'var(--bg-subcard)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowUpRight size={14} color={ACCENT} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>Help me improve {currentData.name}</span>
                        <span style={{ fontSize: '10px', color: dimText, fontWeight: '500' }}>Personalized recommendations</span>
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-tertiary)" />
                  </div>

                  <div
                    onClick={() => setShowStudyPlanModal(true)}
                    style={{
                      backgroundColor: 'var(--bg-subcard)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '12px', padding: '10px 13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(249,115,22,0.3)`; e.currentTarget.style.backgroundColor = ACCENT_DIM; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.backgroundColor = 'var(--bg-subcard)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={14} color={mutedText} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>Build a 3-week study plan</span>
                        <span style={{ fontSize: '10px', color: dimText, fontWeight: '500' }}>Structured plan for {currentData.fullName}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-tertiary)" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── OFFICIAL RESULTS ─────────────────────────────── */}
            <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', color: dimText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '2px' }}>Official Records</span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Official GGSIPU End-Semester Results</h3>
                <span style={{ fontSize: '11px', color: dimText, fontWeight: '500', marginTop: '2px', display: 'block' }}>Synced directly from the GGSIPU results archive database.</span>
              </div>

              {loadingAcademics ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: dimText, padding: '20px 0' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '13px' }}>Loading results…</span>
                </div>
              ) : endSemResults && endSemResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {endSemResults.map(semGroup => (
                    <div key={semGroup.semester} style={{
                      backgroundColor: 'var(--bg-subcard)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '12px', padding: '18px',
                      display: 'flex', flexDirection: 'column', gap: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '10px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Semester {semGroup.semester}</h4>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {semGroup.subjects[0]?.examSession && (
                            <span style={{ fontSize: '11px', color: dimText, fontWeight: '500' }}>Session: {semGroup.subjects[0].examSession}</span>
                          )}
                          <span style={{
                            fontSize: '11px', fontWeight: '700', color: SUCCESS,
                            backgroundColor: 'rgba(52,211,153,0.08)',
                            border: '1px solid rgba(52,211,153,0.18)',
                            padding: '2px 8px', borderRadius: '12px',
                          }}>
                            SGPA: {semGroup.sgpa ? semGroup.sgpa.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                              {['Paper Code', 'Subject', 'Internal', 'External', 'Total', 'Credits', 'Grade'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', fontSize: '10px', color: dimText, fontWeight: '700', textTransform: 'uppercase', textAlign: h === 'Subject' || h === 'Paper Code' ? 'left' : 'center' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {semGroup.subjects.map((sub, sIdx) => (
                              <tr key={sIdx} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                                <td style={{ padding: '10px 12px', fontSize: '12px', color: mutedText, fontFamily: 'monospace' }}>{sub.paperCode}</td>
                                <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>{sub.subjectName}</td>
                                <td style={{ padding: '10px 12px', fontSize: '12px', color: mutedText, textAlign: 'center' }}>{sub.internal}</td>
                                <td style={{ padding: '10px 12px', fontSize: '12px', color: mutedText, textAlign: 'center' }}>{sub.external}</td>
                                <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'center' }}>{sub.total}</td>
                                <td style={{ padding: '10px 12px', fontSize: '12px', color: mutedText, textAlign: 'center' }}>{sub.credits}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{
                                    fontSize: '11px', fontWeight: '800',
                                    color: sub.grade === 'F' ? DANGER : SUCCESS,
                                    backgroundColor: sub.grade === 'F' ? 'rgba(255,69,58,0.08)' : 'rgba(52,211,153,0.08)',
                                    padding: '2px 6px', borderRadius: '4px',
                                  }}>{sub.grade}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: dimText, fontSize: '12px' }}>
                  No official GGSIPU end-semester exam scores synced yet.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── IMPROVE MODAL ─────────────────────────────────────── */}
      {showImproveModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '20px', padding: '24px', width: '420px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color={ACCENT} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{currentData.name} Improvement Plan</h4>
              </div>
              <button onClick={() => setShowImproveModal(false)} style={{ background: 'none', border: 'none', color: mutedText, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: mutedText, margin: 0, lineHeight: 1.5 }}>
              Complete these high-priority recommendations to raise your {currentData.name} performance:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {improvementItems.map((rec, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--bg-subcard)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '12px', padding: '12px',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <span style={{ fontSize: '10px', color: ACCENT, fontWeight: '800' }}>{i + 1}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'block' }}>{rec.title}</span>
                    <span style={{ fontSize: '10px', color: mutedText, fontWeight: '500', marginTop: '2px', display: 'block', lineHeight: 1.4 }}>{rec.description}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowImproveModal(false)}
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #ea580c)`,
                color: '#fff', fontWeight: '700', fontSize: '12px',
                padding: '11px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                boxShadow: `0 4px 16px rgba(249,115,22,0.25)`,
              }}
            >
              Start {currentData.name} Boost
            </button>
          </div>
        </div>
      )}

      {/* ── STUDY PLAN MODAL ──────────────────────────────────── */}
      {showStudyPlanModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '20px', padding: '24px', width: '420px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color={ACCENT} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{currentData.name} – 3-Week Study Plan</h4>
              </div>
              <button onClick={() => setShowStudyPlanModal(false)} style={{ background: 'none', border: 'none', color: mutedText, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: mutedText, margin: 0, lineHeight: 1.5 }}>
              A structured 3-week pacing plan to master {currentData.fullName} and score full marks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {studyPlanItems.map((item, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--bg-subcard)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '12px', padding: '12px',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <div style={{
                    fontSize: '9px', fontWeight: '800', color: ACCENT,
                    backgroundColor: ACCENT_DIM,
                    padding: '3px 7px', borderRadius: '5px',
                    letterSpacing: '0.5px', flexShrink: 0, marginTop: '2px',
                    whiteSpace: 'nowrap',
                  }}>{item.week}</div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'block' }}>{item.title}</span>
                    <span style={{ fontSize: '10px', color: mutedText, fontWeight: '500', marginTop: '2px', display: 'block', lineHeight: 1.4 }}>{item.description}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowStudyPlanModal(false)}
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #ea580c)`,
                color: '#fff', fontWeight: '700', fontSize: '12px',
                padding: '11px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                boxShadow: `0 4px 16px rgba(249,115,22,0.25)`,
              }}
            >
              Save Plan
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Academics;
