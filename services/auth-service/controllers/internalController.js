const Student = require('../models/Student');

// GET /auth/internal/students/:id (internal only - verifyInternalSecret)
// Used by notification-service to resolve a student's email/name for a TARGETED
// notification. Deliberately returns only the minimum needed - not the whole document.
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ id: student._id, name: student.name, email: student.email });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid student id' });
  }
};

module.exports = { getStudentById };
