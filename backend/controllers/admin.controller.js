import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

export const createFaculty = async (req, res) => {
  const { collegeId, name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const faculty = await User.create({
    collegeId,
    name,
    email,
    password: hashed,
    role: "faculty",
    isVerified: true,
  });

  res.status(201).json(faculty);
};