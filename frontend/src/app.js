/**
 * OneCampus Main JavaScript File
 */

// Inject custom styles directly into the spline-viewer shadow DOM to hide logo, loader, and hint elements
function injectSplineStyles() {
    const viewer = document.querySelector('spline-viewer');
    if (viewer && viewer.shadowRoot) {
        if (viewer.shadowRoot.querySelector('#custom-spline-override')) {
            return true;
        }
        const style = document.createElement('style');
        style.id = 'custom-spline-override';
        style.textContent = `
            #logo, #loader, #hint, .hand, [id*="logo"], [id*="hint"], [id*="loader"] {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;
        viewer.shadowRoot.appendChild(style);
        console.log("OneCampus: Successfully injected style override into Spline Shadow DOM.");
        return true;
    }
    return false;
}

const injectTimer = setInterval(() => {
    if (injectSplineStyles()) {
        clearInterval(injectTimer);
    }
}, 50);

window.addEventListener("load", injectSplineStyles);
document.addEventListener("DOMContentLoaded", injectSplineStyles);

// 1. Wait for everything to load (Images, Spline, CSS)
window.addEventListener("load", () => {
    const loader = document.getElementById("loader-wrapper");

    // Loader ko smooth fade-out dene ke liye thoda delay
    setTimeout(() => {
        if (loader) {
            loader.style.opacity = "0";
            loader.style.visibility = "hidden";
        }
        console.log("OneCampus: Page fully loaded & Loader hidden.");
    }, 4000);
});

// 2. Spline Viewer Interaction Logic
// Isse hum ensure karenge ki user scroll kar sake bina model zoom hue
const splineViewer = document.querySelector('spline-viewer');

if (splineViewer) {
    // Spline ke default overlay ko hide karne ke liye
    splineViewer.setAttribute('hint', 'hidden');

    // Forcefully zoom off karne ke liye agar editor mein bhool gaye ho
    splineViewer.addEventListener('wheel', (e) => {
        // Sirf tabhi allow karega jab user ne koi specific modifier key dabayi ho
        if (!e.ctrlKey) {
            // Normal scroll ko page scroll hi rehne dega
            return true;
        }
    }, { passive: true });
}

// 3. Navigation & Button Sound/Feedback (Optional)
const onboardBtn = document.querySelector('.capsule-btn');
if (onboardBtn) {
    onboardBtn.addEventListener('click', () => {
        // Yahan tum transition animation bhi daal sakte ho
        console.log("Onboarding started...");
    });
}

// ===== Placeholder data =====
const attendanceData = {
    percent: 82,
    attended: 33,
    total: 40
  };
  
  let scheduleData = [
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
  ];
  
  const tasksData = [
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
  ];
  
  // ===== Helpers =====
  function formatToday() {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }
  
  function mapStatusToClass(status) {
    if (status === "In Progress") return "in-progress";
    if (status === "Not Started") return "not-started";
    return "in-review";
  }
  
  // ===== Renderers =====
  function renderAttendance() {
    const { percent, attended, total } = attendanceData;
    const clamped = Math.max(0, Math.min(100, percent));
  
    // Ring
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
  
    const ring = document.getElementById("attendance-ring");
    const percentSpan = document.getElementById("attendance-percent");
    const attendedCount = document.getElementById("attended-count");
    const totalCount = document.getElementById("total-count");
    const presentClasses = document.getElementById("present-classes");
    const absentClasses = document.getElementById("absent-classes");
    const statusPill = document.getElementById("attendance-status");
  
    if (ring) {
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${offset}`;
    }
  
    if (percentSpan) percentSpan.textContent = `${clamped}%`;
    if (attendedCount) attendedCount.textContent = attended;
    if (totalCount) totalCount.textContent = total;
    if (presentClasses) presentClasses.textContent = attended;
    if (absentClasses) absentClasses.textContent = Math.max(total - attended, 0);
  
    if (statusPill) {
      statusPill.textContent = clamped >= 75 ? "Safe Zone" : "At Risk";
      if (clamped >= 75) {
        statusPill.style.borderColor = "rgba(34,197,94,0.7)";
        statusPill.style.backgroundColor = "rgba(34,197,94,0.18)";
        statusPill.style.color = "#bbf7d0";
      }
    }
  }
  
  function renderSchedule() {
    const list = document.getElementById("schedule-list");
    if (!list) return;
    list.innerHTML = "";
  
    if (scheduleData.length === 0) {
      const p = document.createElement("p");
      p.className = "schedule-empty";
      p.textContent = "No classes scheduled yet. Add your first class above.";
      list.appendChild(p);
      return;
    }
  
    scheduleData.forEach((cls, index) => {
      const item = document.createElement("div");
      item.className = "schedule-item";
      item.innerHTML = `
        <div class="schedule-dot"></div>
        ${index === 0 ? '<span class="schedule-now">Now</span>' : ""}
        <div class="schedule-main">
          <div class="schedule-title">${cls.subject}</div>
          <div class="schedule-room">${cls.room || "TBA"}</div>
        </div>
        <div class="schedule-time">
          <span class="schedule-time-dot"></span>
          <span>${cls.startTime} – ${cls.endTime}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }
  
  function renderTasks() {
    const list = document.getElementById("tasks-list");
    const countPill = document.getElementById("tasks-count");
    if (!list) return;
  
    list.innerHTML = "";
    if (countPill) countPill.textContent = `${tasksData.length} items`;
  
    tasksData.forEach((task) => {
      const li = document.createElement("div");
      li.className = "task-item";
      const statusClass = mapStatusToClass(task.status);
      li.innerHTML = `
        <div class="task-top">
          <div>
            <div class="task-title">${task.title}</div>
            <div class="task-course">${task.course}</div>
          </div>
          <span class="task-status ${statusClass}">${task.status}</span>
        </div>
        <div class="task-bottom">
          <span class="task-type">
            <span class="task-type-dot"></span>
            ${task.type}
          </span>
          <span class="task-due">
            Due <span>${task.dueDate}</span>
          </span>
        </div>
      `;
      list.appendChild(li);
    });
  }
  
  // ===== Form handling =====
  function initForm() {
    const form = document.getElementById("class-form");
    if (!form) return;
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const subjectInput = document.getElementById("subject");
      const startInput = document.getElementById("startTime");
      const endInput = document.getElementById("endTime");
      const roomInput = document.getElementById("room");
  
      const subject = subjectInput.value.trim();
      const start = startInput.value.trim();
      const end = endInput.value.trim();
      const room = roomInput.value.trim();
  
      if (!subject || !start || !end) {
        return;
      }
  
      // Convert "HH:MM" to a nicer display like "09:00 AM" for placeholder data
      function toDisplayTime(t) {
        if (!t.includes(":")) return t;
        const [hStr, m] = t.split(":");
        let h = parseInt(hStr, 10);
        if (Number.isNaN(h)) return t;
        const suffix = h >= 12 ? "PM" : "AM";
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        return `${String(h).padStart(2, "0")}:${m} ${suffix}`;
      }
  
      const newClass = {
        id: Date.now(),
        subject,
        startTime: toDisplayTime(start),
        endTime: toDisplayTime(end),
        room: room || "TBA"
      };
  
      scheduleData = [...scheduleData, newClass];
      renderSchedule();
  
      form.reset();
    });
  }
  
  // ===== Init =====
  document.addEventListener("DOMContentLoaded", () => {
    const todaySpan = document.getElementById("today-date");
    if (todaySpan) todaySpan.textContent = formatToday();
  
    renderAttendance();
    renderSchedule();
    renderTasks();
    initForm();
  });

// Global Error Handling for Spline (Important)
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'SPLINE-VIEWER') {
        console.warn("Spline Viewer load hone mein dikkat hui, check your URL.");
    }
}, true);

/* =========================================
   LOGIN PAGE INTERACTION HANDLERS
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    // Only execute if we are on the login page
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    console.log("OneCampus: Minimalist Login script initialized.");

    // --- Portal Tab Selector ---
    const selectBtns = document.querySelectorAll(".portal-select-btn");
    selectBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            selectBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const portal = btn.getAttribute("data-portal");
            console.log(`Switched to: ${portal}`);
        });
    });

    // --- Password Toggle Visibility ---
    const passwordToggle = document.getElementById("password-toggle");
    const passwordInput = document.getElementById("password-input");

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", () => {
            const isPassword = passwordInput.getAttribute("type") === "password";
            passwordInput.setAttribute("type", isPassword ? "text" : "password");
            
            passwordToggle.style.color = isPassword ? "var(--color-brand-orange)" : "var(--color-text-dim)";
        });
    }

    // --- Form Submission Redirect ---
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        if (submitBtn) {
            submitBtn.classList.add("loading");
            if (btnText) btnText.textContent = "Connecting...";
        }

        setTimeout(() => {
            window.location.href = "/";
        }, 1000);
    });
});   