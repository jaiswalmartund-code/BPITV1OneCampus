import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LogOut,
  Clock,
  Calendar,
  Check,
  X,
  Plus,
  Sun,
  Moon,
  Database,
  FlaskConical,
  Monitor,
  Code,
  Trash2,
  ExternalLink,
  FileText
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import api from '../services/api.js';
import EmptyState from '../components/EmptyState.jsx';

const getDeadlineColor = (priority) => {
  if (priority === 'Urgent') return { color: '#ff453a', bg: 'rgba(255, 69, 58, 0.12)' };
  if (priority === 'Upcoming') return { color: '#ff9f0a', bg: 'rgba(255, 159, 10, 0.12)' };
  return { color: '#5e5ce6', bg: 'rgba(94, 92, 230, 0.12)' };
};

const getSubjectIcon = (subject) => {
  if (!subject) return Database;
  const s = subject.toLowerCase();
  if (s.includes('lab') || s.includes('practical')) return FlaskConical;
  if (s.includes('os') || s.includes('operating')) return Monitor;
  if (s.includes('python') || s.includes('code') || s.includes('program')) return Code;
  return Database;
};

const formatDueDate = (dueDate) => {
  const d = new Date(dueDate);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (diffDays <= 0) return { dateText: 'Overdue', dateDetail: `${dateStr}, ${timeStr}` };
  if (diffDays === 1) return { dateText: 'Due Tomorrow', dateDetail: `${dateStr}, ${timeStr}` };
  return { dateText: `Due in ${diffDays} Days`, dateDetail: `${dateStr}, ${timeStr}` };
};

