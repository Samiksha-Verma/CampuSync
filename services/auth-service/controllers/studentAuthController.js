const bcrypt = require('bcrypt');
const Student = require('../models/Student');
const { signStudentToken } = require('../utils/token');

const SALT_ROUNDS = 10;
const COLLEGE_ID_PATTERN = /^[A-Z]+\/\d{4}\/\d{3}$/;

// POST /auth/student/signup (public)
// Deliberately minimal - just enough to create an active, logged-in-capable account.
// name/branch/year are filled in later via the student's own Profile page (see
// updateMe below), not collected here.
const signup = async (req, res) => {
  try {
    const { collegeId, email, password } = req.body;

    if (!collegeId || !email || !password) {
      return res.status(400).json({ message: 'collegeId, email, and password are required' });
    }

    const normalizedCollegeId = collegeId.trim().toUpperCase();
    if (!COLLEGE_ID_PATTERN.test(normalizedCollegeId)) {
      return res.status(400).json({ message: 'collegeId must be in the format ABC/2023/005' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await Student.findOne({ $or: [{ collegeId: normalizedCollegeId }, { email: normalizedEmail }] });
    if (existing) {
      return res.status(409).json({
        message:
          existing.collegeId === normalizedCollegeId
            ? 'An account with this College ID already exists'
            : 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await Student.create({ collegeId: normalizedCollegeId, email: normalizedEmail, passwordHash });

    return res.status(201).json({ message: 'Account created. You can now log in with your College ID and password.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while creating your account' });
  }
};

// PUT /auth/student/me (protected: self only)
// Lets a student fill in the name/branch/year that self-signup deliberately skips.
const updateMe = async (req, res) => {
  try {
    const { name, branch, year } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (branch !== undefined) updates.branch = String(branch).trim();
    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 5) {
        return res.status(400).json({ message: 'year must be an integer from 1 to 5' });
      }
      updates.year = parsedYear;
    }

    const student = await Student.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({
      user: {
        id: student._id,
        role: 'student',
        collegeId: student.collegeId,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while updating your account' });
  }
};

// POST /auth/student/login (public)
// Password-only, same shape as Faculty/Admin login.
const login = async (req, res) => {
  try {
    const { collegeId, password } = req.body;

    if (!collegeId || !password) {
      return res.status(400).json({ message: 'collegeId and password are required' });
    }

    const student = await Student.findOne({ collegeId: collegeId.trim().toUpperCase() });
    if (!student) {
      return res.status(401).json({ message: 'Invalid collegeId or password' });
    }

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid collegeId or password' });
    }

    const token = signStudentToken(student);

    return res.status(200).json({
      token,
      user: {
        id: student._id,
        role: 'student',
        collegeId: student.collegeId,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong during login' });
  }
};

module.exports = { signup, updateMe, login };
