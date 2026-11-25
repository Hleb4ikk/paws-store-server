import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  sort_by: z.enum(["price", "title"]).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const idParamSchema = z.object({
  id: z.uuid("Invalid product id"),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().positive(),
  rating: z.number().min(0).max(5).optional(),
  category: z.string().trim().min(1).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  images: z
    .array(z.url("Invalid image URL"))
    .min(3, "At least 3 images required"),
});

export const updateProductSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  price: z.number().positive().optional(),
  rating: z.number().min(0).max(5).optional(),
  category: z.string().trim().min(1).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  images: z.array(z.url("Invalid image URL")).min(3).optional(),
});

export type ListQuery = { query: z.infer<typeof listQuerySchema> };
export type IdParam = { params: z.infer<typeof idParamSchema> };
export type CreateBody = { body: z.infer<typeof createProductSchema> };
export type UpdateBody = { body: z.infer<typeof updateProductSchema> };
