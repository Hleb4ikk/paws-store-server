import { Router } from "express";
import { z } from "zod";
import { or, orderByField } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";
import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware.js";
import { validate, getValidated } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/AppError.js";
import {
  buildCatalogCacheKey,
  getCached,
  invalidateCatalogCache,
  setCached,
} from "../services/cache.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().min(1).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  sort_by: z.enum(["price", "title"]).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

const idParamSchema = z.object({
  id: z.uuid("Invalid product id"),
});

const createProductSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().positive(),
  rating: z.number().min(0).max(5).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  images: z.array(z.url("Invalid image URL")).min(3, "At least 3 images required"),
});

const updateProductSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  price: z.number().positive().optional(),
  rating: z.number().min(0).max(5).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  images: z.array(z.url("Invalid image URL")).min(3).optional(),
});

type ListQuery = { query: z.infer<typeof listQuerySchema> };
type IdParam = { params: z.infer<typeof idParamSchema> };
type CreateBody = { body: z.infer<typeof createProductSchema> };
type UpdateBody = { body: z.infer<typeof updateProductSchema> };


const serializeProduct = <T extends { price: unknown }>(product: T) => ({
  ...product,
  price: Number(product.price),
});

export const productsRouter = Router();

// GET /api/products — catalog with search, filters, sorting, pagination (DB-level)
productsRouter.get(
  "/",
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const { query } = getValidated<ListQuery>(res);
    const cacheKey = buildCatalogCacheKey(req.originalUrl);

    const cached = await getCached(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.type("application/json").send(cached);
      return;
    }

    let filtered = db.orm.public.Product;
    if (query.search) {
      const term = `%${query.search}%`;
      filtered = filtered.where((p) =>
        or(p.title.ilike(term), p.description.ilike(term)),
      );
    }
    if (query.min_price !== undefined) {
      const min = String(query.min_price);
      filtered = filtered.where((p) => p.price.gte(min));
    }
    if (query.max_price !== undefined) {
      const max = String(query.max_price);
      filtered = filtered.where((p) => p.price.lte(max));
    }
    if (query.min_rating !== undefined) {
      const minRating = query.min_rating;
      filtered = filtered.where((p) => p.rating.gte(minRating));
    }

    const ordered = query.sort_by
      ? filtered.orderBy(
          orderByField(filtered, query.sort_by, query.order, ["price", "title"]),
        )
      : filtered;

    const { total } = await filtered.aggregate((a) => ({ total: a.count() }));

    const items = await ordered
      .include("images")
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .all();

    const payload = {
      items: items.map(serializeProduct),
      meta: {
        total_items: total,
        total_pages: Math.ceil(total / query.limit),
        current_page: query.page,
        limit: query.limit,
      },
    };

    await setCached(cacheKey, JSON.stringify(payload));
    res.setHeader("X-Cache", "MISS");
    res.json(payload);
  }),
);

// GET /api/products/:id — single product with images
productsRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(async (_req, res) => {
    const { params } = getValidated<IdParam>(res);

    const product = await db.orm.public.Product.where({ id: params.id })
      .include("images")
      .first();
    if (!product) {
      throw notFound("Product not found");
    }

    res.json(serializeProduct(product));
  }),
);

// POST /api/products — create product (admin only)
productsRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate({ body: createProductSchema }),
  asyncHandler(async (_req, res) => {
    const { body } = getValidated<CreateBody>(res);

    const product = await db.transaction(async (tx) => {
      const created = await tx.orm.public.Product.create({
        title: body.title,
        description: body.description,
        price: String(body.price),
        ...(body.rating !== undefined ? { rating: body.rating } : {}),
        ...(body.stock_quantity !== undefined
          ? { stock_quantity: body.stock_quantity }
          : {}),
      });
      for (const url of body.images) {
        await tx.orm.public.Image.create({ productId: created.id, url });
      }
      return tx.orm.public.Product.where({ id: created.id })
        .include("images")
        .first();
    });

    await invalidateCatalogCache();
    res.status(201).json(serializeProduct(product!));
  }),
);

// PATCH /api/products/:id — update product (admin only)
productsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(async (_req, res) => {
    const { params, body } = getValidated<IdParam & UpdateBody>(res);

    const existing = await db.orm.public.Product.first({ id: params.id });
    if (!existing) {
      throw notFound("Product not found");
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data["title"] = body.title;
    if (body.description !== undefined) data["description"] = body.description;
    if (body.price !== undefined) data["price"] = String(body.price);
    if (body.rating !== undefined) data["rating"] = body.rating;
    if (body.stock_quantity !== undefined)
      data["stock_quantity"] = body.stock_quantity;

    await db.transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.orm.public.Product.where({ id: params.id }).update(data);
      }
      if (body.images !== undefined) {
        await tx.orm.public.Image.where({ productId: params.id }).deleteAll();
        for (const url of body.images) {
          await tx.orm.public.Image.create({ productId: params.id, url });
        }
      }
    });

    const product = await db.orm.public.Product.where({ id: params.id })
      .include("images")
      .first();

    await invalidateCatalogCache();
    res.json(serializeProduct(product!));
  }),
);

// DELETE /api/products/:id — delete product (admin only), cache invalidated
productsRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(async (_req, res) => {
    const { params } = getValidated<IdParam>(res);

    const existing = await db.orm.public.Product.first({ id: params.id });
    if (!existing) {
      throw notFound("Product not found");
    }

    // Images and cart items are removed by ON DELETE CASCADE
    await db.orm.public.Product.where({ id: params.id }).delete();

    await invalidateCatalogCache();
    res.status(204).send();
  }),
);
