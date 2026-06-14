// Middleware: Only allow admins
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin role required.' });
};

export default requireAdmin;
