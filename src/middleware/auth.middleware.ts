import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../configuration/config.js";
import { unauthorized } from "../utils/AppError.js";
import type { UserRole } from "../types/express.js";

interface JwtPayload {
  sub: string;
  role: UserRole;
}

export const signToken = (userId: string, role: UserRole): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as NonNullable<
      jwt.SignOptions["expiresIn"]
    >,
  };
  return jwt.sign({ sub: userId, role }, config.JWT_SECRET, options);
};

export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(unauthorized());
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
};
