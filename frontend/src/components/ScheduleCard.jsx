import React, { useState } from 'react';
import useDashboardStore from '../store/dashboardStore.js';

const ScheduleCard = () => {
  const { schedule, addScheduleItem } = useDashboardStore();
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !startTime || !endTime) return;

    // Convert "HH:MM" (from type="time") to display format e.g. "09:00 AM"
    const toDisplayTime = (timeString) => {
      if (!timeString || !timeString.includes(":")) return timeString;
      const [hStr, m] = timeString.split(":");
      let h = parseInt(hStr, 10);
      if (isNaN(h)) return timeString;
      const suffix = h >= 12 ? "PM" : "AM";
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return `${String(h).padStart(2, '0')}:${m} ${suffix}`;
    };

    addScheduleItem({
      subject,
      startTime: toDisplayTime(startTime),
      endTime: toDisplayTime(endTime),
      room: room || 'TBA'
    });

    // Reset inputs
    setSubject('');
    setStartTime('');
    setEndTime('');
    setRoom('');
  };

  return (
    <div className="glass-card glow-effect p-6 flex flex-col h-full">
      <div className="card-title">
        <span>Today's Schedule</span>
        <span className="card-pill">{schedule.length} lectures</span>
      </div>

      <div className="schedule-list flex-1">
        {schedule.length === 0 ? (
          <p className="schedule-empty">No classes scheduled yet. Add your first class below.</p>
        ) : (
          schedule.map((cls, index) => (
            <div key={cls.id} className="schedule-item mb-4 last:mb-0">
              <div className="schedule-dot"></div>
              {index === 0 && <span className="schedule-now">Now</span>}
              <div className="schedule-main">
                <div className="schedule-title">{cls.subject}</div>
                <div className="schedule-room">{cls.room}</div>
              </div>
              <div className="schedule-time">
                <span className="schedule-time-dot"></span>
                <span>{cls.startTime} – {cls.endTime}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Subject Name"
            className="form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Room (e.g. 102 Block A)"
            className="form-input"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="flex flex-col flex-1 gap-1">
            <span className="text-[10px] text-gray-400">Start Time</span>
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col flex-1 gap-1">
            <span className="text-[10px] text-gray-400">End Time</span>
            <input
              type="time"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="form-btn self-end h-[38px] px-6">
            Add Class
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleCard;
