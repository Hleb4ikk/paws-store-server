import { Router } from "express";
import * as cartController from "../controllers/cartController.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addItemSchema,
  itemIdParamSchema,
  promoSchema,
  updateItemSchema,
} from "../validators/cartValidators.js";

export const cartRouter = Router();

cartRouter.use(authenticate);

// GET /api/cart — current user's cart
cartRouter.get("/", cartController.getCart);

// POST /api/cart/items — add product to cart (or increase quantity)
cartRouter.post(
  "/items",
  validate({ body: addItemSchema }),
  cartController.addItem,
);

// PATCH /api/cart/items/:id — change item quantity
cartRouter.patch(
  "/items/:id",
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  cartController.updateItem,
);

// DELETE /api/cart/items/:id — remove item from cart
cartRouter.delete(
  "/items/:id",
  validate({ params: itemIdParamSchema }),
  cartController.removeItem,
);

// POST /api/cart/apply-promo — validate promocode and calculate discounted total
cartRouter.post(
  "/apply-promo",
  validate({ body: promoSchema }),
  cartController.applyPromo,
);
