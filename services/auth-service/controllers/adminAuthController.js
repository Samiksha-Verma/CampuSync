const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const Faculty = require('../models/Faculty');
const sendEmail = require('../utils/sendEmail');
const { signAdminToken } = require('../utils/token');

// POST /auth/admin/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signAdminToken(admin);

    return res.status(200).json({
      token,
      user: {
        id: admin._id,
        role: 'admin',
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong during login' });
  }
};

// GET /auth/admin/faculty-requests?status=pending (protected: admin only)
// Defaults to pending - that's the actionable queue - but accepts any status so the
// review UI can also show past decisions if it wants to.
const getFacultyRequests = async (req, res) => {
  try {
    const status = ['pending', 'active', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
    const requests = await Faculty.find({ status }).select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching faculty requests' });
  }
};

// PUT /auth/admin/faculty-requests/:id/approve (protected: admin only)
const approveFacultyRequest = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty request not found' });
    }
    if (faculty.status === 'active') {
      return res.status(409).json({ message: 'This account is already active' });
    }

    faculty.status = 'active';
    faculty.approvedBy = req.user.id;
    faculty.rejectionReason = '';
    await faculty.save();

    try {
      await sendEmail({
        to: faculty.email,
        subject: 'CampuSync - Your Faculty Account Has Been Approved',
        html: `<p>Hi ${faculty.name},</p><p>Your CampuSync faculty account has been approved. You can now log in with the email and password you signed up with.</p>`,
      });
    } catch (emailErr) {
      // The approval itself already succeeded and shouldn't be rolled back for a
      // failed notification - the account works either way, this is just a courtesy.
      console.error('Failed to email faculty approval notice:', emailErr);
    }

    const { passwordHash, ...safeFaculty } = faculty.toObject();
    return res.status(200).json({ faculty: safeFaculty });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while approving this request' });
  }
};

// PUT /auth/admin/faculty-requests/:id/reject (protected: admin only)
// Body: { reason } (optional)
const rejectFacultyRequest = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty request not found' });
    }

    faculty.status = 'rejected';
    faculty.rejectionReason = req.body.reason ? String(req.body.reason).trim() : '';
    faculty.approvedBy = undefined;
    await faculty.save();

    const { passwordHash, ...safeFaculty } = faculty.toObject();
    return res.status(200).json({ faculty: safeFaculty });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while rejecting this request' });
  }
};

module.exports = { login, getFacultyRequests, approveFacultyRequest, rejectFacultyRequest };
