const bcrypt = require('bcrypt');
const Faculty = require('../models/Faculty');
const { signFacultyToken } = require('../utils/token');

const SALT_ROUNDS = 10;

// POST /auth/faculty/signup (public)
// Creates the account as 'pending' - it exists but can't log in until an Admin
// approves it. If this email was previously rejected, re-signing up revives that
// same record back to 'pending' for a fresh review, rather than erroring.
const signup = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const existing = await Faculty.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.status !== 'rejected') {
        return res.status(409).json({
          message:
            existing.status === 'pending'
              ? 'An application with this email is already awaiting approval'
              : 'An account with this email already exists',
        });
      }

      existing.name = name.trim();
      existing.passwordHash = passwordHash;
      existing.department = department ? String(department).trim() : '';
      existing.status = 'pending';
      existing.rejectionReason = '';
      existing.approvedBy = undefined;
      await existing.save();

      return res.status(200).json({ message: 'Application resubmitted and awaiting admin approval.' });
    }

    await Faculty.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      department: department ? String(department).trim() : '',
      status: 'pending',
    });

    return res.status(201).json({ message: 'Application submitted and awaiting admin approval.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while submitting your application' });
  }
};

// POST /auth/faculty/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const faculty = await Faculty.findOne({ email: email.trim().toLowerCase() });
    if (!faculty) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, faculty.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (faculty.status === 'pending') {
      return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
    }
    if (faculty.status === 'rejected') {
      return res.status(403).json({
        message: faculty.rejectionReason
          ? `Your faculty application was not approved: ${faculty.rejectionReason}`
          : 'Your faculty application was not approved. Contact your college Admin for details.',
      });
    }

    const token = signFacultyToken(faculty);

    return res.status(200).json({
      token,
      user: {
        id: faculty._id,
        role: 'faculty',
        name: faculty.name,
        email: faculty.email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong during login' });
  }
};

module.exports = { signup, login };
