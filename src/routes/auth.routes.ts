import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../prisma/db.js";
import { signToken } from "../middleware/auth.middleware.js";
import { validate, getValidated } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { conflict, unauthorized } from "../utils/AppError.js";
import type { UserRole } from "../types/express.js";

const credentialsSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type CredentialsBody = { body: z.infer<typeof credentialsSchema> };

export const authRouter = Router();

authRouter.post(
  "/register",
  validate({ body: credentialsSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidated<CredentialsBody>(res);

    const existing = await db.orm.public.User
      .where((u) => u.email.eq(body.email))
      .first();
    if (existing) {
      throw conflict("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await db.orm.public.User.create({
      email: body.email,
      password_hash: passwordHash,
    });

    const token = signToken(user.id, user.role as UserRole);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  }),
);

authRouter.post(
  "/login",
  validate({ body: credentialsSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidated<CredentialsBody>(res);

    const user = await db.orm.public.User
      .where((u) => u.email.eq(body.email))
      .first();
    if (!user) {
      throw unauthorized("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(
      body.password,
      user.password_hash,
    );
    if (!passwordMatches) {
      throw unauthorized("Invalid email or password");
    }

    const token = signToken(user.id, user.role as UserRole);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  }),
);
