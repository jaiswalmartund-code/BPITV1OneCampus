import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import api from '../services/api.js';

const Login = () => {
  const { user, login, loginAdmin, loginTeacher, register, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');
  const [department, setDepartment] = useState('');

  // Student portal custom fields
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImg, setCaptchaImg] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Fetch captcha when role is student and mode is Sign In
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    setLocalError('');
    try {
      const { data } = await api.get('/auth/captcha');
      setCaptchaImg(`data:image/png;base64,${data.imageBase64}`);
      setSessionId(data.sessionId);
      setCaptchaText('');
    } catch (err) {
      console.error('Failed to fetch GGSIPU captcha:', err);
      setLocalError('GGSIPU server is unreachable. Click refresh to retry.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Load captcha when transitioning to Student Sign In
  useEffect(() => {
    setLocalError('');
    setSignUpSuccess('');
    setCaptchaText('');
    if (role === 'student' && !isSignUp) {
      fetchCaptcha();
    }
  }, [role, isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSignUpSuccess('');

    if (isSignUp) {
      // ── Sign Up ──────────────────────────────────────────────────────────
      if (!name.trim()) {
        setLocalError('Name is required');
        return;
      }

      let userDetails = { name, role };

      if (role === 'student') {
        if (!enrollmentNo.trim()) {
          setLocalError('Enrollment number is required');
          return;
        }
        userDetails = { ...userDetails, enrollmentNo };
      } else {
        if (!email.trim() || !password.trim()) {
          setLocalError('Email and password are required');
          return;
        }
        userDetails = { ...userDetails, email, password };
        if (role === 'staff') {
          if (!department.trim()) {
            setLocalError('Department is required');
            return;
          }
          userDetails = { ...userDetails, department };
        }
      }

      const res = await register(userDetails);
      if (res.success) {
        // Always redirect to login after sign-up so user must verify via GGSIPU
        setSignUpSuccess(role === 'staff' ? 'Account created! Please sign in with your credentials.' : 'Account created! Please sign in with your GGSIPU credentials.');
        setIsSignUp(false);
        setName('');
        setEnrollmentNo('');
        setEmail('');
        setPassword('');
        setDepartment('');
      }
    } else {
      // ── Sign In ──────────────────────────────────────────────────────────
      if (role === 'admin') {
        if (!email.trim() || !password.trim()) {
          setLocalError('Email and password are required');
          return;
        }
        const res = await loginAdmin(email, password);
        if (res.success) navigate('/admin');

      } else if (role === 'staff') {
        if (!email.trim() || !password.trim()) {
          setLocalError('Email and password are required');
          return;
        }
        const res = await loginTeacher(email, password);
        if (res.success) navigate('/teacher');

      } else {
        // Student login — only enrollment + father's name + captcha
        if (!enrollmentNo.trim() || !fathersName.trim()) {
          setLocalError('Enrollment number and Father\'s name are required.');
          return;
        }
        if (!captchaText.trim()) {
          setLocalError('Please fill in the security captcha.');
          return;
        }

        const res = await login({
          enrollmentNo,
          fathersName,
          captchaText,
          sessionId,
        });

        if (res.success) {
          navigate('/dashboard');
        } else {
          fetchCaptcha();
        }
      }
    }
  };

  return (
    <div className="login-body">
      <main className="login-minimal-container">
        <div className="login-minimal-card">
          <header className="login-header">
            <Link to="/" className="login-logo-link">OneCampus</Link>
            <p className="login-subtitle">
              {isSignUp ? 'Create a campus account.' : 'Sign in to your campus dashboard.'}
            </p>
          </header>

          {/* Portal Toggle */}
          <div className="portal-selector-container">
            <button
              type="button"
              className={`portal-select-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`portal-select-btn ${role === 'staff' ? 'active' : ''}`}
              onClick={() => setRole('staff')}
            >
              Staff
            </button>
            <button
              type="button"
              className={`portal-select-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div style={{
              fontSize: '12px',
              color: '#ff453a',
              border: '1px solid rgba(255,69,58,0.25)',
              background: 'rgba(255,69,58,0.08)',
              padding: '10px 14px',
              borderRadius: '10px',
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              {localError || error}
            </div>
          )}

          {/* Success Message */}
          {signUpSuccess && (
            <div style={{
              fontSize: '12px',
              color: '#30d158',
              border: '1px solid rgba(48,209,88,0.25)',
              background: 'rgba(48,209,88,0.08)',
              padding: '10px 14px',
              borderRadius: '10px',
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              {signUpSuccess}
            </div>
          )}

          <form className="login-minimal-form" onSubmit={handleSubmit} autoComplete="off">

            {/* ── STUDENT FIELDS ─────────────────────────────────────── */}
            {role === 'student' && (
              <>
                {/* Sign Up: name only (+ enrollment) */}
                {isSignUp && (
                  <div className="minimal-input-group">
                    <label htmlFor="name-input" className="minimal-label">Full Name</label>
                    <input
                      type="text"
                      id="name-input"
                      className="minimal-input"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                {/* Enrollment Number — shown in both sign-in and sign-up */}
                <div className="minimal-input-group">
                  <label htmlFor="enrollment-input" className="minimal-label">Enrollment Number</label>
                  <input
                    type="text"
                    id="enrollment-input"
                    className="minimal-input"
                    required
                    placeholder="0620802824"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                  />
                </div>

                {/* Father's Name — sign in only */}
                {!isSignUp && (
                  <div className="minimal-input-group">
                    <label htmlFor="fathers-name-input" className="minimal-label">Father's Name</label>
                    <input
                      type="text"
                      id="fathers-name-input"
                      className="minimal-input"
                      required
                      placeholder="Father's Full Name"
                      value={fathersName}
                      onChange={(e) => setFathersName(e.target.value)}
                    />
                  </div>
                )}

                {/* Captcha — sign in only */}
                {!isSignUp && (
                  <div className="minimal-input-group">
                    <label htmlFor="captcha-input" className="minimal-label">Security Captcha</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--color-border-dim)',
                        borderRadius: '8px',
                        height: '48px',
                        width: '140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {captchaLoading ? (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Loading...</span>
                        ) : (
                          captchaImg && <img src={captchaImg} alt="GGSIPU Captcha" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        disabled={captchaLoading}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--color-border-dim)',
                          color: '#ffffff',
                          borderRadius: '8px',
                          padding: '0 12px',
                          height: '48px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Refresh
                      </button>
                    </div>
                    <input
                      type="text"
                      id="captcha-input"
                      className="minimal-input"
                      required
                      placeholder="Enter captcha text"
                      value={captchaText}
                      onChange={(e) => setCaptchaText(e.target.value)}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                )}
              </>
            )}

            {/* ── STAFF / ADMIN FIELDS ────────────────────────────────── */}
            {role !== 'student' && (
              <>
                {isSignUp && (
                  <>
                    <div className="minimal-input-group">
                      <label htmlFor="name-input" className="minimal-label">Full Name</label>
                      <input
                        type="text"
                        id="name-input"
                        className="minimal-input"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {role === 'staff' && (
                      <div className="minimal-input-group">
                        <label htmlFor="department-select" className="minimal-label">Department</label>
                        <select
                          id="department-select"
                          className="minimal-input"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            width: '100%',
                            outline: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="" style={{ backgroundColor: '#121214' }}>Select Department</option>
                          <option value="ECE" style={{ backgroundColor: '#121214' }}>Electronics & Communication Engineering (ECE)</option>
                          <option value="BBA" style={{ backgroundColor: '#121214' }}>Bachelor of Business Administration (BBA)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="minimal-input-group">
                  <label htmlFor="username-input" className="minimal-label">Email Address</label>
                  <input
                    type="email"
                    id="username-input"
                    className="minimal-input"
                    required
                    placeholder="name@onecampus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="minimal-input-group">
                  <div className="label-row">
                    <label htmlFor="password-input" className="minimal-label">Password</label>
                    {!isSignUp && <a href="#" className="minimal-forgot-link">Forgot?</a>}
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password-input"
                      className="minimal-input"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      id="password-toggle"
                      className="minimal-toggle-btn"
                      aria-label="Toggle Password Visibility"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: showPassword ? 'var(--color-brand-orange)' : 'var(--color-text-dim)' }}
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Remember Device (Sign In only) */}
            {!isSignUp && (
              <div className="minimal-options">
                <label className="remember-label">
                  <input type="checkbox" id="remember-device" />
                  <span className="custom-checkbox"></span>
                  Remember this device
                </label>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={`minimal-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              <span className="btn-text">
                {loading ? 'Connecting...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </span>
            </button>
          </form>

          <footer className="login-footer">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="minimal-signup-link bg-transparent border-none p-0 cursor-pointer font-medium"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="minimal-signup-link bg-transparent border-none p-0 cursor-pointer font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Login;
