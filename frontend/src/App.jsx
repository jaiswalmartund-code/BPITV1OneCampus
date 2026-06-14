import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore.js';
import useThemeStore from './store/themeStore.js';
import Loader from './components/Loader.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Academics from './pages/Academics.jsx';
import Attendance from './pages/Attendance.jsx';
import Deadlines from './pages/Deadlines.jsx';
import AdminPortal from './pages/AdminPortal.jsx';
import TeacherPortal from './pages/TeacherPortal.jsx';

const App = () => {
  const { checkSession } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    // Check local storage credentials on boot
    checkSession();
    initTheme();
  }, [checkSession, initTheme]);

  return (
    <>
      {/* 
        Loader overlay duration set to 5000ms (5 seconds).
        Underlying page routes mount immediately and load assets in parallel.
      */}
      <Loader duration={5000} />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/teacher" element={<TeacherPortal />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
