import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
      default: 'student',
    },

    // ─── STUDENT FIELDS ───────────────────────────────────────────────────────
    enrollmentNo: {
      type: String,
      unique: true,
      sparse: true, // allows null for teachers/admins
      trim: true,
    },
    // fathersName is NOT stored — re-entered on every login with GGSIPU captcha
    branch: {
      type: String,
      enum: ['ECE', 'BBA'],
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    section: {
      type: String, // "A", "B" — assigned by admin via Class model
    },
    // Data pulled from GGSIPU result page on every login
    programme: String,       // e.g. "B.Tech - Electronics & Communication Engg."
    institute: String,       // e.g. "Bhagwan Parshuram Institute of Technology"
    cgpa: Number,            // Overall CGPA — updated on every login
    resultsLastFetched: Date, // Timestamp of last successful GGSIPU sync

    // ─── TEACHER / ADMIN FIELDS ───────────────────────────────────────────────
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // allows null for students
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows null for students
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false, // never returned by default
      minlength: [6, 'Password must be at least 6 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (teacher/admin only)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method (teacher/admin login)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
