# BPIT OneCampus - Integrated Campus Management System

BPIT OneCampus is a full-featured campus management platform designed specifically for the student, faculty, and administrative ecosystems of Bhagwan Parshuram Institute of Technology (BPIT), affiliated with GGSIPU. It unifies essential academic tools, attendance tracking, syllabus guidelines, marks management, and task deadlines into a single, responsive web application.

---

## Key Features

### Student Workspace
* **Academic Dashboard**: Instant visual overview of CGPA, aggregate attendance, next pending deadline, and active announcements.
* **Academics & Syllabus**: Subject listing mapped to the IP University syllabus. Includes details such as course credits, key topics, recommended reference books, and curated study plans.
* **Attendance Tracker**: Detailed attendance percentage analysis per subject with a visual indicator (progress rings) highlighting safe vs. risk thresholds.
* **Assignment & Deadlines Hub**: Keep track of upcoming deadlines with submittable status, due dates, and direct links.
* **Academic Records**: Access to mid-semester marks and final grade sheets.
* **Teacher Remarks**: Real-time feedback and remarks from faculty members for personalized improvement.

### Faculty / Teacher Portal
* **Class Management**: View list of assigned classes, branches, sections, and subjects taught.
* **Student Roster**: Instant access to student lists registered in assigned sections.
* **Attendance Registry**: Simple interface to log/update attendance for any class, branch, or section.
* **Grading & Marks**: Enter, review, and edit mid-semester and internal exam grades.
* **Assignment Dispatch**: Post new assignments, homework, and test deadlines directly to students.
* **Student Remarks**: Add, view, or delete individual performance remarks for student guidance.

### Administrator Portal
* **User Allocation**: Map faculty members to subjects, assign classes to sections, and manage student rosters.
* **Class Registry**: Register new sections, academic years, and manage the campus catalog.
* **Audit Logs**: Secure tracking of all system-critical operations (login, modifications, deletions).
* **System Metrics**: Real-time count of active students, registered teachers, active classes, and courses.

---

## Technology Stack & Architecture

BPIT OneCampus is built on the robust MERN stack with modern development integrations:

### Frontend
* **Framework**: React 19 (Hooks, Context, Custom Stores)
* **Bundler**: Vite 8 (Hot Module Replacement)
* **Styling**: Tailwind CSS v4 (Compiling natively via @tailwindcss/vite compiler)
* **Routing**: React Router DOM v7 (Clean declarative routing)
* **State Management**: Zustand (Lightweight, atomic state management)
* **Data Fetching**: TanStack React Query v5 (Caching, synchronization, and query states)
* **Data Visualization**: Recharts (Interactive progress/attendance graphics)
* **Icons**: Lucide React (Clean, modern SVG iconography icon set)
* **HTTP Client**: Axios (Interceptors configured for JWT token handling)

### Backend
* **Runtime**: Node.js (ES Modules syntax support)
* **Framework**: Express v5 (Robust routing, centralized error handlers, CORS configuration)
* **Database ODM**: Mongoose ODM (Schema modeling, hooks, and index configurations)
* **Authentication**: JSON Web Tokens (JWT) & Bcrypt (Password hashing)
* **Parsing Utilities**: Cheerio (HTML processing) & pdf-parse (Automatic PDF syllabus processing)

### Database
* **Database**: MongoDB (Document-oriented NoSQL database)

---

## Project Layout

```text
BPIT_V1/
├── backend/
│   ├── scripts/             # Local database seeding, clear, and indexing scripts
│   ├── src/
│   │   ├── config/          # MongoDB connectivity config
│   │   ├── controllers/     # Express route handlers
│   │   ├── middlewares/     # Auth, error, logging middlewares
│   │   ├── models/          # Mongoose collections (User, Class, Student, Marks, etc.)
│   │   ├── routes/          # REST Endpoint mappings
│   │   ├── services/        # Logic extraction & database routines
│   │   ├── utils/           # Helper scripts (Token helpers)
│   │   ├── app.js           # App setup, CORS and global middleware configurations
│   │   └── index.js         # Entry point (Server startup)
│   ├── .env                 # Server configuration credentials
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/          # Images, logos, static files
│   │   ├── components/      # Global shared widgets (Loader, Layouts, Cards)
│   │   ├── pages/           # Pages (Dashboard, Academics, Login, Portal panels)
│   │   ├── services/        # Axios API fetch instance
│   │   ├── store/           # Zustand state directories (authStore, themeStore)
│   │   ├── App.jsx          # Route controllers and base initialization
│   │   └── index.css        # Custom styles & Tailwind bindings
│   ├── vite.config.js       # Vite build configurations with proxy setup
│   └── package.json
└── README.md                # Project documentation
```

---

## Installation & Local Setup

Follow these steps to set up and run BPIT OneCampus on your local machine.

### Prerequisites
* Node.js (v18 or higher recommended)
* MongoDB installed and running locally on port 27017 (or a MongoDB Atlas URI string).

### Step 1: Configure the Backend Environment
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install server-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend/` folder (or verify the existing one):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/bpit_v1
   JWT_SECRET=supersecretjwtkeybpitv1
   ```

### Step 2: Seed the Database
Seed standard academic classes, teacher-subject mappings, syllabus recommendations, and student profiles for immediate development testing:
```bash
npm run seed
```
*Note: This clears existing mock documents in MongoDB and inserts standard mock documents.*

### Step 3: Configure & Run Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client will start running at http://localhost:3000 (auto-proxying all API requests to the backend at port 5000).*

---

## Default Login Credentials for Testing

Use the following pre-seeded user accounts to test the portals:

### 1. Administrator Account
* **Email**: admin@onecampus.edu
* **Password**: admin123

### 2. Faculty / Teacher Account (Dr. Rahul Sharma)
* **Email**: rahul@onecampus.edu
* **Password**: password123

### 3. Student Accounts (ECE 4th Semester)
* **Default Password for all Students**: student123
* **Demo Student (Vikas Kumar)**:
  * **Email**: vikas@onecampus.edu
* **Other Demo Students**:
  * aaravsharma@onecampus.edu
  * adityasingh@onecampus.edu
  * martundjaiswal@onecampus.edu