const Deadlines = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [deadlineType, setDeadlineType] = useState('File Assignment');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState('File Assignment');
  const [addingError, setAddingError] = useState('');

  // Data state
  const [allDeadlines, setAllDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submission state
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch deadlines
  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/deadlines');
      setAllDeadlines(data.deadlines || []);
    } catch (err) {
      console.error('Fetch deadlines error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const handleToggle = async (id) => {
    try {
      await api.patch(`/deadlines/${id}/toggle`);
      setAllDeadlines(prev => prev.map(d => d._id === id ? { ...d, isCompleted: !d.isCompleted } : d));
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/deadlines/${id}`);
      setAllDeadlines(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDeadlineClick = (item) => {
    if (item.isTeacherCreated) {
      setSelectedDeadline(item);
      setSubmissionUrl(item.submission?.fileUrl || '');
      setSubmitError('');
      setSubmitSuccess('');
    } else {
      handleToggle(item._id);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionUrl.trim()) {
      setSubmitError('Please enter a valid Google Drive link.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const { data } = await api.post(`/deadlines/${selectedDeadline._id}/submit`, {
        fileUrl: submissionUrl.trim()
      });
      setSubmitSuccess('Assignment submitted successfully!');
      setSelectedDeadline(prev => ({
        ...prev,
        submission: data.submission,
        isCompleted: true
      }));
      fetchDeadlines();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddingError('');
    if (!newTitle.trim() || !newDueDate) {
      setAddingError('Title and due date are required.');
      return;
    }
    try {
      await api.post('/deadlines', {
        title: newTitle,
        subject: newSubject || 'General',
        dueDate: newDueDate,
        type: newType,
      });
      setNewTitle('');
      setNewSubject('');
      setNewDueDate('');
      setNewType('File Assignment');
      setShowAddForm(false);
      fetchDeadlines();
    } catch (err) {
      setAddingError(err.response?.data?.message || 'Failed to create deadline.');
    }
  };

  // Filter by type
  const typeFiltered = allDeadlines.filter(d => d.type === deadlineType);

  // Filter by tab
  const filtered = typeFiltered.filter(d => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Completed') return d.isCompleted;
    if (activeTab === 'Urgent') return d.priority === 'Urgent' && !d.isCompleted;
    if (activeTab === 'Upcoming') return d.priority === 'Upcoming' && !d.isCompleted;
    if (activeTab === 'Later') return d.priority === 'Later' && !d.isCompleted;
    return true;
  });

  // Timeline: first 4 non-completed
  const timelineItems = typeFiltered.filter(d => !d.isCompleted).slice(0, 4);

  const mutedText = 'var(--text-secondary)';
  const dimText = 'var(--text-tertiary)';

  // User initials
  const initials = user?.name ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div style={{ backgroundColor: 'var(--bg-body)', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, sans-serif", color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>

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
            {['Overview', 'Academics', 'Attendance', 'Deadlines'].map(tab => (
              <React.Fragment key={tab}>
                {tab === 'Deadlines' ? (
                  <div style={{ position: 'relative' }}>
                    <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-active-pill)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {tab}
                    </button>
                    <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: '#5e5ce6', borderRadius: '50%' }}></span>
                  </div>
                ) : (
                  <button style={{ padding: '8px 24px', fontSize: '13.5px', fontWeight: '600', borderRadius: '9999px', color: mutedText, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = mutedText; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => navigate(tab === 'Overview' ? '/dashboard' : `/${tab.toLowerCase()}`)}>
                    {tab}
                  </button>
                )}
              </React.Fragment>
            ))}
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

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.8px' }}>Deadlines</h1>
                <span style={{ fontSize: '14px', color: mutedText, fontWeight: '500', display: 'block', marginTop: '4px' }}>Stay ahead. Never miss a deadline.</span>
              </div>

              {/* Type Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-nav-pill-outer)', border: '1px solid var(--border-nav-pill)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                {['File Assignment', 'Project'].map((type) => {
                  const isActive = deadlineType === type;
                  return (
                    <button key={type} onClick={() => { setDeadlineType(type); setActiveTab('All'); }}
                      style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.22s ease', color: isActive ? 'var(--bg-body)' : mutedText, backgroundColor: isActive ? '#5e5ce6' : 'transparent', boxShadow: isActive ? '0 2px 10px rgba(94, 92, 230, 0.35)' : 'none' }}>
                      {type}
                    </button>
                  );
                })}
              </div>

              {/* Add Button */}
              <button onClick={() => setShowAddForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#5e5ce6', color: '#fff', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4bb3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e5ce6'}>
                <Plus size={16} />
                Add Deadline
              </button>
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
                <div style={{ backgroundColor: 'var(--bg-dropdown)', border: '1px solid var(--border-dim)', borderRadius: '20px', padding: '28px', width: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>New Deadline</h3>
                    <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: dimText, cursor: 'pointer' }}><X size={20} /></button>
                  </div>
                  {addingError && <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)', borderRadius: '8px', fontSize: '12px', color: '#ff453a' }}>{addingError}</div>}
                  <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: dimText, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Title *</label>
                      <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. DBMS Assignment 3" required
                        style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: dimText, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Subject</label>
                      <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. Database Systems"
                        style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: dimText, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Type</label>
                      <select value={newType} onChange={e => setNewType(e.target.value)}
                        style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                        <option value="File Assignment">File Assignment</option>
                        <option value="Project">Project</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: dimText, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Due Date & Time *</label>
                      <input type="datetime-local" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required
                        style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', colorScheme: theme === 'dark' ? 'dark' : 'light' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <button type="button" onClick={() => setShowAddForm(false)}
                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-card)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                      <button type="submit"
                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#5e5ce6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4bb3'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e5ce6'}>
                        Create Deadline
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <EmptyState title="Loading deadlines..." message="Please wait while we fetch your deadlines." />
            ) : (
              <>
                {/* Timeline Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: dimText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming {deadlineType}s</span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: deadlineType === 'Project' ? '#5e5ce6' : '#ff9f0a', backgroundColor: deadlineType === 'Project' ? 'rgba(94, 92, 230, 0.1)' : 'rgba(255, 159, 10, 0.1)', border: `1px solid ${deadlineType === 'Project' ? 'rgba(94, 92, 230, 0.2)' : 'rgba(255, 159, 10, 0.2)'}`, padding: '2px 8px', borderRadius: '6px' }}>
                        {typeFiltered.length} item{typeFiltered.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {timelineItems.length > 0 ? (
                    <>
                      {/* Timeline Dots */}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(timelineItems.length, 4)}, 1fr)`, gap: '24px', height: '20px', position: 'relative', margin: '10px 0 4px 0' }}>
                        {timelineItems.map((item, idx) => {
                          const { color } = getDeadlineColor(item.priority);
                          return (
                            <div key={item._id} style={{ position: 'relative', height: '100%' }}>
                              {idx > 0 && <div style={{ position: 'absolute', top: '50%', left: 0, right: '50%', height: '2px', backgroundColor: 'var(--border-dim)', transform: 'translateY(-50%)' }}></div>}
                              {idx < timelineItems.length - 1 && <div style={{ position: 'absolute', top: '50%', left: '50%', right: 0, height: '2px', backgroundColor: 'var(--border-dim)', transform: 'translateY(-50%)' }}></div>}
                              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, transform: 'translate(-50%, -50%)', zIndex: 5, boxShadow: `0 0 8px ${color}66` }}></div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(timelineItems.length, 4)}, 1fr)`, gap: '24px' }}>
                        {timelineItems.map((item) => {
                          const IconComp = getSubjectIcon(item.subject);
                          const { color, bg } = getDeadlineColor(item.priority);
                          const { dateText } = formatDueDate(item.dueDate);
                          return (
                            <div key={item._id}
                              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderBottom: `3px solid ${color}`, borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '130px', cursor: 'pointer', transition: 'all 0.25s ease' }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${color}22, var(--shadow-card)`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                              onClick={() => handleDeadlineClick(item)}>
                              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${color}1a`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <IconComp size={20} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: item.isCompleted ? 'line-through' : 'none', opacity: item.isCompleted ? 0.6 : 1 }}>{item.title}</h4>
                                  <span style={{ fontSize: '12px', color: mutedText, fontWeight: '500', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subject}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: item.isCompleted ? '#30d158' : color, fontSize: '12px', fontWeight: '700', marginTop: '10px' }}>
                                {item.isCompleted ? <><Check size={16} /><span>Completed</span></> : <><Clock size={16} /><span>{dateText}</span></>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <EmptyState compact title={`No upcoming ${deadlineType.toLowerCase()}s`} message="All clear! Add a new deadline to get started." />
                  )}
                </div>

                {/* Assignments List */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'stretch' }}>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                      {deadlineType === 'File Assignment' ? 'File Assignments' : 'Projects'}
                    </h3>

                    {/* Pill filters */}
                    <div style={{ display: 'flex', gap: '8px', margin: '16px 0 20px 0', flexWrap: 'wrap' }}>
                      {[
                        { label: 'All', dot: '#5e5ce6' },
                        { label: 'Urgent', dot: '#ff453a' },
                        { label: 'Upcoming', dot: '#ff9f0a' },
                        { label: 'Later', dot: '#5e5ce6' },
                        { label: 'Completed', dot: '#30d158' }
                      ].map((tab) => {
                        const isActive = activeTab === tab.label;
                        return (
                          <button key={tab.label} onClick={() => setActiveTab(tab.label)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '9999px', border: isActive ? '1px solid var(--border-nav-pill)' : '1px solid var(--border-dim)', backgroundColor: isActive ? 'var(--bg-active-pill)' : 'var(--bg-nav-pill-outer)', color: isActive ? 'var(--text-primary)' : mutedText, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill)'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-nav-pill-outer)'; }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tab.dot }}></span>
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Assignment List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {filtered.length > 0 ? filtered.map((item) => {
                        const IconComp = getSubjectIcon(item.subject);
                        const { color } = getDeadlineColor(item.priority);
                        const { dateText, dateDetail } = formatDueDate(item.dueDate);
                        const isOwn = !item.isTeacherCreated;

                        return (
                          <div key={item._id}
                            onClick={() => handleDeadlineClick(item)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-subcard)', border: '1px solid var(--border-card)', cursor: 'pointer', transition: 'all 0.2s ease', opacity: item.isCompleted ? 0.65 : 1 }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-card)'; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: item.isCompleted ? 'rgba(48, 209, 88, 0.1)' : `${color}1a`, color: item.isCompleted ? '#30d158' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {item.isCompleted ? <Check size={18} /> : <IconComp size={18} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <h5 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: item.isCompleted ? 'line-through' : 'none' }}>{item.title}</h5>
                                <span style={{ fontSize: '11.5px', color: mutedText, display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subject}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: item.isCompleted ? '#30d158' : color }}>{item.isCompleted ? 'Completed' : dateText}</span>
                                <span style={{ fontSize: '10px', color: dimText, display: 'block', marginTop: '2px' }}>{dateDetail}</span>
                              </div>
                              <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                                {item.priority}
                              </span>
                              {item.isTeacherCreated && (
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>Teacher</span>
                              )}
                              {isOwn && (
                                <button
                                  onClick={(e) => handleDelete(item._id, e)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff453a'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }) : (
                        <EmptyState compact title="Nothing here" message="No deadlines match this filter. Try a different tab." />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Submission drawer/modal */}
      {selectedDeadline && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedDeadline(null)}>
          <div style={{ backgroundColor: 'var(--bg-dropdown)', border: '1px solid var(--border-dim)', borderRadius: '20px', padding: '28px', width: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-dim)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#5e5ce6', fontWeight: 800 }}>
                  {selectedDeadline.subject} • Assignment
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
                  {selectedDeadline.title}
                </h3>
              </div>
              <button onClick={() => setSelectedDeadline(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div className="custom-scrollbar" style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
              {selectedDeadline.description && (
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, margin: '0 0 4px 0' }}>Instructions</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{selectedDeadline.description}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, margin: '0 0 4px 0' }}>Due Date</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                    {new Date(selectedDeadline.dueDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, margin: '0 0 4px 0' }}>Max Marks</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{selectedDeadline.maxMarks || 10} Marks</p>
                </div>
              </div>

              {selectedDeadline.attachment && (
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, margin: '0 0 4px 0' }}>Attachment</h4>
                  <a href={selectedDeadline.attachment} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#5e5ce6', fontWeight: 600, textDecoration: 'none' }}>
                    <ExternalLink size={14} />
                    <span>View Reference Attachment</span>
                  </a>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, margin: '0 0 8px 0' }}>Submission Status</h4>
                
                {selectedDeadline.submission ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        backgroundColor: selectedDeadline.submission.status === 'Graded' ? 'rgba(94, 92, 230, 0.12)' : 'rgba(48, 209, 88, 0.12)',
                        color: selectedDeadline.submission.status === 'Graded' ? '#c084fc' : '#30d158',
                        border: selectedDeadline.submission.status === 'Graded' ? '1px solid rgba(94, 92, 230, 0.2)' : '1px solid rgba(48, 209, 88, 0.2)'
                      }}>
                        {selectedDeadline.submission.status}
                      </span>
                      {selectedDeadline.submission.status === 'Graded' && (
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          Grade: {selectedDeadline.submission.marks} / {selectedDeadline.maxMarks || 10}
                        </span>
                      )}
                    </div>

                    {selectedDeadline.submission.remark && (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '10px', fontSize: '12.5px' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Teacher Feedback: </strong>
                        <span style={{ color: 'var(--text-primary)' }}>{selectedDeadline.submission.remark}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px', marginTop: '4px' }}>
                      <FileText size={16} color="#5e5ce6" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0 }}>
                          Submitted Link
                        </p>
                        <p style={{ fontSize: '9px', color: 'var(--text-tertiary)', margin: 0 }}>
                          Sent on: {new Date(selectedDeadline.submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <a href={selectedDeadline.submission.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '11.5px', color: '#5e5ce6', fontWeight: 700 }}>
                        <ExternalLink size={12} />
                        <span>Open Link</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                    No submission link shared yet. Paste your Google Drive link below to submit.
                  </p>
                )}
              </div>

              {(!selectedDeadline.submission || selectedDeadline.submission.status !== 'Graded') && (
                <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-dim)', paddingTop: '14px' }}>
                  {submitError && <div style={{ padding: '8px', backgroundColor: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: '6px', color: '#ff453a', fontSize: '12px' }}>{submitError}</div>}
                  {submitSuccess && <div style={{ padding: '8px', backgroundColor: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: '6px', color: '#30d158', fontSize: '12px' }}>{submitSuccess}</div>}
                  
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Google Drive Link (PDF)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="url" required value={submissionUrl} onChange={e => setSubmissionUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..."
                        style={{ flex: 1, backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                      <button type="button" onClick={() => setSubmissionUrl(`https://drive.google.com/file/d/1Bpfm${Math.floor(10000+Math.random()*90000)}demoPDF/view?usp=sharing`)}
                        style={{ padding: '8px 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--border-dim)', backgroundColor: 'transparent', color: '#5e5ce6', fontWeight: 700, cursor: 'pointer' }}>
                        Simulate Demo Link
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting}
                    style={{ backgroundColor: '#5e5ce6', color: '#fff', fontWeight: '700', fontSize: '13px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.2s' }}>
                    {submitting ? 'Submitting...' : (selectedDeadline.submission ? 'Resubmit Assignment' : 'Submit Assignment')}
                  </button>
                </form>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedDeadline(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-dim)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Deadlines;
