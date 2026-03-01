const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // authMiddleware already attached req.user
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

export default roleMiddleware;