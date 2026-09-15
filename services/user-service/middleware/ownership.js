// Students and Faculty may only act on their own profile; Admin may act on anyone's.
const requireSelfOrAdmin = (req, res, next) => {
  const { userId } = req.params;

  if (req.user.role === 'admin' || req.user.id === userId) {
    return next();
  }

  return res.status(403).json({ message: 'You can only modify your own profile' });
};

module.exports = { requireSelfOrAdmin };
