// Restrict access to specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied. Required role: ${roles.join(" or ")}`);
    }
    next();
  };
};

// Admin only
const adminOnly = requireRole("admin");

// Admin or Manager
const managerUp = requireRole("admin", "manager");

module.exports = { requireRole, adminOnly, managerUp };
