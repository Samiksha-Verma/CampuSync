const Profile = require('../models/Profile');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

const ALLOWED_FIELDS = ['phone', 'college', 'branch', 'year', 'linkedin', 'github', 'skills', 'bio'];

// GET /users/profile/:userId
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      // Only lazily create a profile for the requester's own userId - we have no way
      // to know a role for someone else's userId (that lives in auth-service's DB).
      if (req.user.id === userId) {
        profile = await Profile.create({ userId, role: req.user.role });
      } else {
        return res.status(404).json({ message: 'Profile not found' });
      }
    }

    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching the profile' });
  }
};

// PUT /users/profile/:userId (protected: self or admin)
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = {};

    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Only refresh `role` from the token when users edit their own profile - an
    // admin editing someone else's profile has no way to know that user's role.
    if (req.user.id === userId) {
      updates.role = req.user.role;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while updating the profile' });
  }
};

// POST /users/profile/:userId/avatar (protected: self or admin)
const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided (field name must be "avatar")' });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `avatar_${userId}`,
      overwrite: true,
    });

    const updates = { avatarUrl: result.secure_url };
    if (req.user.id === userId) {
      updates.role = req.user.role;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while uploading the avatar' });
  }
};

module.exports = { getProfile, updateProfile, uploadAvatar };
