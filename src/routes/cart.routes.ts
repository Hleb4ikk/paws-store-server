import { Router } from "express";
import { z } from "zod";
import { db } from "../prisma/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate, getValidated } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";

const addItemSchema = z.object({
  productId: z.uuid("Invalid product id"),
  quantity: z.number().int().min(1).default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

const itemIdParamSchema = z.object({
  id: z.uuid("Invalid cart item id"),
});

const promoSchema = z.object({
  code: z.string().trim().min(1),
});

type AddItemBody = { body: z.infer<typeof addItemSchema> };
type UpdateItemBody = { body: z.infer<typeof updateItemSchema> };
type ItemIdParam = { params: z.infer<typeof itemIdParamSchema> };
type PromoBody = { body: z.infer<typeof promoSchema> };

const round2 = (value: number): number => Math.round(value * 100) / 100;

const getCartItems = async (userId: string) =>
  db.orm.public.CartItems.where({ userId })
    .include("product", (product) => product.include("images"))
    .all();

const serializeCart = (items: Awaited<ReturnType<typeof getCartItems>>) => {
  // productId is a required FK, so an included product is always present
  const rows = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: { ...item.product!, price: Number(item.product!.price) },
  }));
  return {
    items: rows,
    subtotal: round2(
      rows.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    ),
  };
};

export const cartRouter = Router();

cartRouter.use(authenticate);

// GET /api/cart — current user's cart
cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await getCartItems(req.user!.id);
    res.json(serializeCart(items));
  }),
);

// POST /api/cart/items — add product to cart (or increase quantity)
cartRouter.post(
  "/items",
  validate({ body: addItemSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidated<AddItemBody>(res);

    const product = await db.orm.public.Product.first({ id: body.productId });
    if (!product) {
      throw notFound("Product not found");
    }

    const existing = await db.orm.public.CartItems.where({
      userId: req.user!.id,
      productId: body.productId,
    }).first();

    if (existing) {
      await db.orm.public.CartItems.where({ id: existing.id }).update({
        quantity: existing.quantity + body.quantity,
      });
    } else {
      await db.orm.public.CartItems.create({
        userId: req.user!.id,
        productId: body.productId,
        quantity: body.quantity,
      });
    }

    const items = await getCartItems(req.user!.id);
    res.status(201).json(serializeCart(items));
  }),
);

// PATCH /api/cart/items/:id — change item quantity
cartRouter.patch(
  "/items/:id",
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  asyncHandler(async (req, res) => {
    const { params, body } = getValidated<ItemIdParam & UpdateItemBody>(res);

    const item = await db.orm.public.CartItems.first({ id: params.id });
    if (!item || item.userId !== req.user!.id) {
      throw notFound("Cart item not found");
    }

    await db.orm.public.CartItems.where({ id: params.id }).update({
      quantity: body.quantity,
    });

    const items = await getCartItems(req.user!.id);
    res.json(serializeCart(items));
  }),
);

// DELETE /api/cart/items/:id — remove item from cart
cartRouter.delete(
  "/items/:id",
  validate({ params: itemIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { params } = getValidated<ItemIdParam>(res);

    const item = await db.orm.public.CartItems.first({ id: params.id });
    if (!item || item.userId !== req.user!.id) {
      throw notFound("Cart item not found");
    }

    await db.orm.public.CartItems.where({ id: params.id }).delete();

    const items = await getCartItems(req.user!.id);
    res.json(serializeCart(items));
  }),
);

// POST /api/cart/apply-promo — validate promocode and calculate discounted total
cartRouter.post(
  "/apply-promo",
  validate({ body: promoSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidated<PromoBody>(res);

    const promo = await db.orm.public.Promocode.where((p) =>
      p.code.eq(body.code.toUpperCase()),
    ).first();
    if (!promo || !promo.is_active) {
      throw badRequest("Invalid or inactive promocode");
    }

    const items = await getCartItems(req.user!.id);
    if (items.length === 0) {
      throw badRequest("Cart is empty");
    }

    const cart = serializeCart(items);
    const discountAmount = round2(
      (cart.subtotal * promo.discount_percentage) / 100,
    );

    res.json({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      subtotal: cart.subtotal,
      discount_amount: discountAmount,
      total: round2(cart.subtotal - discountAmount),
      items: cart.items,
    });
  }),
);
