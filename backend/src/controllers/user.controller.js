import User from '../models/user.model.js';
import Class from '../models/class.model.js';
import TeacherRemark from '../models/teacherRemark.model.js';

// @desc    Get user profile (full details by role)
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const profile = {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    };

    if (user.role === 'student') {
      // Include student-specific fields
      profile.enrollmentNo       = user.enrollmentNo;
      profile.branch             = user.branch;
      profile.semester           = user.semester;
      profile.section            = user.section;
      profile.programme          = user.programme;
      profile.institute          = user.institute;
      profile.cgpa               = user.cgpa;
      profile.resultsLastFetched = user.resultsLastFetched;

      // Include class info if enrolled
      const classInfo = await Class.findOne({ students: user.enrollmentNo })
        .select('name branch semester section');
      profile.class = classInfo || null;
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher remarks for logged-in student
// @route   GET /api/user/remarks
// @access  Private (Student)
export const getStudentRemarks = async (req, res, next) => {
  try {
    const remarks = await TeacherRemark.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ remarks });
  } catch (error) {
    next(error);
  }
};

