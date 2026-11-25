import type { RequestHandler } from "express";
import * as authService from "../services/authService.js";
import { getValidated } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { CredentialsBody } from "../validators/authValidators.js";

export const register: RequestHandler = asyncHandler(async (_req, res) => {
  const { body } = getValidated<CredentialsBody>(res);
  const result = await authService.register(body.email, body.password);
  res.status(201).json(result);
});

export const login: RequestHandler = asyncHandler(async (_req, res) => {
  const { body } = getValidated<CredentialsBody>(res);
  const result = await authService.login(body.email, body.password);
  res.json(result);
});
