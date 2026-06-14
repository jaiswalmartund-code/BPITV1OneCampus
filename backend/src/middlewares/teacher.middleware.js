// Middleware: Only allow teachers
const requireTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Teacher role required.' });
};

export default requireTeacher;
