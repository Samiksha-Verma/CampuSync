// Faculty may only edit/delete content they created; Admin may act on anyone's.
// Fetches the record once here and attaches it to req.record so the controller
// doesn't need a second query.
const requireCreatorOrAdmin = (Model, notFoundMessage) => async (req, res, next) => {
  try {
    const record = await Model.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: notFoundMessage || 'Not found' });
    }

    if (req.user.role === 'admin' || record.createdBy === req.user.id) {
      req.record = record;
      return next();
    }

    return res.status(403).json({ message: 'You can only modify content you created' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid id' });
  }
};

module.exports = { requireCreatorOrAdmin };
