import bcrypt from "bcryptjs";
import * as usersRepository from "../repositories/usersRepository.js";
import { signToken } from "../utils/jwt.js";
import { conflict, unauthorized } from "../utils/AppError.js";
import type { UserRole } from "../types/express.js";

const toAuthResponse = (user: {
  id: string;
  email: string;
  role: string;
}) => ({
  token: signToken(user.id, user.role as UserRole),
  user: { id: user.id, email: user.email, role: user.role },
});

export const register = async (email: string, password: string) => {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    throw conflict("User with this email already exists");
  }

  const user = await usersRepository.createUser({
    email,
    password_hash: await bcrypt.hash(password, 10),
  });

  return toAuthResponse(user);
};

export const login = async (email: string, password: string) => {
  const user = await usersRepository.findByEmail(email);
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw unauthorized("Invalid email or password");
  }

  return toAuthResponse(user);
};
