import { Router } from "express";
import * as productsController from "../controllers/productsController.js";
import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductSchema,
  idParamSchema,
  listQuerySchema,
  updateProductSchema,
} from "../validators/productsValidators.js";

export const productsRouter = Router();

// GET /api/products — catalog with search, filters, sorting, pagination (DB-level)
productsRouter.get(
  "/",
  validate({ query: listQuerySchema }),
  productsController.list,
);

// GET /api/products/categories — distinct product categories
productsRouter.get("/categories", productsController.categories);

// GET /api/products/:id — single product with images
productsRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  productsController.getById,
);

// POST /api/products — create product (admin only)
productsRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate({ body: createProductSchema }),
  productsController.create,
);

// PATCH /api/products/:id — update product (admin only)
productsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: updateProductSchema }),
  productsController.update,
);

// DELETE /api/products/:id — delete product (admin only), cache invalidated
productsRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  productsController.remove,
);
