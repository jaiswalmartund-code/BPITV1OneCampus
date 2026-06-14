import React from 'react';
import useDashboardStore from '../store/dashboardStore.js';

const TasksCard = () => {
  const { tasks, toggleTaskStatus } = useDashboardStore();

  const mapStatusToClass = (status) => {
    if (status === "In Progress") return "in-progress";
    if (status === "Not Started") return "not-started";
    return "in-review";
  };

  return (
    <div className="glass-card glow-effect p-6 flex flex-col h-full">
      <div className="card-title">
        <span>Assignments & Tasks</span>
        <span className="card-pill" id="tasks-count">{tasks.length} items</span>
      </div>

      <div className="tasks-list">
        {tasks.map((task) => {
          const statusClass = mapStatusToClass(task.status);
          return (
            <div 
              key={task.id} 
              className="task-item cursor-pointer hover:bg-white/[0.02]"
              onClick={() => toggleTaskStatus(task.id)}
              title="Click to toggle status"
            >
              <div className="task-top">
                <div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-course">{task.course}</div>
                </div>
                <span className={`task-status ${statusClass}`}>{task.status}</span>
              </div>
              <div className="task-bottom">
                <span className="task-type">
                  <span className="task-type-dot"></span>
                  {task.type}
                </span>
                <span className="task-due">
                  Due <span>{task.dueDate}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksCard;
