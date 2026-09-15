require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const Student = require('../models/Student');

// Sample students for testing Phase 1 login/OTP flow.
// Plaintext password for all of them: Student@123
//
// email is REQUIRED and must be a real, deliverable inbox - OTP emails get sent
// there. Both use Gmail's +alias trick to satisfy the model's uniqueness
// constraint while both still deliver to the same real inbox.
const SAMPLE_STUDENTS = [
  {
    collegeId: 'AEC/2023/005',
    name: 'Asha Rao',
    email: 'samiksha3ks+student1@gmail.com',
    branch: 'Computer Science',
    year: 3,
  },
  {
    collegeId: 'AEC/2023/006',
    name: 'Rohit Verma',
    email: 'samiksha3ks+student2@gmail.com',
    branch: 'Electronics',
    year: 2,
  },
];

const PLAINTEXT_PASSWORD = 'Student@123';

const run = async () => {
  await connectDB();

  const passwordHash = await bcrypt.hash(PLAINTEXT_PASSWORD, 10);

  for (const s of SAMPLE_STUDENTS) {
    const existing = await Student.findOne({ collegeId: s.collegeId });
    if (existing) {
      console.log(`Student ${s.collegeId} already exists. Skipping.`);
      continue;
    }
    await Student.create({ ...s, passwordHash });
    console.log(`Student created: ${s.collegeId} / password: ${PLAINTEXT_PASSWORD}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to seed students:', err);
  process.exit(1);
});
