import React, { useState } from 'react';
import useDashboardStore from '../store/dashboardStore.js';

const AttendanceCard = () => {
  const { attendance, updateAttendance } = useDashboardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [attendedVal, setAttendedVal] = useState(attendance.attended);
  const [totalVal, setTotalVal] = useState(attendance.total);

  const clampedPercent = Math.max(0, Math.min(100, attendance.percent));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercent / 100) * circumference;

  const isSafe = clampedPercent >= 75;

  const handleSave = (e) => {
    e.preventDefault();
    const a = parseInt(attendedVal, 10) || 0;
    const t = parseInt(totalVal, 10) || 0;
    if (a > t) {
      alert("Attended classes cannot exceed total classes!");
      return;
    }
    updateAttendance(a, t);
    setIsEditing(false);
  };

  return (
    <div className="glass-card glow-effect p-6 flex flex-col h-full">
      <div className="card-title">
        <span>Attendance Tracker</span>
        <span 
          className="task-status cursor-pointer"
          style={{
            borderColor: isSafe ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)",
            backgroundColor: isSafe ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
            color: isSafe ? "#bbf7d0" : "#fca5a5",
          }}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isSafe ? "Safe Zone" : "At Risk"} (Edit)
        </span>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Attended Classes</label>
            <input 
              type="number" 
              className="form-input" 
              value={attendedVal} 
              onChange={(e) => setAttendedVal(e.target.value)} 
              min="0"
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Total Classes</label>
            <input 
              type="number" 
              className="form-input" 
              value={totalVal} 
              onChange={(e) => setTotalVal(e.target.value)} 
              min="0"
              required 
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="form-btn py-2 text-xs flex-1">Save</button>
            <button 
              type="button" 
              className="form-input py-2 text-xs flex-1"
              onClick={() => {
                setAttendedVal(attendance.attended);
                setTotalVal(attendance.total);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="attendance-layout mt-auto mb-auto">
          <div className="ring-wrapper">
            <svg width="128" height="128" className="ring-svg">
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#e7081b" />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r={radius} className="ring-bg" />
              <circle 
                cx="64" 
                cy="64" 
                r={radius} 
                className="ring-indicator" 
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset
                }}
              />
            </svg>
            <span className="ring-text">{clampedPercent}%</span>
          </div>

          <div className="attendance-stats">
            <div className="stat-item">
              Attended: <span className="stat-val">{attendance.attended}</span>
            </div>
            <div className="stat-item">
              Total: <span className="stat-val">{attendance.total}</span>
            </div>
            <div className="stat-item mt-2 pt-2 border-t border-gray-800">
              Present: <span className="stat-val text-green-400">{attendance.attended}</span>
            </div>
            <div className="stat-item">
              Absent: <span className="stat-val text-red-400">{Math.max(attendance.total - attendance.attended, 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCard;
