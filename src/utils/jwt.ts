import jwt from "jsonwebtoken";
import { config } from "../configuration/config.js";
import type { UserRole } from "../types/express.js";

export const signToken = (userId: string, role: UserRole): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as NonNullable<
      jwt.SignOptions["expiresIn"]
    >,
  };
  return jwt.sign({ sub: userId, role }, config.JWT_SECRET, options);
};
