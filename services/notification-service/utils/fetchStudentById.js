// Resolves a student's email/name for TARGETED notifications only (never called for
// broadcasts - see models/Notification.js for why broadcasts don't need this at all).
const fetchStudentById = async (studentId) => {
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/internal/students/${studentId}`, {
      headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET },
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('[notification-service] failed to reach auth-service:', err.message);
    return null;
  }
};

module.exports = fetchStudentById;
