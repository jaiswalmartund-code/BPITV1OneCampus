import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  attendance: {
    percent: 82,
    attended: 33,
    total: 40
  },
  schedule: [
    {
      id: 1,
      subject: "Digital Signal Processing",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      room: "Room 204, Block B"
    },
    {
      id: 2,
      subject: "Microprocessors & Interfacing",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      room: "Lab 3, Block C"
    },
    {
      id: 3,
      subject: "Data Structures",
      startTime: "02:00 PM",
      endTime: "03:30 PM",
      room: "Room 108, Block A"
    }
  ],
  tasks: [
    {
      id: 1,
      title: "Microprocessors Assignment 2",
      course: "Microprocessors & Interfacing",
      dueDate: "Feb 28, 2026",
      type: "Assignment",
      status: "In Progress"
    },
    {
      id: 2,
      title: "DSP Quiz – Filters",
      course: "Digital Signal Processing",
      dueDate: "Mar 02, 2026",
      type: "Quiz",
      status: "Not Started"
    },
    {
      id: 3,
      title: "Data Structures Project Milestone",
      course: "Data Structures",
      dueDate: "Mar 05, 2026",
      type: "Project",
      status: "In Review"
    }
  ],

  // Actions
  addScheduleItem: (item) => set((state) => ({
    schedule: [...state.schedule, { ...item, id: Date.now() }]
  })),

  toggleTaskStatus: (taskId) => set((state) => ({
    tasks: state.tasks.map((task) => {
      if (task.id === taskId) {
        let nextStatus;
        if (task.status === "Not Started") nextStatus = "In Progress";
        else if (task.status === "In Progress") nextStatus = "In Review";
        else nextStatus = "Not Started";
        return { ...task, status: nextStatus };
      }
      return task;
    })
  })),

  updateAttendance: (attended, total) => set(() => {
    const percent = total > 0 ? Math.round((attended / total) * 100) : 0;
    return {
      attendance: { percent, attended, total }
    };
  })
}));

export default useDashboardStore;
