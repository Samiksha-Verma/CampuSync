const jwt = require('jsonwebtoken');

const signToken = (payload, expiresIn) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// accountCreatedAt lets notification-service tell "broadcasts posted before this
// student even had an account" apart from "broadcasts they should see", without
// notification-service ever having to call auth-service to find out.
const signStudentToken = (student) =>
  signToken(
    { id: student._id, role: 'student', accountCreatedAt: student.createdAt },
    process.env.JWT_STUDENT_EXPIRES_IN || '1d'
  );

const signFacultyToken = (faculty) =>
  signToken(
    { id: faculty._id, role: 'faculty' },
    process.env.JWT_STAFF_EXPIRES_IN || '7d'
  );

const signAdminToken = (admin) =>
  signToken(
    { id: admin._id, role: 'admin' },
    process.env.JWT_STAFF_EXPIRES_IN || '7d'
  );

module.exports = { signStudentToken, signFacultyToken, signAdminToken };
