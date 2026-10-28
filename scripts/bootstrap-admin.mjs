import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../lib/models.ts";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const uri = process.env.MONGODB_URI;

if (!email || !password || !uri) {
  throw new Error(
    "Set ADMIN_EMAIL, ADMIN_PASSWORD, and MONGODB_URI before bootstrapping the administrator.",
  );
}
if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const existing = await User.exists({ email });
  if (existing) {
    throw new Error(
      "An administrator with this email already exists. The bootstrap command only creates the initial account.",
    );
  }
  await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
  });
  console.info(`Created the initial administrator account: ${email}`);
} finally {
  await mongoose.disconnect();
}
