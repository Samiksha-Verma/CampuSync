const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const fetchStudentById = require('../utils/fetchStudentById');

// POST /notifications/broadcast (internal only - verifyInternalSecret, called by other services)
// Body: { type, message, relatedEntityId, recipientId? }
//   - recipientId present  -> targeted: one student, emitted to their personal room, emailed.
//   - recipientId omitted  -> broadcast: all current students, emitted to the shared room,
//                              no email (see README for why mass-emailing every content
//                              change was deliberately left out).
const broadcast = async (req, res) => {
  try {
    const { type, message, relatedEntityId, recipientId } = req.body;

    if (!type || !message) {
      return res.status(400).json({ message: 'type and message are required' });
    }

    const notification = await Notification.create({
      recipientId: recipientId || null,
      type,
      message,
      relatedEntityId,
    });

    const io = req.app.get('io');
    const payload = {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      relatedEntityId: notification.relatedEntityId,
      scope: recipientId ? 'targeted' : 'broadcast',
      createdAt: notification.createdAt,
    };

    if (recipientId) {
      io.to(`student:${recipientId}`).emit('notification', payload);

      // Fire-and-forget: a slow/failed email must never block or fail the response,
      // since the caller (e.g. opportunities-service) is waiting on this request as
      // part of its own create/update/delete flow.
      fetchStudentById(recipientId)
        .then((student) => {
          if (student?.email) {
            return sendEmail({
              to: student.email,
              subject: 'CampuSync Notification',
              html: `<p>Hi ${student.name || ''},</p><p>${message}</p>`,
            });
          }
        })
        .catch((err) => console.error('[notification-service] failed to email student:', err.message));
    } else {
      io.to('students').emit('notification', payload);
    }

    return res.status(201).json({ notification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while broadcasting the notification' });
  }
};

module.exports = { broadcast };
