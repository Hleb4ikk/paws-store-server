import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middleware/validate.middleware.js";
import { credentialsSchema } from "../validators/authValidators.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate({ body: credentialsSchema }),
  authController.register,
);

authRouter.post(
  "/login",
  validate({ body: credentialsSchema }),
  authController.login,
);
