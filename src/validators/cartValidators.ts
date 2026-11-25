import { z } from "zod";

export const addItemSchema = z.object({
  productId: z.uuid("Invalid product id"),
  quantity: z.number().int().min(1).default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export const itemIdParamSchema = z.object({
  id: z.uuid("Invalid cart item id"),
});

export const promoSchema = z.object({
  code: z.string().trim().min(1),
});

export type AddItemBody = { body: z.infer<typeof addItemSchema> };
export type UpdateItemBody = { body: z.infer<typeof updateItemSchema> };
export type ItemIdParam = { params: z.infer<typeof itemIdParamSchema> };
export type PromoBody = { body: z.infer<typeof promoSchema> };
