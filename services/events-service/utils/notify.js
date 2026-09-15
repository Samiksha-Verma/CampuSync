// Fires a notification via notification-service's internal /broadcast endpoint.
// Called directly on notification-service's own URL (never through the gateway -
// this is a service-to-service call with no end-user JWT to attach).
const notify = async ({ type, message, relatedEntityId, recipientId }) => {
  const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5009';

  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET,
      },
      body: JSON.stringify({ type, message, relatedEntityId, recipientId }),
    });
  } catch (err) {
    // Notification delivery must never break the actual CRUD operation that triggered it.
    console.error('[notify] failed to reach notification-service:', err.message);
  }
};

module.exports = notify;
