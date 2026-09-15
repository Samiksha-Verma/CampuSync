const Notification = require('../models/Notification');

// Presents a consistent shape regardless of whether the underlying doc is targeted
// (its own isRead) or a shared broadcast (per-student read state via readBy).
const shapeNotification = (doc, studentId) => {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: o._id,
    type: o.type,
    message: o.message,
    relatedEntityId: o.relatedEntityId,
    scope: o.recipientId === null ? 'broadcast' : 'targeted',
    isRead: o.recipientId === null ? o.readBy.includes(studentId) : o.isRead,
    createdAt: o.createdAt,
  };
};

// GET /notifications/me (Student only)
const getMyNotifications = async (req, res) => {
  try {
    const accountCreatedAt = new Date(req.user.accountCreatedAt);

    const notifications = await Notification.find({
      $or: [
        { recipientId: req.user.id },
        { recipientId: null, createdAt: { $gte: accountCreatedAt } },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      notifications: notifications.map((n) => shapeNotification(n, req.user.id)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching notifications' });
  }
};

// PUT /notifications/:id/read (Student only)
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const accountCreatedAt = new Date(req.user.accountCreatedAt);
    const isMine = notification.recipientId === req.user.id;
    const isVisibleBroadcast = notification.recipientId === null && notification.createdAt >= accountCreatedAt;

    if (!isMine && !isVisibleBroadcast) {
      return res.status(403).json({ message: 'You cannot modify this notification' });
    }

    if (isMine) {
      notification.isRead = true;
      await notification.save();
    } else {
      // Shared document read by many students - record this student's read state
      // without touching anyone else's.
      await Notification.updateOne({ _id: notification._id }, { $addToSet: { readBy: req.user.id } });
    }

    const updated = await Notification.findById(req.params.id);
    return res.status(200).json({ notification: shapeNotification(updated, req.user.id) });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid notification id' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while updating the notification' });
  }
};

module.exports = { getMyNotifications, markAsRead, shapeNotification };
